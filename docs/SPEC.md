# Interface Specification (SPEC)

> **用途**：定义各层边界接口，供并行开发使用。即使某一层的实现尚未完成，其他层也可依照本文件中的类型与契约独立推进。  
> **版本**：链上结算（Smart Contracts）+ 前端 IndexedDB 索引（Indexed）+ HTTP api-client 收口  
> **参考**：`docs/TODO.md`、`packages/domain/src/*`、`packages/contracts/contracts/*.sol`、`packages/api-client/src/nodestayClient.ts`

---

## 0. 阅读指引

| 符号 | 含义 |
|------|------|
| ✅ 已实现 | 当前代码库中已存在，本 SPEC 仅做声明 |
| 🆕 新增 | 新增，需要实现 |
| 🔧 修改 | 已有实现需要改造/迁移/收口 |

**层级依赖规则**：

```
View  ──依赖──►  Controller  ──依赖──►  Service  ──依赖──►  Model (Store)
                │                        │
                │                        ├──► @nodestay/api-client (HTTP)
                │                        └──► Indexed (IndexedDB)
                │
                └──► Model (Store)（只读：订阅状态、暴露给 View）
```

- **View**：只依赖 Controller，不直接调 Service、不直接读 Store。
- **Controller**：依赖 Service + Model（Store）。只读 Store、调用 Service 方法；不直接写 Store，不直接调 API/IndexedDB。
- **Service**：依赖 Model（Store）+ api-client + Indexed/Query。负责拉数、转换、**并写入 Store**（或从 Store 读缓存）；不感知 React/Controller。
- **Model (Store)**：被 Service 读/写；被 Controller 只读。权威链上数据在 IndexedDB；Store 存 UI 状态与展示用缓存，可清空重建。

**多数据源规则（本项目关键）**：

```
Service ──► @nodestay/api-client (HTTP) ──► apps/api (REST)
Service ──► Indexed (IndexedDB) ─────────► Polygon RPC (Smart Contracts + Events)
```

硬约束：

- 链上的列表/聚合数据（nodes/jobs/passes 等）必须进入前端 IndexedDB（indexed）形成 Read Model。
- UI 默认读 IndexedDB；仅在“缺失/同步中/单条详情补齐”时允许回退 RPC 单查。

---

## 1. 术语与命名约定（重要）

本仓库同时存在两类“Contract”，为避免混淆统一约定如下：

- **API Contract**：指 `apps/api` 的 HTTP 接口契约（请求/响应类型 + zod schema）。
- **Smart Contract**：指 `packages/contracts/contracts/*.sol` 部署到链上的合约（Polygon / Amoy）。
- **Indexed / Indexer**：指前端 IndexedDB 的链上事件派生读模型，以及同步器（logs → upsert）。
- **NodeStay Client**：指 `@nodestay/api-client`（HTTP SDK）。

文档中若写 **Contract** 且无特别说明，默认指 **API Contract**；涉及链上则明确写 **Smart Contract**。

---

## 2. 整体架构

```
[Frontend: apps/web]
  View ──► Controller ──► Service ──► Model (Store)
              │               │
              │ 只读 Store     ├──► @nodestay/api-client (HTTP) ──► apps/api
              │               └──► Indexed (IndexedDB) ──► Polygon RPC (Smart Contracts + Events)
              │
              └──► Model (Store)（只读）
```

要点：

- **Service 操作 Model**：拉数（HTTP / IndexedDB）后由 Service 写入 Store；Controller 只读 Store 并调用 Service 方法，保持 Controller 薄、复用集中。
- **链上是“最小可验证状态 + 事件”**；面向 UI 的列表/聚合查询由 IndexedDB Read Model 承载；Store 存展示用缓存与 UI 状态，可清空重建。
- **HTTP API 与链上并存**：HTTP 负责链下业务编排；链上负责可验证权益与资金流（Pass/Vault/ComputeMarket）。

---

## 3. 共享领域类型（Domain Types）✅

> 文件：`packages/domain/src/*`（由 `packages/domain/src/index.ts` 统一 export）

领域类型以 **zod schema + infer type** 方式提供，供前后端共用（减少重复定义与漂移）。

### 3.1 基础类型 ✅

- `Money` / `CurrencyCode`：`packages/domain/src/money.ts`
- `IdempotencyKey`：`packages/domain/src/idempotency.ts`

### 3.2 日本合规（Venue / Identity / Session）✅

- `Venue` / `RegulationProfile`：`packages/domain/src/venue.ts`
- `IdentityVerification`：`packages/domain/src/identity.ts`
- `Session`：`packages/domain/src/session.ts`

### 3.3 账本域（Ledger）✅

- `LedgerAccount` / `LedgerTransaction` / `LedgerEntry` / `OutboxEvent`：`packages/domain/src/ledger.ts`

### 3.4 Compute 域 ✅

- `ComputeNode` / `ComputeJob`：`packages/domain/src/compute.ts`

> 约定：API Contract 与前端 Model **尽量复用 domain 类型**；若暂时无法复用，必须在 SPEC 中写明映射规则与差异字段。

### 3.5 前端 Model 与 api-client 返回值类型对应表（I2）✅

