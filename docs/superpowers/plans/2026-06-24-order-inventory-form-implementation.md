# 订单录入 & 库存管理 & 报表 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 改造订单录入（工艺联动+多尺寸行）、库存入库（三段式规格+动态下拉）、报表系统（日报/周报/月报/年报）、材料统筹（联合开片）

**Architecture:** 数据模型（加 dimensions/color/width/price 列）→ 后端 API（支持新字段）→ 前端页面（工艺联动表单+报表面板）。不变更现有引擎/仓储/状态机核心逻辑。

**Tech Stack:** TypeScript + Express + sql.js + HTML/CSS/JS 单文件前端

---

## 文件结构映射

| 模块 | 新建 | 修改 |
|------|------|------|
| 数据模型 | | `domain/order/order.entity.ts`, `domain/material/material.entity.ts`, `domain/inventory/inventory.entity.ts` |
| 数据库 | | `infrastructure/database/connection.ts` (DDL + migration), 所有 repo |
| 后端API | | `interfaces/dto/order.dto.ts`, `interfaces/dto/material.dto.ts`, `interfaces/http/routes/order.routes.ts`, `interfaces/http/routes/material.routes.ts`, `interfaces/http/routes/report.routes.ts` |
| 前端 | | `public/app/index.html` (新增录入页面+报表面板) |

---

### Task 1: 数据库迁移 — 加 color/width/price/dimensions 列

**Files:**
- Modify: `src/infrastructure/database/connection.ts` — DDL + migration

- [ ] **Step 1: 更新 orders 表 DDL，加 dimensions 列**

在 `initializeSchema` 的 orders CREATE TABLE 的 `punched` 行后加：
```sql
dimensions TEXT DEFAULT '[]',
```

- [ ] **Step 2: 更新 inventory_batches 表 DDL，加 color/width/price 列**

```sql
color TEXT DEFAULT '',
batch_width REAL DEFAULT 0,
price REAL DEFAULT 0,
```

- [ ] **Step 3: 更新 materials 表 DDL，加 color/width 列**

```sql
color TEXT DEFAULT '',
material_width REAL DEFAULT 0,
```

- [ ] **Step 4: 在迁移数组追加新列**

```typescript
'ALTER TABLE orders ADD COLUMN dimensions TEXT DEFAULT \'[]\'',
'ALTER TABLE inventory_batches ADD COLUMN color TEXT DEFAULT \'\'',
'ALTER TABLE inventory_batches ADD COLUMN batch_width REAL DEFAULT 0',
'ALTER TABLE inventory_batches ADD COLUMN price REAL DEFAULT 0',
'ALTER TABLE materials ADD COLUMN color TEXT DEFAULT \'\'',
'ALTER TABLE materials ADD COLUMN material_width REAL DEFAULT 0',
```

- [ ] **Step 5: 验证**

```bash
pnpm typecheck
```

---

### Task 2: 领域实体更新

**Files:**
- Modify: `src/domain/order/order.entity.ts`
- Modify: `src/domain/material/material.entity.ts`
- Modify: `src/domain/inventory/inventory.entity.ts`

- [ ] **Step 1: Order 实体加 dimensions 字段**

```typescript
// 在 Order 接口加
readonly dimensions: OrderDimension[];

// 新增
export interface OrderDimension {
  sliceSize?: string;
  sliceQty?: number;
  punchSize?: string;
  punchQty?: number;
  layerThickness?: number;
  notes?: string;
}
```

`CreateOrderInput` 加：
```typescript
dimensions?: OrderDimension[];
```

- [ ] **Step 2: Material 实体加 color/materialWidth**

```typescript
readonly color: string;
readonly materialWidth: number;  // 宽度(m)
```

- [ ] **Step 3: InventoryBatch 实体加 color/width/price**

```typescript
readonly color: string;
readonly batchWidth: number;
readonly price: number;
```

- [ ] **Step 4: 验证**

