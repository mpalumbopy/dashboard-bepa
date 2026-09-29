// Cloudflare Pages Function — Proxy del Semáforo SIFEN (DNIT)
// Route: GET /api/sifen-semaforo
// Respuesta esperada: { data: [ { nombreServicio, estado: VERDE|AMARILLO|ROJO, tiempoPromedio } ] }

const UPSTREAM = 'https://semaforo-sifen.dnit.gov.py/semafororest/estado';
const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: HEADERS });

export async function onRequestGet() {
  try {
    const res = await fetch(UPSTREAM, {
      headers: { Accept: 'application/json' },
      cf: { cacheTtl: 0, cacheEverything: false },
    });
    if (!res.ok) return json({ error: `DNIT respondió HTTP ${res.status}` }, 502);
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