| api-client 方法 / 返回类型 | 前端 Model（apps/web/src/models/） | 说明 |
|---------------------------|-------------------------------------|------|
| `listVenues()` → `Array<{ venueId, name, address, timezone }>` | `venue.model.Venue` | 一一对应 |
| `listPlans(venueId)` → `Array<{ planId, venueId, name, baseDurationMinutes, basePriceMinor, depositRequiredMinor }>` | `venue.model.Plan` | 一一对应 |
| `verifyIdentity()` → `{ identityVerificationId }` | `identity.model.IdentityVerification` | 仅 id 时用返回值 |
| `checkinSession()` → `{ sessionId }` | `session.model`（SessionId） | 一一对应 |
| `checkoutSession()` → `JsonObject` | `session.model.CheckOutResult` | Contract 收口后与 Contract 类型一致 |
| `getBalance()` → `{ currency, balanceMinor, depositHeldMinor }` | `user.model.Balance` | 一一对应 |
| `createVenueAsMerchant()` → `{ venueId, name, address, timezone }` | `merchant.model` / Venue | 一一对应 |
| `listComputeNodes()` → `ComputeNodeItem[]`（@nodestay/api-contracts） | `compute.model.ComputeNode` | Service 层将 API 的 nodeId/venueId/seatId/status/pricePerHourMinor 映射或补全为 ComputeNode（缺省由 IndexedDB 补全） |
| `submitComputeJob()` → `SubmitJobResponse`（`{ jobId }`） | `compute.model`（jobId 写入 store） | 一一对应 |
| `getComputeJob()` → `GetJobResponse`（`{ jobId, status }`） | `compute.model.ComputeJob`（部分） | status 与 domain ComputeJobStatus 一致 |
| `cancelComputeJob()` → `CancelJobResponse` | store 更新 job 状态 | 一一对应 |
| `getComputeJobResult()` → `JobResultResponse`（`{ jobId, resultUri }`） | `compute.model`（resultUri） | 一一对应 |
| `purchasePass()` → 依 passes.contract | `pass.model.PurchasePassResult` | 与 API Contract 响应一致 |

类型来源约定：**Compute 相关 HTTP 响应类型** 以 `@nodestay/api-contracts` 为准（与后端 Contract 一致）；前端 Model 为展示与 Store 用，可由 Service 将 api-client 返回值与 IndexedDB 数据合并后写入 Store。

---

## 4. 合约层接口（Smart Contracts）✅

> 合约源：`packages/contracts/contracts/*.sol`  
> 测试：`packages/contracts/test/*.test.ts`

### 4.1 合约清单 ✅

- `AccessPassNFT.sol`：通行证 NFT（ERC721）
- `DepositVault.sol`：押金 Vault（hold/capture/release）
- `ComputeMarket.sol`：算力市场（节点注册 + Job 状态机 + JPYC 托管 + 平台分账）

### 4.2 权限/信任模型（必须显式）✅

三份合约均采用 **Owner + Operator** 的中心化运营模型：

- **Owner**：配置 `operator`（以及 `ComputeMarket.platformFeeRecipient`）
- **Operator**：执行关键写操作（mint/consume/suspend；押金 capture/release；compute job 生命周期）

因此：

- 前端/后端实现需把 **“operator 是受信服务”** 当作系统前提（建议多签、角色分离、审计与轮换）。
- UI/产品文案必须一致表达（例如 Job 状态由 operator 更新；异常由 operator 介入）。

### 4.3 `ComputeMarket`（链上）接口规范 ✅

#### 4.3.1 NodeData（链上最小字段）✅

- `nodeId: bytes32`
- `venueOwner: address`
- `pricePerHourMinor: uint256`（JPYC minor）
- `minBookingHours/maxBookingHours: uint256`
- `active: bool`

#### 4.3.2 Job 状态机 ✅

枚举（与合约一致）：

`PENDING → ASSIGNED → RUNNING → (COMPLETED | FAILED)`，另有 `CANCELLED`（仅 `PENDING/ASSIGNED` 可取消）。

关键语义：

- `submitJob(nodeId, estimatedHours)`：用户 transferFrom → 合约托管 `depositMinor`
- `completeJob(jobId, resultHash)`：operator 完成并分账（75% venue / 25% platform）
- `failJob(jobId)`：operator 标记失败并全额退款
- `cancelJob(jobId)`：requester 或 operator 在 `PENDING/ASSIGNED` 阶段取消并退款

#### 4.3.3 事件（Indexer 输入）✅

Node：

- `NodeRegistered(nodeId, venueOwner, pricePerHourMinor)`
- `NodeUpdated(nodeId)`
- `NodeDeactivated(nodeId)`
- `NodeActivated(nodeId)`

Job：

- `JobSubmitted(jobId, nodeId, requester, depositMinor)`
- `JobAssigned(jobId)`
- `JobStarted(jobId, startedAt)`
- `JobCompleted(jobId, resultHash, venueAmount, platformAmount)`
- `JobFailed(jobId, refundAmount)`
- `JobCancelled(jobId, refundAmount)`

### 4.4 `AccessPassNFT`（链上）接口规范 ✅

