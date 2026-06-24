// ============================================================
// 溢彩 Production OS — 订单领域实体
// 映射自：生产排单表
// ============================================================

import { OrderStatus, Priority, ProcessTemplate, PunchType } from '../../shared/types';

/** 订单聚合根 */
export interface Order {
  readonly id: string;
  readonly code: string;          // 订单编号
  readonly productCode: string;   // 款号
  readonly customerName: string;  // 客户
  readonly category: string;      // 产品类别
  readonly processTemplate: ProcessTemplate;  // 加工工艺
  readonly priority: Priority;
  readonly status: OrderStatus;

  // 材料信息
  readonly materialSpec: string;      // 用料规格
  readonly sheetSize: string;         // 片材尺寸
  readonly sliceSize: string;         // 切片尺寸
  readonly sliceQty: number;          // 切片总数

  // 冲型信息
  readonly punchType?: PunchType;     // 冲型工艺（可选）
  readonly punchSize?: string;        // 冲型后尺寸（可选）
  readonly punchQty?: number;         // 冲型数量（可选）

  // 进度跟踪
  readonly sheetOpened: number;       // 已开片材数
  readonly sheetCut: number;          // 已切片材数
  readonly punched: number;           // 已冲型数

  // 多尺寸/多模具配置
  readonly dimensions: OrderDimension[];

  readonly createdAt: string;         // 下单日期
  readonly updatedAt: string;
}

/** 创建订单输入 */
export interface CreateOrderInput {
  code: string;
  productCode: string;
  customerName: string;
  category: string;
  processTemplate: ProcessTemplate;
  priority?: Priority;
  materialSpec: string;
  sheetSize: string;
  sliceSize: string;
  sliceQty: number;
  punchType?: PunchType;
  punchSize?: string;
  punchQty?: number;
  dimensions?: OrderDimension[];
}

/** 订单进度更新 */
export interface UpdateOrderProgress {
  sheetOpened?: number;
  sheetCut?: number;
  punched?: number;
  status?: OrderStatus;
}

/** 订单尺寸/模具配置 */
export interface OrderDimension {
  sliceSize?: string;
  sliceQty?: number;
  punchSize?: string;
  punchQty?: number;
}
