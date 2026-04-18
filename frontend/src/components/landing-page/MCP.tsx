import { motion } from "framer-motion";

export function MCPLandingSection() {
  const fadeUp = {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.35 },
    transition: { duration: 0.65, ease: "easeOut" as const },
  };

  return (
    <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
      <motion.div className="text-center mb-10" {...fadeUp}>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          Natural Language. Real Actions.
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          ImgZenix MCP lets you manage folders and images with simple,
          human-like requests. No menus, no forms. Describe what you want and
          let the system execute it.
        </p>
      </motion.div>

      <motion.div
        className="my-10 h-px w-full bg-border"
        initial={{ opacity: 0, scaleX: 0.8 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        <motion.figure
          initial={{ opacity: 0, y: 36, rotate: -0.8 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, delay: 0.08, ease: "easeOut" }}
          className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_60px_-36px_var(--primary)]"
        >
          <div className="border-b border-border px-4 py-3 text-sm font-medium text-muted-foreground">
            Chat 1
          </div>
          <div className="aspect-[16/10] bg-background/70 p-3 sm:p-4 flex items-center justify-center">
            <img
              src="/landing-page/create-folder.png"
              alt="MCP chat where user creates a nested folder"
              className="mx-auto h-full w-auto rounded-lg object-contain"
              style={{ background: "var(--background)" }}
            />
          </div>
        </motion.figure>

        <motion.figure
          initial={{ opacity: 0, y: 36, rotate: 0.8 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_60px_-36px_var(--accent)]"
        >
          <div className="border-b border-border px-4 py-3 text-sm font-medium text-muted-foreground">
            Chat 2
          </div>
          <div className="aspect-[16/10] bg-background/70 p-3 sm:p-4 flex items-center justify-center">
            <img
              src="/landing-page/upload-image.png"
              alt="MCP chat where user uploads image to folder"
              className="mx-auto h-full w-auto rounded-lg object-contain"
              style={{ background: "var(--background)" }}
            />
          </div>
        </motion.figure>
      </div>

      <motion.div
        className="my-10 h-px w-full bg-border"
        initial={{ opacity: 0, scaleX: 0.8 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.55, ease: "easeOut", delay: 0.15 }}
      />

      <motion.div className="text-center" {...fadeUp}>
        <p className="text-base font-semibold text-primary mb-1 tracking-[0.08em] uppercase">
          From clicks to commands
        </p>
        <p className="text-xl text-foreground font-medium mb-2">
          Skip the interface. Describe what you want.
        </p>
        <p className="text-muted-foreground text-base">
          Just type what you want and let the system handle the rest.
        </p>
      </motion.div>
    </section>
  );
}
