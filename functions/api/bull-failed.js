// Cloudflare Pages Function — Proxy de trabajos Failed del Controller (Bull Board API)
// Route: GET /api/bull-failed?queue=consultaDocumentoCore&page=1
// Devuelve la respuesta original de /admin/trabajos/api/queues con los jobs Failed
// de la cola pedida (50 por página). Solo colas en la lista blanca.

const UPSTREAM = 'https://controller-monitor.futura100.com.py/admin/trabajos/api/queues';
const ALLOWED = new Set(['consultaDocumentoCore']);
const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: HEADERS });

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const queue = url.searchParams.get('queue') || 'consultaDocumentoCore';
  if (!ALLOWED.has(queue)) return json({ error: `Cola no permitida: ${queue}` }, 400);

  const page = Math.min(Math.max(parseInt(url.searchParams.get('page') || '1', 10) || 1, 1), 100);
  const params = new URLSearchParams({
    activeQueue: queue,
    status: 'failed',
    page: String(page),
    jobsPerPage: '50',
  });

  try {
    const res = await fetch(`${UPSTREAM}?${params}`, {
      headers: { Accept: 'application/json' },
      cf: { cacheTtl: 0, cacheEverything: false },
    });
    if (!res.ok) return json({ error: `Controller respondió HTTP ${res.status}` }, 502);
    return new Response(await res.text(), { headers: HEADERS });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' },
  });
}
