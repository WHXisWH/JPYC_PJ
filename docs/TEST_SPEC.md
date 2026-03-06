# 测试规范（TEST SPEC）

> **用途**：为 `docs/SPEC.md` 中定义的各层边界提供可执行的测试规范，支持并行开发与验收。  
> **范围**：`apps/web`（View/Controller/Service/Store）+ `packages/api-client` + `apps/api` + `packages/contracts`（Smart Contracts）+ `Indexed/Indexer`（前端 IndexedDB 链上索引层）。  
> **参考**：`docs/SPEC.md`、`docs/TODO.md`

---

## 0. 通用约定（所有层适用）

### 0.1 测试分层与目标

- **单元测试（Unit）**：函数/类的纯逻辑；快、无 IO；失败定位精确。
- **集成测试（Integration）**：模块间协作（HTTP client ↔ server、Indexer ↔ DB、Controller ↔ Service）；允许 mock 外部依赖。
- **端到端（E2E）**：从用户行为或 API 请求到最终输出；尽量少但关键路径必测。

### 0.2 失败信息与可诊断性

- 断言失败必须可定位（错误消息包含：输入、关键中间值、输出）。
- 与链相关测试必须输出：`chainId`、合约地址、区块号或事件名（用于复现/排查）。

### 0.3 Mock/Fixture 规则

- **HTTP**：优先 mock `fetchImpl`（api-client）或使用 `supertest`（apps/api）。
- **时间**：统一使用 fake timers 或可注入 time provider；避免真实 `Date.now()` 导致 flaky。
- **随机**：必须可控（固定种子或显式注入随机源）。

### 0.4 覆盖率门槛（按包现状）

- `apps/web`：Vitest 覆盖率阈值 80%（已配置）。
- `packages/api-client`、`packages/domain`：Vitest 覆盖率阈值 100%（已配置）。
- `packages/contracts`：以 Hardhat coverage 为准（建议关键分支覆盖）。
- `apps/api`：Jest coverage（建议逐步设阈值；当前以关键路径为主）。

---

## 1. 共享领域类型（Domain Types）✅

> 位置：`packages/domain`（Vitest / node 环境）

### 1.1 目标

- zod schema 的 **边界值** 与 **错误分支** 都要覆盖。
- 领域函数（如 money 的加法、幂等键规范化）必须无副作用且可预测。

### 1.2 必测用例（最低集合）

- **Money**
  - `addMoney`：同币种正常相加；不同币种抛错。
- **Idempotency**
  - `normalizeIdempotencyKey`：长度边界、非法字符、合法字符集。
- **Compute schemas**
  - `ComputeNodeSchema/ComputeJobSchema`：必填字段缺失、枚举非法值、数值边界（负数/0/超大）。
- **Venue/Regulation**
  - `RegulationProfileSchema`：`prohibitedFields` 枚举校验；`piiRetentionYears` 正整数。

### 1.3 命令

- `pnpm -w test -F @nodestay/domain`（或根目录 `npm run test -w @nodestay/domain`）

---

## 2. Smart Contracts（packages/contracts）✅

> 位置：`packages/contracts`（Hardhat + chai）

### 2.1 目标

- 状态机迁移必须与合约实现一致，且 **所有 revert 分支** 有覆盖。
- 资金流（JPYC ERC20）必须验证：托管余额、分账比例、退款金额。
- 事件必须覆盖（Indexer 依赖事件作为唯一输入）。

### 2.2 `ComputeMarket.sol` 必测用例

- **权限**
  - `setOperator/setPlatformFeeRecipient`：onlyOwner；拒绝 zero address。
  - `registerNode/updateNode/activate/deactivate`：onlyOperator。
- **节点**
  - 注册成功写入 `nodes[nodeId]`，`nodeIds` 计数正确。
  - 重复注册 revert（`NodeAlreadyExists`）。
  - price=0、min=0、min>max revert。
- **Job 生命周期**
  - `submitJob` 托管金额 = `pricePerHourMinor * estimatedHours`；`JobSubmitted` 参数正确。
  - 状态迁移：PENDING→ASSIGNED→RUNNING→COMPLETED（事件与字段 `startedAt/endedAt/resultHash`）。
  - `failJob`：RUNNING/ASSIGNED 可失败并全额退款；PENDING 失败必须 revert。
  - `cancelJob`：requester/operator 可取消；第三方 revert；RUNNING 取消 revert。
