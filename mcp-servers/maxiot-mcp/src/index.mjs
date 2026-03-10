import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Configuration (from environment variables)
// ---------------------------------------------------------------------------

const config = {
  gatewayUrl:
    process.env.MAXIOT_GATEWAY_URL || "https://api-cn1.biot-apps.com/",
  apiBase: process.env.MAXIOT_API_BASE || "https://api.maxiot.com",
  xToken: process.env.MAXIOT_X_TOKEN || "",
  token: process.env.MAXIOT_TOKEN || "",
  orgId: process.env.MAXIOT_ORG_ID || "",
  appId: process.env.MAXIOT_APP_ID || "",
  projectCode: process.env.MAXIOT_PROJECT_CODE || "",
  tenantCode: process.env.MAXIOT_TENANT_CODE || "",
  country: process.env.MAXIOT_COUNTRY || "cn",
};

// ---------------------------------------------------------------------------
// Gateway helper
// ---------------------------------------------------------------------------

function buildApiHeaders(overrides = {}) {
  return {
    "x-org-id": config.orgId,
    "max-app-id": config.appId,
    "sunmi-appid": config.appId,
    "x-client-name": config.projectCode,
    "x-token": config.xToken,
    "max-token": config.token,
    "sunmi-token": config.token,
    "content-type": "application/json",
    "x-language": "zh-CN",
    ...overrides,
  };
}

/**
 * 通过 biot 网关调用 MaxIoT API。
 *
 * @param {string} serviceName  网关服务名（仅标识用途）
 * @param {string} apiPath      API 路径，如 /v3/max/mermaid/public/...
 * @param {object} body         请求体
 * @param {object} [options]
 * @param {string} [options.method='post']
 * @param {number} [options.timeout=50000]
 * @param {object} [options.headerOverrides]
 */
async function callGateway(serviceName, apiPath, body, options = {}) {
  const { method = "post", timeout = 50000, headerOverrides } = options;

  const payload = {
    config: { requestTimeout: timeout, serviceName },
    httpData: {
      uri: `${config.apiBase}${apiPath}`,
      method,
      header: buildApiHeaders(headerOverrides),
      body,
    },
  };

  const res = await fetch(config.gatewayUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "MAX-COUNTRY": config.country,
      "g-model": "dt",
      "locale-language": "zh-CN",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gateway ${res.status}: ${text}`);
  }

  return res.json();
}

/** 构造通用 context 对象 */
function makeContext(tenantCode) {
  return {
    tenantCode: tenantCode || config.tenantCode,
    projectCode: config.projectCode,
  };
}

/** 格式化 API 结果为 MCP 响应 */
function ok(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function fail(msg) {
  return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "maxiot-mcp",
  version: "1.0.0",
});

// ---- Tool: 查询项目列表 ----

server.tool(
  "query-project-list",
  "查询 MaxIoT 平台的项目列表，支持关键字搜索、分页、按项目类型过滤",
  {
    keyword: z.string().optional().describe("搜索关键字"),
    pageNum: z.number().optional().default(1).describe("页码"),
    pageSize: z.number().optional().default(10).describe("每页数量"),
    tenantCode: z.string().optional().describe("租户编码，不传使用默认值"),
    joinType: z
      .number()
      .optional()
      .default(1)
      .describe("1=我参与的, 0=全部"),
    projectTypeList: z
      .array(z.string())
      .optional()
      .default(["application", "component"])
      .describe('项目类型，如 application / component'),
  },
  async ({ keyword, pageNum, pageSize, tenantCode, joinType, projectTypeList }) => {
    try {
      const tc = tenantCode || config.tenantCode;
      const data = await callGateway(
        "queryByTenantPageList",
        "/v3/max/mermaid/public/MaxDevProjectQueryFacade/queryByTenantPageList",
        {
          request: {
            joinType,
            keyword: keyword || "",
            projectTypeList,
            pageNum,
            pageSize,
            type: 1,
            tenantCode: tc,
          },
          context: makeContext(tc),
        }
      );
      return ok(data);
    } catch (e) {
      return fail(e.message);
    }
  }
);

// ---- Tool: 查询项目详情 ----

server.tool(
  "query-project-detail",
  "根据项目编码查询 MaxIoT 项目的详细信息",
  {
    projectCode: z.string().describe("项目编码，如 PRJ240108..."),
    tenantCode: z.string().optional().describe("租户编码，不传使用默认值"),
  },
  async ({ projectCode, tenantCode }) => {
    try {
      const tc = tenantCode || config.tenantCode;
      const data = await callGateway(
        "queryByCode",
        "/v3/max/mermaid/public/MaxDevProjectQueryFacade/queryByCode",
        {
          request: { tenantCode: tc },
          context: { tenantCode: tc, projectCode },
        }
      );
      return ok(data);
    } catch (e) {
      return fail(e.message);
    }
  }
);

// ---------------------------------------------------------------------------
//  新增 tool 模板（复制下面的块，修改参数即可）
// ---------------------------------------------------------------------------
//
// server.tool(
//   "tool-name",
//   "工具描述",
//   { param: z.string().describe("参数说明") },
//   async ({ param }) => {
//     try {
//       const data = await callGateway(
//         "serviceName",
//         "/v3/max/mermaid/public/SomeFacade/someMethod",
//         { request: { ... }, context: makeContext() }
//       );
//       return ok(data);
//     } catch (e) {
//       return fail(e.message);
//     }
//   }
// );

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