运营写操作（operator-only）：

- `mint(to, planId, venueId, durationMinutes, expiresAt, transferable) → tokenId`
- `consumePass(tokenId, usedMinutes)`
- `suspendPass(tokenId)`
- `reactivatePass(tokenId)`

转移限制：

- `transferable=false`：永不可转移
- `transferable=true`：每次转移后 24h 冷却（cooldown）

Indexer 输入事件：

- `PassMinted`
- `PassConsumed`
- `PassSuspended`
- `PassReactivated`
- ERC721 `Transfer`（用于 owner 追踪）

### 4.5 `DepositVault`（链上）接口规范 ✅

- `holdDeposit(amount)`：用户 transferFrom → vault，并累加 `heldBalance[payer]`
- `captureDeposit(payer, to, amount)`：operator 扣减 held 并向商家转账
- `releaseDeposit(payer, amount)`：operator 扣减 held 并退回用户

Indexer 输入事件：

- `DepositHeld`
- `DepositCaptured`
- `DepositReleased`

---

## 5. 前端 IndexedDB（Indexed）链上索引层 🆕

> **硬约束**：链上的数据存储在前端 indexed（IndexedDB）里。  
> 含义：前端维护“事件派生 Read Model”，可随时清空并从链上事件重建。

### 5.0 链上交互栈与 Provider 策略（W3）✅

- **选型**：前端链上读操作（getLogs、getBlockNumber）使用 **viem**（轻量、与 ethers 同源、TypeScript 友好）。写操作（如用户 sign 提交 Job）若需前端发起交易，同样通过 viem 的 `createPublicClient` / `createWalletClient`。
- **Provider 策略**：仅需 HTTP RPC，无需 WebSocket。Indexer 按轮询拉取新区块即可。配置来源：`NEXT_PUBLIC_RPC_URL`（默认 Polygon Amoy 公共 RPC）、`NEXT_PUBLIC_CHAIN_ID`（默认 80002）。
- **合约地址**：`NEXT_PUBLIC_COMPUTE_MARKET_ADDRESS`、`NEXT_PUBLIC_ACCESS_PASS_NFT_ADDRESS`、`NEXT_PUBLIC_DEPOSIT_VAULT_ADDRESS`；缺省时使用 Amoy 测试网已部署地址（见 `apps/web/src/services/config.ts`）。

### 5.1 Read Model 表结构（建议）🆕

最小必需表：

- `chain_sync_state`
- `compute_nodes`
- `compute_jobs`
- `passes`

可选调试表：

- `events`（原始日志，用于 debug / 回放）

建议字段：

```ts
export interface ChainSyncStateRow {
  chainId: number;
  contractAddress: string;
  deploymentBlock: number;
  lastProcessedBlock: number;
  lastFinalizedBlock: number;
  updatedAtIso: string;
  lastError?: string;
}
```

### 5.2 同步策略（事件驱动 + 可恢复）🆕

- **初次同步**：从 `deploymentBlock` 扫 logs 到 head
- **增量同步**：按区块区间拉取 logs，upsert 到 IndexedDB
- **去重键**：`(chainId, txHash, logIndex)` 必须唯一
- **finalityDepth**：仅把 `head - finalityDepth` 之前的块视作 finalized 写入 `lastFinalizedBlock`
- **reorg**：检测回滚后回退到 `lastFinalizedBlock` 重扫

### 5.3 Indexer / Query 接口（供并行开发）🆕

```ts
export interface ChainSyncStatus {
  isSyncing: boolean;
  chainId: number;
  contractAddress: string;
  lastProcessedBlock: number;
  lastFinalizedBlock: number;
  lastError?: string;
}

export interface ChainIndexer {
  start(): Promise<void>;
  stop(): Promise<void>;
  syncOnce(): Promise<void>;
  status(): Promise<ChainSyncStatus>;
}

export interface ComputeReadModelQuery {
  listNodes(): Promise<Array<{
    chainId: number;
    nodeId: string; // bytes32 hex
    venueOwner: string;
    pricePerHourMinor: string;
    minBookingHours: number;
    maxBookingHours: number;
    active: boolean;
    updatedAtBlock: number;
  }>>;

  listJobsByRequester(requester: string): Promise<Array<{
    chainId: number;
    jobId: string; // uint256 as string
    nodeId: string;
    requester: string;
    depositMinor: string;
    estimatedHours: number;
    status: 'PENDING' | 'ASSIGNED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    startedAt?: number;
    endedAt?: number;
    resultHash?: string;
    updatedAtBlock: number;
  }>>;
}
```

---

## 6. API Contract（HTTP）接口（apps/api）✅/🔧

> 现状：Controller 内联 zod（例如 `apps/api/src/modules/v1/controllers/compute.controller.ts`）。  
> 目标：收口到 `apps/api/src/modules/v1/contracts/`（🔧）。

### 6.1 与 `@nodestay/api-client` 对齐的端点 ✅

