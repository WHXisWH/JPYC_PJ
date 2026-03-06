# Node Stay 项目功能文档

> 本文档面向开发者和 AI Agent，全面介绍 Node Stay 项目的功能模块、技术架构与业务流程。

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术架构](#2-技术架构)
3. [技术栈](#3-技术栈)
4. [项目结构](#4-项目结构)
5. [业务功能模块](#5-业务功能模块)
6. [智能合约](#6-智能合约)
7. [前端页面](#7-前端页面)
8. [API 接口](#8-api-接口)
9. [数据流与状态管理](#9-数据流与状态管理)
10. [开发指南](#10-开发指南)

---

## 1. 项目概述

**Node Stay** 是一个面向日本网络咖啡厅（ネットカフェ）的区块链双面市场平台，结合了**座席利用权资产化**与**闲置算力租赁**两大核心业务。

### 核心价值

| 角色 | 价值 |
|------|------|
| **用户（消费者）** | 用 JPYC 稳定币购买座席利用权 NFT，享受灵活的网咖服务；也可租用闲置算力执行计算任务 |
| **商家（网咖经营者）** | 座席利用权 NFT 化带来新的收入模式；闲置 PC/GPU 出租获得额外算力租赁收入 |
| **平台** | 算力市场收取 25% 平台费；提供基础设施与运营支持 |

### 支付与区块链

- **支付代币**: JPYC（日元锚定 ERC-20 稳定币）
- **网络**: Polygon PoS（主网 chainId 137）/ Polygon Amoy（测试网 chainId 80002）
- **结算**: 链上自动分账，无需信任中介

---

## 2. 技术架构

```
┌────────────────────────────────────────────────┐
│                 apps/web                       │
│        Next.js 14 (App Router) 前端            │
│   View → Controller(Hook) → Service → Store   │
│                    │               │           │
│                    │     ┌─────────┴────────┐  │
│                    │     │                  │  │
│                    │     ▼                  ▼  │
│                    │  api-client      IndexedDB│
│                    │     │          (Dexie)    │
└────────────────────┼─────┼──────────────┼──────┘
                     │     │              │
                     │     ▼              ▼
               ┌─────┼─────────┐   ┌───────────┐
               │  apps/api     │   │ Polygon    │
               │  NestJS       │   │ PoS / Amoy │
               │  REST API     │   │ Smart      │
               │  (端口 3001)  │   │ Contracts  │
               └───────────────┘   └───────────┘

共享包:
  packages/domain       → Zod schema + 共享领域类型
  packages/api-client   → NodeStayClient (幂等 HTTP SDK)
  packages/api-contracts→ API 请求/响应 Zod schema
  packages/contracts    → Hardhat + Solidity 智能合约
```

### 分层架构原则

前端采用严格的分层架构，单向依赖：

| 层级 | 职责 | 允许依赖 |
|------|------|----------|
| **View** | 纯 UI 渲染，事件转发 | 仅 Controller Hook |
| **Controller** (Hook) | UI 状态机，暴露数据与操作 | Service + Store（只读） |
| **Service** | 数据拉取、转换、写入 Store | api-client + IndexedDB + Store |
| **Model** (Store) | UI 状态与展示缓存 | 无外部依赖 |

### 多数据源策略

- **HTTP API** (`@nodestay/api-client`): 链下业务编排（身份验证、会话管理等）
- **IndexedDB** (Dexie): 链上事件派生读模型，UI 默认读取
- **Polygon RPC** (viem): 链上交互，仅在缺失数据时回退单查

---

## 3. 技术栈

| 分类 | 技术 | 版本 |
|------|------|------|
| Monorepo | npm workspaces | - |
| 语言 | TypeScript | ^5.6 |
| 前端框架 | Next.js (App Router) | 14 |
| UI 库 | React | 18 |
| 样式 | Tailwind CSS | v4 |
| 状态管理 | Zustand | ^5 |
| 本地持久化 | Dexie (IndexedDB) | ^4 |
| 链上交互 | viem | ^2.21 |
| 后端框架 | NestJS | 10 |
| 数据校验 | Zod | ^3.24 |
| 智能合约 | Solidity | ^0.8.26 |
| 合约开发 | Hardhat | 2.22 |
| 合约标准库 | OpenZeppelin | ^5 |
| 区块链 | Polygon PoS / Amoy | 137 / 80002 |
| 前端测试 | Vitest + Testing Library | - |
| 后端测试 | Jest + supertest | - |
| 合约测试 | Hardhat Mocha/Chai | - |

---

## 4. 项目结构

```
JPYC_PJ/
├── apps/
│   ├── web/                          # Next.js 前端
│   │   └── src/
│   │       ├── app/                  # 页面路由
│   │       │   ├── layout.tsx        # 根布局 (Header + Footer)
│   │       │   ├── globals.css       # Tailwind 主题定义
│   │       │   ├── page.tsx          # 首页
│   │       │   ├── venues/           # 店铺一览 + 详情
│   │       │   ├── passes/           # 我的通行证
│   │       │   ├── sessions/         # 会话管理
│   │       │   ├── compute/          # 算力市场
│   │       │   └── merchant/compute/ # 商家节点管理
│   │       ├── components/           # 复用组件
│   │       ├── hooks/                # Controller 层 Hook
│   │       ├── models/               # 类型定义 + Store 定义
│   │       ├── services/             # Service 层
│   │       ├── stores/               # Zustand Store 导出
│   │       └── indexed/              # IndexedDB 链上索引
│   │
│   └── api/                          # NestJS 后端
│       └── src/
│           ├── main.ts               # 入口 (端口 3001)
│           └── modules/v1/           # V1 API 模块
│               ├── controllers/      # HTTP Controller
│               ├── contracts/        # Zod 校验 schema
│               └── services/         # 业务服务
│
└── packages/
    ├── contracts/                    # 智能合约
    │   ├── contracts/                # Solidity 源码
    │   ├── scripts/deploy.ts         # 部署脚本
    │   ├── test/                     # 合约测试 (61 tests)
    │   └── typechain-types/          # TypeChain 生成类型
    ├── domain/                       # 共享领域类型 (Zod)
    ├── api-client/                   # NodeStayClient HTTP SDK
    └── api-contracts/                # API 请求/响应 schema
```

---

## 5. 业务功能模块

### 5.1 座席利用权市场

用户可以使用 JPYC 购买网咖座席的利用权 NFT，实现去中心化的入场与结账流程。

**完整流程:**

```
用户 → 浏览店铺 → 选择套餐 → JPYC 购买 AccessPassNFT
    → JPYC 存入 DepositVault (hold)
    → QR 码入店 → 消费 Pass 时间
    → 结账 → captureDeposit (扣费给店铺) + releaseDeposit (退还剩余)
```

**涉及合约:**
- `AccessPassNFT.sol` - 利用权 NFT 发行与管理
- `DepositVault.sol` - JPYC 押金托管

**功能特性:**
- 套餐类型多样（时间、价格、押金要求各异）
- NFT 可转让（部分套餐限制，月额套餐不可转让）
- 转让冷却机制（24 小时，防洗钱）
- 实时会话计时器（1 秒更新）
- 超时自动计算超额费用

### 5.2 闲置算力租赁市场

网咖空闲时段的 PC/GPU 资源可被租用执行计算任务，实现资源高效利用。

**完整流程:**

```
依赖者 → 浏览算力节点 → 选择节点
      → JPYC 托管至 ComputeMarket
      → 提交 Job (PENDING → ASSIGNED → RUNNING)
      → 完成 → 店铺 75% + 平台 25% 自动分账
      → 失败/取消 → 全额退款
```

**涉及合约:**
- `ComputeMarket.sol` - 算力市场、Job 状态机、分账

**Job 状态机:**

| 状态 | 说明 | 可迁移至 |
|------|------|----------|
| PENDING | 已提交，等待分配 | ASSIGNED, CANCELLED |
| ASSIGNED | 已分配节点 | RUNNING, FAILED, CANCELLED |
| RUNNING | 执行中 | COMPLETED, FAILED |
| COMPLETED | 已完成，自动分账 | - |
| FAILED | 失败，全额退款 | - |
| CANCELLED | 取消，全额退款 | - |

**收益分配:**
- 店铺（venueOwner）: 75%
- 平台: 25%（`PLATFORM_FEE_BPS = 250 / FEE_DENOMINATOR = 1000`）

### 5.3 商家管理

商家可以注册店铺、管理套餐、注册算力节点并配置定价。

**功能:**
- 创建/管理店铺信息（名称、地址、时区）
- 创建/更新套餐计划
- 管理座席
- 注册/激活/停用算力节点
- 设置算力节点定价与预约时间范围
- 收益模拟器

### 5.4 身份验证

日本合规要求的本人确认流程，入店前需完成身份验证。

### 5.5 链上数据索引

前端通过 IndexedDB 维护链上事件的派生读模型：

**同步机制:**
- 初次同步: 从部署块扫描到最新块
- 增量同步: 按区块区间拉取新事件
- 去重: `(chainId, txHash, logIndex)` 唯一键
- Reorg 处理: 检测回滚后回退至 finalized 块重扫

**索引表:**
- `chain_sync_state` - 同步进度
- `compute_nodes` - 算力节点快照
- `compute_jobs` - Job 快照
- `passes` - 通行证快照

---

## 6. 智能合约

### 6.1 AccessPassNFT (ERC-721)

网咖座席利用权 NFT，记录使用时间、有效期、转让状态。

| 函数 | 权限 | 说明 |
|------|------|------|
| `mint(to, planId, venueId, duration, expiresAt, transferable)` | Operator | 铸造利用权 NFT |
| `consumePass(tokenId, usedMinutes)` | Operator | 消费使用时间 |
| `suspendPass(tokenId)` | Operator | 冻结（违规处理） |
| `reactivatePass(tokenId)` | Operator | 解冻 |
| `isPassValid(tokenId)` | View | 查询有效性 |

**PassData 结构:**
- `planId` - 套餐 ID
- `venueId` - 店铺 ID（0 = 多店通用）
- `remainingMinutes` - 剩余使用时间
- `expiresAt` - 有效期（Unix 时间戳）
- `isActive` - 有效标志
- `transferable` - 可转让标志

### 6.2 DepositVault

JPYC 押金金库，实现 hold/capture/release 模式。

| 函数 | 权限 | 说明 |
|------|------|------|
| `holdDeposit(amount)` | 任何人 | 用户存入 JPYC |
| `captureDeposit(payer, to, amount)` | Operator | 扣款给商家 |
| `releaseDeposit(payer, amount)` | Operator | 退款给用户 |

### 6.3 ComputeMarket

算力市场，管理节点注册与 Job 生命周期。

**节点管理:**
- `registerNode` / `updateNode` / `activateNode` / `deactivateNode`

**Job 生命周期:**
- `submitJob` → `assignJob` → `startJob` → `completeJob`（分账）
- `failJob`（退款）/ `cancelJob`（退款）

### 6.4 部署信息 (Amoy 测试网)

| 合约 | 地址 |
|------|------|
| MockERC20 (测试 JPYC) | `0x2fA62C3E53b67A9678F4Aac14E2843c1dF7b8AfD` |
| AccessPassNFT | `0x1cC076ed23D6c2e5dD37aAe28b9a21aA9d46eC3a` |
| DepositVault | `0xb2a5A4354F9b53089893b2aF9840a29cEeEe84fD` |
| ComputeMarket | `0x159E85E8f296B9a3A95A9FFaE59Ae7aF4358Ee77` |

---

## 7. 前端页面

### 7.1 首页 (`/`)

- Hero 区域，品牌介绍
- 功能亮点展示
- 使用流程说明
- 定价方案
- 收益模拟器
- CTA（行动号召）

### 7.2 店铺一览 (`/venues`)

- 店铺搜索与筛选
- 排序功能
- 骨架屏加载
- 店铺卡片展示

**Hook:** `useVenuesPage`

### 7.3 店铺详情 (`/venues/[venueId]`)

- 套餐列表与价格
- JPYC 购买弹窗
- 套餐详情（时长、押金要求）

**Hook:** `useVenueDetailPage`

### 7.4 我的通行证 (`/passes`)

- 通行证列表与筛选标签（全部/有效/过期）
- QR 码展示弹窗（用于入店）
- 剩余时间进度条

**Hook:** `usePassesPage`

### 7.5 会话管理 (`/sessions`)

- 活跃会话实时计时器（1 秒更新）
- 超时费用计算
- 结账操作

**Hook:** `useSessionPage`

### 7.6 算力市场 (`/compute`)

- 算力节点搜索与筛选
- 节点卡片（规格、价格、状态）
- Job 提交弹窗
- 我的 Job 列表
- 收益仪表板

**Hook:** `useComputePage`

### 7.7 商家节点管理 (`/merchant/compute`)

- 节点注册与激活
- 定价设置（每小时费用、最小/最大预约时间）
- 收益模拟器
- 导入指南

**Hook:** `useMerchantCompute`

### 7.8 公共组件

| 组件 | 说明 |
|------|------|
| `Header` | 固定导航栏，JPYC 余额显示，钱包连接，滚动样式切换 |
| `Footer` | 页脚 |
| `HealthBadge` | API 健康状态指示器 |

### 7.9 设计系统

**颜色体系:**

| 用途 | 色值 | 变量名 |
|------|------|--------|
| 品牌色（靛蓝） | `#6366F1` | `--color-brand-500` |
| JPYC 色（金色） | `#F59E0B` | `--color-jpyc-500` |
| 暗色背景 | `#0F172A` | `--color-surface-900` |

**预定义样式类:**
- 按钮: `btn-primary`, `btn-secondary`, `btn-jpyc`
- 徽章: `badge-green`, `badge-yellow`, `badge-blue`, `badge-gray`, `badge-red`
- 输入: `input-field`, `select-field`
- 布局: `container-main`
- 加载: `skeleton`, `animate-fade-in`, `animate-slide-up`

---

## 8. API 接口

### 8.1 健康检查

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/v1/health` | 返回 `{ ok: true }` |

### 8.2 店铺与套餐

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/v1/venues` | 店铺列表 |
| GET | `/v1/venues/:venueId/plans` | 指定店铺的套餐列表 |

### 8.3 身份验证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/v1/identity/verify` | 本人确认（`{ userId, venueId }`） |

### 8.4 会话管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/v1/sessions/checkin` | 入店签到 |
| POST | `/v1/sessions/checkout` | 结账（需 `idempotency-key` header） |

### 8.5 用户

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/v1/user/balance` | JPYC 余额（含已托管金额） |

### 8.6 通行证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/v1/passes/purchase` | 购买通行证（需 `idempotency-key`） |
| POST | `/v1/passes/:passId/transfer` | 转让通行证 |

### 8.7 商家

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/v1/merchant/venues` | 创建店铺 |
| POST | `/v1/merchant/venues/:id/seats` | 管理座席 |
| POST | `/v1/merchant/compute/enable` | 启用算力功能 |

### 8.8 算力

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/v1/compute/nodes` | 算力节点列表 |
| POST | `/v1/compute/jobs` | 提交计算任务 |
| GET | `/v1/compute/jobs/:jobId` | 查询 Job 状态 |
| POST | `/v1/compute/jobs/:jobId/cancel` | 取消 Job |
| GET | `/v1/compute/jobs/:jobId/result` | 获取 Job 结果 |

---

## 9. 数据流与状态管理

### 9.1 Zustand Store 划分

| Store | 职责 |
|-------|------|
| `venue.store` | 店铺与套餐数据 |
| `pass.store` | 用户通行证列表 |
| `session.store` | 活跃会话 |
| `user.store` | JPYC 余额等用户信息 |
| `compute.store` | 算力节点、Job 列表、UI 筛选状态 |
| `chainSync.store` | 链上同步进度与错误 |

### 9.2 典型数据流

```
┌─────────┐     ┌────────────┐     ┌──────────┐     ┌───────┐
│  View   │ ──► │ Controller │ ──► │ Service  │ ──► │ Store │
│ (页面)  │     │   (Hook)   │     │          │     │       │
│  渲染   │ ◄── │  只读Store │     │ 拉数+写入│ ──► │ 缓存  │
└─────────┘     └────────────┘     └──────────┘     └───────┘
                                        │
                              ┌─────────┴────────┐
                              ▼                  ▼
                        api-client          IndexedDB
                         (HTTP)         (链上事件索引)
```

### 9.3 关键数据流示例

| 操作 | 数据源 | 流向 |
|------|--------|------|
| 店铺列表 | HTTP API | HTTP → Service → Store → View |
| 算力节点列表 | IndexedDB (链上事件) | Indexer → IndexedDB → Service → Store → View |
| 提交 Job | HTTP API | View → Controller → Service → HTTP |
| Job 状态 | IndexedDB (链上事件) | Indexer → IndexedDB → Service → Store → View |
| 链同步状态 | Indexer | Indexer → Service → Store → View |

---

## 10. 开发指南

### 10.1 环境要求

- Node.js >= 20.0.0
- npm >= 10

### 10.2 安装与启动

```bash
# 安装依赖
npm install

# 全栈启动 (API + Web)
npm run dev

# 仅启动前端 (http://localhost:3000)
npm run dev -w @nodestay/web

# 仅启动后端
npm run dev -w @nodestay/api
```

### 10.3 测试

```bash
# 全部测试
npm test

# 前端测试
npm run test -w @nodestay/web

# 后端测试
npm run test -w @nodestay/api

# 合约测试 (61 tests)
cd packages/contracts && npx hardhat test

# 合约覆盖率
cd packages/contracts && npx hardhat coverage
```

### 10.4 合约编译与部署

```bash
cd packages/contracts

# 编译
npx hardhat compile

# 部署到 Amoy 测试网
npx hardhat run scripts/deploy.ts --network amoy

# 部署到 Polygon 主网
npx hardhat run scripts/deploy.ts --network polygon
```

### 10.5 相关文档

| 文档 | 说明 |
|------|------|
| `README.md` | 项目总览（日语） |
| `docs/SPEC.md` | 接口规范（各层边界定义） |
| `docs/TEST_SPEC.md` | 测试规范 |
| `docs/PROJECT.md` | 本文档（项目功能介绍） |

---

*文档版本：PROJECT — 更新于 2026-03-06*
