import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const storeId    = Deno.env.get("SSLCOMMERZ_STORE_ID");
    const storePasswd = Deno.env.get("SSLCOMMERZ_STORE_PASSWORD");
    const isSandbox  = Deno.env.get("SSLCOMMERZ_SANDBOX") !== "false";

    if (!storeId || !storePasswd) {
      return new Response(
        JSON.stringify({ error: "SSLCommerz not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      order_id,
      amount,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      product_name = "MIA ONE Order",
      success_url,
      fail_url,
      cancel_url,
    } = await req.json();

    if (!order_id || !amount) {
      return new Response(
        JSON.stringify({ error: "order_id and amount are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = isSandbox
      ? "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"
      : "https://securepay.sslcommerz.com/gwprocess/v4/api.php";

    const appUrl = Deno.env.get("APP_URL") || "https://miaone.app";

    const formData = new URLSearchParams({
      store_id: storeId,
      store_passwd: storePasswd,
      total_amount: String(amount),
      currency: "BDT",
      tran_id: order_id,
      success_url: success_url || `${appUrl}/payment/success`,
      fail_url: fail_url || `${appUrl}/payment/fail`,
      cancel_url: cancel_url || `${appUrl}/payment/cancel`,
      ipn_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook?gateway=sslcommerz`,
      cus_name: customer_name || "Customer",
      cus_email: customer_email || "customer@miaone.app",
      cus_phone: customer_phone || "01700000000",
      cus_add1: customer_address || "Dhaka",
      cus_city: "Dhaka",
      cus_country: "Bangladesh",
      ship_name: customer_name || "Customer",
      ship_add1: customer_address || "Dhaka",
      ship_city: "Dhaka",
      ship_country: "Bangladesh",
      product_name,
      product_category: "General",
      product_profile: "general",
      emi_option: "0",
      num_of_item: "1",
      product_amount: String(amount),
      shipping_method: "Courier",
      value_a: order_id,
    });

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const data = await response.json();

    if (data.status === "SUCCESS") {
      return new Response(
        JSON.stringify({
          gateway_url: data.GatewayPageURL,
          session_key: data.sessionkey,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: data.failedreason || "SSLCommerz initiation failed" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