- `GET /v1/health` → `{ ok: true }`
- `GET /v1/venues` → venues list
- `GET /v1/venues/:venueId/plans` → plans list
- `POST /v1/identity/verify` → `{ identityVerificationId }`
- `POST /v1/sessions/checkin` → `{ sessionId }`
- `POST /v1/sessions/checkout` + header `idempotency-key` →（🔧）明确响应类型
- `GET /v1/user/balance` → `{ currency: 'JPYC'; balanceMinor; depositHeldMinor }`
- `POST /v1/merchant/venues` → create venue

### 6.2 Compute（链下编排 API）✅/🔧

> ⚠️ 与链上 `ComputeMarket` 不同：此层用于提交任务参数与编排，不承担链上托管与结算。

- `GET /v1/compute/nodes`
- `POST /v1/compute/jobs`
- `GET /v1/compute/jobs/:jobId`
- `POST /v1/compute/jobs/:jobId/cancel`
- `GET /v1/compute/jobs/:jobId/result`

（🔧）需要在 Contract 中明确“链下 jobId”与“链上 jobId”的关联字段（例如 `chainJobId` / `txHash` / `resultHash`）。

---

## 7. Service 层接口

**职责边界**：Service 层 **操作 Model（Store）**——从 api-client / IndexedDB 拉数并**写入 Store**（或读 Store 缓存）；Controller 只读 Store 并调用 Service 方法，不直接写 Store。Service 不感知 React/Controller。

### 7.1 `@nodestay/api-client`（HTTP SDK）✅/🔧

> 文件：`packages/api-client/src/nodestayClient.ts`

职责：

- 统一 `baseUrl`、`fetch` 调用、JSON 解析与错误处理
- 统一幂等键规范化（`normalizeIdempotencyKey`）
- 可注入 `fetchImpl` 便于测试

要求（🔧）：

- compute 相关 HTTP 调用也应收口到 `NodeStayClient`（目前尚未实现）。
- 错误语义建议升级为结构化错误（包含 status 与 message）。

### 7.2 Chain Index Services 🆕

Service 层必须对外暴露：

- 同步控制：start/stop/syncOnce/status
- Read Model 查询：listNodes/listMyJobs/listPasses 等（读 IndexedDB）
- **写 Store**：拉取/转换后的数据由 Service 写入 Model（Store），供 Controller 只读

接口示意：

```ts
export interface ChainSyncService {
  start(): Promise<void>;
  stop(): Promise<void>;
  syncOnce(): Promise<void>;
  status(): Promise<ChainSyncStatus>;
}

export interface ComputeChainService {
  listNodes(): Promise<import('@nodestay/domain').ComputeNode[]>;
  listMyJobs(requesterAddress: string): Promise<import('@nodestay/domain').ComputeJob[]>;
}
```

---

## 8. Controller 层接口（Hook）

Controller 是 Hook，向 View 暴露数据与操作函数；**只读 Model（Store）**、调用 Service 方法（建议通过 Context 注入），**不直接写 Store**（写 Store 由 Service 完成）。

### 8.1 `useComputePage`（🆕 建议契约）

```ts
export interface UseComputePageReturn {
  nodes: import('@nodestay/domain').ComputeNode[];
  myJobs: import('@nodestay/domain').ComputeJob[];
  isLoading: boolean;
  error: string | null;

  // UI state
  taskFilter: 'ALL' | 'ML_TRAINING' | 'RENDERING' | 'ZK_PROVING' | 'GENERAL';
  availableOnly: boolean;
  bookingNodeId: string | null;

  // actions
  refresh(): Promise<void>;
  openBooking(nodeId: string): void;
  closeBooking(): void;
  submitJob(params: { nodeId: string; estimatedHours: number; taskType: string; taskSpec: any }): Promise<void>;
  cancelJob(jobId: string): Promise<void>;
}
```

### 8.2 `useChainSyncStatus`（🆕）

用于显示同步进度（header badge）并提供“手动同步”入口：

- `status: ChainSyncStatus`
- `syncOnce(): Promise<void>`

---

## 9. Model 层接口（Zustand Store + IndexedDB）🔧/🆕

**读写约定**：

- **Service 写、Controller 只读**：拉数与转换由 Service 完成，Service 将结果写入 Store；Controller 仅订阅 Store 并暴露给 View。
- 链上 nodes/jobs/passes 的权威数据在 IndexedDB Read Model；Store 存 UI state、同步状态与展示用缓存，可清空重建。
- IndexedDB 可清空重建；Store 重启后可从 IndexedDB 或 Service 重新 hydrate。

建议拆分：

- `compute.store`：筛选条件/选中节点/弹窗/提交状态、以及 Service 写入的 nodes/jobs 缓存
- `chainSync.store`：同步状态、错误、最后处理块

---

## 10. View 层接口（Component 约束）

View 层不含业务逻辑。所有计算、验证、副作用均在 Controller / Service 中完成；View 组件通过 Hook 获取状态与 handler，只负责渲染与事件转发。

---

## 11. 错误类型扩展（建议）🆕

建议 Service 层抛结构化错误，Controller 决定如何映射为 UI toast/banner：

