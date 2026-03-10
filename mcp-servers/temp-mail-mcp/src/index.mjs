/**
 * Temp Mail MCP - 免费临时邮箱（mail.tm + 1secmail，可扩展多 provider）
 * 能力：列域名、选 domain 创建邮箱、收邮件、提取验证码
 * API: https://docs.mail.tm/ , https://www.1secmail.com/api/v1/
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const MAILTM_BASE = "https://api.mail.tm";
const SECMAIL_BASE = "https://www.1secmail.com/api/v1";

const DEFAULT_HEADERS = { "Content-Type": "application/json", Accept: "application/json" };

function ok(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function fail(msg) {
  return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
}

function randomString(len = 12) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { ...DEFAULT_HEADERS, ...options.headers } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body.message || body["hydra:description"] || res.statusText;
    throw new Error(`${res.status}: ${msg}`);
  }
  return body;
}

async function getDomainsFromMailTm() {
  const data = await fetchJson(`${MAILTM_BASE}/domains`);
  const list = Array.isArray(data) ? data : data["hydra:member"] || data.member || [];
  return list
    .filter((d) => d.isActive !== false)
    .map((d) => ({ provider: "mail.tm", domain: d.domain, id: d.id }));
}

async function getDomainsFrom1SecMail() {
  const url = `${SECMAIL_BASE}/?action=getDomainList`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const list = await res.json().catch(() => []);
  return Array.isArray(list) ? list.map((d) => ({ provider: "1secmail", domain: typeof d === "string" ? d : d.domain || d })) : [];
}

const FALLBACK_DOMAINS = [
  { provider: "mail.tm", domain: "dollicons.com" },
  { provider: "mail.tm", domain: "tempmail.lol" },
  { provider: "mail.tm", domain: "mail.tm" },
  { provider: "1secmail", domain: "1secmail.com" },
  { provider: "1secmail", domain: "1secmail.org" },
  { provider: "1secmail", domain: "1secmail.net" },
];

async function listDomains() {
  const results = [];
  try {
    const mailTm = await getDomainsFromMailTm();
    results.push(...mailTm);
  } catch (_) {}
  try {
    const sec = await getDomainsFrom1SecMail();
    results.push(...sec);
  } catch (_) {}
  const seen = new Set();
  const merged = results.filter((d) => {
    const key = `${d.provider}:${d.domain}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return merged.length > 0 ? merged : FALLBACK_DOMAINS;
}

function resolveProviderForDomain(domainsList, domain) {
  const d = domain.replace(/^@/, "").toLowerCase();
  return domainsList.find((x) => x.domain.toLowerCase() === d)?.provider || "mail.tm";
}

async function createAccount(address, password) {
  return fetchJson(`${MAILTM_BASE}/accounts`, {
    method: "POST",
    body: JSON.stringify({ address, password }),
  });
}

async function getMailTmToken(address, password) {
  const data = await fetchJson(`${MAILTM_BASE}/token`, {
    method: "POST",
    body: JSON.stringify({ address, password }),
  });
  if (!data.token) throw new Error("No token in response");
  return data.token;
}

function parseToken(token) {
  try {
    const j = JSON.parse(token);
    if (j && j.provider === "1secmail" && j.login && j.domain) return j;
  } catch (_) {}
  return null;
}

async function getMessages(token, page = 1) {
  const sec = parseToken(token);
  if (sec) {
    const url = `${SECMAIL_BASE}/?action=getMessages&login=${encodeURIComponent(sec.login)}&domain=${encodeURIComponent(sec.domain)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`1secmail getMessages: ${res.status}`);
    const list = await res.json().catch(() => []);
    return (Array.isArray(list) ? list : []).map((m) => ({
      id: String(m.id),
      from: typeof m.from === "string" ? m.from : (m.from?.address ?? m.from ?? ""),
      subject: m.subject || "",
      intro: m.intro || m.bodyPreview || m.preview || "",
      createdAt: m.date || m.createdAt || "",
    }));
  }
  const data = await fetchJson(`${MAILTM_BASE}/messages?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const list = Array.isArray(data) ? data : data["hydra:member"] || data.member || [];
  return list.map((m) => ({
    id: m.id,
    from: m.from,
    subject: m.subject,
    intro: m.intro,
    createdAt: m.createdAt,
  }));
}

async function getMessageById(token, messageId) {
  const sec = parseToken(token);
  if (sec) {
    const url = `${SECMAIL_BASE}/?action=readMessage&login=${encodeURIComponent(sec.login)}&domain=${encodeURIComponent(sec.domain)}&id=${encodeURIComponent(messageId)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`1secmail readMessage: ${res.status}`);
    const m = await res.json().catch(() => ({}));
    const text = m.body ?? m.text ?? m.textBody ?? "";
    const html = m.htmlBody ?? m.html ?? "";
    const from = typeof m.from === "string" ? m.from : (m.from?.address ?? m.from ?? "");
    return {
      subject: m.subject || "",
      text,
      html,
      from,
      createdAt: m.date || m.createdAt || "",
    };
  }
  const m = await fetchJson(`${MAILTM_BASE}/messages/${messageId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const html = Array.isArray(m.html) ? m.html.join("") : m.html || "";
  return {
    subject: m.subject,
    text: m.text || "",
    html,
    from: m.from,
    createdAt: m.createdAt,
  };
}

function extractVerificationCode(text, pattern = /\b(\d{4,8})\b/) {
  if (!text || typeof text !== "string") return null;
  const re = typeof pattern === "string" ? new RegExp(pattern) : pattern;
  const m = text.match(re);
  return m ? m[1] : null;
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "temp-mail-mcp",
  version: "1.0.0",
});

server.tool(
  "list-domains",
  "列出所有可用的临时邮箱域名，创建邮箱前先调用此接口获取 domain 列表，再由用户选择后调用 create-inbox",
  {},
  async () => {
    try {
      const domains = await listDomains();
      return ok({ domains, hint: "将选中的 domain 传入 create-inbox 的 domain 参数" });
    } catch (e) {
      return fail(e.message);
    }
  }
);

server.tool(
  "create-inbox",
  "使用选定的 domain 和自定义用户名创建临时邮箱。先调用 list-domains 获取可选 domain（含 mail.tm 与 1secmail 等），再传入此处。返回 address、token；mail.tm 还返回 password。后续拉邮件和取验证码需使用 token。",
  {
    username: z.string().min(1).describe("邮箱前缀（本地部分），如 myuser，最终邮箱为 myuser@<domain>"),
    domain: z.string().min(1).describe("域名，从 list-domains 返回的 domain 列表中选一个，如 dollicons.com 或 1secmail.com"),
    password: z.string().optional().describe("仅 mail.tm 使用，1secmail 无需密码；不传则自动生成"),
  },
  async ({ username, domain, password }) => {
    try {
      const domainsList = await listDomains();
      const provider = resolveProviderForDomain(domainsList, domain);
      const local = String(username).trim().toLowerCase().replace(/@.*/, "");
      const dom = domain.replace(/^@/, "").trim();
      const address = `${local}@${dom}`;

      if (provider === "1secmail") {
        const token = JSON.stringify({ provider: "1secmail", login: local, domain: dom });
        return ok({
          address,
          token,
          provider: "1secmail",
          hint: "1secmail 无需密码，请保存 token 用于 get-messages / get-verification-code",
        });
      }

      const pwd = password || randomString(12);
      await createAccount(address, pwd);
      const token = await getMailTmToken(address, pwd);
      return ok({
        address,
        password: pwd,
        token,
        provider: "mail.tm",
        hint: "请保存 token，后续 get-messages 和 get-verification-code 需要用到",
      });
    } catch (e) {
      return fail(e.message);
    }
  }
);

