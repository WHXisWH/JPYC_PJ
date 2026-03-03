# Node Stay — 项目当前状态（中文详细说明）

> 更新时间：2026-03-04
> 整体完成度：**约 60%**
> 合约层完整、UI 层完整、后端和前后端集成仍是主要缺口

---

## 目录

1. [已完成部分](#一已完成部分)
2. [未完成部分（详细列表）](#二未完成部分详细列表)
   - [后端 API 层](#1-后端-api-层)
   - [前端页面层](#2-前端页面层)
   - [前后端接口集成](#3-前后端接口集成)
   - [基础设施 / 数据持久化](#4-基础设施--数据持久化)
   - [文案与文档](#5-文案与文档)
3. [文件路径索引](#三文件路径索引)
4. [接口清单（已有 vs 缺失）](#四接口清单已有-vs-缺失)
5. [下一步优先级建议](#五下一步优先级建议)

---

## 一、已完成部分

### 1. 智能合约（`packages/contracts/`）— ✅ 完整

| 合约文件 | 功能 | 状态 |
|---|---|---|
| `contracts/AccessPassNFT.sol` | ERC-721 利用权 NFT；mint / consumePass / suspend / reactivate；24h 转让冷却期 | ✅ |
| `contracts/DepositVault.sol` | JPYC hold / capture / release 模式 | ✅ |
| `contracts/ComputeMarket.sol` | bytes32 节点 ID 上链；完整 Job 生命周期；75% 店铺 / 25% 平台自动分配 | ✅ |
| `contracts/MockERC20.sol` | 测试网用 JPYC 模拟币 | ✅ |
| `contracts/MockERC20Config.sol` | 可配置失败行为的 ERC-20 Mock | ✅ |
| `test/accessPass.test.ts` | 24 个测试，全覆盖新接口 | ✅ |
| `test/computeMarket.test.ts` | 37 个测试，含 75/25 分配精度验证 | ✅ |
| `test/depositVault.test.ts` | 3 个测试 | ✅ |
| `scripts/deploy.ts` | 支持 Amoy / Polygon mainnet / local，自动部署 MockERC20 | ✅ |
| `hardhat.config.ts` | 配置 Amoy（chainId 80002）+ Polygon（137）+ dotenv | ✅ |
| `.env.example` | 环境变量模板 | ✅ |

**Polygon Amoy 已部署地址（2026-03-04）**

| 合约 | 地址 |
|---|---|
| MockERC20 | `0x2fA62C3E53b67A9678F4Aac14E2843c1dF7b8AfD` |
| AccessPassNFT | `0x1cC076ed23D6c2e5dD37aAe28b9a21aA9d46eC3a` |
| DepositVault | `0xb2a5A4354F9b53089893b2aF9840a29cEeEe84fD` |
| ComputeMarket | `0x159E85E8f296B9a3A95A9FFaE59Ae7aF4358Ee77` |

---

### 2. 共享包

#### `packages/domain/src/` — ✅ Schema 完整（13 个 Zod Schema）

| 文件 | 导出内容 |
|---|---|
| `money.ts` | `MoneySchema`（currency + amountMinor） |
| `idempotency.ts` | `IdempotencyKeySchema` + `normalizeIdempotencyKey()` |
| `venue.ts` | `VenueSchema`、`JurisdictionSchema`、`RegulationProfileSchema` |
| `identity.ts` | `IdentityVerificationSchema`（6 种验证方法） |
| `accessPass.ts` | `AccessPassSchema`（8 状态）、`DepositStatusSchema` |
| `session.ts` | `SessionSchema`（5 状态 + 计费详情） |
| `ledger.ts` | `LedgerAccountSchema`、`LedgerTransactionSchema`、`OutboxEventSchema` |
| `compute.ts` | `ComputeNodeSchema`、`ComputeJobSchema`（6 状态） |
| `reservation.ts` | `ReservationSchema`（6 状态） |
| `settlement.ts` | `SettlementSchema` |
| `dispute.ts` | `DisputeSchema`（4 状态） |
| `index.ts` | 统一导出 |

#### `packages/api-client/src/nodestayClient.ts` — ✅ 9 个方法

| 方法 | 路径 | 幂等 |
|---|---|---|
| `health()` | GET `/v1/health` | — |
| `listVenues()` | GET `/v1/venues` | — |
| `listPlans(venueId)` | GET `/v1/venues/:id/plans` | — |
| `verifyIdentity(input)` | POST `/v1/identity/verify` | — |
| `checkinSession(input)` | POST `/v1/sessions/checkin` | — |
| `checkoutSession(input, key)` | POST `/v1/sessions/checkout` | ✅ Header |
| `getBalance()` | GET `/v1/user/balance` | — |
| `createVenueAsMerchant(input)` | POST `/v1/merchant/venues` | — |
| `purchasePass(input, key)` | POST `/v1/passes/purchase` | ✅ Header |

---

### 3. 前端 UI（`apps/web/src/`）— ✅ 界面完整，部分页面数据为 Mock

#### 已完成的组件与页面

| 路径 | 内容 | 实际 API 接入 |
|---|---|---|
| `app/layout.tsx` | 根布局（Header + Footer + 元信息） | — |
| `app/globals.css` | Tailwind v4 主题（`@theme{}`），品牌色 / JPYC 金 / 深色背景 | — |
| `app/page.tsx` | 首页：Hero / 功能介绍 / 使用流程 / 套餐高亮 / 收益模拟 / CTA | ❌ 纯静态 |
| `app/venues/page.tsx` | 店铺列表：搜索 / 过滤 / Skeleton 加载 | ✅ `listVenues()` |
| `app/venues/[venueId]/page.tsx` | 店铺详情：套餐卡片 / 购买弹窗 | ✅ `listPlans()` + `purchasePass()` |
| `app/passes/page.tsx` | 我的通行证：状态过滤标签 / QR 弹窗 / 剩余时间进度条 | ❌ Mock 数据 |
| `app/sessions/page.tsx` | 会话页：实时计时器（1s 刷新）/ 超时费计算 / 结账 | ⚠️ 部分（仅 checkout） |
| `app/compute/page.tsx` | 算力市场：节点卡片 / 提交任务弹窗 / 我的任务 / 收益看板 | ❌ Mock 数据 |
| `app/merchant/compute/page.tsx` | 商户节点管理：启用/停用切换 / 编辑弹窗 / 收益模拟 / 4步引导 | ❌ Mock 数据 |
| `components/layout/Header.tsx` | 滚动感知背景 / 移动端汉堡菜单 / JPYC 余额显示 | ✅ `getBalance()` |
| `components/layout/Footer.tsx` | 链接分组 / Polygon 网络标识 / 合规注记 | — |
| `components/HealthBadge.tsx` | API 状态标签（日语文案） | ✅ `health()` |
| `services/nodestay.ts` | `createNodeStayClient()` 工厂函数 | — |
| `services/config.ts` | baseUrl 配置 | — |

#### 测试（Vitest）

| 文件 | 测试数 | 状态 |
|---|---|---|
| `app/page.test.tsx` | 2 | ✅ |
| `app/layout.test.tsx` | 2 | ✅ |
| `components/HealthBadge.test.tsx` | 3 | ✅ |
| `vitest.config.ts` | 覆盖率阈值 80%，esbuild jsxInject 解决 ESM 冲突 | ✅ |

---

### 4. 后端 API（`apps/api/`）— ✅ 框架完整，⚠️ 数据仅在内存

**已实现的端点（共 16 个）**

| 路径 | 方法 | 控制器 | 状态 |
|---|---|---|---|
| `/v1/health` | GET | health.controller.ts | ✅ |
| `/v1/venues` | GET | venues.controller.ts | ✅ |
| `/v1/venues/:id/plans` | GET | venues.controller.ts | ✅ |
| `/v1/passes/purchase` | POST | passes.controller.ts | ✅（幂等） |
| `/v1/passes/:id/transfer` | POST | passes.controller.ts | ✅（Feature Flag） |
| `/v1/sessions/checkin` | POST | sessions.controller.ts | ✅ |
| `/v1/sessions/checkout` | POST | sessions.controller.ts | ⚠️ 计费硬编码 |
| `/v1/user/balance` | GET | user.controller.ts | ❌ 返回硬编码 0 |
| `/v1/identity/verify` | POST | identity.controller.ts | ✅（框架） |
| `/v1/merchant/venues` | POST | merchant.controller.ts | ✅ |
| `/v1/merchant/venues/:id/plans` | PUT | merchant.controller.ts | ✅ |
| `/v1/merchant/venues/:id/seats` | POST | merchant.controller.ts | ✅ |
| `/v1/merchant/venues/:id/compute/enable` | POST | merchant.controller.ts | ✅ |
| `/v1/disputes` | POST | merchant.controller.ts | ✅（框架） |
| `/v1/compute/nodes` | GET | compute.controller.ts | ✅（Feature Flag） |
| `/v1/compute/jobs` | POST | compute.controller.ts | ✅（Feature Flag） |
| `/v1/compute/jobs/:id` | GET | compute.controller.ts | ✅（Feature Flag） |

---

### 5. 工程配置 — ✅

| 文件 | 内容 |
|---|---|
| `package.json`（根） | npm workspaces（apps/* + packages/*） |
| `tsconfig.base.json` | 共享 TypeScript 配置 |
| `docker-compose.yml` | PostgreSQL 16 + Redis 7（已定义，**未实际接入**） |
| `.gitignore` | 已排除 `.env`、`node_modules`、`artifacts` 等 |
| `README.md` | 日语版完整说明文档 |

---

## 二、未完成部分（详细列表）

### 1. 后端 API 层

---

#### 1-1. 数据持久化（最高优先级）

**路径**：`apps/api/src/modules/v1/services/store.service.ts`

**现状**：所有业务数据存储在 `Map<string, Record>` 内存结构中，重启即丢失。

```typescript
// 当前实现（7个 Map，全部内存）
private readonly venues   = new Map<Id, VenueRecord>();
private readonly plans    = new Map<Id, PricePlanRecord>();
private readonly passes   = new Map<Id, AccessPassRecord>();
private readonly sessions = new Map<Id, SessionRecord>();
private readonly computeNodes = new Map<Id, ComputeNodeRecord>();
private readonly computeJobs  = new Map<Id, ComputeJobRecord>();
private readonly disputes     = new Map<Id, DisputeRecord>();
```

**需要做**：
- [ ] `apps/api/package.json` 添加 ORM（TypeORM 或 Prisma）
- [ ] 连接 `docker-compose.yml` 中的 PostgreSQL（`nodestay:nodestay@localhost:5432/nodestay`）
- [ ] 为每个 Record 类型创建 Entity / Model
- [ ] 编写数据库 Migration 文件（建议路径：`apps/api/src/migrations/`）
- [ ] 将 `StoreService` 的 7 个 Map 替换为数据库查询
- [ ] 设置 Redis（`localhost:6379`）用于幂等键缓存（`IdempotencyService` 当前也是内存 Map）

---

#### 1-2. 用户余额接口

**路径**：`apps/api/src/modules/v1/controllers/user.controller.ts`

**现状**：

```typescript
// MVP 注记：返回硬编码 0，未接入链上/钱包
async getBalance() {
  return { currency: 'JPYC', balanceMinor: 0, depositHeldMinor: 0 };
}
```

**需要做**：
- [ ] 确定钱包方案（托管式 Custodial 还是非托管 Non-custodial）
- [ ] Custodial：在数据库中维护 JPYC 余额台帐，`getBalance()` 读 DB
- [ ] Non-custodial：集成 ethers.js，调用链上 ERC-20 `balanceOf(address)`
- [ ] `apps/api/package.json` 添加 `ethers`（Non-custodial 方案）

---

#### 1-3. 结账计费逻辑

**路径**：`apps/api/src/modules/v1/controllers/sessions.controller.ts`

**现状**：

```typescript
// 返回硬编码 0，实际计费未实现
return {
  sessionId, usedMinutes: 0,
  charges: { baseMinor: 0, overtimeMinor: 0, totalMinor: 0 }
};
```

**同时**，前端 `apps/web/src/app/sessions/page.tsx` 自己在客户端计算超时费（逻辑不应在客户端）。

**需要做**：
- [ ] 在 `LedgerService`（`apps/api/src/modules/v1/services/ledger.service.ts`）实现真实计费算法：
  - 0–10 分钟：免费
  - 11–30 分钟：100 JPYC / 10 分钟
  - 31–60 分钟：150 JPYC / 10 分钟
  - 60 分钟以上：自动套餐升级
- [ ] `sessions.controller.ts` 的 checkout 端点调用 `LedgerService.calcCharges()`
- [ ] 调用 `AccessPassNFT.consumePass(tokenId, usedMinutes)`（链上消费）
- [ ] 调用 `DepositVault.captureDeposit()` + `releaseDeposit()`（实际划款）

---

#### 1-4. 本人确认（KYC）

**路径**：`apps/api/src/modules/v1/controllers/identity.controller.ts`

**现状**：框架已有，接受 `{ userId, venueId }` 请求，返回 `{ identityVerificationId }`，但实际验证逻辑为空。

**需要做**：
- [ ] 对接第三方 KYC API（例：TRUSTDOCK、Liquid、Jumio）
- [ ] 实现 `apps/api/src/modules/v1/services/identity.service.ts`（当前不存在）
- [ ] 存储验证结果到数据库（`IdentityVerificationRecord`）
- [ ] 在 `sessions.controller.ts` 的 checkin 流程中校验 KYC 状态

---

#### 1-5. 认证与授权

**现状**：所有 API 端点均无鉴权，任何人都可以调用。

**需要做**：
- [ ] `apps/api/package.json` 添加 `@nestjs/jwt`、`@nestjs/passport`、`passport-jwt`
- [ ] 实现 `AuthModule`（建议路径：`apps/api/src/modules/auth/`）
- [ ] 实现 JWT 登录端点：`POST /v1/auth/login`
- [ ] 添加 `JwtAuthGuard` 装饰器到需要鉴权的路由
- [ ] 区分普通用户 / 商户 / 运营人员的角色（RBAC）

---

#### 1-6. 算力市场与合约集成

**路径**：`apps/api/src/modules/v1/controllers/compute.controller.ts`

**现状**：节点和 Job 数据存于内存 `StoreService`，未与已部署的 `ComputeMarket.sol` 交互。

**需要做**：
- [ ] 后端调用 `ComputeMarket.registerNode()` 完成节点上链
- [ ] `submitJob` 端点调用 `ComputeMarket.submitJob()`（触发链上 JPYC 托管）
- [ ] `completeJob` 端点调用 `ComputeMarket.completeJob()`（触发 75/25 自动分配）
- [ ] 为 Webhook 或事件监听实现 `ComputeMarket` 事件订阅（`JobCompleted`、`JobFailed`）

---

#### 1-7. 日志与错误处理

**现状**：无结构化日志，错误直接 `throw new Error()`。

**需要做**：
- [ ] `apps/api/package.json` 添加 `winston` 或 `pino`
- [ ] 添加全局异常过滤器 `AllExceptionsFilter`
- [ ] 为关键操作（购买、结账、争议）添加审计日志记录

---

### 2. 前端页面层

---

#### 2-1. 通行证页面（`/passes`）

**路径**：`apps/web/src/app/passes/page.tsx`

**现状**：完全使用本地 Mock 数据，未接入任何 API。

```typescript
// 文件顶部的硬编码 Mock 数据
const MOCK_PASSES: Pass[] = [
  { passId: 'pass_001', planName: '3時間パック', venueId: 'venue_demo',
    venueName: 'デモ店舗', status: 'ACTIVE', remainingMinutes: 180,
    expiresAt: '2024-12-31T23:59:59Z', transferable: true },
  { passId: 'pass_002', planName: 'ナイトパック',  status: 'IN_USE', ... },
  { passId: 'pass_003', planName: '3時間パック',   status: 'CONSUMED', ... },
  { passId: 'pass_004', planName: 'デイタイムパック', status: 'EXPIRED', ... },
];
```

**需要做**：
- [ ] `packages/api-client/src/nodestayClient.ts` 添加 `listPasses()` 方法：`GET /v1/passes`
- [ ] `apps/api/src/modules/v1/controllers/` 添加 `passes.controller.ts` 的 `GET /v1/passes` 端点
- [ ] 替换 `MOCK_PASSES` 为 API 调用 + 加载状态 + 错误状态
- [ ] QR 码实际内容应是 `passId` 签名串，而不是占位字符串

---

#### 2-2. 会话页面（`/sessions`）

**路径**：`apps/web/src/app/sessions/page.tsx`

**现状**：
- 计费逻辑在客户端（不安全，以服务端为准）
- 当前会话数据（`sessionId`、`passId`）是硬编码的初始 state
- 结账后导航为假跳转

```typescript
// 当前硬编码的初始状态
const [session] = useState({
  sessionId: 'sess_demo_001',
  passId: 'pass_001',
  seatId: 'A-12',
  ...
});
```

**需要做**：
- [ ] 会话状态从 URL 参数或全局状态（Zustand / Context）读取真实 `sessionId`
- [ ] 移除客户端计费计算，改为调用 `checkoutSession()` 后使用服务端返回值
- [ ] 添加 `GET /v1/sessions/:id` 端点供页面轮询当前状态（`api-client` 也需添加方法）
- [ ] 结账完成后跳转到真实的结算详情页

---

#### 2-3. 算力市场页面（`/compute`）

**路径**：`apps/web/src/app/compute/page.tsx`

**现状**：三个 Tab（算力租用 / 我的任务 / 收益看板）全部使用 Mock。

```typescript
// Mock 节点数据（4条）
const MOCK_NODES: ComputeNode[] = [
  { nodeId: 'node_001', venueName: 'アキバネットカフェ',
    gpuModel: 'RTX 4090', vram: 24, pricePerHour: 800, ... },
  ...
];
// Mock 任务数据（5条）
const MOCK_JOBS: Job[] = [
  { jobId: 'job_001', nodeId: 'node_001', status: 'RUNNING',
    estimatedHours: 4, depositMinor: 3200, ... },
  ...
];
```

**需要做**：
- [ ] `api-client` 添加方法：
  - `listComputeNodes()` → `GET /v1/compute/nodes`
  - `listMyJobs()` → `GET /v1/compute/jobs?requester=me`
  - `submitComputeJob(input, key)` → `POST /v1/compute/jobs`（已有端点，需客户端方法）
- [ ] 替换 `MOCK_NODES` / `MOCK_JOBS` 为 API 调用
- [ ] 提交任务弹窗需要先调用 `token.approve(ComputeMarket, amount)` 再调 `submitJob`（链上操作）
- [ ] 收益看板数据来源需定义（链上 event 聚合 or 后端统计接口）

---

#### 2-4. 商户节点管理页面（`/merchant/compute`）

**路径**：`apps/web/src/app/merchant/compute/page.tsx`

**现状**：全部 Mock，商户身份未经验证。

```typescript
const MOCK_VENUE_NAME = 'アキバネットカフェ 秋葉原本店';
const MOCK_NODES: MerchantNode[] = [
  { nodeId: 'node_001', name: 'Gaming PC #1',
    gpuModel: 'RTX 4090', status: 'active', pricePerHour: 800,
    todayEarnings: 3200, totalEarnings: 48000, ... },
  ...
];
```

**需要做**：
- [ ] `api-client` 添加方法：
  - `listMerchantNodes(venueId)` → `GET /v1/merchant/venues/:id/compute/nodes`
  - `updateComputeNode(nodeId, input)` → `PUT /v1/merchant/compute/nodes/:id`（端点需新增）
  - `toggleComputeNode(nodeId, active)` → `PATCH /v1/merchant/compute/nodes/:id/status`（端点需新增）
- [ ] `merchant.controller.ts` 补充上述 2 个端点
- [ ] 节点启用操作需同步调用 `ComputeMarket.activateNode()` / `deactivateNode()`（链上）
- [ ] 节点注册时需先调用 `ComputeMarket.registerNode()`（需 operator 权限）
- [ ] 收益数据需新增统计端点：`GET /v1/merchant/venues/:id/compute/earnings`

---

#### 2-5. 钱包连接（全局）

**路径**：`apps/web/src/components/layout/Header.tsx`

**现状**：`ウォレット接続` 按钮无任何点击逻辑，为静态占位按钮。

```tsx
<button className="btn-primary py-2 text-sm">
  ウォレット接続  {/* ← 无 onClick，无钱包集成 */}
</button>
```

**需要做**：
- [ ] 集成钱包连接库：RainbowKit / wagmi / ConnectKit（推荐 wagmi + RainbowKit）
- [ ] `apps/web/package.json` 添加 `wagmi`、`@rainbow-me/rainbowkit`、`viem`
- [ ] 连接后显示地址缩写 + Polygon Amoy 网络切换提示
- [ ] 将 `getBalance()` 改为从链上读取已连接钱包的 JPYC 余额

---

### 3. 前后端接口集成

以下接口在后端已有实现，但 `api-client` 和前端均未调用：

| 端点 | 后端 | api-client 方法 | 前端使用 |
|---|---|---|---|
| `GET /v1/passes` | ❌ 端点不存在 | ❌ 无 `listPasses()` | ❌ Mock |
| `GET /v1/sessions/:id` | ❌ 端点不存在 | ❌ 无 `getSession()` | ❌ 硬编码 |
| `POST /v1/sessions/checkin` | ✅ | ✅ `checkinSession()` | ❌ 前端未调用 |
| `POST /v1/identity/verify` | ✅（框架） | ✅ `verifyIdentity()` | ❌ 前端未调用 |
| `GET /v1/compute/nodes` | ✅（Feature Flag） | ❌ 无 `listComputeNodes()` | ❌ Mock |
| `POST /v1/compute/jobs` | ✅（Feature Flag） | ❌ 无 `submitComputeJob()` | ❌ Mock |
| `GET /v1/compute/jobs/:id` | ✅（Feature Flag） | ❌ 无 `getComputeJob()` | ❌ Mock |
| `POST /v1/merchant/venues/:id/compute/enable` | ✅ | ❌ 无对应方法 | ❌ Mock |
| `PUT /v1/merchant/venues/:id/plans` | ✅ | ❌ 无 `updatePlan()` | ❌ 未实现 |

---

### 4. 基础设施 / 数据持久化

#### 4-1. 数据库（最关键缺口）

**现状**：`docker-compose.yml` 定义了 PostgreSQL + Redis，但代码层完全未使用。

```yaml
# docker-compose.yml（已存在，未接入）
postgres:
  image: postgres:16
  environment:
    POSTGRES_USER: nodestay
    POSTGRES_PASSWORD: nodestay
    POSTGRES_DB: nodestay
  ports: ["5432:5432"]

redis:
  image: redis:7
  ports: ["6379:6379"]
```

**需要做**：
- [ ] `apps/api/package.json` 添加 `@nestjs/typeorm`、`typeorm`、`pg`（或 Prisma）
- [ ] 创建 `apps/api/src/database/` 目录，添加连接配置
- [ ] 创建数据库 Entity（对应 `StoreService` 的 7 种 Record）：
  - `apps/api/src/entities/venue.entity.ts`
  - `apps/api/src/entities/plan.entity.ts`
  - `apps/api/src/entities/access-pass.entity.ts`
  - `apps/api/src/entities/session.entity.ts`
  - `apps/api/src/entities/compute-node.entity.ts`
  - `apps/api/src/entities/compute-job.entity.ts`
  - `apps/api/src/entities/dispute.entity.ts`
- [ ] 编写 Migration（路径：`apps/api/src/migrations/`）
- [ ] `StoreService` 重构为各自的 Repository Service
- [ ] `IdempotencyService` 改用 Redis（当前是内存 Map）

#### 4-2. 环境变量（后端）

`apps/api/` 目前**没有** `.env` 文件，也没有 `.env.example`。

**需要做**：
- [ ] 创建 `apps/api/.env.example`，包含：
  ```env
  PORT=3001
  DATABASE_URL=postgresql://nodestay:nodestay@localhost:5432/nodestay
  REDIS_URL=redis://localhost:6379
  JWT_SECRET=
  ENABLE_COMPUTE_MARKET=true
  ENABLE_TRANSFER_MARKET=false
  # 合约地址（Amoy）
  ACCESS_PASS_NFT_ADDRESS=0x1cC076ed23D6c2e5dD37aAe28b9a21aA9d46eC3a
  DEPOSIT_VAULT_ADDRESS=0xb2a5A4354F9b53089893b2aF9840a29cEeEe84fD
  COMPUTE_MARKET_ADDRESS=0x159E85E8f296B9a3A95A9FFaE59Ae7aF4358Ee77
  OPERATOR_PRIVATE_KEY=
  ```
- [ ] `apps/api/package.json` 添加 `@nestjs/config`、`dotenv`

#### 4-3. 链上事件监听

**现状**：完全没有事件监听机制，合约状态变化无法通知后端。

**需要做**：
- [ ] 实现 `apps/api/src/modules/blockchain/` 模块
- [ ] 订阅 `AccessPassNFT` 事件：`PassMinted`、`PassConsumed`
- [ ] 订阅 `ComputeMarket` 事件：`JobCompleted`、`JobFailed`、`JobCancelled`
- [ ] 事件触发后同步数据库状态

---

### 5. 文案与文档

#### 5-1. 前端文案（需补充内容的位置）

| 文件 | 位置 | 问题 |
|---|---|---|
| `app/page.tsx` | 价格章节 | 具体套餐价格为占位示例（¥500/3h），需与商务确认后替换 |
| `app/page.tsx` | 收益模拟章节 | 算力收益数字（¥45,000/月）为示例值，应改为可计算的动态值 |
| `app/compute/page.tsx` | 节点 GPU 规格 | Mock 数据中 GPU 型号（RTX 4090）为示例，上线前需真实数据 |
| `app/merchant/compute/page.tsx` | 导入引导 Step 01–04 | 文案已写，但 Step 03「ノードを接続」的具体硬件要求未定义 |
| `components/layout/Footer.tsx` | 服务条款 / 隐私政策链接 | `href="#"` 占位，对应页面（`/terms`、`/privacy`）未创建 |
| `components/layout/Footer.tsx` | 资金决算法表记 | 合规文案为模板，需法务审查后确认 |

#### 5-2. 缺失页面（有链接但无页面）

| 链接来源 | 目标路径 | 页面是否存在 |
|---|---|---|
| Footer | `/terms` | ❌ |
| Footer | `/privacy` | ❌ |
| Footer | `/tokushoho` | ❌（特定商取引法表记） |
| Footer | `/compliance` | ❌ |
| Footer | `/help` | ❌ |
| Footer | `/contact` | ❌ |
| Header nav | `/passes` | ✅（已有但 Mock） |
| compute 页 | `/merchant/compute` | ✅（已有但 Mock） |

#### 5-3. API 文档

**现状**：无 Swagger / OpenAPI 文档。

**需要做**：
- [ ] `apps/api/package.json` 添加 `@nestjs/swagger`
- [ ] 在 `main.ts` 初始化 `SwaggerModule`
- [ ] 所有 DTO 添加 `@ApiProperty()` 装饰器
- [ ] 文档访问路径：`/api-docs`（建议仅开发环境开放）

---

## 三、文件路径索引

### 需要新建的文件

```
apps/api/
├── .env.example                              ← 需创建
├── src/
│   ├── database/
│   │   └── database.module.ts               ← 需创建（DB 连接）
│   ├── entities/
│   │   ├── venue.entity.ts                  ← 需创建
│   │   ├── plan.entity.ts                   ← 需创建
│   │   ├── access-pass.entity.ts            ← 需创建
│   │   ├── session.entity.ts                ← 需创建
│   │   ├── compute-node.entity.ts           ← 需创建
│   │   ├── compute-job.entity.ts            ← 需创建
│   │   └── dispute.entity.ts               ← 需创建
│   ├── migrations/
│   │   └── 001_init.ts                      ← 需创建
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts               ← 需创建
│   │   │   ├── auth.controller.ts           ← 需创建（POST /v1/auth/login）
│   │   │   ├── auth.service.ts              ← 需创建
│   │   │   └── jwt.strategy.ts             ← 需创建
│   │   ├── blockchain/
│   │   │   ├── blockchain.module.ts         ← 需创建
│   │   │   └── event-listener.service.ts   ← 需创建
│   │   └── v1/
│   │       ├── services/
│   │       │   └── identity.service.ts      ← 需创建（当前 controller 直接返回）
│   │       └── controllers/
│   │           └── （passes GET 端点需补充）

apps/web/src/app/
├── terms/
│   └── page.tsx                             ← 需创建
├── privacy/
│   └── page.tsx                             ← 需创建
├── tokushoho/
│   └── page.tsx                             ← 需创建
├── compliance/
│   └── page.tsx                             ← 需创建
├── help/
│   └── page.tsx                             ← 需创建
└── contact/
    └── page.tsx                             ← 需创建
```

### 需要修改的文件

```
apps/api/src/modules/v1/
├── controllers/
│   ├── user.controller.ts        ← 替换硬编码余额
│   ├── sessions.controller.ts    ← 实现真实计费逻辑
│   ├── merchant.controller.ts    ← 补充 PUT/PATCH 节点端点
│   └── passes.controller.ts      ← 补充 GET /v1/passes 端点
└── services/
    ├── store.service.ts          ← 替换为数据库实现
    ├── ledger.service.ts         ← 实现真实计费算法
    └── idempotency.service.ts    ← 改用 Redis

packages/api-client/src/nodestayClient.ts   ← 补充 7 个缺失方法

apps/web/src/app/
├── passes/page.tsx               ← 替换 MOCK_PASSES
├── sessions/page.tsx             ← 移除客户端计费逻辑
├── compute/page.tsx              ← 替换 MOCK_NODES / MOCK_JOBS
└── merchant/compute/page.tsx     ← 替换 MOCK_NODES / MOCK_VENUE_NAME

apps/web/src/components/layout/Header.tsx   ← 实现钱包连接
```

---

## 四、接口清单（已有 vs 缺失）

### `packages/api-client/src/nodestayClient.ts` 需补充的方法

| 方法名 | HTTP | 路径 | 说明 |
|---|---|---|---|
| `listPasses()` | GET | `/v1/passes` | 获取当前用户所有通行证 |
| `getSession(sessionId)` | GET | `/v1/sessions/:id` | 获取会话状态 |
| `listComputeNodes(filter?)` | GET | `/v1/compute/nodes` | 算力节点列表（已有端点） |
| `submitComputeJob(input, key)` | POST | `/v1/compute/jobs` | 提交算力任务（已有端点） |
| `getComputeJob(jobId)` | GET | `/v1/compute/jobs/:id` | 获取任务状态（已有端点） |
| `listMerchantNodes(venueId)` | GET | `/v1/merchant/venues/:id/compute/nodes` | 商户节点列表 |
| `updateComputeNode(nodeId, input)` | PUT | `/v1/merchant/compute/nodes/:id` | 更新节点配置 |
| `toggleComputeNode(nodeId, active)` | PATCH | `/v1/merchant/compute/nodes/:id/status` | 启用/停用节点 |
| `getMerchantEarnings(venueId)` | GET | `/v1/merchant/venues/:id/compute/earnings` | 收益统计 |

### 后端需新增的端点

| 路径 | 方法 | 控制器 |
|---|---|---|
| `/v1/passes` | GET | `passes.controller.ts` |
| `/v1/sessions/:id` | GET | `sessions.controller.ts` |
| `/v1/auth/login` | POST | `auth.controller.ts`（需新建） |
| `/v1/merchant/venues/:id/compute/nodes` | GET | `merchant.controller.ts` |
| `/v1/merchant/compute/nodes/:id` | PUT | `merchant.controller.ts` |
| `/v1/merchant/compute/nodes/:id/status` | PATCH | `merchant.controller.ts` |
| `/v1/merchant/venues/:id/compute/earnings` | GET | `merchant.controller.ts` |

---

## 五、下一步优先级建议

### P0 — 必须（影响核心流程）

1. **数据库接入**：`StoreService` → PostgreSQL，`IdempotencyService` → Redis
2. **结账计费**：`LedgerService` 实现真实算法，移除前端客户端计算
3. **余额接口**：`getBalance()` 接入链上或 DB 台账

### P1 — 高优先（影响完整性）

4. **认证授权**：JWT + Passport，保护所有非公开端点
5. **前端 API 集成**：`passes` / `compute` / `merchant/compute` 页面接入真实接口
6. **钱包连接**：Header 的 `ウォレット接続` 按钮实现（wagmi + RainbowKit）

### P2 — 中优先（上线前需要）

7. **法律页面**：`/terms`、`/privacy`、`/tokushoho`
8. **KYC 集成**：identity.service.ts 对接真实验证服务
9. **链上事件监听**：blockchain 模块，同步合约状态到数据库
10. **Swagger 文档**：API 文档自动生成

### P3 — 低优先（优化项）

11. 前端错误边界和加载状态（`passes` / `compute` 等页面）
12. 结账完成页（`/sessions/[id]/complete`）
13. 收益看板真实数据聚合
14. E2E 测试（Playwright）
