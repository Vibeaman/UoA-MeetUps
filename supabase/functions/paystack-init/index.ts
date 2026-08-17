import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PLANS = {
  weekly: { amount: 150000, name: "Weekly Pass" },
  monthly: { amount: 450000, name: "Monthly VIP" },
  semester: { amount: 1200000, name: "Semester Royal Pass" },
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
    if (userError || !user?.id || !user.email) return json({ ok: false, error: "Authentication is required." }, 401);

    const body = await request.json() as Record<string, unknown>;
    const planId = typeof body.planId === "string" ? body.planId.trim().toLowerCase() : "";
    const plan = PLANS[planId as keyof typeof PLANS];
    if (!plan) return json({ ok: false, error: "Invalid premium plan." }, 400);

    const reference = `uoa_${crypto.randomUUID().replaceAll("-", "")}`;
    const callbackUrl = Deno.env.get("PAYSTACK_CALLBACK_URL") || "https://uo-a-meet-ups.vercel.app/?payment=callback";
    const metadata = {
      user_id: user.id,
      plan_id: planId,
      plan_name: plan.name,
      source: "uoa_meetups_web",
    };

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: plan.amount,
        currency: "NGN",
        reference,
        callback_url: callbackUrl,
        metadata,
      }),
    });
    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData?.status || !paystackData?.data?.authorization_url) {
      console.error("Paystack initialization failed:", paystackData);
      return json({ ok: false, error: "Paystack could not initialize this payment." }, 502);
    }

    const { error: insertError } = await adminClient.from("payment_transactions").insert({
      id: reference,
      provider: "paystack",
      provider_reference: reference,
      user_id: user.id,
      plan_id: planId,
      amount_kobo: plan.amount,
      currency: "NGN",
      status: "pending",
      metadata,
    });
    if (insertError) {
      console.error("Payment transaction record failed:", insertError);
      return json({ ok: false, error: "Payment could not be recorded safely." }, 500);
    }

    return json({
      ok: true,
      reference,
      accessCode: paystackData.data.access_code,
      authorizationUrl: paystackData.data.authorization_url,
      amountKobo: plan.amount,
      currency: "NGN",
      planId,
    });
  } catch (error) {
    console.error("Paystack initialization error:", error);
    return json({ ok: false, error: "Payment initialization failed." }, 500);
  }
});
