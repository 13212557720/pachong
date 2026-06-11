import { DEFAULT_PORT as COMMON_DEFAULT_PORT } from "@/constants";

export const DEFAULT_PORT = String(COMMON_DEFAULT_PORT);
export const DEFAULT_DATA_DIR = "data/chrome_data_2234";
export const DEFAULT_CLOSE_AFTER_SECONDS = "5";
export const DEFAULT_PAGE_URL = "https://example.com";

export const SAME_SITE_OPTIONS = ["Strict", "Lax", "None"] as const;
export type SameSiteOption = (typeof SAME_SITE_OPTIONS)[number];


export const PAGE_ACTION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "runInstagramAction", label: "Instagram 自动化" },
  { value: "runFacebookAction", label: "Facebook 自动化（占位）" },
  { value: "none", label: "仅打开页面" },
];

export const SCAN_SELECTED_IDS_KEY = "adspower_scan_selected_ids";
