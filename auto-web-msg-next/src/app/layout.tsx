import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { FloatingMonitor } from "@/components/features/FloatingMonitor";
import { LogMonitor } from "@/components/features/LogMonitor";
import { InitScanner } from "@/components/features/InitScanner";

/**
 * 应用根布局组件
 *
 * 定义全局 HTML 结构、字体配置和导航菜单：
 * - 引入 Inter、Geist、Geist_Mono 字体
 * - 配置响应式导航栏（首页、getdata、data、extra-data）
 * - 提供页面内容插槽
 *
 * @module app/layout
 */

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Auto Web Msg - Next Dev",
  description: "Next + Playwright JS 管理台（Server Actions 直连）",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}>
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-12 w-full max-w-7xl items-center gap-2 px-4">
            <Link href="/" className="text-sm font-semibold">
              Auto Web Msg
            </Link>
            <nav className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="rounded-md px-2 py-1 hover:bg-muted hover:text-foreground">
                首页
              </Link>
              <Link href="/getdata" className="rounded-md px-2 py-1 hover:bg-muted hover:text-foreground">
                抓取
              </Link>
              <Link href="/extra-data" className="rounded-md px-2 py-1 hover:bg-muted hover:text-foreground">
                额外处理
              </Link>
              <Link href="/pgsqlDetails" className="rounded-md px-2 py-1 hover:bg-muted hover:text-foreground">
                PG管理
              </Link>
              <Link href="/browser-manager" className="rounded-md px-2 py-1 hover:bg-muted hover:text-foreground">
                浏览器管理
              </Link>
              {/* <Link href="/ig-accounts" className="rounded-md px-2 py-1 hover:bg-muted hover:text-foreground">
                IG代理池
              </Link> */}
              <Link href="/settings" className="rounded-md px-2 py-1 hover:bg-muted hover:text-foreground">
                设置
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <LogMonitor />
        <FloatingMonitor />
        <InitScanner />
      </body>
    </html>
  );
}