```bash
pnpm typecheck
```

---

### Task 3: 仓储层更新 — order.repo.ts

**Files:**
- Modify: `src/infrastructure/database/repositories/order.repo.ts`

- [ ] **Step 1: toRow/toEntity 加 dimensions 映射**

```typescript
// toRow:
dimensions: JSON.stringify(o.dimensions ?? []),

// toEntity:
dimensions: JSON.parse(row.dimensions || '[]'),
```

- [ ] **Step 2: INSERT SQL 加 dimensions 列**

```sql
INSERT INTO orders (..., dimensions) VALUES (..., @dimensions)
```

- [ ] **Step 3: 验证**

```bash
pnpm typecheck
```

---

### Task 4: 仓储层更新 — material.repo.ts + inventory.repo.ts

**Files:**
- Modify: `src/infrastructure/database/repositories/material.repo.ts`
- Modify: `src/infrastructure/database/repositories/inventory.repo.ts`

- [ ] **Step 1: material.repo toEntity/toRow 加 color/materialWidth**

```typescript
// toEntity:
color: r.color || '',
materialWidth: r.material_width || 0,

// toRow:
color: m.color,
materialWidth: m.materialWidth,
```

- [ ] **Step 2: inventory.repo batchToEntity 加 color/width/price**

```typescript
color: r.color || '',
batchWidth: r.batch_width || 0,
price: r.price || 0,
```

- [ ] **Step 3: 更新 INSERT 语句包含新列**

materials INSERT 加 `color, material_width`；inventory_batches INSERT 加 `color, batch_width, price`。

- [ ] **Step 4: 验证**

```bash
pnpm typecheck
```

---

### Task 5: 后端 API — 订单创建支持 dimensions + 用料自动匹配

**Files:**
- Modify: `src/interfaces/dto/order.dto.ts`
- Modify: `src/application/order/order.service.ts`
- Modify: `src/interfaces/http/routes/order.routes.ts`

- [ ] **Step 1: DTO 加 dimensions 校验**

```typescript
export const CreateOrderSchema = z.object({
  // ... existing fields
  dimensions: z.array(z.object({
    sliceSize: z.string().optional(),
    sliceQty: z.number().int().positive().optional(),
    punchSize: z.string().optional(),
    punchQty: z.number().int().positive().optional(),
  })).optional().default([]),
});
```

- [ ] **Step 2: OrderService.createOrder 传递 dimensions**

```typescript
const order = await this.orderRepo.create({ ...input, dimensions: input.dimensions ?? [] });
```

- [ ] **Step 3: 加库存实时查询端点 GET /api/materials/options**

返回所有有库存的材料，格式：
```json
{ "options": [{ "id": "batch-uuid", "label": "辉煌-白45°B料-白-1.4m-60mm (库存:30床)", "supplier": "辉煌", "material": "白45°B料", "color": "白", "width": 1.4, "thickness": 60, "stock": 30 }] }
```

在 `material.routes.ts` 加：
```typescript
router.get('/options', asyncHandler(async (_req, res) => {
  const batches = await inventoryRepo.findAvailable('', 0);
  res.json({ success: true, data: { options: batches.map(b => ({
    id: b.id, label: `${b.supplierName}-${b.materialSpec}-${b.color||'无颜色'}-${b.batchWidth||b.info}m-${b.info||''} (库存:${b.remainingQty}床)`,
    supplier: b.supplierName, material: b.materialSpec, color: b.color,
    width: b.batchWidth, stock: b.remainingQty,
  })) } });
}));
```

- [ ] **Step 4: 订单列表 API 返回 dimensions**

`GET /api/orders` 已返回完整 Order 对象，dimensions 已包含。

- [ ] **Step 5: 验证**

```bash
pnpm typecheck && pnpm test
```

---

### Task 6: 后端 API — 库存入库增强

