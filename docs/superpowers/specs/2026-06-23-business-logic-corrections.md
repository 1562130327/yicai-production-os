# 溢彩 Production OS — 生产逻辑修正计划

> 2026-06-23 | 基于工厂负责人口述 + Excel数据对照

## 修正项清单

---

### #1 ✅ 打印排序 — 已正确，无需修改

**实际逻辑**：
- 郑思远（第一步）：待生产排前，生产中排后（先领料，上游不做下游没法开工）
- 其他师傅：生产中排前，待生产排后（先清手上积压）

**代码位置**：`print.routes.ts:56-59`

---

### #2 ✅ 库存扣减链路 — 已修复

郑思远第一步完成时自动扣库存：`recordCompletion()` 中检测 `type==='横竖分切' && sequence===1` → 模糊匹配订单 sheetSize 到库存规格 → 调用 `inventoryRepo.deduct()`。

### #4 ✅ 订单状态流转 — 已修复

createOrder → pending（待排产）→ 管理员 PUT /api/orders/:id/assign → scheduled → 第一步startStep → in_progress。

### #5 ✅ 权限粒度 — 已修复

POST /api/orders → admin+merchandiser；PUT /api/orders/:id/assign → admin；POST /api/materials/inbound → admin。

### #9 ✅ 入库 API — 已修复

`POST /api/materials/inbound { batchId, quantity, reason }` — 管理员专用。

---

### #2 ✅ 库存扣减链路 — 已修复

**实际逻辑**：郑思远第一步填写"调用原材料 X 张"→ 系统自动从库存扣减对应材料和数量

**当前代码**：`inventoryRepo.deduct()` 存在但无人调用。`recordCompletion()` 只更新 completedQty，不触发库存扣减。

**修复路径**：
```
ProcessService.recordCompletion()
  ↓ 判断 step.type === '横竖分切' && step.sequence === 1
  ↓ 从 flow → order → materialSpec 获取材料标识
  ↓ 从 inventoryRepo.findByMaterialSpec() 找到匹配批次
  ↓ 调用 inventoryRepo.deduct(batchId, quantity, orderId)
  ↓ 记录 inventory transaction (outbound)
```

**涉及文件**：
- `src/application/process/process.service.ts` — recordCompletion 方法
- `src/engines/process-engine/process-engine.ts` — recordCompletion 返回数据结构可能需要扩展
- `src/modules/production/index.ts` — ProcessService 需要注入 inventoryRepo

---

### #3 ❌ 师傅专属任务视图 — 缺失

**实际逻辑**：师傅登录后应看到**属于自己的跨订单任务队列**，而不是完整工序链。

**当前代码**：看板展示所有订单池，点详情展示完整工序链。

**修复方案**：
- 新增 API：`GET /api/workers/:name/tasks` — 返回该师傅在所有订单中负责的步骤
- 前端：师傅登录后默认显示自己的任务队列面板
- 每种师傅显示不同的规格字段：
  - 郑思远 → 原材料规格（materialSpec + sheetSize）
  - 伍乾进 → 片材规格（sheetSize）
  - 莫齐国 → 切片规格（sliceSize × sliceQty）
  - 李乐 → 冲型规格（punchSize × punchQty）

**涉及文件**：
- `src/interfaces/http/routes/` — 新增 worker routes 或扩展 process routes
- `public/app/index.html` — 新增师傅专属任务面板

---

### #4 ❌ 订单状态流转 — 不对

**实际逻辑**：
```
跟单员录单 → pending
管理员分配 → scheduled
第一步师傅开始 → in_progress
最后一步完成 → completed
```

**当前代码**：创建订单后状态直接跳到 `scheduled`（#15修复时改的）

**修复**：
- `createOrder()` 后状态保持 `pending`
- 新增"分配"API：`PUT /api/orders/:id/assign` — 管理员操作，pending→scheduled
- 第一步 `startStep()` 时检查：如果订单状态为 `scheduled`，自动推进到 `in_progress`
- 最后一步 `completeStep()` 时检查：如果所有步骤完成，自动推进到 `completed`

**涉及文件**：
- `src/application/order/order.service.ts` — createOrder 状态改回 pending，新增 assign 方法
- `src/application/process/process.service.ts` — startStep 推进订单状态
- `src/interfaces/http/routes/order.routes.ts` — 新增 assign 端点

---

### #5 ❌ 权限粒度 — 不够细

**实际逻辑**：
| 操作 | 管理员 | 跟单员 | 师傅 |
|------|--------|--------|------|
| 查看订单 GET | ✅ | ✅ | ✅(仅自己的) |
| 创建订单 POST | ✅ | ✅ | ❌ |
| 编辑订单 PUT | ✅ | ✅ | ❌ |
| 入库 POST /materials | ✅ | ❌ | ❌ |
| 工序操作 POST /processes | ✅ | ❌ | ✅(仅自己) |

**当前代码**：`requireRole` 只用在 reports/samples/customers，订单/工序/材料未做 GET/POST 分离。

**修复**：在每个路由的 POST/PUT 方法前加 `requireRole('admin', 'merchandiser')`，GET 保持开放。

**涉及文件**：
- `src/interfaces/http/routes/order.routes.ts`
- `src/interfaces/http/routes/material.routes.ts`
- `src/interfaces/http/routes/process.routes.ts`
- `src/interfaces/http/routes/index.ts` — 拆分路由中间件

---

### #6 ❌ 安源订单合并后尺寸参数 — 需验证

**实际数据**：
```
2# 切片: 66×81×30mm × 1523片（产品尺寸）
2# 冲型: 输入 215×96×20mm × 511片 → 输出 67×82×20mm × 1523个
```
合并后：`库存切片冲型` → 工序 `直切 → 冲型`

**问题**：切片步骤的 `sliceSize` 应该是 66×81×30mm（产品尺寸），冲型步骤的 `punchQty`=1523。但中间材料 215×96×20mm 在冲型步骤里怎么体现？

**需要确认**：重导入后检查 2# 订单的工序步骤数据。

---

### #7 ❌ 材料扣减后库存不足的处理 — 缺失

**实际逻辑**：库存 < 10 张预警。不够 → 提示跟单员补充。

**当前代码**：预警已显示，但扣减时如果库存不足只是抛出 Error，没有友好的业务提示和通知链路。

---

### #8 ❌ 补产追溯链激活后 — 上游步骤的状态恢复

**实际逻辑**：冲型不够→通知直切补切→直切师傅判断手上有没有余量→有余量直接补→没有继续往上。

**当前代码**：`getSupplementChain()` 找到了上游链，`requestSupplement()` 把第一个上游设为 ready，但没有处理"师傅判断余量"这个环节。

---

## 优先级排序

| 优先级 | 修正项 | 影响 |
|--------|--------|------|
| P0 | #2 库存扣减 | 郑思远操作后库存不更新，核心链路断 |
| P0 | #3 师傅专属视图 | 师傅不知道自己要做什么，痛点1未解决 |
| P1 | #4 订单状态流转 | 状态和实际流程不符 |
| P1 | #5 权限粒度 | 师傅可以改订单，跟单员可以入库 |
| P2 | #6 合并参数验证 | 数据准确性 |
| P2 | #7 库存不足处理 | 异常路径缺失 |
| P2 | #8 补产恢复 | 异常路径缺失 |

---

*此文档将在修正过程中持续更新。每完成一项勾选完成。*
