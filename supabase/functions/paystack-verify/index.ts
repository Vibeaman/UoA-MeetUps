import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PLANS = {
  weekly: { amount: 150000 },
  monthly: { amount: 450000 },
  semester: { amount: 1200000 },
} as const;

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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);

  try {
    const secretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!secretKey) return json({ ok: false, error: "Paystack is not configured." }, 503);

    const authorization = request.headers.get("Authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ ok: false, error: "Authentication is required." }, 401);

    const adminClient = getAdminClient();
    const { data: userResult, error: userError } = await adminClient.auth.getUser(token);
    const user = userResult.user;
    if (userError || !user?.id) return json({ ok: false, error: "Authentication is required." }, 401);

    const body = await request.json() as Record<string, unknown>;
    const reference = typeof body.reference === "string" ? body.reference.trim() : "";
    if (!reference) return json({ ok: false, error: "A transaction reference is required." }, 400);

    const { data: transaction, error: transactionError } = await adminClient
      .from("payment_transactions")
      .select("id, provider_reference, user_id, plan_id, amount_kobo, currency, status, metadata")
      .eq("provider_reference", reference)
      .eq("user_id", user.id)
      .maybeSingle();
    if (transactionError || !transaction) return json({ ok: false, error: "Transaction not found." }, 404);

    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const paystackData = await paystackResponse.json();
    const verified = paystackResponse.ok && paystackData?.status && paystackData?.data;
    const paymentData = paystackData?.data;
    const expectedAmount = PLANS[transaction.plan_id as keyof typeof PLANS]?.amount || Number(transaction.amount_kobo);
    const isSuccessful = verified
      && paymentData.status === "success"
      && paymentData.currency === transaction.currency
      && Number(paymentData.amount) === expectedAmount
      && Number(paymentData.amount) === Number(transaction.amount_kobo);

    const nextStatus = isSuccessful
      ? "success"
      : paymentData?.status === "abandoned"
      ? "abandoned"
      : "failed";
    const metadata = {
      ...(typeof transaction.metadata === "object" && transaction.metadata ? transaction.metadata : {}),
      paystack_status: paymentData?.status || null,
      paystack_gateway_response: paymentData?.gateway_response || null,
      verified_at: new Date().toISOString(),
    };

    const { error: updateError } = await adminClient
      .from("payment_transactions")
      .update({
        status: nextStatus,
        paid_at: isSuccessful && paymentData.paid_at ? paymentData.paid_at : null,
        metadata,
      })
      .eq("id", transaction.id)
      .eq("user_id", user.id);
    if (updateError) throw updateError;

    if (isSuccessful) {
      const { data: profile, error: profileReadError } = await adminClient
        .from("profiles")
        .select("id, badges")
        .eq("id", user.id)
        .maybeSingle();
      if (profileReadError) throw profileReadError;
      const currentBadges = Array.isArray(profile?.badges) ? profile.badges : [];
      const nextBadges = Array.from(new Set([...currentBadges, "👑 VIP Royal Pass"]));
      const { error: profileError } = await adminClient
        .from("profiles")
        .update({ badges: nextBadges })
        .eq("id", user.id);
      if (profileError) throw profileError;
    }

    return json({
      ok: true,
      paid: isSuccessful,
      status: nextStatus,
      reference,
      planId: transaction.plan_id,
      amountKobo: transaction.amount_kobo,
      currency: transaction.currency,
    });
  } catch (error) {
    console.error("Paystack verification error:", error);
    return json({ ok: false, error: "Payment verification failed." }, 500);
  }
});