**Files:**
- Modify: `src/interfaces/dto/material.dto.ts`
- Modify: `src/interfaces/http/routes/material.routes.ts`
- Modify: `src/application/material/material.service.ts`

- [ ] **Step 1: 扩展入库 DTO**

```typescript
export const CreateInventorySchema = z.object({
  supplier: z.string().min(1),
  material: z.string().min(1),
  color: z.string().optional().default(''),
  width: z.number().positive(),
  length: z.number().positive(),   // 长(m)
  thickness: z.number().positive(), // 厚(mm)
  quantity: z.number().int().positive(),
  price: z.number().min(0).optional(),
  notes: z.string().optional(),
});
```

- [ ] **Step 2: 入库 API 自动创建/更新材料记录**

```typescript
router.post('/inbound', requireRole('admin'), asyncHandler(async (req, res) => {
  const dto = CreateInventorySchema.parse(req.body);
  const spec = `${dto.width}m×${dto.length}m×${dto.thickness}mm`;
  const materialSpec = `${dto.supplier} — ${dto.material} — ${dto.color || '无颜色'} — ${dto.width}m宽 — ${dto.thickness}mm`;

  // 确保材料定义存在（幂等）
  let material = await materialRepo.findBySpec(materialSpec);
  if (!material) {
    material = await materialRepo.create({
      spec: materialSpec,
      info: `${dto.material} ${spec}`,
      sheetSize: spec,
      lossRate: 0.05,
      unit: '床',
      color: dto.color,
      materialWidth: dto.width,
    });
  }

  // 创建或追加库存批次
  const existingBatches = await inventoryRepo.findByMaterialSpec(materialSpec);
  const matchingBatch = existingBatches.find(b => b.info === spec && b.batchWidth === dto.width);
  if (matchingBatch) {
    await inventoryRepo.inbound(matchingBatch.id, dto.quantity, dto.notes || '入库');
  } else {
    await inventoryRepo.create({
      batchNo: `${dto.supplier}-${dto.material}-${spec}`,
      materialSpec,
      info: spec,
      supplierName: dto.supplier,
      supplierInfo: dto.notes || '',
      remainingQty: dto.quantity,
      unit: '床',
      inboundWeek: dto.quantity,
      lastInboundAt: new Date().toISOString(),
      color: dto.color,
      batchWidth: dto.width,
      price: dto.price ?? 0,
    });
  }

  res.status(201).json({ success: true, data: { message: `入库 ${dto.quantity} 床` } });
}));
```

- [ ] **Step 3: 验证**

```bash
pnpm typecheck && pnpm test
```

---

### Task 7: 报表 API 扩展 — 日报/周报/月报

**Files:**
- Modify: `src/interfaces/http/routes/report.routes.ts`

- [ ] **Step 1: 库存日报**

```typescript
router.get('/daily-inventory', asyncHandler(async (_req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const batches = await inventoryRepo.findByMaterialSpec('');
  const totalStock = batches.reduce((s, b) => s + b.remainingQty, 0);
  const todayTx = (await Promise.all(batches.map(b => inventoryRepo.getTransactions(b.id))))
    .flat().filter(tx => tx.timestamp.startsWith(today));

  res.json({ success: true, data: {
    date: today,
    totalStock,
    inboundToday: todayTx.filter(tx => tx.type === 'inbound').reduce((s, tx) => s + tx.quantity, 0),
    outboundToday: todayTx.filter(tx => tx.type === 'outbound').reduce((s, tx) => s + tx.quantity, 0),
    transactions: todayTx.slice(0, 50),
  }});
}));
```

- [ ] **Step 2: 库存周报**

