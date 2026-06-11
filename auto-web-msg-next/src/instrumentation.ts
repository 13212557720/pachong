import { createLogger } from "@/lib/logger";

const logger = createLogger("instrumentation");

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    logger.info("项目启动完毕");
  }
}
