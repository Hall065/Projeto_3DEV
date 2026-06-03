import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

async function sha256Hex(value: string) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');
  const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
  const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');

  if (!apiSecret || !apiKey || !cloudName) {
    return new Response(JSON.stringify({ error: 'Cloudinary nao configurado' }), { status: 500 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = `timestamp=${timestamp}${apiSecret}`;
  const signature = await sha256Hex(paramsToSign);

  return new Response(
    JSON.stringify({ cloudName, apiKey, signature, timestamp }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
