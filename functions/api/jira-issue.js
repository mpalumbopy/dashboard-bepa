/**
 * Cloudflare Pages Function — Detalle completo de un ticket Jira
 * Route: GET /api/jira-issue?key=IN-123
 * Devuelve: issue (con renderedFields + changelog) + comments (con renderedBody)
 */
const JIRA_BASE = "https://grupobepa.atlassian.net";
const CORS = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
const FIELDS = "summary,status,assignee,reporter,priority,project,issuetype,created,updated,description,comment,labels,timeoriginalestimate,timespent,timeestimate,parent,subtasks,attachment";

export async function onRequestGet(context) {
  const { request, env } = context;
  const key = new URL(request.url).searchParams.get("key");

  if (!key) return new Response(JSON.stringify({ error: "key requerido" }), { status: 400, headers: CORS });
  if (!env.JIRA_EMAIL || !env.JIRA_TOKEN)
    return new Response(JSON.stringify({ error: "Credenciales no configuradas" }), { status: 500, headers: CORS });

  const auth = `Basic ${btoa(`${env.JIRA_EMAIL}:${env.JIRA_TOKEN}`)}`;
  const h = { Authorization: auth, Accept: "application/json" };

  try {
    const [issueRes, commentsRes] = await Promise.all([
      fetch(`${JIRA_BASE}/rest/api/3/issue/${key}?expand=renderedFields,changelog&fields=${FIELDS}`, { headers: h }),
      fetch(`${JIRA_BASE}/rest/api/3/issue/${key}/comment?expand=renderedBody&maxResults=100&orderBy=created`, { headers: h }),
    ]);

    if (!issueRes.ok) {
      const err = await issueRes.text();
      return new Response(JSON.stringify({ error: `Jira ${issueRes.status}: ${err}` }), { status: issueRes.status, headers: CORS });
    }

    const issue = await issueRes.json();
    const commentsData = commentsRes.ok ? await commentsRes.json() : { comments: [] };

    return new Response(JSON.stringify({ issue, comments: commentsData.comments || [] }), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 502, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" } });
}
