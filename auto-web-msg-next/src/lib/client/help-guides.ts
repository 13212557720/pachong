import type { HelpGuideConfig } from "@/types/components";

/**
 * / 页面使用说明配置。
 */
export const HOME_HELP_GUIDE: HelpGuideConfig = {
  title: "使用说明与字段解释",
  description: "用于管理浏览器实例、打开页面、配置自动化开关与批量任务，适合作为日常操作入口。",
  steps: [
    "先在“浏览器实例”中填写端口和数据目录并启动实例，确认状态为 running。",
    "在“页面操作”中输入目标 URL，先用高亮模式验证元素定位，再开启真实发送。",
    "按需开启自动化发送开关并配置高亮选择器，建议每次改选择器后先小规模验证。",
    "使用批量任务面板导入任务，先看预览再执行，避免错误链接进入正式流程。",
    "批量完成后回看实例配置，按需调整并发和自动关闭时间，降低资源占用。",
  ],
  fields: [
    {
      field: "port",
      meaning: "浏览器远程调试端口。",
      example: "2234",
      note: "同一端口不能重复启动多个实例。",
    },
    {
      field: "data",
      meaning: "浏览器用户数据目录。",
      example: "D:\\profiles\\ig-2234",
      note: "建议每个实例使用独立目录。",
    },
    {
      field: "send_enabled",
      meaning: "是否执行真实发送动作。",
      example: "true / false",
      note: "关闭时仅做定位/高亮，不会点击发送。",
    },
    {
      field: "highlight_selector",
      meaning: "高亮模式下用于标记目标元素的选择器。",
      example: "div[role='button'] svg[aria-label='Send']",
      note: "用于调试页面元素定位。",
    },
  ],
  tip: "首页负责实例与任务编排；抓取和增强建议在“抓取/额外处理”页面执行。",
};

/**
 * /getdata 页面使用说明配置。
 */
export const GETDATA_HELP_GUIDE: HelpGuideConfig = {
  title: "使用说明与字段解释",
  description: "用于发起 following 抓取、查看任务进度、筛选用户池并导出目标数据。",
  steps: [
    "填写 headers(JSON)，支持自动保存到本地并在刷新后复用。",
    "选择抓取目标：手动输入 userid，或在用户池表格点击“抓取/重新抓取”。",
    "启动任务后在日志区观察 run_id、pages、records 与 current_max_id。",
    "任务完成后查看摘要与前 20 条预览，再到用户池按筛选条件二次处理或导出。",
  ],
  fields: [
    {
      field: "userid",
      meaning: "本次抓取目标用户 ID。",
      example: "78255850299",
      note: "不能为空，支持手动输入或从用户池行触发。",
    },
    {
      field: "headers",
      meaning: "请求 Instagram 接口所需的请求头 JSON。",
      example: '{"cookie":"sessionid=...","x-csrftoken":"..."}',
      note: "至少包含 cookie；JSON 格式错误会被拦截。",
    },
    {
      field: "run_id",
      meaning: "后台任务唯一标识。",
      example: "getdata_1712635000000_ab12cd",
      note: "用于轮询任务进度。",
    },
    {
      field: "current_max_id",
      meaning: "当前分页游标（next_max_id）。",
      example: "1200 / undefined",
      note: "为 undefined 表示已抓取到最后一页。",
    },
    {
      field: "repeat_count",
      meaning: "该用户在聚合日志中出现的总次数。",
      example: "3",
      note: "由数据库聚合统计。",
    },
    {
      field: "is_completed",
      meaning: "该用户是否存在对应抓取日志文件。",
      example: "true / false",
      note: "true 时点击按钮会先提示“重新抓取”确认。",
    },
  ],
  tip: "重新抓取会写入新的 run 记录，不会删除历史运行记录。",
};

/**
 * /extra-data 页面使用说明配置。
 */
export const EXTRA_DATA_HELP_GUIDE: HelpGuideConfig = {
  title: "使用说明与字段解释",
  description: "用于按页增强数据库用户池，支持复杂筛选、分页处理与可选数量导出。",
  steps: [
    "先选择一个运行中的实例端口。",
    "先用筛选条件（如粉丝区间、IP 包含/排除）收敛数据范围。",
    "确认当前页用户（默认每页 20 条，可自定义并支持跳页）。",
    "点击“执行当前页增强”，系统会逐条抓取并即时写回数据库。",
    "需要留档时可直接导出 CSV/XLSX，并设置导出数量上限。",
    "查看执行结果中的 processed/success/failed 与失败明细。",
  ],
  fields: [
    {
      field: "followers_count",
      meaning: "从用户主页读取并格式转换后的粉丝数。",
      example: "548000",
      note: "支持“万/亿”转换，未取到时可能为空字符串。",
    },
    {
      field: "ip_location",
      meaning: "账号属地抓取结果。",
      example: "西班牙 / 未知",
      note: "未获取成功时统一写“未知”。",
    },
    {
      field: "is_private",
      meaning: "账号隐私状态。",
      example: "true / false",
      note: "会影响粉丝数与 IP 的抓取分支。",
    },
    {
      field: "processed / success / failed",
      meaning: "本批次处理、成功、失败数量。",
      example: "10 / 8 / 2",
      note: "单条失败不会中断整批。",
    },
  ],
  tip: "当前实现为“每处理一条即回写”模式，可降低长任务中断导致的数据丢失风险。",
};

/**
 * /pgsqlDetails 页面使用说明配置。
 */
export const PGSQL_HELP_GUIDE: HelpGuideConfig = {
  title: "使用说明与字段解释",
  description: "用于查看 PostgreSQL 库状态、表结构和分页数据，并支持动态列筛选与导出。",
  steps: [
    "进入页面后会自动加载数据库状态与可访问表列表。",
    "点击任意表名进入该表数据视图。",
    "通过动态筛选按列设置关键词/区间/布尔值，并按需勾选 includeNull。",
    "使用分页按钮、跳页和每页条数查看不同数据片段。",
    "导出时可设置数量上限，避免一次性导出过大数据集。",
    "结合列元信息（类型/可空）判断数据结构与质量。",
  ],
  fields: [
    {
      field: "database_size",
      meaning: "当前数据库总体占用空间。",
      example: "128 MB",
      note: "用于快速感知体量变化。",
    },
    {
      field: "active_connections",
      meaning: "当前活动连接数。",
      example: "12",
      note: "接近 max_connections 时需关注连接池配置。",
    },
    {
      field: "column_name / data_type",
      meaning: "字段名与数据库字段类型。",
      example: "created_at / timestamp with time zone",
      note: "用于排查类型不匹配问题。",
    },
    {
      field: "total / total_pages",
      meaning: "当前表总行数与分页总页数。",
      example: "1024 / 52",
      note: "分页查询时基于 page_size 实时计算。",
    },
  ],
  tip: "本页为只读管理视图，不执行写入操作；导出默认建议先小数量验证。",
};

