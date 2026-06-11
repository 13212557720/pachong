import { Locator, Page } from "playwright";
import { createActionLogger } from "../logging/actionLog";
const log = createActionLogger("IG");

/**
 * 模拟人类点击操作
 *
 * @param page - Playwright Page 实例
 * @param selector - 目标元素选择器
 * @param timeoutMs - 等待元素可见的超时时间
 * @param logUrl - 日志记录用的 URL
 * @throws {Error} 元素不可见或无位置信息时抛出
 * @note 模拟真实鼠标移动轨迹，包含随机偏移和分步移动
 */
export async function humanClick(page: Page, selector: string, timeoutMs: number, logUrl: string) {
    const locator: Locator = page.locator(selector).first();
    log("等待按钮可见", `selector=${selector}, timeout=${timeoutMs}ms`, logUrl);
    await locator.waitFor({ state: "visible", timeout: timeoutMs });
    const box = await locator.boundingBox();
    if (!box) throw new Error(`元素 ${selector} 没有可见位置`);

    const targetX = box.x + randomBetween(0.3, 0.7) * box.width;
    const targetY = box.y + randomBetween(0.3, 0.7) * box.height;
    await page.mouse.move(targetX + randomBetween(-100, 100), targetY + randomBetween(-100, 100), {
        steps: 10,
    });
    await new Promise((resolve) => setTimeout(resolve, Math.round(randomBetween(200, 500))));
    await page.mouse.move(targetX, targetY, { steps: 20 });
    await new Promise((resolve) => setTimeout(resolve, Math.round(randomBetween(50, 200))));
    await page.mouse.down();
    await new Promise((resolve) => setTimeout(resolve, Math.round(randomBetween(50, 150))));
    await page.mouse.up();
}

/**
 * 生成指定范围内的随机数
 *
 * @param min - 最小值（包含）
 * @param max - 最大值（包含）
 * @returns 随机浮点数
 */
export function randomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min);
}
