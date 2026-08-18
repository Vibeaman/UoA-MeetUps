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

    let { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, username, is_banned")
      .eq("username", username)
      .maybeSingle();

    if (profileError) {
      rateLimitState.count += 1;
      return invalidCredentials();
    }

    if (profile?.is_banned) {
      return json({ ok: false, error: 'This account has been suspended.' }, 403);
    }

    if (!profile) {
      // Legacy accounts may have auth metadata but no profile row. Search all auth-user pages
      // instead of silently failing after the first 1,000 users.
      const authUsersPageSize = 1000;
      let page = 1;
      let authUser: any = null;
      let usersError: unknown = null;

      while (!authUser) {
        const { data: usersResult, error } = await adminClient.auth.admin.listUsers({
          page,
          perPage: authUsersPageSize,
        });
        if (error) {
          usersError = error;
          break;
        }

        authUser = usersResult?.users.find(
          (candidate) => normalizeUsername(candidate.user_metadata?.username) === username,
        );

        if (authUser || !usersResult?.users?.length || usersResult.users.length < authUsersPageSize) break;
        page += 1;
      }

      if (usersError || !authUser) {
        rateLimitState.count += 1;
        return invalidCredentials();
      }

      // Do not create a fabricated age-0 profile. The client will let the authenticated
      // legacy account complete its real age and profile details after the session starts.
      profile = { id: authUser.id, username, is_banned: false };
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