```typescript
router.get('/weekly-inventory', asyncHandler(async (_req, res) => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7*24*60*60*1000).toISOString();
  const batches = await inventoryRepo.findByMaterialSpec('');

  const groupBySupplier: Record<string, { inbound: number; outbound: number }> = {};
  for (const b of batches) {
    const txs = await inventoryRepo.getTransactions(b.id);
    for (const tx of txs) {
      if (tx.timestamp < weekAgo) continue;
      const key = b.supplierName || '未知';
      if (!groupBySupplier[key]) groupBySupplier[key] = { inbound: 0, outbound: 0 };
      if (tx.type === 'inbound') groupBySupplier[key].inbound += tx.quantity;
      else if (tx.type === 'outbound') groupBySupplier[key].outbound += tx.quantity;
    }
  }

  res.json({ success: true, data: {
    period: `${weekAgo.split('T')[0]} ~ ${now.toISOString().split('T')[0]}`,
    totalStock: batches.reduce((s, b) => s + b.remainingQty, 0),
    lowStock: batches.filter(b => b.remainingQty > 0 && b.remainingQty < 10).length,
    bySupplier: groupBySupplier,
  }});
}));
```

- [ ] **Step 3: 订单月报**

```typescript
router.get('/monthly-orders', asyncHandler(async (_req, res) => {
  const orders = await orderRepo.findActive();
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30*24*60*60*1000).toISOString();

  const thisMonth = orders.filter(o => o.createdAt >= monthAgo);
  const byCustomer: Record<string, number> = {};
  for (const o of thisMonth) {
    byCustomer[o.customerName] = (byCustomer[o.customerName] || 0) + 1;
  }

  res.json({ success: true, data: {
    period: `${monthAgo.split('T')[0]} ~ ${now.toISOString().split('T')[0]}`,
    total: orders.length,
    newThisMonth: thisMonth.filter(o => o.status === 'pending').length,
    completedThisMonth: thisMonth.filter(o => o.status === 'completed').length,
    byCustomer: Object.entries(byCustomer).sort((a, b) => b[1] - a[1]).slice(0, 20),
  }});
}));
```

- [ ] **Step 4: 验证**

```bash
pnpm typecheck && pnpm test
```

---

### Task 8: 前端 — 订单录入页面（工艺联动 + 多尺寸行）

**Files:**
- Modify: `public/app/index.html`

- [ ] **Step 1: 在导航加"录单"入口（仅 admin+merchandiser 可见）**

```html
<a data-panel="newOrder" onclick="switchPanel('newOrder')" class="admin-only">录 单</a>
```

- [ ] **Step 2: 加录单面板 HTML**

```html
<section class="panel" id="panel-newOrder">
  <div class="filter-bar">
    <h3 style="color:var(--accent)">新建订单</h3>
    <span id="orderPreview" style="color:var(--text-dim);font-size:13px;margin-left:auto"></span>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
    <div>
      <label style="font-size:11px;color:var(--text-dim)">客户</label>
      <input id="newCust" list="custList" placeholder="选择或输入" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px">
      <datalist id="custList"></datalist>
    </div>
    <div>
      <label style="font-size:11px;color:var(--text-dim)">款号</label>
      <input id="newProduct" placeholder="可选" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px">
    </div>
    <div>
      <label style="font-size:11px;color:var(--text-dim)">工艺</label>
      <select id="newTemplate" onchange="onTemplateChange()" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px">
        <option value="">选择工艺...</option>
        <optgroup label="基础">${['片材','片材切片','片材冲型','片材切片冲型','切片冲型'].map(t=>`<option value="${t}">${t}</option>`).join('')}</optgroup>
        <optgroup label="背胶">${['片材背胶','片材背胶冲型','片材背胶切片','片材背胶切片冲型'].map(t=>`<option value="${t}">${t}</option>`).join('')}</optgroup>
        <optgroup label="库存">${['库存片材','库存切片','库存冲型','库存切片冲型'].map(t=>`<option value="${t}">${t}</option>`).join('')}</optgroup>
      </select>
    </div>
    <div>
      <label style="font-size:11px;color:var(--text-dim)">优先级</label>
      <select id="newPriority" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px">
        <option value="unmentioned">客户没提</option><option value="attention">客户关注</option><option value="normal">客户催产</option><option value="urgent">客户紧急</option><option value="deadline">死命令</option>
      </select>
    </div>
    <div>
      <label style="font-size:11px;color:var(--text-dim)">用料（从库存选）</label>
      <select id="newMaterial" onchange="onMaterialChange()" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px">
        <option value="">加载中...</option>
      </select>
    </div>
    <div id="sheetFields" style="display:none">
      <label style="font-size:11px;color:var(--text-dim)">片材尺寸</label>
      <div style="display:flex;gap:4px">
        <input id="sheetW" placeholder="宽(m)" style="width:80px;padding:6px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px">
        <span style="color:var(--text-dim)">×</span>
        <input id="sheetL" placeholder="长(m)" style="width:80px;padding:6px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px">
        <span style="color:var(--text-dim)">×</span>
        <input id="sheetT" placeholder="厚(mm)" style="width:80px;padding:6px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px">
      </div>
      <input id="sheetQty" placeholder="片材总数" type="number" style="margin-top:4px;width:100%;padding:6px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px">
    </div>
  </div>
  <div id="dimensionRows" style="margin-top:12px"></div>
  <div style="margin-top:12px;display:flex;gap:8px">
    <button class="btn" id="btnAddDimRow" style="display:none" onclick="addDimensionRow()">+ 加尺寸行</button>
    <button class="btn primary" onclick="submitNewOrder()">提 交</button>
    <span id="stockHint" style="color:var(--text-dim);font-size:12px;align-self:center"></span>
  </div>
</section>
```

