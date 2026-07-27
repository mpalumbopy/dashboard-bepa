// Cloudflare Pages Function — Proxy Bull Queue API (Core)
// Route: GET /api/bull-core

const UPSTREAM = 'https://core-monitor.futura100.com.py/admin/trabajos/api/queues?page=1&jobsPerPage=10';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

export async function onRequestGet() {
  try {
    const res = await fetch(UPSTREAM);
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 502, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' } });
}
