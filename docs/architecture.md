# 溢彩 Production OS 架构文档

> 材料约束驱动 + 工序流转 + 产线调度 + 追溯反馈

## 系统隐喻

| 概念 | 映射 |
|------|------|
| 工厂 | 操作系统 |
| 订单 | 进程 |
| 材料 | 内存 |
| 工序 | CPU 调度 |
| 任务 | 线程 |

## 架构分层

```
┌─────────────────────────────────┐
│        interfaces/              │  ← HTTP API, DTO
│        (Express Router)         │
├─────────────────────────────────┤
│        application/             │  ← 用例编排
│        (Services)               │
├──────────────┬──────────────────┤
│   engines/   │   domain/        │
│  (四大引擎)   │  (领域实体)       │
├──────────────┴──────────────────┤
│       infrastructure/           │  ← DB, 仓储实现
└─────────────────────────────────┘
```

## 核心引擎

### ProcessEngine
- 工序状态机（11 种合法转换）
- 工序 DAG 构建
- 自动流转（上游完成 → 下游就绪）
- 返工路径

### MaterialEngine
- EVA 库存匹配
- 片材切割计算（支持旋转优化）
- 损耗率计算
- 多订单合并切割

### ScheduleEngine
- 人机任务分配
- 优先级加权算法
- 自动调度 & 批量调度
- 负载均衡

### TraceEngine
- 全链路事件记录
- 正向追溯 & 反向反查
- 异常报告
- 补产机制

## 核心业务流

```
订单创建 → 材料匹配(MaterialEngine)
         → 工序生成(ProcessEngine)
         → 任务分配(ScheduleEngine)
         → 执行
         → 追溯记录(TraceEngine)
```

## 数据模型（从 Excel 映射）

| Excel 字段 | 实体属性 |
|-----------|---------|
| 订单编号 | Order.code |
| 款号 | Order.productCode |
| 客户 | Order.customerName |
| 加工工艺 | Order.processType |
| 用料 | Order.materialSpec |
| 片材尺寸 | Order.sheetSize |
| 切片尺寸 | Order.sliceSize |
| 切片总数 | Order.sliceQty |
| 冲型工艺 | Order.punchType |
| 已开片材数 | Order.sheetOpened |
| 已切片材数 | Order.sheetCut |
| 已冲型数 | Order.punched |
| 完单 | Order.status |