- [ ] **Step 3: 工艺联动 JS**

```javascript
function onTemplateChange() {
  const t = document.getElementById('newTemplate').value;
  const sheetFields = document.getElementById('sheetFields');
  const addBtn = document.getElementById('btnAddDimRow');
  const dimRows = document.getElementById('dimensionRows');

  // 显示/隐藏片材区
  const needsSheet = t && !t.startsWith('库存') && t !== '打包';
  sheetFields.style.display = needsSheet ? '' : 'none';

  // 显示/隐藏尺寸行区
  const needsDims = t && (t.includes('切片') || t.includes('冲型'));
  addBtn.style.display = needsDims ? '' : 'none';

  // 已有尺寸行时展示预览
  if (needsDims && dimRows.children.length === 0) addDimensionRow();

  // 预览工序链
  fetch(API + '/orders/preview-chain?template=' + t, { headers: headers() })
    .then(r => r.json()).then(d => {
      if (d.data) document.getElementById('orderPreview').textContent = '工序链: ' + d.data.join(' → ');
    }).catch(() => {});
}

function addDimensionRow() {
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:6px;align-items:center;margin-top:6px';
  const t = document.getElementById('newTemplate').value;
  const hasSlice = t && t.includes('切片');
  const hasPunch = t && t.includes('冲型');
  let html = '<span style="font-size:11px;color:var(--text-dim);min-width:40px">行</span>';
  if (hasSlice) html += '<input placeholder="切片尺寸" style="flex:1;padding:6px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px" class="dim-slice"> <input placeholder="数量" type="number" style="width:80px;padding:6px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px" class="dim-sqty">';
  if (hasPunch) html += '<input placeholder="冲型后尺寸" style="flex:1;padding:6px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px" class="dim-punch"> <input placeholder="数量" type="number" style="width:80px;padding:6px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px" class="dim-pqty">';
  html += '<button class="btn sm danger" onclick="this.parentElement.remove()">删</button>';
  div.innerHTML = html;
  document.getElementById('dimensionRows').appendChild(div);
}
```

- [ ] **Step 4: 用料动态加载 JS**

