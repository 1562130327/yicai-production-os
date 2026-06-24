# 🏭 溢彩 Production OS

> EVA 片材加工厂 MES 生产控制系统 — 材料约束驱动 + 工序流转 + 产线调度 + 追溯反馈

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-sql.js-orange)](https://github.com/sql-js/sql.js/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

一个为 EVA 片材加工厂量身打造的轻量级 MES 系统。12 人团队，14 台机器，24 种工艺组合，5 级优先级体系。

**不是传统 ERP** — 这是以工序流转为核心的生产操作系统。每个师傅打开系统就知道自己要做什么。

---

## 截图

管理员看板：订单池 + 机器状态 + 人员分配
师傅面板：按优先级排列的个人任务队列，一键操作
订单详情：工序流 Pipeline 可视化，进度实时追踪

---

## 核心设计

| 概念 | 隐喻 |
|------|------|
| 工厂 | 操作系统 |
| 订单 | 进程 |
| 材料 | 内存 |
| 工序 | CPU 调度 |
| 任务 | 线程 |

## 四大引擎

| 引擎 | 职责 |
|------|------|
| **ProcessEngine** | 24 种工艺模板 → 10 种原子工序自动展开，11 种状态转换，DAG 工序流 |
| **MaterialEngine** | EVA 库存匹配，片材切割优化（直接切+套料切），厚度/尺寸换算，损耗计算 |
| **ScheduleEngine** | 5 级优先级加权算法，人机自动分配，负载均衡 |
| **TraceEngine** | 全链路事件记录，正向/反向追溯，异常检测，自动补产链 |

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | TypeScript + Express + sql.js (SQLite WASM) |
| 前端 | 纯 HTML/CSS/JS SPA，零框架依赖 |
| 架构 | DDD 分层 (domain → engines → application → interfaces) |
| 认证 | 自定义 Bearer Token + 3 角色权限矩阵 |

## 项目结构

```
src/
├── domain/          # 领域实体 (Order/Process/Material/Inventory/Task/Trace)
├── engines/         # 核心引擎 (Process/Material/Schedule/Trace)
├── application/     # 应用服务层 (用例编排)
├── interfaces/      # HTTP 接口 (22 个 REST API + 认证中间件)
├── infrastructure/  # 仓储实现 + SQLite 适配层
└── shared/          # 类型定义、错误、Result 模式
public/
├── login.html       # 工业风登录页
└── app/index.html   # SPA 主应用 (看板/订单/库存/报表)
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 浏览器打开 http://localhost:3000
# 管理员: panguanglong / 123456
# 师傅:   zhengsiyuan  / 123456
```

## 用户角色

| 角色 | 人数 | 权限 |
|------|------|------|
| 管理员 | 2 人 | 全部：分配订单、入库、处理反馈 |
| 跟单员 | 3 人 | 录单、查看进度、客户管理 |
| 师傅 | 4 人 | 只看自己的任务队列，一键操作 |

## API 端点 (22 个)

```
POST   /api/auth/login         登录
GET    /api/orders              活跃订单
POST   /api/orders              创建订单 (跟单员+)
PUT    /api/orders/:id/assign   分配订单 (管理员)
GET    /api/processes/:orderId  订单工序流
POST   /api/processes/complete  分次完成数量
GET    /api/workers/:name/tasks 师傅任务队列
POST   /api/materials/inbound   入库 (管理员)
GET    /api/materials/options   用料下拉选项
GET    /api/print/:worker       按师傅打印
GET    /api/reports/daily-inventory  库存日报
GET    /api/reports/weekly-inventory 库存周报
GET    /api/reports/monthly-orders   订单月报
POST   /api/feedback            提交反馈 (自动暂停)
GET    /api/customers           客户管理
GET    /api/samples             样板管理
```

## 设计原则

1. **一眼看清** — 急单红色，库存预警，状态可见
2. **操作零思考** — 师傅点两下完成操作
3. **所有业务逻辑在引擎层** — Controller 不做业务判断
4. **所有生产行为可追溯** — TraceEngine 全链路记录

## License

MIT
