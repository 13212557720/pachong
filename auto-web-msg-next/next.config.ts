/**
 * Next.js 配置文件
 *
 * 此文件用于配置 Next.js 应用的构建和运行行为。
 * - output: "standalone" 启用独立部署模式，输出可自包含的可执行文件
 * - allowedDevOrigins: 设置开发环境允许的额外 origins
 *
 * @module next.config
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",  // 独立部署模式，启用后会输出可自包含的可执行文件
  reactCompiler: true,

  /* config options here */
  allowedDevOrigins: ['192.168.3.253'],
  // 排除运行时产生的数据文件夹以及多余源码，避免 Next.js standalone 包体积过大。
  outputFileTracingExcludes: {
    '*': [
      'data/**/*',
      'logs/**/*',
      'scripts/**/*',
      'test/**/*',
      '*.exe',
      '*.yaml',
      'README.md',
      'AGENTS.md',
      '.git/**/*',
      'src/**/*',
      'auto-web-msg-next.json'
    ],
  },
  outputFileTracingIncludes: {
    '*': [
      './run-*',
      'start.js'
    ],
  }
};

export default nextConfig;