```javascript
function loadMaterialOptions() {
  fetch(API + '/materials/options', { headers: headers() })
    .then(r => r.json()).then(d => {
      const sel = document.getElementById('newMaterial');
      sel.innerHTML = '<option value="">选择用料...</option>' +
        (d.data?.options||[]).map(o => `<option value="${o.id}">${o.label}</option>`).join('');
    });
}

function onMaterialChange() {
  const sel = document.getElementById('newMaterial');
  const opt = sel.options[sel.selectedIndex];
  document.getElementById('stockHint').textContent = opt ? `库存: ${opt.text.match(/库存:(\d+)床/)?.[1] || '?'} 床` : '';
}
```

- [ ] **Step 5: 提交 JS**

```javascript
async function submitNewOrder() {
  const cust = document.getElementById('newCust').value.trim();
  const tpl = document.getElementById('newTemplate').value;
  if (!cust || !tpl) { alert('请填写客户和工艺'); return; }

  const body = {
    code: 'ORD-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.random().toString(36).slice(2,5).toUpperCase(),
    customerName: cust,
    productCode: document.getElementById('newProduct').value.trim(),
    processTemplate: tpl,
    priority: document.getElementById('newPriority').value,
    materialSpec: document.getElementById('newMaterial').value || '',
    sheetSize: [document.getElementById('sheetW').value, document.getElementById('sheetL').value, document.getElementById('sheetT').value].filter(Boolean).join('×'),
    sliceSize: '',
    sliceQty: 0,
    category: '未分类',
    dimensions: [],
  };

  // 收集尺寸行
  document.getElementById('dimensionRows').querySelectorAll('> div').forEach(div => {
    const dim = {};
    const s = div.querySelector('.dim-slice');
    const sq = div.querySelector('.dim-sqty');
    const p = div.querySelector('.dim-punch');
    const pq = div.querySelector('.dim-pqty');
    if (s) dim.sliceSize = s.value.trim();
    if (sq) dim.sliceQty = parseInt(sq.value) || 0;
    if (p) dim.punchSize = p.value.trim();
    if (pq) dim.punchQty = parseInt(pq.value) || 0;
    body.dimensions.push(dim);
  });

  // 片材数量
  const sq = document.getElementById('sheetQty');
  if (sq) { body.sliceQty = parseInt(sq.value) || 0; }

  // 用第一条尺寸行填充主字段（兼容旧结构）
  if (body.dimensions[0]) {
    body.sliceSize = body.dimensions[0].sliceSize || '';
    body.sliceQty = body.dimensions[0].sliceQty || 0;
    body.punchQty = body.dimensions[0].punchQty || 0;
  }

  const res = await fetch(API + '/orders', {
    method: 'POST', headers: headers(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.success) {
    alert('订单创建成功: ' + data.data.code);
    switchPanel('orders'); loadOrders();
  } else {
    alert('失败: ' + (data.error?.message || data.error));
  }
}
```

- [ ] **Step 6: 页面初始化时加载用料列表**

```javascript
if (!IS_WORKER) loadMaterialOptions();
```

- [ ] **Step 7: 验证**

浏览器 Ctrl+Shift+R，管理员/跟单员登录 → 点击"录单"→ 选工艺 → 字段联动变化 → 填数据 → 提交。

---

### Task 9: 前端 — 库存入库页面

**Files:**
- Modify: `public/app/index.html`

- [ ] **Step 1: 在库存面板加"入库"按钮**

```html
<button class="btn primary" onclick="switchPanel('inbound')" style="margin-left:auto">入 库</button>
```

- [ ] **Step 2: 加入库表单面板**

