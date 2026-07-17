import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ImageKit requires: HMAC-SHA1(token + expire, privateKey) returned as a
// lowercase hexadecimal string (NOT base64). Using SHA-256 or base64 output
// causes "400 - invalid signature parameter" on upload.
async function hmacSha1Hex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const privateKey = Deno.env.get("IMAGEKIT_PRIVATE_KEY");
    const publicKey =
      Deno.env.get("IMAGEKIT_PUBLIC_KEY") ??
      "public_yEPy2DHHPu/KY2jJ3R5GIjfbkZc=";

    if (!privateKey) {
      return new Response(
        JSON.stringify({
          error: "IMAGEKIT_PRIVATE_KEY secret is not configured",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Random token (UUID without dashes).
    const token = crypto.randomUUID().replace(/-/g, "");

    // Expire: Unix timestamp 30 minutes from now (ImageKit max is 1 hour).
    const expire = Math.floor(Date.now() / 1000) + 1800;

    // signature = HMAC-SHA1(token + expire, privateKey) as lowercase hex.
    const signature = await hmacSha1Hex(token + expire, privateKey);

    return new Response(
      JSON.stringify({ token, expire, signature, publicKey }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
