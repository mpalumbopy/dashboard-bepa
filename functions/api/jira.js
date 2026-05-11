/**
 * Cloudflare Pages Function — Proxy hacia Jira REST API
 * Ruta: /api/jira  (POST)
 *
 * Variables de entorno requeridas (configurar en Cloudflare Pages → Settings → Environment variables):
 *   JIRA_EMAIL  → tu email de Atlassian (ej: marcelo@grupobepa.com)
 *   JIRA_TOKEN  → API token de Jira (https://id.atlassian.com/manage-profile/security/api-tokens)
 */

const JIRA_BASE = "https://grupobepa.atlassian.net";

export async function onRequestPost(context) {
  const { request, env } = context;

  // ── CORS headers (permite llamadas desde el mismo dominio) ──────────────────
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  // ── Validación de credenciales configuradas ─────────────────────────────────
  if (!env.JIRA_EMAIL || !env.JIRA_TOKEN) {
    return new Response(
      JSON.stringify({ error: "Credenciales de Jira no configuradas en el servidor" }),
      { status: 500, headers: corsHeaders }
    );
  }

  // ── Parse del body ──────────────────────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Body inválido" }),
      { status: 400, headers: corsHeaders }
    );
  }

  const { jql, fields, maxResults = 100, startAt = 0, nextPageToken } = body;
  if (!jql) {
    return new Response(
      JSON.stringify({ error: "jql requerido" }),
      { status: 400, headers: corsHeaders }
    );
  }

  // ── Llamada a Jira REST API v3 ──────────────────────────────────────────────
  const basicAuth = btoa(`${env.JIRA_EMAIL}:${env.JIRA_TOKEN}`);
  const fieldList = fields || ["summary", "status", "assignee", "project", "issuetype",
                      "timeoriginalestimate", "timespent", "timeestimate",
                      "created", "updated", "priority"];

  let jiraRes;
  try {
    jiraRes = await fetch(`${JIRA_BASE}/rest/api/3/search/jql`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        jql,
        fields: fieldList,
        maxResults,
        ...(nextPageToken ? { nextPageToken } : {}),
        fieldsByKeys: false,
      }),
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "No se pudo conectar con Jira: " + e.message }),
      { status: 502, headers: corsHeaders }
    );
  }

  if (!jiraRes.ok) {
    const errText = await jiraRes.text();
    return new Response(
      JSON.stringify({ error: `Jira respondió ${jiraRes.status}: ${errText}` }),
      { status: jiraRes.status, headers: corsHeaders }
    );
  }

  const data = await jiraRes.json();
  return new Response(JSON.stringify(data), { headers: corsHeaders });
}

// Preflight CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Dashboard-Token",
    },
  });
}
