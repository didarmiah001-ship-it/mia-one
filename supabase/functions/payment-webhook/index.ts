import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, stripe-signature",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const gateway = url.searchParams.get("gateway");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    if (gateway === "stripe") {
      // ── Stripe webhook ──────────────────────────────────────────────────────
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

      if (!stripeKey || !webhookSecret) {
        return new Response("Stripe not configured", { status: 503 });
      }

      const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
      const signature = req.headers.get("stripe-signature") || "";
      const body = await req.text();

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch {
        return new Response("Invalid signature", { status: 400 });
      }

      if (event.type === "payment_intent.succeeded") {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.order_id;
        if (orderId) {
          await supabase
            .from("payments")
            .update({ status: "verified", gateway_ref: pi.id, gateway_response: pi, verified_at: new Date().toISOString() })
            .eq("gateway_ref", pi.id);

          await supabase
            .from("orders")
            .update({ payment_status: "paid", status: "confirmed" })
            .eq("id", orderId);
        }
      }

      if (event.type === "payment_intent.payment_failed") {
        const pi = event.data.object as Stripe.PaymentIntent;
        await supabase
          .from("payments")
          .update({ status: "failed", gateway_response: pi })
          .eq("gateway_ref", pi.id);
      }

      if (event.type === "charge.refunded") {
        const charge = event.data.object as Stripe.Charge;
        const refundAmount = charge.amount_refunded / 100;
        const status = charge.refunded ? "refunded" : "partially_refunded";
        await supabase
          .from("payments")
          .update({ status, refund_amount: refundAmount, refunded_at: new Date().toISOString() })
          .eq("gateway_ref", charge.payment_intent as string);
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (gateway === "sslcommerz") {
      // ── SSLCommerz IPN ──────────────────────────────────────────────────────
      const storeId = Deno.env.get("SSLCOMMERZ_STORE_ID");
      const storePasswd = Deno.env.get("SSLCOMMERZ_STORE_PASSWORD");
      const isSandbox = Deno.env.get("SSLCOMMERZ_SANDBOX") !== "false";

      if (!storeId || !storePasswd) {
        return new Response("SSLCommerz not configured", { status: 503 });
      }

      let body: Record<string, string> = {};
      if (req.method === "POST") {
        const text = await req.text();
        const params = new URLSearchParams(text);
        params.forEach((v, k) => { body[k] = v; });
      }

      const { val_id, status: sslStatus, tran_id: orderId, amount, currency } = body;

      if (sslStatus === "VALID" && val_id) {
        // Validate with SSLCommerz validation API
        const validateBase = isSandbox
          ? "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"
          : "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php";

        const validateUrl = `${validateBase}?val_id=${val_id}&store_id=${storeId}&store_passwd=${storePasswd}&format=json`;
        const vRes = await fetch(validateUrl);
        const vData = await vRes.json();

        if (vData.status === "VALID" || vData.status === "VALIDATED") {
          await supabase
            .from("payments")
            .update({ status: "verified", gateway_response: vData, verified_at: new Date().toISOString() })
            .eq("gateway_ref", orderId);

          await supabase
            .from("orders")
            .update({ payment_status: "paid", status: "confirmed" })
            .eq("id", orderId);
        }
      }

      if (sslStatus === "FAILED" || sslStatus === "CANCELLED") {
        await supabase
          .from("payments")
          .update({ status: "failed", gateway_response: body })
          .eq("gateway_ref", orderId);
      }

      return new Response("OK", { status: 200 });
    }

    return new Response("Unknown gateway", { status: 400 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
