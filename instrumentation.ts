// Next.js 启动钩子。当设置了 HTTPS_PROXY / HTTP_PROXY 时，把全局 fetch 切换到走代理。
// 仅在 Node.js runtime 注册（Edge runtime 不支持 ProxyAgent，也不参与本地 OAuth 调用）。

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const proxy =
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy;

  if (!proxy) return;

  try {
    const { ProxyAgent, setGlobalDispatcher } = await import("undici");
    setGlobalDispatcher(new ProxyAgent(proxy));
    // eslint-disable-next-line no-console
    console.log(`[instrumentation] fetch proxy enabled via ${proxy}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[instrumentation] failed to set proxy agent:", error);
  }
}
