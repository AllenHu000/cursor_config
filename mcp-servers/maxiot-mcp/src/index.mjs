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

/** 从 getProjectDeployResults 网关响应中解析部署列表（兼容常见 data 嵌套） */
function extractDeployResultList(parsed) {
  const tryPaths = [
    parsed?.data?.data?.list,
    parsed?.data?.data?.records,
    parsed?.data?.list,
    parsed?.data?.records,
    parsed?.data?.content,
    parsed?.list,
  ];
  for (const arr of tryPaths) {
    if (Array.isArray(arr) && arr.length > 0) return arr;
  }
  return null;
}

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
  "根据项目编码查询 MaxIoT 项目详情（底层 MaxDevProjectQueryFacade/queryByCode）。当用户要查「某项目的当前迭代 / 项目元信息 / 迭代列表」时使用本工具；不要用它查「生产部署记录」——部署请用 get-project-deploy-results。",
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
  "获取指定工程、指定迭代的最新一条「构建」记录 getLastBuildInfo（含 logUrl 等）。iterationCode 从 query-project-detail 获取。这是构建（build），不是生产「部署」（deploy）；部署记录用 get-project-deploy-results。",
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

// ---- Tool: 工程部署记录（生产/验收等）----

server.tool(
  "get-project-deploy-results",
  "查询工程「部署」记录 MaxReleaseFacade/getProjectDeployResults（与构建 getLastBuildInfo 不同）。当用户要「生产环境最新部署 / 最新一条上线记录」时设 latestOnly=true（取返回列表首条，通常接口按时间倒序）；要翻页查全部部署记录时用 latestOnly=false 并调整 pageNum/pageSize。查「当前迭代/项目详情」请用 query-project-detail（queryByCode），不要用本工具。",
  {
    projectCode: z.string().describe("项目编码，如 PRJ260304..."),
    tenantCode: z.string().optional().describe("租户编码，不传使用环境变量默认值"),
    stage: z
      .string()
      .optional()
      .default("prod")
      .describe("部署阶段，如 prod"),
    acceptance: z.boolean().optional().default(true).describe("是否验收相关筛选，默认 true"),
    keyWord: z.string().optional().default("").describe("关键词筛选"),
    pageNum: z.number().optional().default(1).describe("页码"),
    pageSize: z.number().optional().default(10).describe("每页条数，查全部时可增大"),
    latestOnly: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "为 true 时仅解析并返回列表中的第一条为 latestRecord（用于生产最新部署），并附带 fullResponse 便于核对"
      ),
  },
  async ({
    projectCode,
    tenantCode,
    stage,
    acceptance,
    keyWord,
    pageNum,
    pageSize,
    latestOnly,
  }) => {
    try {
      const tc = tenantCode || config.tenantCode;
      const data = await callGateway(
        "getProjectDeployResults",
        "/v3/max/starfish/public/MaxReleaseFacade/getProjectDeployResults",
        {
          request: {
            acceptance,
            stage,
            keyWord: keyWord ?? "",
            pageNum,
            pageSize,
            tenantCode: tc,
          },
          context: {
            projectCode,
            tenantCode: tc,
          },
        }
      );
      if (!latestOnly) {
        return ok(data);
      }
      const list = extractDeployResultList(data);
      const latestRecord = list ? list[0] : null;
      return ok({
        latestRecord,
        listLength: list?.length ?? 0,
        note:
          latestRecord == null
            ? "未能从响应中解析部署列表，请查看 fullResponse 结构"
            : "latestRecord 为解析到的列表首条；若与实际「最新」不符，请对比 fullResponse 中排序规则",
        fullResponse: data,
      });
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
 * 3. （已实现）工程部署记录 / 生产最新部署：get-project-deploy-results
 * 4. 触发工程构建
 * 5. （已实现）安装 APK：install-apk（依赖本地 apk_installer）
 *
 * 完整链路：
 * - 项目详情 / 当前迭代：query-project-detail（queryByCode）
 * - 某迭代最新构建：query-project-detail -> query-last-build-info
 * - 生产部署记录 / 最新上线：get-project-deploy-results（latestOnly）
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
