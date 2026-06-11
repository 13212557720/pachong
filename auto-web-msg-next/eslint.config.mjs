/**
 * ESLint Flat Config 配置文件
 *
 * 此文件使用 ESLint 9.x 的 flat config 格式配置代码检查规则。
 * 集成了 Next.js Core Web Vitals 和 TypeScript 的推荐规则集。
 *
 * @module eslint.config
 */
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;