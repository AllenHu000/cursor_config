---
name: max-disassemble
description: 使用 @sm/max-builder-devtool 反编译大程序日志，还原代码 schema 到本地目录。支持单个或批量多个构建日志 logUrl。Use when the user mentions 反编译、disassemble、还原代码、解析 schema、解析构建日志、反向解析、批量反编译, or asks to extract schema from a log URL.
---

# 大程序日志反编译

使用 `@sm/max-builder-devtool` 的 `disassemble` 命令，从线上构建日志 URL（logUrl）反向解析出代码 schema 文件到本地目录。支持**单个**或**批量多个**日志 URL。

## 使用方式

**单条日志：**
```bash
npx @sm/max-builder-devtool disassemble <构建日志logUrl> <输出目录>
```

**批量多条日志：** 对每个 URL 分别执行一次 disassemble，每个日志输出到同一根目录下的**不同子目录**，避免互相覆盖。

## 参数说明

| 参数 | 说明 | 是否必填 |
|---|---|---|
| 日志 URL | CDN 上的 `.txt` 日志文件地址，通常以 `https://cdn.biot-apps.com/resource/` 开头；可传多个 | 必填 |
| 输出目录 | 单条：schema 输出路径。多条：**根目录**，每条日志会输出到其下子目录 | 必填，默认建议 `~/desktop/disassemble` |

## 批量处理规则

当用户提供**多个**构建日志 URL（如粘贴多行、多个链接、或“这几个都反编译一下”）时：

1. **逐个执行**：对每个 URL 执行一次 `npx @sm/max-builder-devtool disassemble <当前URL> <输出子目录>`。
2. **输出子目录**：在用户指定的根目录（或默认根目录）下，为每条日志单独建子目录，命名方式二选一：
   - `1`、`2`、`3`…（按顺序）
   - 或从 URL 提取简短标识（如文件名/最后一段），例如 `rec260203tfc0b2...`
3. **根目录约定**：若用户只说“输出到 ~/desktop/disassemble”，则批量时根目录为 `~/desktop/disassemble`，各日志输出到 `~/desktop/disassemble/1`、`~/desktop/disassemble/2` 等。
4. **失败与汇总**：单条失败不中断后续；全部完成后汇总成功数、失败数及失败对应的 URL（如有）。

## 执行流程

1. **确认参数**：识别是单条还是多条 URL；确认输出目录（未提供则用默认根目录）。
2. **执行命令**：
   - 单条：`npx @sm/max-builder-devtool disassemble <URL> <输出目录>`
   - 多条：对每个 URL 执行上述命令，输出目录为 `<根目录>/<子目录名>`。
3. **检查结果**：列出各输出目录下生成的文件，并做简要汇总。

## 示例

**单条：**
```bash
npx @sm/max-builder-devtool disassemble https://cdn.biot-apps.com/resource/APP221228a649a0f2wlzzv5gypg8wjbuxr/rec260203tfc0b2isvla5pcnv0f93a1vck.txt ~/desktop/disassemble
```

**批量（3 条）：** 根目录为 `~/desktop/disassemble`，子目录用 1、2、3。
```bash
npx @sm/max-builder-devtool disassemble "https://cdn.biot-apps.com/resource/.../log1.txt" ~/desktop/disassemble/1
npx @sm/max-builder-devtool disassemble "https://cdn.biot-apps.com/resource/.../log2.txt" ~/desktop/disassemble/2
npx @sm/max-builder-devtool disassemble "https://cdn.biot-apps.com/resource/.../log3.txt" ~/desktop/disassemble/3
```

## 注意事项

- 单条执行建议超时 120 秒；批量时按条数适当放宽或保持每条 120 秒。
- 用户只提供日志 URL 时，主动确认输出根目录，默认建议 `~/desktop/disassemble`；批量时说明会在此根目录下按序号或标识分子目录。
- 用户只说“反编译”未给 URL 时，主动询问日志地址（可说明支持多条）。

## 反编译输出代码解读
反编译后得到的结果为某工程的源码
目录结构解读：
| 文件夹/文件 | 解释 |
|---------|----------|
| 配置管理 | 包括项目级配置信息，产物词条、端缓存配置、币种配置、工程构建引擎、环境变量 |
| 全局变量 | 工程内全局变量 |
| 全局逻辑 | 工程内所有的全局逻辑集合 |
| 生命周期 | 应用级生命周期 |
| 业务组件 | 工程引入的业务组件集合，每个组件包括组件页面逻辑，组件页面schema,页面变量  |
| 主副屏页面 | 工程内所有的页面集合， 文件夹名即为页面路由名，包括页面逻辑，页面schema,页面变量 |
| 自定义组件 | 业务自定义的组件集合，文件夹名即为组件名 |
| project.json | 项目编译、构建入口，工程的全量信息 |

