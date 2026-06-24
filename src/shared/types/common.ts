// ============================================================
// 溢彩 Production OS — 共享基础类型
// ============================================================

/** 原子工序类型（10种） */
export type ProcessType =
  | '横竖分切' | '破片' | '直切' | '冲型'
  | '背胶' | '点胶' | '贴布' | '打包'
  | '改回填' | '粘胶';

/** 工艺组合（24种，跟单员选择后自动展开为工序链） */
export type ProcessTemplate =
  // 基础
  | '片材' | '片材切片' | '片材冲型' | '片材切片冲型' | '切片冲型'
  // 背胶
  | '片材背胶' | '片材背胶冲型' | '片材背胶切片' | '片材背胶切片冲型'
  // 贴布
  | '片材贴布' | '片材贴布冲型' | '片材贴布切片' | '片材贴布切片冲型'
  // 背胶+贴布
  | '片材背胶贴布' | '片材背胶贴布冲型' | '片材背胶贴布切片冲型'
  // 点胶（与背胶互斥）
  | '片材切片冲型点胶' | '片材贴布切片冲型点胶'
  // 库存（不从原材料开始）
  | '库存片材' | '库存切片' | '库存冲型' | '库存切片冲型'
  // 直接加工（外来材料）
  | '改回填' | '热熔胶' | '点胶'
  // 其他
  | '打包';

/** 冲型工艺 */
export type PunchType = '单冲' | '连冲' | '复合冲';

/** 订单优先级（5级） */
export type Priority = 'deadline' | 'urgent' | 'normal' | 'attention' | 'unmentioned';

/** 优先级标签映射 */
export const PRIORITY_LABELS: Record<Priority, string> = {
  deadline:    '客户下达死命令',
  urgent:      '客户催产',
  normal:      '客户关注',
  attention:   '客户没提',
  unmentioned: '客户没提',
};

/** 优先级颜色 */
export const PRIORITY_COLORS: Record<Priority, string> = {
  deadline:    '#FF0000',
  urgent:      '#FF6600',
  normal:      '#FFCC00',
  attention:   '#3399FF',
  unmentioned: '#999999',
};

/** 订单状态 */
export type OrderStatus =
  | 'pending'        // 待排产
  | 'material_matching'  // 材料匹配中
  | 'scheduled'      // 已排产
  | 'in_progress'    // 生产中
  | 'partial_done'   // 部分完成
  | 'completed'      // 已完单
  | 'cancelled';     // 已取消

/** 工序执行状态 */
export type ProcessStatus =
  | 'waiting'        // 等待上游
  | 'ready'          // 就绪
  | 'running'        // 执行中
  | 'paused'         // 暂停
  | 'done'           // 完成
  | 'rework'         // 返工
  | 'skipped';       // 跳过

/** 任务状态 */
export type TaskStatus =
  | 'queued'         // 排队
  | 'assigned'       // 已分配
  | 'running'        // 执行中
  | 'completed'      // 完成
  | 'failed';        // 失败

/** 事件类型（追溯用） */
export type TraceEventType =
  | 'order_created'
  | 'material_matched'
  | 'process_started'
  | 'process_completed'
  | 'process_failed'
  | 'task_assigned'
  | 'task_completed'
  | 'rework_triggered'
  | 'supplement_started'
  | 'supplement_needed'
  | 'order_completed'
  | 'anomaly_detected'
  | 'stock_priority_skipped';

/** 分页参数 */
export interface Pagination {
  page: number;
  pageSize: number;
}

/** 分页结果 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 日期范围 */
export interface DateRange {
  start: Date;
  end: Date;
}

// ============================================================
// 工艺模板 → 原子工序链 映射表
// ============================================================

/** 工艺组合 → 展开后的工序序列（带机器绑定） */
export const PROCESS_TEMPLATE_MAP: Record<ProcessTemplate, ProcessType[]> = {
  // 基础
  '片材':               ['横竖分切', '破片'],
  '片材切片':           ['横竖分切', '破片', '直切'],
  '片材冲型':           ['横竖分切', '破片', '冲型'],
  '片材切片冲型':       ['横竖分切', '破片', '直切', '冲型'],
  '切片冲型':           ['直切', '冲型'],

  // 背胶
  '片材背胶':           ['横竖分切', '破片', '背胶'],
  '片材背胶冲型':       ['横竖分切', '破片', '冲型', '背胶'],
  '片材背胶切片':       ['横竖分切', '破片', '直切', '背胶'],
  '片材背胶切片冲型':   ['横竖分切', '破片', '直切', '冲型', '背胶'],

  // 贴布
  '片材贴布':           ['横竖分切', '破片', '贴布'],
  '片材贴布冲型':       ['横竖分切', '破片', '冲型', '贴布'],
  '片材贴布切片':       ['横竖分切', '破片', '直切', '贴布'],
  '片材贴布切片冲型':   ['横竖分切', '破片', '直切', '冲型', '贴布'],

  // 背胶+贴布
  '片材背胶贴布':       ['横竖分切', '破片', '背胶', '贴布'],
  '片材背胶贴布冲型':   ['横竖分切', '破片', '冲型', '背胶', '贴布'],
  '片材背胶贴布切片冲型': ['横竖分切', '破片', '直切', '冲型', '背胶', '贴布'],

  // 点胶（与背胶互斥）
  '片材切片冲型点胶':   ['横竖分切', '破片', '直切', '冲型', '点胶'],
  '片材贴布切片冲型点胶': ['横竖分切', '破片', '直切', '冲型', '贴布', '点胶'],

  // 库存（跳过横竖分切和破片，从已有库存开始）
  '库存片材':           ['直切'],
  '库存切片':           ['直切'],
  '库存冲型':           ['冲型'],
  '库存切片冲型':       ['直切', '冲型'],

  // 直接加工
  '改回填':             ['改回填'],
  '热熔胶':             ['背胶'],
  '点胶':               ['点胶'],

  // 其他
  '打包':               ['打包'],
};

/** 工序 → 负责师傅 */
export const PROCESS_WORKER_MAP: Record<ProcessType, string> = {
  '横竖分切': '郑思远',
  '破片':     '伍乾进',
  '直切':     '莫齐国',
  '冲型':     '李乐',
  '背胶':     '简翠花',
  '点胶':     '简翠花',
  '贴布':     '简翠花',
  '打包':     '杨合进',
  '改回填':   '郑思远',
  '粘胶':     '简翠花',
};

/** 工序 → 默认机器 */
export const PROCESS_MACHINE_MAP: Record<ProcessType, string> = {
  '横竖分切': '横竖分切机',
  '破片':     '破片机',
  '直切':     '直切机',
  '冲型':     '冲床',
  '背胶':     '热熔胶机',
  '点胶':     '点胶机',
  '贴布':     '热熔胶机',
  '打包':     '打包台',
  '改回填':   '改回填机',
  '粘胶':     '热熔胶机',
};