- **结算**
  - 分账比例严格 75/25（`PLATFORM_FEE_BPS/FEE_DENOMINATOR`）；合约余额归零。

### 2.3 `AccessPassNFT.sol` 必测用例

- `mint`：onlyOperator；to=0、duration=0、expiresAt<=now revert；`PassMinted` 参数正确。
- `consumePass`：onlyOperator；inactive/expired/超额使用 revert；用尽后 `isActive=false`。
- `suspend/reactivate`：事件发出；状态变更正确。
- **转移限制**
  - `transferable=false` 转移 revert（`NotTransferable`）。
  - cooldown：第一次转移成功；冷却内二次转移 revert；冷却后转移成功；`lastTransferTime` 记录正确。

### 2.4 `DepositVault.sol` 必测用例

- `holdDeposit`：amount=0 revert；transferFrom false revert；heldBalance 累加正确；事件正确。
- `capture/release`：onlyOperator；余额不足 revert；to=0 revert；transfer false revert；余额扣减正确。

### 2.5 命令

- `npm run test -w @nodestay/contracts`
- 覆盖率：`npm run test:coverage -w @nodestay/contracts`

---

## 3. HTTP SDK（packages/api-client）✅/🔧

> 位置：`packages/api-client`（Vitest / node 环境）  
> 关键设计：可注入 `fetchImpl`，单测应优先用它做 mock。

### 3.1 目标

- 每个 client 方法必须验证：
  - URL 拼接与 baseUrl 归一化
  - 请求方法、headers、body
  - 非 2xx 时错误抛出（后续升级为结构化错误也要保持可判别性）
  - 幂等键 header（`idempotency-key`）是否规范化

### 3.2 必测用例（最低集合）

- `NodeStayClient.json<T>()`
  - `res.ok=false` 抛错；`res.json()` 解析异常抛错。
- `checkoutSession` / `purchasePass`
  - `idempotency-key` 必须经过 `normalizeIdempotencyKey`；非法 key 应在客户端侧抛错（在发请求前）。
- `createVenueAsMerchant` / `verifyIdentity` / `checkinSession`
  - `content-type: application/json` 必须设置；body JSON 序列化正确。

### 3.3 扩展（🔧）

- 当 compute 方法加入 client 后，必须补齐：
  - `/v1/compute/*` 路径与输入输出类型
  - 错误语义（Not Implemented 时 message 显示正确）

### 3.4 命令

- `npm run test -w @nodestay/api-client`

---

## 4. 后端 HTTP API（apps/api）✅/🔧

> 位置：`apps/api`（Jest + supertest + @nestjs/testing）

### 4.1 目标

- Controller 的输入校验（zod）必须覆盖成功/失败分支。
- Feature flag 分支必须覆盖（compute market enable/disable）。
- StoreService 的核心行为至少有集成测试覆盖（通过 HTTP 端点验证）。

### 4.2 必测用例（最低集合）

- **健康检查**
  - `GET /v1/health` 返回 `{ ok: true }`。
- **compute**
  - flag 关闭：`/v1/compute/*` 返回 501（NOT_IMPLEMENTED）。
  - `POST /v1/compute/jobs`：
    - body 缺字段/类型错 → 400
    - 正常 body → 200 + `{ jobId }`
  - `GET /v1/compute/jobs/:jobId`：
    - 不存在 → 404
    - 存在 → 200 + `{ jobId, status }`
- **checkout**
  - 缺少 `idempotency-key`（若后端要求）→ 400/422（需在 API Contract 明确）

### 4.3 API Contract 抽离后的测试（🔧）

当 schema 迁移到 `apps/api/src/modules/v1/contracts/` 后：

- 为每个 contract 文件新增 **schema 单测**（parse/safeParse 分支）。
- Controller 测试应从“测试 zod 细节”转为“测试 controller 是否调用 contract 正确处理错误”。

### 4.4 命令

- `npm run test -w @nodestay/api`

---

## 5. 前端（apps/web）测试规范（View / Controller / Service / Store）

