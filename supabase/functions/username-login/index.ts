import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FAILED_ATTEMPT_LIMIT = 8;
const FAILED_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const failedAttempts = new Map<string, { count: number; windowStarted: number }>();

const getClientKey = (request: Request) =>
  request.headers.get("cf-connecting-ip") ||
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  "unknown";

const normalizeUsername = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const json = (body: Record<string, unknown>, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, ...extraHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const invalidCredentials = () =>
  json({ ok: false, error: "Invalid username or password." }, 401);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);

  const clientKey = getClientKey(request);
  const now = Date.now();
  const current = failedAttempts.get(clientKey);
  const rateLimitState = !current || now - current.windowStarted >= FAILED_ATTEMPT_WINDOW_MS
    ? { count: 0, windowStarted: now }
    : current;
  failedAttempts.set(clientKey, rateLimitState);

  if (rateLimitState.count >= FAILED_ATTEMPT_LIMIT) {
    const retryAfter = Math.max(1, Math.ceil((rateLimitState.windowStarted + FAILED_ATTEMPT_WINDOW_MS - now) / 1000));
    return json({ ok: false, error: "Too many failed attempts. Try again later." }, 429, { "Retry-After": String(retryAfter) });
  }

  try {
    const body = await request.json();
    const username = normalizeUsername(body?.username);
    const password = typeof body?.password === "string" ? body.password : "";

    if (!/^[a-z0-9_]{3,24}$/.test(username) || password.length < 6) {
      rateLimitState.count += 1;
      return invalidCredentials();
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ ok: false, error: "Username login is temporarily unavailable." }, 503);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, username")
      .eq("username", username)
      .maybeSingle();

    if (profileError || !profile) {
      rateLimitState.count += 1;
      return invalidCredentials();
    }

    const { data: userResult, error: userError } = await adminClient.auth.admin.getUserById(profile.id);
    const authEmail = userResult.user?.email;
    if (userError || !authEmail) {
      rateLimitState.count += 1;
      return invalidCredentials();
    }

    const { data: sessionResult, error: signInError } = await adminClient.auth.signInWithPassword({
      email: authEmail,
      password,
    });

    if (signInError || !sessionResult.session || !sessionResult.user) {
      rateLimitState.count += 1;
      if (/email not confirmed/i.test(signInError?.message || "")) {
        return json({
          ok: false,
          code: "email_not_confirmed",
          email: authEmail,
          error: "Your email has not been confirmed yet. Check your inbox before signing in.",
        }, 403);
      }
      return invalidCredentials();
    }

    failedAttempts.delete(clientKey);
    return json({
      ok: true,
      session: sessionResult.session,
      user: {
        id: sessionResult.user.id,
        email: sessionResult.user.email,
        email_confirmed_at: sessionResult.user.email_confirmed_at,
        confirmed_at: sessionResult.user.confirmed_at,
      },
    });
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }
});
