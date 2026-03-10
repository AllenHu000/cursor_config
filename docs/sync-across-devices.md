# Cursor 配置 / Skill / 本地 MCP 跨设备同步

## 1. 相关文件分布

| 内容 | 路径 | 说明 |
|------|------|------|
| 规则 (rules) | `~/.cursor/rules/` | 全局 / 项目规则 |
| 个人 Skills | `~/.cursor/skills/` | 自建 skill |
| 斜杠命令 | `~/.cursor/commands/` | 自定义 / 命令 |
| MCP 配置 | `~/.cursor/mcp.json` | 含 **敏感信息**（token、secret）和**绝对路径** |
| 本地 MCP 实现 | `~/.cursor/mcp-servers/` | 如 temp-mail-mcp、maxiot-mcp |
| 编辑器设置 | `~/Library/Application Support/Cursor/User/settings.json` | 仅编辑器偏好 |
| 快捷键 | `~/Library/Application Support/Cursor/User/keybindings.json` | 键位 |

Cursor 自带的 **Settings Sync** 只同步「设置、快捷键、扩展」等 VS Code 体系里的东西，**不会**同步 `~/.cursor` 下的 rules、skills、mcp 等，所以跨设备要用下面方式之一。

---

## 2. 推荐：Git 私有仓库 + 模板

用私有 Git 仓库同步「可版本管理」的部分，敏感配置用模板 + 本地文件。

### 2.1 纳入版本库的内容

- `~/.cursor/rules/`
- `~/.cursor/skills/`
- `~/.cursor/commands/`
- `~/.cursor/mcp-servers/`（本地实现的 MCP 源码）
- `~/.cursor/mcp.json.example`（见下）

### 2.2 不提交、用模板替代

- **`mcp.json`**  
  - 含 token、Client Secret、绝对路径（如 `/Users/sm1328/...`），不应原样提交。  
  - 做法：维护一份 **`mcp.json.example`** 提交到仓库，把敏感值和绝对路径改成占位符；新设备复制为 `mcp.json` 后按说明填写。

`mcp.json.example` 示例结构（占位符可自定）：

```json
{
  "mcpServers": {
    "teambition-openapi-mcp": {
      "command": "npx",
      "args": ["-y", "@tng/teambition-openapi-mcp", "user-mcp", "-u", "YOUR_TB_USER_TOKEN"]
    },
    "dingtalk-mcp": {
      "command": "npx",
      "args": ["-y", "dingtalk-mcp@latest"],
      "env": {
        "DINGTALK_Client_ID": "YOUR_CLIENT_ID",
        "DINGTALK_Client_Secret": "YOUR_CLIENT_SECRET",
        "ACTIVE_PROFILES": "dingtalk-contacts,dingtalk-calendar,..."
      }
    },
    "temp-mail-mcp": {
      "command": "node",
      "args": ["{{CURSOR_HOME}}/mcp-servers/temp-mail-mcp/src/index.mjs"]
    },
    "maxiot-mcp": {
      "command": "node",
      "args": ["{{CURSOR_HOME}}/mcp-servers/maxiot-mcp/src/index.mjs"],
      "env": {
        "MAXIOT_X_TOKEN": "YOUR_MAXIOT_TOKEN",
        "MAXIOT_TOKEN": "YOUR_MAXIOT_TOKEN",
        "MAXIOT_ORG_ID": "...",
        "MAXIOT_APP_ID": "...",
        "MAXIOT_PROJECT_CODE": "...",
        "MAXIOT_TENANT_CODE": "..."
      }
    }
  }
}
```

新设备上：

1. 把 `mcp.json.example` 复制为 `mcp.json`。  
2. 把 `{{CURSOR_HOME}}` 替换成当前机器的 `~/.cursor` 绝对路径（或写脚本用 `$HOME/.cursor` 生成）。  
3. 填入该设备对应的 token / secret。

### 2.3 .gitignore 建议

当前 `.cursor/.gitignore` 已用 `*` 全忽略再按需放开。若要同步上述内容，需在「不忽略」列表中加上（在现有 `!rules/` 等后面补）：

```gitignore
!mcp.json.example
!mcp-servers/
!mcp-servers/**
!docs/
!docs/**
```

不要添加 `!mcp.json`，保证真实配置不提交。

### 2.4 新设备拉取后

```bash
cd ~/.cursor
git clone <你的私有仓库> .   # 或 pull
cp mcp.json.example mcp.json
# 编辑 mcp.json：替换 {{CURSOR_HOME}} 和所有占位符
```

若 MCP 用 `node` 跑本地脚本，新设备需已安装 Node，路径用本机 `~/.cursor` 的绝对路径。

---

## 3. 可选：云盘同步（不推荐放敏感信息）

把 `~/.cursor` 中**不含敏感信息**的目录（如 rules、skills、commands、mcp-servers）放到 iCloud / Dropbox / OneDrive 等，再在各设备用 **符号链接** 链回 `~/.cursor/rules` 等。

- **不推荐**把整个 `~/.cursor` 或 `mcp.json` 放进云盘：token/secret 会明文进云端，且多设备同时改可能冲突。
- 若只同步 rules/skills/commands/mcp-servers，和「Git 只同步这些目录」等价，但无版本历史，不如 Git 清晰。

---

## 4. 小结

| 方式 | 适用 | 注意 |
|------|------|------|
| **Git 私有仓库 + mcp.json.example** | 多设备、要版本管理、不想把 token 提交上去 | 新设备要复制模板并填一次 mcp.json；路径用本机绝对路径或脚本生成 |
| Cursor Settings Sync | 仅编辑器设置、快捷键、扩展 | 不包含 rules/skills/mcp |
| 云盘同步 | 不想用 Git 时 | 只同步非敏感目录，不要同步 mcp.json |

**推荐**：用 **Git 私有仓库** 同步 `rules`、`skills`、`commands`、`mcp-servers` 和 `mcp.json.example`；每台设备保留本地 `mcp.json`，按模板填写/替换路径与密钥。
