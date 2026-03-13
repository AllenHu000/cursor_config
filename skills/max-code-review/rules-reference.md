# 语法黑名单规则详细参考

## 规则 1：DSL 首参必须为字符串字面量

### 应用工程涉及接口

- `max.serviceCall()`
- `max.data.set()` / `max.data.get()`
- `max.appData.set()` / `max.appData.get()`
- `max.pageData.set()` / `max.pageData.get()`
- `max.compData.set()` / `max.compData.get()`
- `max.router.redirectTo()` / `max.router.navigateTo()` / `max.router.navigateBackTo()`
- `max.subRouter.redirectTo()` / `max.subRouter.navigateTo()` / `max.subRouter.navigateBackTo()`
- `max.envVar.getValue()` / `max.i18n.getText()`

### 模型工程涉及接口

- `max.model.*` / `max.domain.*` / `max.biz.*`
- `max.common.ctx.set()` / `max.common.ctx.get()`
- `max.common.async.submit()` / `max.common.sequence.uniqueByDay()`
- `max.envVar.getValue()`
- `max.serviceCall()`
- `max.common.request.get()` / `max.common.request.post()` / `max.common.request.put()`
- `max.common.request.delete()` / `max.common.request.openapi()`

### 违规示例

```javascript
// ❌ 变量引用
const key = "userInfo";
max.data.get(key);

// ❌ 字符串拼接
max.data.get("user" + "Info");

// ❌ 模板字符串
max.data.get(`${prefix}Info`);

// ✅ 直接字符串常量
max.data.get("userInfo");
```

## 规则 2：禁止代理系统 DSL

### 违规模式

```javascript
// ❌ 代理 max 本身
const b = max;
b.serviceCall();

// ❌ 代理具体方法
const fn = max.serviceCall;
fn("api", {});

// ❌ 代理中间层对象
const env = max.env;
env.getEnv();

const common = max.common;
common.request.get("api");
```

### 正确写法

```javascript
// ✅ 始终使用全拼调用
max.serviceCall("api", {});
max.env.getEnv();
max.common.request.get("api");
```

## 规则 3：JavaScript 语法黑名单

### DOM 操作

```javascript
// ❌ 禁止
document.getElementById("app");
document.querySelector(".class");
document.createElement("div");
```

### BOM 操作

```javascript
// ❌ 禁止
window.location.href;
window.setTimeout();
globalThis.fetch();
```

### var 关键字

```javascript
// ❌ 禁止
var count = 0;

// ✅ 使用 let 或 const
let count = 0;
const MAX = 100;
```

### with 语句

```javascript
// ❌ 禁止
with (obj) { a = 1; }

// ✅ 明确引用
obj.a = 1;
```

### eval / new Function

```javascript
// ❌ 禁止
eval("console.log(1)");
const fn = new Function("a", "return a + 1");

// ✅ 使用静态函数
const fn = (a) => a + 1;
```

### IIFE

```javascript
// ❌ 禁止
(function() { /* ... */ })();

// ✅ 使用命名函数
function init() { /* ... */ }
init();
```

### 动态 Key

```javascript
// ❌ 禁止
const key = "name";
obj[key] = value;
obj["prefix" + suffix];

// ✅ 使用静态属性
obj.name = value;
```
