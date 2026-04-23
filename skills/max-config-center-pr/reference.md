# max-config-center-pr 参考数据

## 钉钉 AI 表格「功能清单」

| 项 | 值 |
|----|-----|
| baseId | `EpGBa2Lm8azoq94yCD3A96xlWgN7R35y` |
| tableId | `hERWDMS` |
| 表名 | 所有数据 |

### 常用 fieldId（查询用）

| 字段 | fieldId |
|------|---------|
| 端 | `01ZM8y7` |
| 模块 | `F7WFMHH` |
| 负责人 | `KF6uGCK` |
| Key | `tZsldwz` |
| 一级 | `hv6RNZ5` |

### query_records 提示

- `filters` 多条件 `and` + 单选 option id 在部分环境可能返回 0 条：可改为 **单一条件**（如仅 `F7WFMHH` = 模块 option id）分页拉取，再在结果中筛 `01ZM8y7.name === '台式'`；或使用 `keyword` 辅助。
- 负责人单元格为 `user` 类型：返回 `userId`，人名需 **`mcp_dingtalk-mcp_getUserDetailByUserId`**（`userid`）解析。

### 端「台式」、模块「点餐」示例 option id

- 端·台式：`dMqwXiMxln`
- 模块·点餐：`qPUkHulYz2`

（其他模块/端请用 `get_fields` 拉单选 options，勿硬编码过期 id。）

## Conf / Handler 插入位置

- `Conf_Local.js`、`Conf_Universal.js`、`Handler_Local.js` 等按 **模块分段**（注释 `// ----- MODULE -----` 或连续同 `MODULE.` 前缀）。
- 新增 `MODULE.KEY` 时：写入 **该 MODULE 段内、段末最后一项之后**；勿贴在 `return` 对象或文件物理末尾。

## GitHub 仓库路径速查

```
max-config-center/
├── README.md                          # 配置一览表
├── configuration_v1/                  # 勿动
└── configuration_v2/
    ├── ConfigCenter.js
    ├── config/
    │   ├── ConfEntry.js
    │   ├── Conf_Universal.js
    │   └── Conf_Local.js
    └── handler/
        ├── HandlerEntry.js
        ├── Handler_Universal.js
        └── Handler_Local.js
```

## README「配置一览」表

- 列为：功能键、台式、手持、自助、Web后台、扫码点餐、管家App（以当前 README 为准）。
- 新行：`MODULE.KEY` + 各端 `√` 或空，与 Conf 放置范围及产品设计一致。
