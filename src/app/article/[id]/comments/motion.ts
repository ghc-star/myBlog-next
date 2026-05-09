export const fadeUpMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.24, ease: "easeOut" },
} as const;

export const expandMotion = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.2, ease: "easeOut" },
} as const;

export const quickTapMotion = {
  whileTap: { scale: 0.96 },
  transition: { duration: 0.16 },
} as const;
