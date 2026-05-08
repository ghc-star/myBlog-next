import { motion } from "framer-motion";
import { usePageTitle } from "../../hooks/usePageTitle";

const name = "ghc".split("");

function Hero() {
  usePageTitle("关于");
  return (
    <section className="relative flex min-h-[70vh] flex-col items-center justify-center text-center sm:min-h-screen">
      <div className="sm:-translate-x-8 sm:-translate-y-16">
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-4 text-xs tracking-[0.18em] text-[var(--text-sub)] uppercase sm:mb-6 sm:text-sm sm:tracking-[0.25em]"
        >
          Developer · Builder · Explorer
        </motion.p>

        <div className="flex justify-center gap-1 [perspective:1000px]">
          {name.map((char, index) => (
            <motion.span
              key={`${char}-${index}`}
              initial={{ opacity: 0, y: 50, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                delay: 0.4 + index * 0.12,
                type: "spring",
                stiffness: 260,
                damping: 14,
                mass: 0.9,
              }}
              className="inline-block text-5xl font-bold sm:text-6xl md:text-7xl"
            >
              {char}
            </motion.span>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="my-3 mb-6 text-lg text-[var(--text-sub)] sm:my-4 sm:mb-8 sm:text-2xl"
        >
          MyBlog
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.6 }}
          className="mb-10 flex flex-wrap justify-center gap-3"
        >
          {[
            "Frontend Developer",
            "Lifelong Learner",
            "Open Source Enthusiast",
          ].map((tag, index) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 1.5 + index * 0.15,
                duration: 0.4,
              }}
              className="rounded-full border border-[var(--theme-accent-border)] bg-[var(--theme-accent-soft)] px-3 py-1 text-xs text-[var(--theme-accent)] sm:px-4 sm:py-1.5 sm:text-sm"
            >
              {tag}
            </motion.span>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
        className="absolute bottom-4 hidden flex-col items-center gap-2 sm:bottom-6 sm:flex md:-translate-x-8"
      >
        <span className="text-xs tracking-widest text-[var(--text-faint)] uppercase">
          Scroll
        </span>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          className="flex h-8 w-5 justify-center rounded-full border-2 border-[var(--border-normal)] pt-1.5"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
            className="h-1 w-1 rounded-full bg-[var(--text-faint)]"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

export default Hero;