server.tool(
  "get-messages",
  "获取该临时邮箱的收件列表（摘要）。需要创建邮箱时返回的 token。",
  {
    token: z.string().describe("create-inbox 返回的 token"),
    page: z.number().optional().default(1).describe("页码"),
  },
  async ({ token, page }) => {
    try {
      const list = await getMessages(token, page);
      return ok({ messages: list });
    } catch (e) {
      return fail(e.message);
    }
  }
);

server.tool(
  "get-message",
  "获取单封邮件的完整正文（用于查看内容或自行提取验证码）。",
  {
    token: z.string().describe("create-inbox 返回的 token"),
    messageId: z.string().describe("邮件 ID，来自 get-messages 返回的 id"),
  },
  async ({ token, messageId }) => {
    try {
      const msg = await getMessageById(token, messageId);
      return ok(msg);
    } catch (e) {
      return fail(e.message);
    }
  }
);

server.tool(
  "get-verification-code",
  "从收件箱中查找并提取验证码：拉取邮件列表，从最新一封开始检查正文中的数字验证码（默认 4–8 位），返回第一个匹配到的验证码及对应邮件信息。若尚未收到验证码邮件可稍后重试。",
  {
    token: z.string().describe("create-inbox 返回的 token"),
    codePattern: z.string().optional().describe("可选，验证码正则，默认匹配 4–8 位数字，如 \\b(\\\\d{6})\\\\b 表示 6 位数字"),
  },
  async ({ token, codePattern }) => {
    try {
      const list = await getMessages(token);
      const pattern = codePattern ? new RegExp(codePattern) : /\b(\d{4,8})\b/;
      for (const m of list) {
        const full = await getMessageById(token, m.id);
        const text = full.text || (full.html || "").replace(/<[^>]+>/g, " ");
        const code = extractVerificationCode(text, pattern);
        if (code) {
          return ok({
            code,
            subject: full.subject,
            from: full.from,
            messageId: m.id,
          });
        }
      }
      return ok({
        code: null,
        hint: "当前收件箱中未找到匹配的验证码，请确认验证码邮件已发送后重试",
        messageCount: list.length,
      });
    } catch (e) {
      return fail(e.message);
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
