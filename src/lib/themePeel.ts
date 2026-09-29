// 主题"掀开"动画的触发点：由 ThemeToggle 在点击时记录（按钮中心坐标），
// ShellEffects 应用新主题时取出并作为圆形揭示的圆心。用模块级变量传递，
// 避免为了一个一次性坐标污染全局 store。
let peelOrigin: { x: number; y: number } | null = null;

export function markThemePeelOrigin(x: number, y: number) {
  peelOrigin = { x, y };
}

export function takeThemePeelOrigin() {
  const origin = peelOrigin;
  peelOrigin = null;
  return origin;
}
