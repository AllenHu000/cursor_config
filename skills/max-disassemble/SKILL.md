---
name: max-disassemble
description: 使用 @sm/max-builder-devtool 反编译大程序日志，还原代码 schema 到本地目录。Use when the user mentions 反编译、disassemble、还原代码、解析 schema、解析构建日志、反向解析, or asks to extract schema from a log URL.
---

# 大程序日志反编译

使用 `@sm/max-builder-devtool` 的 `disassemble` 命令，从线上日志 URL 反向解析出代码 schema 文件到本地目录。

## 使用方式

```bash
npx @sm/max-builder-devtool disassemble <日志URL> <输出目录>
```

## 参数说明

| 参数 | 说明 | 是否必填 |
|---|---|---|
| 日志 URL | CDN 上的 `.txt` 日志文件地址，通常以 `https://cdn.biot-apps.com/resource/` 开头 | 必填 |
| 输出目录 | schema 文件的本地输出路径，相对于当前工作目录 | 必填，默认建议 `~/desktop/disassemble` |

## 执行流程

1. **确认参数**：向用户确认日志 URL 和输出目录（如未提供）
2. **执行命令**：运行 `npx @sm/max-builder-devtool disassemble <URL> <输出目录>`
3. **检查结果**：列出输出目录下生成的文件，确认反编译成功

## 示例

```bash
npx @sm/max-builder-devtool disassemble https://cdn.biot-apps.com/resource/APP221228a649a0f2wlzzv5gypg8wjbuxr/rec260203tfc0b2isvla5pcnv0f93a1vck.txt ~/desktop/disassemble
```

## 注意事项

- 命令执行可能需要较长时间，设置合理的超时（建议 120 秒）
- 如果用户只提供了日志 URL，主动询问输出目录，默认建议 `~/desktop/disassemble`
- 如果用户只说"反编译"但没给 URL，主动询问日志地址
