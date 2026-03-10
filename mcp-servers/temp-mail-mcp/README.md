  # 使用方式
  1. 对 Agent 说例如：
    • 「帮我列一下临时邮箱可用的域名」
    • 「用域名 dollicons.com 创建一个临时邮箱，用户名 mytest」
    • 「用刚才的 token 查一下有没有验证码」
  2. 流程建议：先 list-domains → 你选一个 domain → create-inbox(username, domain) → 用该邮箱在业务侧触发发验证码 →
     get-verification-code(token) 取验证码。