import { spawnSync } from "child_process";
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


/**
 * 
 */



// ---- Tool: 查询已加入的组织（租户）列表 ----

server.tool(
  "query-tenant-list",
  "查询当前账号已加入的 MaxIoT 组织（租户）列表，用于切换组织或查看可访问的组织",
  {
    keyword: z.string().optional().describe("搜索关键字，可选，按组织名等过滤"),
    tenantCode: z.string().optional().describe("当前上下文租户编码，不传使用环境变量默认值"),
  },
  async ({ keyword, tenantCode }) => {
    try {
      const tc = tenantCode || config.tenantCode;
      const data = await callGateway(
        "queryJoinedTenant",
        "/v3/max/coral/public/MemberQueryFacade/queryJoinedTenant",
        {
          request: {
            permSet: [
              "PROJECT_MEMBER_ADD",
              "PROJECT_MEMBER_EDIT",
              "PROJECT_MEMBER_DEL",
              "PROJECT_DATA_EDIT",
              "PROJECT_ANDROID_STRUCTURE",
              "PROJECT_WEB_DEPLOY",
              "PROJECT_COMPONENTS_PUBLISH",
              "PROJECT_IDE_EDIT",
              "TENANT_MANAGE_UPDATE_TENANT_INFO",
              "TENANT_MANAGE_AUTH_ENTITY",
            ],
            keyWord: keyword ?? null,
            tenantCode: tc || undefined,
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

// ---- Tool: 获取某工程指定迭代的最新一条构建记录 ----

server.tool(
  "query-last-build-info",
  "获取指定工程、指定迭代的最新一条构建记录（last build info），返回包含 logUrl 等构建信息。iterationCode 可从项目详情 query-project-detail 中获取。",
  {
    projectCode: z.string().describe("项目编码，如 PRJ260304..."),
    iterationCode: z.string().describe("迭代编码，如 ITE260310...，可从项目详情获取"),
    tenantCode: z.string().optional().describe("租户编码，不传使用环境变量默认值"),
    iterationName: z.string().optional().describe("迭代名称，可选，如 SI260310-0049970"),
    buildModel: z.string().optional().default("develop").describe("构建模式，默认 develop"),
    oneselfBuild: z.boolean().optional().default(true).describe("是否本人构建"),
    projectSubType: z.string().optional().default("app").describe("项目子类型，默认 app"),
    componentAdapType: z.string().optional().default("app").describe("组件适配类型，默认 app"),
  },
  async ({
    projectCode,
    iterationCode,
    tenantCode,
    iterationName,
    buildModel,
    oneselfBuild,
    projectSubType,
    componentAdapType,
  }) => {
    try {
      const tc = tenantCode || config.tenantCode;
      const data = await callGateway(
        "getLastBuildInfo",
        "/v3/max/starfish/public/MaxReleaseFacade/getLastBuildInfo",
        {
          request: {
            iterationCode,
            iterationName: iterationName ?? "",
            buildModel,
            oneselfBuild,
          },
          context: {
            iterationCode,
            projectCode,
            tenantCode: tc,
            projectSubType,
            componentAdapType,
          },
        }
      );
      return ok(data);
    } catch (e) {
      return fail(e.message);
    }
  }
);

// ---- Tool: 安装 APK 到设备（调用本地 apk_installer） ----

const APK_INSTALLER_BIN = process.env.APK_INSTALLER_PATH || "apk_installer";

server.tool(
  "install-apk",
  "使用本地 apk_installer 将 APK 安装到已连接的 Android 设备。URL 需为构建产物下载地址（可含 downloadName 参数），可从 query-last-build-info 等接口获取。",
  {
    apkUrl: z.string().describe("APK 下载 URL，需包含 downloadName 参数"),
    device: z.string().optional().describe("设备序列号，多设备时指定"),
    force: z.boolean().optional().default(false).describe("是否强制覆盖已存在文件"),
    outputDir: z.string().optional().describe("下载输出目录，默认当前目录"),
  },
  async ({ apkUrl, device, force, outputDir }) => {
    try {
      const args = [];
      if (outputDir) args.push("-o", outputDir);
      if (device) args.push("-d", device);
      if (force) args.push("-f");
      args.push(apkUrl);

      const result = spawnSync(APK_INSTALLER_BIN, args, {
        encoding: "utf-8",
        timeout: 300000,
      });

      const stdout = (result.stdout || "").trim();
      const stderr = (result.stderr || "").trim();
      const code = result.status ?? (result.error ? -1 : 0);

      if (code !== 0) {
        const msg = stderr || stdout || result.error?.message || `exit ${code}`;
        return fail(msg);
      }
      return ok({
        success: true,
        stdout: stdout || undefined,
        stderr: stderr || undefined,
      });
    } catch (e) {
      return fail(e.message);
    }
  }
);

/**
 * TODO:
 * 1. 切换组织（或仅文档说明用环境变量切换）
 * 2. （已实现）获取工程指定迭代最新构建：query-last-build-info
 * 3. 触发工程构建
 * 4. （已实现）安装 APK：install-apk（依赖本地 apk_installer）
 *
 * 完整链路：登录 -> query-tenant-list 获取组织列表 -> 切 env 或选 tenantCode -> query-project-list -> query-project-detail（拿 iterationCode）-> query-last-build-info
 */

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
