# 🏭 溢彩 Production OS

> **材料约束驱动 + 工序流转 + 产线调度 + 追溯反馈 的生产控制系统**

## 系统本质

不是传统 MES，而是以材料约束为核心的生产操作系统。

| 概念映射 | |
|----------|------|
| 工厂 | 操作系统 |
| 订单 | 进程 |
| 材料 | 内存 |
| 工序 | CPU 调度 |
| 任务 | 线程 |

## 核心引擎

| 引擎 | 职责 |
|------|------|
| **ProcessEngine** | 工序流转控制、状态机、DAG 工序图、返工路径 |
| **MaterialEngine** | EVA 库存匹配、片材切割优化、损耗计算、多订单合并 |
| **ScheduleEngine** | 人机任务分配、优先级调度、负载均衡 |
| **TraceEngine** | 生产路径记录、异常反推、补产机制 |

## 项目结构

```
src/
├── domain/          # 领域模型（DDD）
│   ├── order/       # 订单实体
│   ├── process/     # 工序实体 + 流程DAG
│   ├── material/    # 材料实体
│   ├── inventory/   # 库存实体
│   ├── task/        # 任务实体
│   └── trace/       # 追溯实体
├── engines/         # 核心引擎（所有业务逻辑）
│   ├── process-engine/
│   ├── material-engine/
│   ├── schedule-engine/
│   └── trace-engine/
├── application/     # 应用服务层
├── interfaces/      # 接口层（HTTP）
├── infrastructure/  # 基础设施（DB、仓储实现）
├── modules/         # 业务模块
└── shared/          # 共享类型、工具
```

## 快速开始

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## 核心业务流

```
订单创建 → 材料匹配(MaterialEngine) → 工序生成(ProcessEngine)
         → 任务分配(ScheduleEngine) → 执行 → 追溯记录(TraceEngine)
```
