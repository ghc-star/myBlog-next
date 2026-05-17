// Next.js 启动钩子。当设置了 HTTPS_PROXY / HTTP_PROXY 时，把全局 fetch 切换到走代理。
// 仅在 Node.js runtime 注册（Edge runtime 不支持 ProxyAgent，也不参与本地 OAuth 调用）。
//
// 注意：用 EnvHttpProxyAgent 而不是 ProxyAgent，原因有两个
// 1. EnvHttpProxyAgent 自带 NO_PROXY 解析，本地服务（127.0.0.1 / localhost / Qdrant 等）自动绕过
// 2. ProxyAgent 走 HTTP CONNECT 时要求 header 全是 ASCII，Next.js Server Action
//    在某些回调链里会带含中文的 header，导致 "Cannot convert argument to a ByteString"

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const proxy =
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy;

  if (!proxy) return;

  // 兜底 NO_PROXY，确保本地服务永远走直连
  const noProxy = process.env.NO_PROXY || process.env.no_proxy;
  const localBypass = "localhost,127.0.0.1,::1";
  process.env.NO_PROXY = noProxy
    ? `${noProxy},${localBypass}`
    : localBypass;

  try {
    const { EnvHttpProxyAgent, setGlobalDispatcher } = await import("undici");
    setGlobalDispatcher(new EnvHttpProxyAgent());
    // eslint-disable-next-line no-console
    console.log(
      `[instrumentation] fetch proxy enabled via ${proxy} (bypass: ${process.env.NO_PROXY})`,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[instrumentation] failed to set proxy agent:", error);
  }
}
