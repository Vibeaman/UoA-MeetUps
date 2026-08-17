import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const PASSWORD_DIGEST = "2a3ee2fb4bfb076d76092bd36af364e89fb492d898d7ca7b7bd5bf4bf1d3a360";
const TOKEN_TTL_SECONDS = 60 * 60 * 8;
const FAILED_ATTEMPT_LIMIT = 5;
const FAILED_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const failedAttempts = new Map<string, { count: number; windowStarted: number }>();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toHex(new Uint8Array(digest));
};

const timingSafeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
};

const encodeBase64Url = (value: string) =>
  btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const getClientKey = (request: Request) =>
  request.headers.get("cf-connecting-ip") ||
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  "unknown";

const getRateLimitState = (clientKey: string) => {
  const now = Date.now();
  const current = failedAttempts.get(clientKey);
  if (!current || now - current.windowStarted >= FAILED_ATTEMPT_WINDOW_MS) {
    const reset = { count: 0, windowStarted: now };
    failedAttempts.set(clientKey, reset);
    return reset;
  }
  return current;
};

const signProof = async (payload: string) => {
  const signingSecret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!signingSecret) throw new Error("Admin signing secret is unavailable.");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toHex(new Uint8Array(signature));
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ authenticated: false, message: "Method not allowed." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const clientKey = getClientKey(request);
    const rateLimitState = getRateLimitState(clientKey);
    if (rateLimitState.count >= FAILED_ATTEMPT_LIMIT) {
      const retryAfter = Math.max(1, Math.ceil((rateLimitState.windowStarted + FAILED_ATTEMPT_WINDOW_MS - Date.now()) / 1000));
      return new Response(JSON.stringify({ authenticated: false, message: "Too many failed attempts. Try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(retryAfter) },
      });
    }

    const body = await request.json();
    const password = typeof body?.password === "string" ? body.password.trim().toUpperCase() : "";
    const digest = await sha256Hex(password);

    if (!timingSafeEqual(digest, PASSWORD_DIGEST)) {
      rateLimitState.count += 1;
      return new Response(JSON.stringify({ authenticated: false, message: "Invalid staff password." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    failedAttempts.delete(clientKey);
    const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
    const payload = encodeBase64Url(JSON.stringify({ role: "admin", exp: expiresAt }));
    const signature = await signProof(payload);

    return new Response(JSON.stringify({ authenticated: true, proof: `${payload}.${signature}`, expiresAt }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return new Response(JSON.stringify({ authenticated: false, message: "Invalid request." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