```ts
export type AppErrorCode =
  | 'API_BAD_REQUEST'
  | 'API_NOT_FOUND'
  | 'API_NOT_IMPLEMENTED'
  | 'API_UNAVAILABLE'
  | 'CHAIN_SYNC_FAILED'
  | 'CHAIN_RPC_FAILED'
  | 'CHAIN_REORG';

export class AppError extends Error {
  code: AppErrorCode;
  detail?: unknown;
  constructor(code: AppErrorCode, message: string, detail?: unknown) {
    super(message);
    this.code = code;
    this.detail = detail;
  }
}
```

---

## 12. 跨层数据流速查表

| 操作 | View | Controller | Service | 数据流 |
|------|------|-----------|---------|-------|
| 门店列表 | `venues/page` | `useVenuesPage`（读 Store） | `VenueService.listVenues` → **写 Store** | HTTP → Store |
| Compute 节点列表（权威） | `compute/page` | `useComputePage`（读 Store） | `ComputeChainService.listNodes` → **写 Store** | IndexedDB → Store |
| 提交 compute job（编排参数） | modal submit | `useComputePage.submitJob` | `ComputeHttpService.submitJob`（或 NodeStayClient） | HTTP |
| 展示 job 状态（权威） | my jobs list | `useComputePage`（读 Store） | `ComputeChainService.listMyJobs` → **写 Store** | IndexedDB → Store |
| 链上同步状态 | header badge | `useChainSyncStatus`（读 Store） | `ChainSyncService.status/syncOnce` → **写 Store** | Indexer → Store |

---

## 13. 实现顺序建议（可并行）

| Track | 内容 | 前置依赖 | 状态 |
|-------|------|---------|------|
| A | apps/api：抽离 API Contract（contracts 目录 + 替换 Controller 内联 zod） | 无 | 🔧 |
| B | api-client：与 API Contract 对齐（补齐 compute 方法、错误语义） | A | 🔧 |
| C | IndexedDB：DB schema + Indexer（ComputeMarket/Pass/Vault 事件同步 + reorg/finality） | 合约地址/部署块 | 🆕 |
| D | Chain Query Services：从 IndexedDB 映射为 domain DTO（ComputeNode/ComputeJob） | C | 🆕 |
| E | Controller：接入 ChainSync 与 Read Model（`useChainSyncStatus` / `useComputePage`） | D | 🆕 |
| F | View：纯渲染化（页面只消费 Controller 输出） | E | 🔧 |

---

*文档版本：SPEC — 更新于 2026-03-06（Smart Contracts + 前端 IndexedDB 索引 + api-client/HTTP 收口）*

# Interface Specification

> **用途**：定义各层边界接口，供并行开发使用。即使某一层实现尚未完成，其他层也可依照本文件中的类型与契约独立推进。  
> **版本**： Smart Contracts + 前端 IndexedDB 索引层 + HTTP api-client 收口  
> **参考**：`docs/TODO.md`、`packages/contracts/contracts/*.sol`、`packages/domain/src/*`

---

## 0. 阅读指引

| 符号 | 含义 |
|------|------|
| ✅ 已实现 | 当前代码库中已存在，本 SPEC 仅做声明 |
| 🆕 新增 | 需要实现（或从零搭建） |
| 🔧 修改 | 已有实现需要改造/迁移/收口 |

**层级依赖规则**：

```
View  ──依赖──►  Controller  ──依赖──►  Service  ──依赖──►  Model (Store)
                │                        │
                │ 只读 Store             ├──► @nodestay/api-client (HTTP) ──► apps/api
                │                        └──► Chain Index (IndexedDB) ──► Polygon RPC
```

约束：

- View 只依赖 Controller；不直接调 Service、不直接读 Store。
- Controller 只读 Store、调用 Service；不直接写 Store。
- Service 操作 Model（读/写 Store），负责拉数、转换、写入 Store；不感知 React。
- 链上数据必须进入前端 IndexedDB 形成 Read Model；Store 为展示用缓存与 UI 状态，可清空重建。

---

## 1. 术语与命名约定（重要）

本仓库同时存在两类“Contract”，为避免混淆统一约定如下：

- **API Contract**：指 `apps/api` 的**HTTP 接口契约**（请求/响应类型 + zod schema）。计划落地位置：`apps/api/src/modules/v1/contracts/`（🔧 当前尚未抽离）。
- **Smart Contract**：指 `packages/contracts/contracts/*.sol` 中部署到链上的合约（Polygon / Amoy）。
- **Indexed / Indexer**：指前端用 IndexedDB 维护的“链上事件派生读模型”，以及负责同步日志的同步器。
- **NodeStay Client**：指 `@nodestay/api-client`（HTTP SDK），为前端/其他应用复用的 API 访问层。

文档中若写 **Contract** 且无特别说明，默认指 **API Contract**；涉及链上则明确写 **Smart Contract**。

---

## 2. 整体架构

```
[Frontend: apps/web]
  View ──► Controller ──► Service ──► Model (Store)
              │ 只读         │
              │             ├──► @nodestay/api-client ──► apps/api
              │             └──► Indexed (IndexedDB) ──► Polygon RPC (Smart Contracts + Events)
              └──► Model (Store)（只读）
```

要点：

