---
name: daily-standup
description: 生成每日站会汇报内容，自动汇总 Teambition 任务进度和钉钉日程/待办。Use when the user mentions 站会、standup、日报、今日工作、每日汇报、工作进展, or asks about today's schedule and tasks.
---

# 每日站会汇报

自动从 Teambition 和钉钉获取数据，生成结构化的站会汇报。

## 执行步骤

### Step 1: 获取当前时间和用户信息

调用 `dingtalk-mcp-currentDateTime` 获取当前日期时间，确定"今天"和"昨天"的范围。

调用 `dingtalk-mcp-searchUser` 搜索用户（queryWord: "胡云波"），获取 userId，再通过 `dingtalk-mcp-getUserDetailByUserId` 获取 unionId。

### Step 2: 并行获取数据

同时发起以下请求：

**Teambition 任务（使用 searchProjectTasksV3）：**

- 项目ID: `6160fed2040018338d4502cb`
- 查询当前迭代中自己负责的任务：
  - 进行中的任务: `q` 参数使用 TQL `executorId = "5c8f470e2cbe0500018a679c"`
  - 可按需过滤迭代 sprintId（参考 global rule 中的活跃迭代）

**钉钉日程（使用 dingtalk-mcp-getCalendarView）：**

- calendarId: `primary`
- timeMin: 今天 00:00:00（ISO-8601 格式）
- timeMax: 今天 23:59:59（ISO-8601 格式）
- unionId: Step 1 获取的 unionId

**钉钉待办（使用 dingtalk-mcp-queryTasks）：**

- unionId: Step 1 获取的 unionId
- isDone: false
- roleTypes: `[["executor"]]`

### Step 3: 分析和分类

将 Teambition 任务按状态分类：

| 分类 | 判断依据 |
|------|---------|
| 昨日完成 | 任务状态为"已完成"类且更新时间在昨天 |
| 今日进行中 | 任务状态为"进行中"类 |
| 待开始 | 任务状态为"未开始"/"待处理"类 |
| 风险/阻塞 | 已逾期或临近截止日期的任务 |

### Step 4: 输出汇报

使用以下模板输出：

```
## 📋 每日站会 - {日期} {星期}

### 昨日完成
- [任务编号] 任务标题 (任务类型)
- ...
（如果没有，写"无"）

### 今日计划
- [任务编号] 任务标题 — 当前状态/进度说明
- ...

### 风险与阻塞
- [任务编号] 任务标题 — ⚠️ 风险说明（如逾期、依赖阻塞等）
（如果没有，写"暂无风险项"）

### 今日会议
- HH:MM - HH:MM | 会议标题 | 地点/会议链接
- ...
（如果没有，写"今日无会议"）

### 待办事项（钉钉）
- 待办标题 — 截止时间
- ...
（如果没有，写"暂无待办"）
```

## 注意事项

- 如果 MCP 调用失败，跳过该部分并标注"获取失败"，不要中断整个流程
- 任务编号优先使用 Teambition 的 uniqueId（如 `#SUNMI-1234`）
- 时间统一使用 24 小时制，时区为 Asia/Shanghai
- 汇报内容要简洁，每条任务一行，不要展开描述
