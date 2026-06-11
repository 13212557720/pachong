import { Metadata } from "next";
import { BrowserManagerClient } from "./_components/BrowserManagerClient";

export const metadata: Metadata = {
  title: "浏览器管理 - AdsPower",
  description: "管理和启动 AdsPower 浏览器实例",
};

export default function BrowserManagerPage() {
  return (
    <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
      <BrowserManagerClient />
    </main>
  );
}