- **Service 操作 Model**：拉数后由 Service 写入 Store；Controller 只读 Store 并调用 Service。
- **链上是“最小可验证状态 + 事件”**；面向 UI 的列表/聚合由 IndexedDB Read Model 承载；Store 存展示缓存与 UI 状态。
- **HTTP API 与链上并存**：HTTP 负责链下业务编排；链上负责可验证权益与资金流（Pass/Vault/ComputeMarket）。

---

## 3. 共享领域类型（Domain Types）✅

> 文件：`packages/domain/src/*`（已由 `packages/domain/src/index.ts` 统一导出）

领域类型以 **zod schema + infer type** 方式提供，供前后端共用（减少重复定义与漂移）。

### 3.1 金额与通用约束 ✅

- `Money` / `CurrencyCode`：`packages/domain/src/money.ts`
- `IdempotencyKey`：`packages/domain/src/idempotency.ts`（用于 checkout/purchase 的幂等键规范化）

### 3.2 业务域 ✅

- `Venue`、`RegulationProfile`（日本合规字段）：`packages/domain/src/venue.ts`
- `IdentityVerification`：`packages/domain/src/identity.ts`
- `Session`：`packages/domain/src/session.ts`
- `Ledger*`：`packages/domain/src/ledger.ts`（账本域事件与出账 outbox）
- `ComputeNode` / `ComputeJob`：`packages/domain/src/compute.ts`（计算节点与任务 DTO）

> 约定：**API Contract 与前端 Model 尽量复用 domain 类型**；若暂时无法复用，必须在 SPEC 中写明映射规则与差异字段。

---

## 4. HTTP API 接口（apps/api）✅/🔧

> 当前实现：Controller 内联 zod（例：`apps/api/src/modules/v1/controllers/compute.controller.ts`）。  
> 目标：把所有 schema 抽离为 API Contract（🔧）。

### 4.1 基础健康检查 ✅

- `GET /v1/health` → `{ ok: true }`

### 4.2 门店与套餐 ✅

- `GET /v1/venues` → `Array<{ venueId; name; address; timezone }>`
- `GET /v1/venues/:venueId/plans` → `Array<{ planId; venueId; name; baseDurationMinutes; basePriceMinor; depositRequiredMinor }>`

### 4.3 身份验证 ✅

- `POST /v1/identity/verify` body `{ userId; venueId }` → `{ identityVerificationId }`

### 4.4 会话 ✅

- `POST /v1/sessions/checkin` body `{ passId; seatId; venueId; identityVerificationId? }` → `{ sessionId }`
- `POST /v1/sessions/checkout` body `{ sessionId }` + header `idempotency-key` → `JsonObject`（🔧 需收口为明确响应类型）

### 4.5 用户余额 ✅

- `GET /v1/user/balance` → `{ currency: 'JPYC'; balanceMinor; depositHeldMinor }`

### 4.6 商家操作 ✅/🔧

已在 `NodeStayClient` 中出现：

- `POST /v1/merchant/venues` body `{ name; address; timezone }` → `{ venueId; name; address; timezone }`

（🔧）后续应补齐 plans/seats/compute enable/disputes 等端点，并统一写入 API Contract。

### 4.7 Compute（链下 API）✅/🔧

> Controller：`apps/api/src/modules/v1/controllers/compute.controller.ts`

- `GET /v1/compute/nodes` → `ComputeNodeRecord[]`（当前为 Store 假数据）
- `POST /v1/compute/jobs` body：

```ts
{
  requesterId: string;
  taskType: string;
  taskSpec: {
    command: string;
    inputUri: string;
    outputUri: string;
    envVars: Record<string, string>;
    dockerImage?: string;
  };
}
```

→ `{ jobId: string }`

- `GET /v1/compute/jobs/:jobId` → `{ jobId; status }`
- `POST /v1/compute/jobs/:jobId/cancel` → `{ jobId; cancelled: true }`
- `GET /v1/compute/jobs/:jobId/result` → `{ jobId; resultUri: string | null }`（当前固定 `null`）

（🔧）注意：这是“链下编排 API”，不等同于链上 `ComputeMarket` 的 Job。最终产品需要在 SPEC 中明确两者的关联策略（见第 7/8 节）。

---

## 5. `@nodestay/api-client`（HTTP SDK）✅/🔧

> 文件：`packages/api-client/src/nodestayClient.ts`（✅ 已实现）  
> 前端创建位置：`apps/web/src/services/nodestay.ts`（✅）

### 5.1 职责边界 ✅

- 统一 `baseUrl`、`fetch` 调用、JSON 解析与错误处理
- 统一 header（尤其是 `idempotency-key`）与输入归一化（`normalizeIdempotencyKey`）
- **不做 UI 状态管理**；不依赖 React；不做复杂业务编排

### 5.2 必须满足的契约 🔧

- NodeStayClient 的方法签名 **必须与 API Contract 对齐**（请求/响应类型一致）。
- 错误语义：建议从“仅抛 `APIエラー: status`”升级为可判别错误（例如 `ApiError` + status + body message）。

---

## 6. Smart Contracts（packages/contracts）✅

> 合约源代码：`packages/contracts/contracts/*.sol`  
> 构建/测试：Hardhat（`packages/contracts/hardhat.config.ts` + `packages/contracts/test/*.test.ts`）

