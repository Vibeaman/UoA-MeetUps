import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
};

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

const json = (body: Record<string, unknown>, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, ...extraHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

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

const verifyProof = async (proof: unknown) => {
  if (typeof proof !== "string") return false;
  const separator = proof.indexOf(".");
  if (separator <= 0) return false;

  const payload = proof.slice(0, separator);
  const signature = proof.slice(separator + 1);
  const expectedSignature = await signProof(payload);
  if (!timingSafeEqual(signature, expectedSignature)) return false;

  try {
    const claims = JSON.parse(decodeBase64Url(payload));
    return claims?.role === "admin" && Number(claims.exp) * 1000 > Date.now();
  } catch {
    return false;
  }
};

const getAdminClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Admin database access is unavailable.");
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const listVerificationRequests = async () => {
  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from("verification_requests")
    .select("id, user_id, user_name, username, faculty, department, profile_photo, live_selfie_photo, student_id_photo, status, admin_note, submitted_at")
    .order("submitted_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
};

const updateVerificationRequest = async (body: Record<string, unknown>) => {
  const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
  const status = body.status === "approved" || body.status === "rejected" ? body.status : null;
  const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim() : "";
  if (!requestId || !status) throw new Error("Invalid verification update.");

  const adminClient = getAdminClient();
  const { data: updatedRequest, error: requestError } = await adminClient
    .from("verification_requests")
    .update({
      status,
      admin_note: status === "rejected" ? adminNote || "Photo mismatch or unclear selfie." : null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .select("id, user_id, status, admin_note, reviewed_at")
    .maybeSingle();

  if (requestError || !updatedRequest) throw requestError || new Error("Verification request not found.");

  const { data: profile, error: profileReadError } = await adminClient
    .from("profiles")
    .select("id, badges")
    .eq("id", updatedRequest.user_id)
    .maybeSingle();
  if (profileReadError) throw profileReadError;

  const currentBadges = Array.isArray(profile?.badges) ? profile.badges : [];
  const nextBadges = status === "approved"
    ? Array.from(new Set([...currentBadges, "🛡️ Verified Student"]))
    : currentBadges.filter((badge: unknown) => typeof badge !== "string" || !badge.includes("Verified"));

  const { error: profileUpdateError } = await adminClient
    .from("profiles")
    .update({
      is_verified: status === "approved",
      verification_status: status === "approved" ? "verified" : "rejected",
      badges: nextBadges,
    })
    .eq("id", updatedRequest.user_id);
  if (profileUpdateError) throw profileUpdateError;

  return updatedRequest;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (request.method !== "POST") {
    return json({ authenticated: false, message: "Method not allowed." }, 405);
  }

  try {
    const body = await request.json() as Record<string, unknown>;

    if (body.action === "list_verifications" || body.action === "update_verification") {
      if (!(await verifyProof(body.proof))) {
        return json({ authenticated: false, message: "Admin proof is invalid or expired." }, 403);
      }

      if (body.action === "list_verifications") {
        return json({ authenticated: true, requests: await listVerificationRequests() });
      }

      return json({ authenticated: true, request: await updateVerificationRequest(body) });
    }

    const clientKey = getClientKey(request);
    const rateLimitState = getRateLimitState(clientKey);
    if (rateLimitState.count >= FAILED_ATTEMPT_LIMIT) {
      const retryAfter = Math.max(1, Math.ceil((rateLimitState.windowStarted + FAILED_ATTEMPT_WINDOW_MS - Date.now()) / 1000));
      return json({ authenticated: false, message: "Too many failed attempts. Try again later." }, 429, { "Retry-After": String(retryAfter) });
    }

    const password = typeof body.password === "string" ? body.password.trim().toUpperCase() : "";
    const digest = await sha256Hex(password);

    if (!timingSafeEqual(digest, PASSWORD_DIGEST)) {
      rateLimitState.count += 1;
      return json({ authenticated: false, message: "Invalid partner password." }, 401);
    }

    failedAttempts.delete(clientKey);
    const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
    const payload = encodeBase64Url(JSON.stringify({ role: "admin", exp: expiresAt }));
    const signature = await signProof(payload);

    return json({ authenticated: true, proof: `${payload}.${signature}`, expiresAt });
  } catch (error) {
    console.error("Admin function error:", error);
    return json({ authenticated: false, message: "Admin request could not be completed." }, 400);
  }
});
