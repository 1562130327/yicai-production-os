import { Customer } from '../domain/customer';

export const CUSTOMER_MOCK: Customer[] = [
  { id: 'C1', name: '东莞鞋材厂', contact: '张经理', phone: '13900001111', level: 'vip', paymentCycle: '月结30天', address: '东莞市厚街镇', notes: '老客户，量大', createdAt: '2026-01-01', updatedAt: '2026-06-01' },
  { id: 'C2', name: '深圳运动科技', contact: '李总', phone: '13900002222', level: 'vip', paymentCycle: '月结15天', address: '深圳市宝安区', notes: '质量要求高', createdAt: '2026-01-15', updatedAt: '2026-06-01' },
  { id: 'C3', name: '广州箱包有限公司', contact: '王经理', phone: '13900003333', level: 'normal', paymentCycle: '月结30天', address: '广州市花都区', notes: '', createdAt: '2026-02-01', updatedAt: '2026-06-01' },
  { id: 'C4', name: '佛山瑜伽用品', contact: '陈经理', phone: '13900004444', level: 'normal', paymentCycle: '月结45天', address: '佛山市南海区', notes: '季节性订单', createdAt: '2026-03-01', updatedAt: '2026-06-01' },
  { id: 'C5', name: '中山玩具厂', contact: '刘经理', phone: '13900005555', level: 'new', paymentCycle: '预付', address: '中山市小榄镇', notes: '新客户', createdAt: '2026-06-01', updatedAt: '2026-06-15' },
];
