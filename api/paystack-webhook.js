const SUPABASE_WEBHOOK_URL = 'https://ylyfpatonnplpmvmrsji.supabase.co/functions/v1/paystack-webhook';

export const config = {
  api: {
    bodyParser: false,
  },
};

const readRawBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

export default async function handler(request, response) {
  if (request.method === 'GET' || request.method === 'HEAD') {
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');
    response.end('Paystack webhook ready');
    return;
  }

  if (request.method !== 'POST') {
    response.statusCode = 405;
    response.setHeader('Allow', 'GET, HEAD, POST');
    response.end('Method not allowed');
    return;
  }

  try {
    const rawBody = await readRawBody(request);
    const signature = request.headers['x-paystack-signature'];
    const contentType = request.headers['content-type'] || 'application/json';
    const signatureValue = Array.isArray(signature) ? signature[0] : signature || '';

    const upstream = await fetch(SUPABASE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'x-paystack-signature': signatureValue,
      },
      body: rawBody,
    });

    const body = await upstream.text();
    response.statusCode = upstream.status;
    response.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    response.end(body);
  } catch (error) {
    console.error('Paystack webhook proxy error:', error instanceof Error ? error.message : error);
    response.statusCode = 502;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ ok: false, error: 'Webhook forwarding failed.' }));
  }
}