### 6.1 合约清单与职责 ✅

- **`AccessPassNFT.sol`**：通行证 NFT（ERC721）
- **`DepositVault.sol`**：押金 Vault（hold/capture/release）
- **`ComputeMarket.sol`**：算力市场（节点注册 + Job 状态机 + JPYC 托管与分账）

### 6.2 信任模型（必须显式）✅

三份合约均采用 **Owner + Operator** 中心化运营模型：

- Owner：设置 operator（以及 `ComputeMarket.platformFeeRecipient`）
- Operator：执行关键写操作（铸造/消耗 Pass、押金捕获/释放、Compute Job 状态迁移与结算）

> 产品侧必须把“operator 为受信服务”作为前提：建议采用多签/权限隔离/轮换策略。

### 6.3 `ComputeMarket` 状态机（链上）✅

**NodeData（最小字段）**：

- `nodeId: bytes32`
- `venueOwner: address`
- `pricePerHourMinor: uint256`
- `minBookingHours/maxBookingHours: uint256`
- `active: bool`

**JobStatus**（与合约枚举严格一致）：

`PENDING → ASSIGNED → RUNNING → (COMPLETED | FAILED)`，另有 `CANCELLED`（仅 `PENDING/ASSIGNED` 可取消）。

**事件（Indexing 入口）**：

- Node：`NodeRegistered/NodeUpdated/NodeActivated/NodeDeactivated`
- Job：`JobSubmitted/JobAssigned/JobStarted/JobCompleted/JobFailed/JobCancelled`

### 6.4 `AccessPassNFT` 转移限制 ✅

- `transferable=false`：永不可转移
- `transferable=true`：每次转移后写入 `lastTransferTime[tokenId]`，且 **24h 冷却**期间再次转移会 revert

> 注意：mint 后第一次转移不受冷却限制（`lastTransferTime` 初值为 0）。

---

## 7. 前端 IndexedDB（Indexed）链上索引层 🆕

本项目约定：**链上的数据存储在前端的 indexed（IndexedDB）里面**，即维护“链上事件派生 Read Model”，UI 默认只读 IndexedDB。

### 7.1 DB Schema（建议）🆕

以“可从事件重建”为目标，IndexedDB 建议维护：

- `chain_sync_state`：
  - `chainId`
  - `contractAddress`
  - `deploymentBlock` / `fromBlock`
  - `lastProcessedBlock`
  - `lastFinalizedBlock`
  - `updatedAt`
- `compute_nodes`：链上节点快照（由 Node 事件驱动 upsert）
- `compute_jobs`：链上 Job 快照（由 Job 事件驱动 upsert）
- `passes`：Pass 快照（由 Pass 事件 + ERC721 Transfer 驱动）
- `events`（可选）：原始日志（用于 debug / 回放）

### 7.2 Indexer 行为约束 🆕

- **去重键**：`(chainId, txHash, logIndex)` 必须唯一
- **finalityDepth**：仅把 `head - finalityDepth` 之前的块视作 finalized 写入 `lastFinalizedBlock`
- **reorg 处理**：如发现回滚（blockHash 不一致），回退到 `lastFinalizedBlock` 重新同步该范围
- **读写约定**：UI 默认读 IndexedDB；缺失时允许回退 `readContract()` 读取单条详情补齐

### 7.3 Indexer / Query Service 接口（建议）🆕

实现建议（不限制库）：可选 `dexie` 或 `idb`。无论选型，需提供一组稳定接口供 Service 层调用：

```ts
export interface ChainSyncStatus {
  chainId: number;
  contractAddress: string;
  lastProcessedBlock: number;
  lastFinalizedBlock: number;
  isSyncing: boolean;
  lastError?: string;
}

export interface ChainIndexer {
  start(): Promise<void>;
  stop(): Promise<void>;
  syncOnce(): Promise<void>;
  getStatus(): Promise<ChainSyncStatus>;
}

export interface ChainReadModelQuery {
  listComputeNodes(): Promise<Array<{
    chainId: number;
    nodeId: string; // bytes32 hex
    venueOwner: string;
    pricePerHourMinor: string;
    minBookingHours: number;
    maxBookingHours: number;
    active: boolean;
    updatedAtBlock: number;
  }>>;

  listComputeJobsByRequester(requester: string): Promise<Array<{
    chainId: number;
    jobId: string;
    nodeId: string;
    status: 'PENDING' | 'ASSIGNED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    depositMinor: string;
    estimatedHours: number;
    startedAt?: number;
    endedAt?: number;
    resultHash?: string;
    updatedAtBlock: number;
  }>>;
}
```

---

## 8. 前端 Service 层接口 ✅/🔧/🆕

> 位置：`apps/web/src/services/`  
> **职责**：Service **操作 Model（Store）**——拉数后写入 Store；Controller 只读 Store 并调用 Service。

Service 层分两类数据源：

1) **HTTP 数据源**（通过 `@nodestay/api-client`）  
2) **链上 Read Model 数据源**（通过 IndexedDB Query；必要时回退 RPC 单查）  

拉取/转换后的数据由 Service **写入 Store**，供 Controller 只读。

