# 溢彩 Production OS API 文档

## 基础信息

- Base URL: `http://localhost:3000/api`
- 响应格式: `{ success: boolean, data?: any, error?: { code, message, details? } }`

## 健康检查

```
GET /health
→ { status: "ok", timestamp: "..." }
```

## 订单 API

### 创建订单
```
POST /api/orders
Content-Type: application/json

{
  "code": "ORD-2024-001",
  "productCode": "YK-001",
  "customerName": "客户A",
  "category": "鞋材",
  "processType": "分切",
  "priority": "normal",
  "materialSpec": "EVA-5mm",
  "sheetSize": "1200x2400",
  "sliceSize": "300x400",
  "sliceQty": 500
}

→ 201 { success: true, data: Order }
```

### 获取订单
```
GET /api/orders/:id
→ { success: true, data: Order }
```

### 活跃订单列表
```
GET /api/orders
→ { success: true, data: Order[] }
```

### 完单
```
PUT /api/orders/:id/complete
→ { success: true, data: Order }
```

## 工序 API

### 获取工序流
```
GET /api/processes/:orderId
→ { success: true, data: ProcessFlow }
```

### 推进工序
```
PUT /api/processes/advance
{ "flowId": "...", "stepId": "...", "toStatus": "running" }
→ { success: true }
```

### 触发返工
```
PUT /api/processes/rework
{ "flowId": "...", "stepId": "...", "reason": "尺寸偏差" }
→ { success: true }
```

## 材料 API

### 查询库存
```
GET /api/materials/:spec/available
→ { success: true, data: { spec, available } }
```

### 扣减库存
```
POST /api/materials/deduct
{ "batchId": "...", "quantity": 10, "orderId": "..." }
→ { success: true }
```

## 追溯 API

### 订单追溯链
```
GET /api/traces/:orderId
→ { success: true, data: TraceEvent[] }
```

### 批次反查
```
GET /api/traces/batch/:batchId
→ { success: true, data: TraceEvent[] }
```

### 报告异常
```
POST /api/traces/anomaly
{ "orderId": "...", "processStepId": "...", "type": "defect",
  "description": "...", "severity": "high" }
→ 201 { success: true, data: AnomalyEvent }
```

### 创建补产
```
POST /api/traces/supplement
{ "originalOrderId": "...", "reason": "品质不良", "quantity": 50 }
→ 201 { success: true, data: SupplementRecord }
```
