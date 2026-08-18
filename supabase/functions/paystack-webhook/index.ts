import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-paystack-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const getAdminClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase server configuration is incomplete.");
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const PLAN_DURATIONS_MS = {
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
  semester: 4 * 30 * 24 * 60 * 60 * 1000,
} as const;

const grantPremiumEntitlement = async (
  adminClient: ReturnType<typeof getAdminClient>,
  userId: string,
  planId: keyof typeof PLAN_DURATIONS_MS,
  providerReference: string,
) => {
  const { data: alreadyGranted, error: existingError } = await adminClient
    .from("premium_entitlements")
    .select("id")
    .eq("provider_reference", providerReference)
    .maybeSingle();
  if (existingError) throw existingError;
  if (alreadyGranted) return;

  const now = new Date();
  const { data: currentEntitlement, error: currentError } = await adminClient
    .from("premium_entitlements")
    .select("expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (currentError) throw currentError;

  const currentExpiry = currentEntitlement?.expires_at ? new Date(currentEntitlement.expires_at) : null;
  const startsAt = currentExpiry && currentExpiry.getTime() > now.getTime() ? currentExpiry : now;
  const expiresAt = new Date(startsAt.getTime() + PLAN_DURATIONS_MS[planId]);

  const { error: entitlementError } = await adminClient.from("premium_entitlements").upsert({
    id: `premium_${userId}`,
    user_id: userId,
    plan_id: planId,
    provider_reference: providerReference,
    status: "active",
    starts_at: startsAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    updated_at: now.toISOString(),
  }, { onConflict: "user_id" });
  if (entitlementError) throw entitlementError;
};

const isValidSignature = async (payload: string, signature: string, secretKey: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secretKey),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return signature.length === 128 && toHex(new Uint8Array(digest)) === signature.toLowerCase();
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);

  try {
    const secretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!secretKey) return json({ ok: false, error: "Webhook is not configured." }, 503);

    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature") || "";
    if (!(await isValidSignature(rawBody, signature, secretKey))) {
      return json({ ok: false, error: "Invalid webhook signature." }, 401);
    }

    const event = JSON.parse(rawBody) as Record<string, any>;
    const eventData = event.data || {};
    const reference = typeof eventData.reference === "string"
      ? eventData.reference
      : typeof eventData.transaction?.reference === "string"
      ? eventData.transaction.reference
      : "";
    if (!reference) return json({ ok: true, ignored: true });

    const status = event.event === "charge.success"
      ? "success"
      : event.event === "refund.processed"
      ? "refunded"
      : event.event === "charge.failed"
      ? "failed"
      : event.event === "refund.failed"
      ? "failed"
      : null;
    if (!status) return json({ ok: true, ignored: true });

    const adminClient = getAdminClient();
    const { data: existing, error: existingError } = await adminClient
      .from("payment_transactions")
      .select("id, user_id, plan_id, amount_kobo, currency, metadata, status")
      .eq("provider_reference", reference)
      .maybeSingle();
    if (existingError) throw existingError;

    const eventMetadata = typeof eventData.metadata === "object" && eventData.metadata ? eventData.metadata : {};
    const metadata = {
      ...(existing?.metadata || {}),
      ...eventMetadata,
      last_webhook_event: event.event || null,
      last_webhook_at: new Date().toISOString(),
    };
    const amountKobo = Number(eventData.amount || existing?.amount_kobo || 0);
    const currency = eventData.currency || existing?.currency || "NGN";
    const userId = eventMetadata.user_id || existing?.user_id || null;
    const planId = eventMetadata.plan_id || existing?.plan_id || null;
    const paidAt = status === "success" && eventData.paid_at ? eventData.paid_at : null;

    const { error: upsertError } = await adminClient.from("payment_transactions").upsert({
      id: existing?.id || reference,
      provider: "paystack",
      provider_reference: reference,
      user_id: userId,
      plan_id: planId,
      amount_kobo: amountKobo,
      currency,
      status,
      paid_at: paidAt,
      metadata,
    }, { onConflict: "provider_reference" });
    if (upsertError) throw upsertError;

    if (status === "success" && userId && (planId === "weekly" || planId === "monthly" || planId === "semester")) {
      await grantPremiumEntitlement(adminClient, userId, planId, reference);

      const { data: profile, error: profileReadError } = await adminClient
        .from("profiles")
        .select("id, badges")
        .eq("id", userId)
        .maybeSingle();
      if (profileReadError) throw profileReadError;
      if (profile) {
        const currentBadges = Array.isArray(profile.badges) ? profile.badges : [];
        const nextBadges = Array.from(new Set([...currentBadges, "👑 VIP Royal Pass"]));
        const { error: profileError } = await adminClient
          .from("profiles")
          .update({ badges: nextBadges })
          .eq("id", userId);
        if (profileError) throw profileError;
      }
    }

    if (status === "refunded") {
      const { error: entitlementError } = await adminClient
        .from("premium_entitlements")
        .update({ status: "refunded", updated_at: new Date().toISOString() })
        .eq("provider_reference", reference);
      if (entitlementError) throw entitlementError;
    }

    return json({ ok: true, recorded: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return json({ ok: false, error: "Webhook processing failed." }, 500);
  }
});