```html
<section class="panel" id="panel-inbound">
  <h3 style="color:var(--accent);margin-bottom:16px">库存入库</h3>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:600px">
    <div>
      <label style="font-size:11px;color:var(--text-dim)">供应商</label>
      <input id="inbSupplier" list="supplierList" placeholder="选择或输入" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px">
      <datalist id="supplierList"></datalist>
    </div>
    <div>
      <label style="font-size:11px;color:var(--text-dim)">材质</label>
      <input id="inbMaterial" list="materialList" placeholder="选择或输入" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px">
      <datalist id="materialList"></datalist>
    </div>
    <div>
      <label style="font-size:11px;color:var(--text-dim)">颜色</label>
      <input id="inbColor" list="colorList" placeholder="白/黑/灰..." style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px">
      <datalist id="colorList"></datalist>
    </div>
    <div>
      <label style="font-size:11px;color:var(--text-dim)">规格</label>
      <div style="display:flex;gap:4px">
        <input id="inbW" placeholder="宽(m)" style="flex:1;padding:6px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px">
        <span>×</span>
        <input id="inbL" placeholder="长(m)" style="flex:1;padding:6px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px">
        <span>×</span>
        <input id="inbT" placeholder="厚(mm)" style="flex:1;padding:6px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px">
      </div>
    </div>
    <div>
      <label style="font-size:11px;color:var(--text-dim)">数量(床)</label>
      <input id="inbQty" type="number" min="1" placeholder="张数" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px">
    </div>
    <div>
      <label style="font-size:11px;color:var(--text-dim)">单价(元/床，可选)</label>
      <input id="inbPrice" type="number" min="0" placeholder="可不填" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px">
    </div>
    <div>
      <label style="font-size:11px;color:var(--text-dim)">备注</label>
      <input id="inbNotes" placeholder="批次号等" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border);color:var(--text);border-radius:2px">
    </div>
  </div>
  <button class="btn primary" onclick="submitInbound()" style="margin-top:16px">确 认 入 库</button>
</section>
```

- [ ] **Step 3: 入库提交 JS**

```javascript
async function submitInbound() {
  const body = {
    supplier: document.getElementById('inbSupplier').value.trim(),
    material: document.getElementById('inbMaterial').value.trim(),
    color: document.getElementById('inbColor').value.trim(),
    width: parseFloat(document.getElementById('inbW').value) || 0,
    length: parseFloat(document.getElementById('inbL').value) || 0,
    thickness: parseFloat(document.getElementById('inbT').value) || 0,
    quantity: parseInt(document.getElementById('inbQty').value) || 0,
    price: parseFloat(document.getElementById('inbPrice').value) || 0,
    notes: document.getElementById('inbNotes').value.trim(),
  };
  if (!body.supplier || !body.material || !body.width || !body.length || !body.thickness || !body.quantity) {
    alert('请填写所有必填项'); return;
  }
  const res = await fetch(API + '/materials/inbound', {
    method: 'POST', headers: headers(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.success) {
    alert(data.data?.message || '入库成功');
    // 清空表单
    ['inbSupplier','inbMaterial','inbColor','inbW','inbL','inbT','inbQty','inbPrice','inbNotes'].forEach(id => document.getElementById(id).value = '');
  } else {
    alert('入库失败: ' + (data.error?.message || data.error));
  }
}
```

- [ ] **Step 4: 验证**

浏览器管理员登录 → 库存 → 入库 → 三段式填规格 → 提交。

---

### Task 10: 前端 — 报表面板扩展

**Files:**
- Modify: `public/app/index.html`

- [ ] **Step 1: 报表面板加日报/周报/月报切换**

```html
<div class="filter-bar">
  <button class="btn" onclick="loadReport('daily')">日报</button>
  <button class="btn" onclick="loadReport('weekly')">周报</button>
  <button class="btn" onclick="loadReport('monthly')">月报</button>
</div>
<div id="reportContent"></div>
```

- [ ] **Step 2: 报表加载 JS**

