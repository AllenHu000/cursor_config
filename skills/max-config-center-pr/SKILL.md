---
name: max-config-center-pr
description: >-
  查询钉钉 AI 表格「功能清单」中模块/端负责人；按 max-config-center 范式在 configuration_v2 增加配置 Key、同步 README「配置一览」并向 sunmi-web/max-config-center 提 PR。
  Use when the user asks to add a config key, sync README, query feature-list owner, max-config-center PR, 配置中心 PR, or 功能清单负责人.
---

# max-config-center 配置项与 PR 工作流

## 边界（必读）

1. **钉钉 AI 表格**：仅用 MCP **只读**（`get_base` / `get_tables` / `get_fields` / `query_records`）。**禁止** `create_records` / `update_records` / `delete_*` 等写入；表格由**仓库管理员在 PR 接受后自行维护**。
2. **仓库**：只改 **`configuration_v2/`** 与根目录 **`README.md`**；**绝不修改 `configuration_v1/`**。

详细 ID 与路径见 [reference.md](reference.md)。

---

## Step 1 — 功能清单与负责人

1. 用 `mcp_dingtalk-ai-excel-mcp_get_tables`（baseId、tableId 见 reference）确认字段 id；必要时 `get_fields` 取单选 **option id**。
2. `query_records` 过滤目标 **模块**（`F7WFMHH`）与/或 **端**（`01ZM8y7`）；若组合过滤无结果，改为单条件分页 + 在结果中筛 `端/模块` 的 `name`。
3. 从命中行的 `KF6uGCK` 取 `userId`，调用 **`mcp_dingtalk-mcp_getUserDetailByUserId`** 得到负责人姓名，向用户汇报。

---

## Step 2 — 对齐配置范式（按模块插入，禁止堆在文件末尾）

1. 打开（或 clone）<https://github.com/sunmi-web/max-config-center>，阅读 `README.md`：**模块**缩写、`ConfigCenter` API 示例、「配置一览」表格式。
2. **fullKey** 必须为 **`MODULE.KEY`**，与 README 模块名一致（如 `CHECKOUT.xxx`、`PAYMENT.xxx`）。记清 **MODULE** 前缀（`CHECKOUT`、`PAYMENT`、`TAX` 等）。

### 2.1 `Conf_Universal.js` / `Conf_Local.js`

- 两个文件均按 **模块分段**（常见为注释如 `// ----- CHECKOUT -----` 或同前缀 `"MODULE.` 键成组）。
- **插入位置**：在 **该 MODULE 已有配置项的最后一条之后** 追加新键；若该模块下尚无键，则紧接在该模块注释块/第一段同前缀键之后。保持与同模块键 **相邻**，便于 diff 与 code review。
- **禁止**：在 `return { ... }` 内 **不分模块**、直接贴在 **整个对象末尾** 或文件最后一行；禁止打乱其他模块已有顺序（除非维护者要求重排）。

### 2.2 `Handler_Universal.js` / `Handler_Local.js`

- Handler 与 Conf **同模块成组**（如 `// ----- CHECKOUT -----`、`// ----- PAYMENT -----`）。
- **插入位置**：在 **对应 MODULE 分段内**、该段 **最后一条 Handler 映射之后** 增加新项；结构复制 **同段内** 最相近的现有项（`SWITCH` / `CONTENT` / `pull`·`push`）。
- **禁止**：在 class 或对象 **最底部** 一次性粘贴、与模块注释脱节。

### 2.3 与 Step 3 联动（README）

- 「配置一览」表通常按 **MODULE 分组**（连续多行同一 `SYS.*`、`CHECKOUT.*` 等）。新行须插在 **同 MODULE 一组行内** 的合适位置（例如按字母序、或紧挨同类业务键），**禁止**默认加在整张表最后一行导致分组断裂。

### 2.4 其他

- 在 `configuration_v2/config/` 中选择 **Universal** 或 **Local** 文件之一（或两者，视设计）：跨端/通用 → `Conf_Universal.js`；端本地默认 → `Conf_Local.js`。
- 若该 Key 需 **云端同步**：在 **对应** `Handler_*.js` 的 **同模块分段内** 注册；无同步需求的纯本地默认值可仅改 Conf（不确定则在 PR 中说明并 @ 审查者）。
- **不要改** `ConfEntry.js` / `HandlerEntry.js`，除非仓库已有明确模式要求合并新文件（默认仅扩展现有 Conf/Handler）。

---

## Step 3 — 更新 README「配置一览」

1. 在 `README.md` 的「配置一览」表中增加一行：**功能键** = 完整 `MODULE.KEY`。
2. 按产品要求在 **台式 / 手持 / 自助 / Web后台 / 扫码点餐 / 管家App** 列填 `√` 或留空，与表格及设计一致；可对照功能清单 AI 表里「端」列。

---

## Step 4 — Git 提交与 PR

1. 分支名建议：`feat(config): add MODULE.KEY` 或 `docs(readme): sync config matrix for MODULE.KEY`。
2. **Conventional Commits**，英文 subject，例如：`feat(config): add CHECKOUT.FOO_BAR`。
3. 若本地无写权限：**fork** `sunmi-web/max-config-center`，推送到自己的 fork，再提 PR 到 `sunmi-web/max-config-center:main`（或仓库默认分支）。
4. 使用 **`gh pr create`**（或 GitHub Web）创建 PR；描述中写清：
   - 新增 Key、默认值、Universal/Local 选择理由；
   - 是否已加 Handler、云端 settingKey 映射（若有）；
   - **说明：未改钉钉 AI 表格，请管理员在合并后自行同步功能清单。**

---

## 自检清单

- [ ] 未触碰 `configuration_v1/`
- [ ] fullKey 与 README 模块缩写一致
- [ ] 新项插在 **对应模块分段内**（Conf / Handler / README 表分组），非文件或全表末尾堆砌
- [ ] `Conf_Universal` / `Conf_Local` 与 Handler 成对关系正确（若需同步）
- [ ] README「配置一览」已加行且端列正确
- [ ] 未对钉钉功能清单表执行任何写入类 MCP
- [ ] PR 描述已提醒管理员后续改表