### 8.1 HTTP Services（示意）🔧

- `VenueService`：listVenues / listPlans
- `IdentityService`：verify
- `SessionService`：checkin / checkout（幂等键）
- `PassService`：purchase（幂等键）
- `UserService`：getBalance
- `MerchantService`：createVenue / upsertPlan / upsertSeat / enableCompute / disputes...

### 8.2 Chain Services（示意）🆕

- `ChainSyncService`：负责启动 indexer、暴露同步状态（供 UI 展示）
- `ComputeChainReadService`：从 IndexedDB 读取链上 nodes/jobs（只读）
- `PassChainReadService`：从 IndexedDB 读取 passes（只读）

---

## 9. 前端 Controller（Hook）接口 ✅/🔧/🆕

> 位置：`apps/web/src/controllers/` 或 `apps/web/src/hooks/`  
> **职责**：只读 Store、调用 Service 方法；不直接写 Store（写 Store 由 Service 完成）。

### 9.1 页面 Controller（建议）🔧

- `useVenuesPage()`：门店列表
- `useSessionPage()`：会话与 checkout
- `useComputePage()`：compute 节点与 job（链下 API + 链上索引的组合展示）

### 9.2 链上同步状态 Controller 🆕

- `useChainSyncStatus()`：订阅 `ChainSyncService`，显示当前同步进度、错误、最后块高

---

## 10. 前端 Model/Store（Zustand + IndexedDB）🔧/🆕

**读写约定**：**Service 写、Controller 只读**。Store 由 Service 写入（拉数、转换后）；Controller 仅订阅并暴露给 View。

最小要求：

- **数据源唯一**：链上列表/聚合只来自 IndexedDB Read Model；Store 存展示用缓存与 UI 状态，可清空重建。
- **可恢复**：IndexedDB 可清空重建；Store 重启可从 IndexedDB 或 Service 重新 hydrate。

推荐拆分：

- `compute.store`：页面筛选条件、选中节点、提交状态等“UI state”（不承载链上权威数据）
- `chainSync.store`：同步状态、错误、最后处理块

---

## 11. 错误类型（建议）🆕

为便于上层统一展示，建议 Service 层统一抛出结构化错误：

```ts
export type AppErrorCode =
  | 'API_NOT_IMPLEMENTED'
  | 'API_BAD_REQUEST'
  | 'API_NOT_FOUND'
  | 'API_UNAUTHORIZED'
  | 'CHAIN_SYNC_FAILED'
  | 'CHAIN_REORG_DETECTED'
  | 'CHAIN_RPC_FAILED'
  | 'CONTRACT_REVERTED';

export class AppError extends Error {
  code: AppErrorCode;
  detail?: unknown;
  constructor(code: AppErrorCode, message: string, detail?: unknown) {
    super(message);
    this.code = code;
    this.detail = detail;
  }
}
```

---

## 12. 跨层数据流速查表（目标态）

| 操作 | View | Controller | Service | 数据流 |
|------|------|-----------|---------|-------|
| 门店列表 | venues/page 渲染 | useVenuesPage（读 Store） | VenueService.listVenues → 写 Store | HTTP → Store |
| Compute 节点列表（展示） | compute/page 渲染 | useComputePage（读 Store） | ComputeChainReadService.listNodes → 写 Store | IndexedDB → Store |
| Compute 节点列表（补充展示字段） | compute/page 渲染 | useComputePage（读 Store） | VenueService.listVenues + join → 写 Store | HTTP + IndexedDB → Store |
| 提交 Compute Job（链下编排） | 点击提交 | useComputePage.handleSubmit | ComputeService.submitJob | HTTP |
| Job 状态展示（权威） | job 列表 | useComputePage（读 Store） | ComputeChainReadService.listJobsByRequester → 写 Store | IndexedDB → Store |
| 同步状态展示 | 顶部 badge | useChainSyncStatus（读 Store） | ChainSyncService.status/syncOnce → 写 Store | Indexer → Store |

> 说明：Controller 只读 Store 并调用 Service；Service 拉数后写入 Store。链上权威在 IndexedDB；Store 为展示用缓存与 UI 状态。

---

## 13. 实现顺序建议（可并行）

以下 Track 可独立分配给不同开发者/Agent：

| Track | 内容 | 前置依赖 | 状态 |
|-------|------|---------|------|
| A | 抽离 API Contract（apps/api contracts 目录 + 替换 Controller 内联 zod） | 无 | 🆕 |
| B | api-client 与 API Contract 对齐（响应类型收口、错误语义结构化） | A | 🔧 |
| C | IndexedDB Schema + Indexer（compute/pass/job 事件同步 + reorg） | Smart Contracts 部署信息 | 🆕 |
| D | Chain Read Services（listNodes/listJobs/listPasses） | C | 🆕 |
| E | 页面 Controller 接入 Chain Sync 状态与 Read Model | D | 🆕 |
| F | View 层纯渲染化（页面只消费 Controller 输出） | E | 🔧 |

---

*文档版本：SPEC — 更新于 2026-03-06（Smart Contracts + 前端 IndexedDB 索引层 + api-client 层边界收口）*