```javascript
async function loadReport(type) {
  const endpoints = {
    daily: '/api/reports/daily-inventory',
    weekly: '/api/reports/weekly-inventory',
    monthly: '/api/reports/monthly-orders',
  };
  const res = await fetch(endpoints[type], { headers: headers() });
  const data = await res.json();
  if (!data.success) return;
  const d = data.data;

  let html = '';
  if (type === 'daily') {
    html = `<div class="stat-grid">
      <div class="stat-card"><div class="stat-val">${d.totalStock}</div><div class="stat-label">当前库存(床)</div></div>
      <div class="stat-card"><div class="stat-val" style="color:var(--success)">${d.inboundToday}</div><div class="stat-label">今日入库</div></div>
      <div class="stat-card"><div class="stat-val" style="color:var(--warning)">${d.outboundToday}</div><div class="stat-label">今日出库</div></div>
    </div>`;
    if (d.transactions.length > 0) {
      html += '<table class="order-table"><thead><tr><th>批次</th><th>类型</th><th>数量</th><th>时间</th></tr></thead><tbody>';
      d.transactions.forEach(tx => { html += `<tr><td>${tx.batchId}</td><td>${tx.type}</td><td>${tx.quantity}</td><td>${tx.timestamp}</td></tr>`; });
      html += '</tbody></table>';
    }
  } else if (type === 'weekly') {
    html = `<div class="stat-grid">
      <div class="stat-card"><div class="stat-val">${d.totalStock}</div><div class="stat-label">当前库存</div></div>
      <div class="stat-card"><div class="stat-val" style="color:var(--danger)">${d.lowStock}</div><div class="stat-label">低库存预警</div></div>
    </div>`;
    for (const [sup, v] of Object.entries(d.bySupplier)) {
      html += `<div class="supplier-group"><h3>${sup}</h3><div class="inv-row"><span>入库</span><span class="qty">${v.inbound} 床</span></div><div class="inv-row"><span>出库</span><span class="qty">${v.outbound} 床</span></div></div>`;
    }
  } else if (type === 'monthly') {
    html = `<div class="stat-grid">
      <div class="stat-card"><div class="stat-val">${d.total}</div><div class="stat-label">活跃订单</div></div>
      <div class="stat-card"><div class="stat-val">${d.newThisMonth}</div><div class="stat-label">本月新增</div></div>
      <div class="stat-card"><div class="stat-val" style="color:var(--success)">${d.completedThisMonth}</div><div class="stat-label">本月完成</div></div>
    </div>`;
    html += '<table class="order-table"><thead><tr><th>客户</th><th>订单数</th></tr></thead><tbody>';
    d.byCustomer.forEach(([c, n]) => { html += `<tr><td>${c}</td><td>${n}</td></tr>`; });
    html += '</tbody></table>';
  }
  document.getElementById('reportContent').innerHTML = html;
}
```

- [ ] **Step 3: 验证**

浏览器打开报表 → 切日报/周报/月报 → 数据正常展示。

---

### Task 11: 前端 — 库存面板加"入库"入口

**Files:**
- Modify: `public/app/index.html`

- [ ] **Step 1: 库存面板顶部加按钮**

在 `id="panel-inventory"` 的 `filter-bar` 或顶部加：
```html
<button class="btn primary admin-only" onclick="switchPanel('inbound')">入 库</button>
```

- [ ] **Step 2: 验证**

管理员登录 → 库存 → 显示入库按钮 → 点击跳转入库表单。

---

### Task 12: 最终验证

- [ ] **Step 1: 全量 typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 2: 全量测试**

```bash
pnpm test
```

- [ ] **Step 3: 启动服务端到端测试**

```bash
pnpm dev
# 浏览器 http://localhost:3000
# 管理员登录 → 录单 → 入库 → 报表
# 师傅登录 → 任务面板
```

- [ ] **Step 4: 确认无旧代码残余**

```bash
grep -r "seed\|xlsx\|normalizeSize\|mergeOrderRows\|EVA库存" src/ --include="*.ts"
# 预期：无结果
```

---

## 注意事项

- dimensions 数据为 JSON 字符串存储，不影响现有查询逻辑
- 旧订单如有 dimensions 为空数组 `[]`，兼容处理
- ProcessEngine.generateFlow 不需要改，工序生成逻辑不变
- 所有 UI 改动在 `public/app/index.html`，优先加 admin-only class 控制权限
