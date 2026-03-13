---
name: max-code-review
description: 审查大程序（MaxIoT）代码，按语法黑名单规则扫描违规写法并生成报告。Use when the user mentions 审查代码、代码审查、code review、扫描违规、检查黑名单, or asks to review max code quality.
---

# 大程序代码审查

按语法黑名单规则扫描指定目录下的 JS 代码，输出违规报告。

## 审查范围

### 扫描目标

- 仅扫描 `*.js` 文件，但排除名为`variables.js`的文件 
- 排除以下文件不用扫描
    - `IoTCenter.js`，`MoneyCalculatorSource.js`, `yup.js`
- 用户未指定目录时，默认扫描 `src/` 下所有子目录

### 排除项

以下文件和目录跳过审查：

| 类型 | 排除项 | 原因 |
|---|---|---|
| 文件类型 | `*.json` / `*.yml` / `*.yaml` | 非代码文件 |
| 目录 | `全局变量/` | 自动生成的变量定义，含合法的特殊写法 |
| 文件 | `variables.js` | 页面变量声明文件，含自动生成代码 |

## 审查规则

按以下三类规则逐一检查，详细规则参见 [rules-reference.md](rules-reference.md)。

### 规则 1：DSL 首参必须为字符串字面量

检测以下 API 调用，首个参数是否为直接字符串常量：

```
max.serviceCall / max.data.set / max.data.get
max.appData.set / max.appData.get
max.pageData.set / max.pageData.get
max.compData.set / max.compData.get
max.router.redirectTo / max.router.navigateTo / max.router.navigateBackTo
max.subRouter.redirectTo / max.subRouter.navigateTo / max.subRouter.navigateBackTo
max.envVar.getValue / max.i18n.getText
max.model.* / max.domain.* / max.biz.*
max.common.ctx.set / max.common.ctx.get
max.common.async.submit / max.common.sequence.uniqueByDay
max.common.request.get / max.common.request.post / max.common.request.put
max.common.request.delete / max.common.request.openapi
```

**判定违规**：首参为变量引用、字符串拼接、模板字符串、函数返回值。

### 规则 2：禁止代理系统 DSL

检测是否存在将 `max` 或其子对象/方法赋值给变量的写法：

- `const/let/var xxx = max`
- `const/let/var xxx = max.someMethod`
- `const/let/var xxx = max.someNamespace`（如 `max.env`、`max.common`、`max.data`）

### 规则 3：JavaScript 语法黑名单

| 检测项 | 搜索模式 |
|---|---|
| DOM 操作 | `document.` 相关调用 |
| BOM 操作 | `window.` / `globalThis.` 相关调用 |
| var 关键字 | `var ` 声明 |
| with 语句 | `with (` / `with(` |
| eval | `eval(` 调用 |
| new Function | `new Function(` 构造 |
| IIFE | `(function` 立即执行模式 |

> 动态 Key（如 `obj[variable]`）需人工判断，工具扫描仅标记疑似项。

## 执行流程

### Step 1：确认审查范围

- 向用户确认要审查的目录（默认 `src/`）
- 确认是否有额外需要排除的目录或文件

### Step 2：使用 Grep 工具逐项扫描

按三类规则分别使用 Grep 工具搜索违规代码。搜索时排除上述排除项。

推荐搜索策略（使用 Grep 工具，非 shell 命令）：

**规则 1 — DSL 动态首参**：
- pattern: `max\.(serviceCall|data\.(set|get)|appData\.(set|get)|pageData\.(set|get)|compData\.(set|get))\s*\(`
- 逐个结果检查首参是否为字符串字面量

**规则 2 — 代理 DSL**：
- pattern: `(const|let|var)\s+\w+\s*=\s*max(\.|;|\s|$)`

**规则 3 — 语法黑名单**：
- pattern: `\bdocument\.\w+`
- pattern: `\bwindow\.\w+`
- pattern: `\bglobalThis\.\w+`
- pattern: `\bvar\s+\w+`
- pattern: `\bwith\s*\(`
- pattern: `\beval\s*\(`
- pattern: `\bnew\s+Function\s*\(`
- pattern: `\(function\s*\(`

### Step 3：生成审查报告

按以下格式输出报告：

```markdown
# 代码审查报告

审查目录：`xxx`
扫描文件数：xx
违规文件数：xx

## 违规汇总

| 规则 | 违规数 | 严重程度 |
|---|---|---|
| DSL 动态首参 | x | 🔴 严重 |
| 代理系统 DSL | x | 🔴 严重 |
| DOM 操作 | x | 🔴 严重 |
| BOM 操作 | x | 🔴 严重 |
| var 关键字 | x | 🟡 警告 |
| with 语句 | x | 🔴 严重 |
| eval 调用 | x | 🔴 严重 |
| new Function | x | 🔴 严重 |
| IIFE | x | 🟡 警告 |

## 违规详情

### DSL 动态首参
- `path/to/file.js:行号` — 违规代码片段

### 代理系统 DSL
- `path/to/file.js:行号` — 违规代码片段

...（按规则分组列出）
```

### Step 4：给出修复建议

对每类违规给出具体的修复方案，优先提供可直接替换的代码。

### Step 5: 在钉钉"我的文档"创建审查报告文档