> 位置：`apps/web`（Vitest + jsdom + testing-library）

### 5.1 View 层（React 组件）🆕/🔧

**目标**：只测渲染与交互绑定，不测业务计算。

必测用例（最低集合）：

- **渲染状态**
  - loading skeleton / empty state / error state 正确展示
- **交互转发**
  - 点击按钮会调用 props handler（或 controller 提供的 handler）
  - 表单输入更新调用对应 setter

约束：

- View 测试不得直接 mock HTTP/Indexer；应通过注入的 Controller 返回值驱动渲染。

### 5.2 Controller 层（Hook）🆕/🔧

**目标**：验证 UI 状态机（loading/error/modal/filter）与对 Service 的调用边界。

必测用例（以 `useComputePage` 为代表）：

- `refresh()`：
  - 成功：nodes/jobs 写入；loading 正确开关
  - 失败：error 设置；loading 关闭
- `openBooking/closeBooking`：
  - bookingNodeId 状态更新正确
- `submitJob/cancelJob`：
  - 调用正确的 Service 方法；失败时错误提示可见

实现建议：

- Controller 通过依赖注入拿到 Service（Context），测试中用 fake service（spy）替代真实实现。

### 5.3 Service 层（HTTP + IndexedDB 聚合）🆕/🔧

**目标**：验证“数据源选择与转换规则”：

- HTTP：调用 `NodeStayClient` 方法是否正确；错误是否映射为统一错误类型。
- IndexedDB：查询是否只读 Read Model；缺失时是否回退单条 RPC（如实现）。

必测用例：

- `ComputeChainService.listNodes()`：从 IndexedDB 拿到 node snapshot → 映射为 domain `ComputeNode`。
- `ComputeChainService.listMyJobs()`：按 requester 过滤；状态枚举一致。
- Join（如果 Service 做）：链上 nodeId → 通过 HTTP venueId/venueName 补全展示字段。

### 5.4 Model/Store（Zustand + IndexedDB）🆕/🔧

**目标**：Store 只承载 UI state 与同步状态，不承载链上权威数据副本；hydration 可恢复。

必测用例：

- 初始化：从 IndexedDB hydrate（若实现）；无数据时状态为默认值。
- chain sync 状态更新：store 能正确接收并更新 `lastProcessedBlock/lastError`。

### 5.5 命令

- `npm run test -w @nodestay/web`

---

## 6. Indexed / Indexer（前端链上索引层）🆕

> 本层当前尚未实现，但 SPEC 规定必须实现；本节定义其测试要求。

### 6.1 目标

- logs → Read Model 的映射必须正确且可重复（幂等）。
- 断点续扫必须正确（lastProcessedBlock）。
- reorg 回滚必须正确（回退到 lastFinalizedBlock 重扫）。

### 6.2 必测用例（最低集合）

- **幂等**
  - 同一批 logs 重放两次，DB 行不重复、最终状态一致（依赖 txHash+logIndex 去重）。
- **断点续扫**
  - 从 `deploymentBlock` 扫到 N；保存 lastProcessedBlock=N；
  - 再次 sync 只处理 (N+1..head)。
- **reorg**
  - 构造“回滚”场景（可用 fake provider + 两套不同 blockHash）；
  - 检测不一致后回退到 lastFinalizedBlock 并重扫，Read Model 恢复正确。
- **事件映射**
  - `ComputeMarket.JobCompleted` 必须更新 `compute_jobs` 的 status/resultHash/endedAt（或对应字段）。
  - `AccessPassNFT.Transfer` 必须更新 `passes.owner`。

### 6.3 工具建议

- Indexer 的 provider 访问应可注入（便于单测用 fake provider）。
- IndexedDB 访问层建议用可替换的 adapter（真实 IndexedDB vs in-memory）。

---

## 7. CI 建议（按 workspace）

建议 CI 分层执行（可并行）：

- `packages/domain`（fast, 100% coverage）
- `packages/api-client`（fast, 100% coverage）
- `packages/contracts`（hardhat test + coverage）
- `apps/api`（jest）
- `apps/web`（vitest + jsdom）

---

*文档版本：TEST SPEC — 更新于 2026-03-06*

