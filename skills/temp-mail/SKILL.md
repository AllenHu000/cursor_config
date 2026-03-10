---
name: temp-mail
description: 创建免费临时邮箱、选择域名、接收并提取验证码。使用 temp-mail-mcp 的 list-domains、create-inbox、get-messages、get-verification-code。适用于需要临时邮箱收验证码、注册测试等场景。
---

# 临时邮箱（收验证码）

基于 **mail.tm** 与 **1secmail** 的免费临时邮箱，通过 MCP 工具完成：列域名（多 provider）→ 选 domain 创建邮箱 → 收邮件 → 取验证码。

## 何时使用

- 用户需要「临时邮箱」「验证码邮箱」「一次性邮箱」
- 需要先看到**可选域名列表**再创建邮箱
- 服务端已向该邮箱发送验证码，需要**拿到验证码**

## 推荐流程

1. **列出可用域名**：调用 `list-domains`，把返回的 `domains` 展示给用户选择。
2. **创建邮箱**：用户选定 `domain` 并给出邮箱前缀（如 `myuser`），调用 `create-inbox`，传入 `username` 和 `domain`。务必保存返回的 `token`。
3. **收验证码**：用户用该邮箱在目标站点触发发验证码后，调用 `get-verification-code` 并传入上一步的 `token`，即可拿到提取出的验证码。若未收到可稍后重试。

## MCP 工具一览

| 工具 | 用途 |
|------|------|
| `list-domains` | 获取可选域名列表，供用户选择 |
| `create-inbox` | 用选定的 domain + 自定义 username 创建邮箱；mail.tm 返回 address、password、token，1secmail 仅返回 address、token（无需密码） |
| `get-messages` | 用 token 拉收件列表（摘要） |
| `get-message` | 用 token + messageId 拉单封邮件正文 |
| `get-verification-code` | 用 token 从收件箱中提取验证码（默认 4–8 位数字） |

## 注意

- 不包含「向该邮箱发送邮件」能力（如 sendVerificationCode）。
- 创建邮箱后请保存并传递 `token`，后续拉邮件和取验证码都依赖它。
- mail.tm 限流约 8 QPS/IP，轮询不要太密。
- `list-domains` 会聚合 mail.tm 与 1secmail 的域名；创建时根据所选 domain 自动选用对应 provider。若 1secmail 在本地被限流或 403，可仅选用 list 中的 mail.tm 域名。
