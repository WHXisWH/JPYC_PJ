/**
 * Store 规范（SPEC §9、TODO M11）
 *
 * 约定：
 * - **Service 写、Controller 只读**：拉数与转换由 Service 完成，Service 将结果写入 Store；
 *   Controller 仅订阅 Store 并暴露给 View，不直接写 Store。
 * - State 结构：每个 store 包含业务数据 + loading + error。
 * - **供 Service 调用的 setter**：如 setVenues、setLoading、setError、setNodes、setJobs 等，
 *   Service 在拉取/转换后调用这些 setter 更新 state。
 * - **供 Controller 的 selector**：Controller 通过 getState() 或 useSelector 只读 state，
 *   或使用 store 暴露的 getters（如 getVenues()、isLoading()）。
 * - 错误/加载状态字段：每个 store 统一提供 loading: boolean、error: string | null，
 *   Service 在请求前 setLoading(true)、setError(null)，请求后 setLoading(false)，
 *   失败时 setError(message)。
 */

export type StoreLoading = boolean;
export type StoreError = string | null;
