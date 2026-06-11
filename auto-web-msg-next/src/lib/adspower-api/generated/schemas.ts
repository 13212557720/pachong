export interface paths {
    "/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 连接状态
         * @description 用于检查当前设备 API 接口的可用性。
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *       "code": 0,
                         *       "msg": "success"
                         *     }
                         */
                        "application/json": {
                            code: number;
                            msg: string;
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/browser/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 打开环境
         * @description 通过指定 user_id 或 serial_number 来启动指定的浏览器环境。两者不能同时为空。
         */
        get: {
            parameters: {
                query?: {
                    /**
                     * @description 必填 字符串 创建环境后生成的唯一环境ID。
                     * @example 环境 ID
                     */
                    user_id?: string;
                    /**
                     * @description 选填 字符串 填写 user_id 时优先使用 user_id。
                     * @example 环境序号
                     */
                    serial_number?: string;
                    /**
                     * @description 选填 字符串 默认: 0
                     *      1: 否
                     *      0: 是
                     * @example 打开平台或历史页面。
                     */
                    open_tabs?: string;
                    /**
                     * @description 选填 字符串 默认: 1
                     *      1: 是
                     *      0: 否
                     * @example 是否打开IP检测页面
                     */
                    ip_tab?: string;
                    /**
                     * @description 选填 字符串 默认: 0
                     *      1: 是
                     *      0: 否
                     * @example 是否使用新版IP检测页面
                     */
                    new_first_tab?: string;
                    /**
                     * @description 选填 字符串 详情参考 Chromium 命令行开关。示例: ["--window-position=400,0", "--blink-settings=imagesEnabled=false", "--disable-notifications"]
                     * @example 浏览器启动参数[]
                     */
                    launch_args?: string;
                    /**
                     * @description `string` `Optional` `Default: 0`
                     *     `1`：Yes
                     *     `0`：No
                     * @example 是否启动无头浏览器
                     */
                    headless?: string;
                    /**
                     * @description `string` `Optional` `Default: 0`
                     *     `1`：Yes
                     *     `0`：No
                     * @example 是否禁用自动填充密码
                     */
                    disable_password_filling?: string;
                    /**
                     * @description 选填 字符串 默认: 0 磁盘空间不足时可设置为1。 1: 是 0: 否
                     * @example 关闭浏览器后是否删除缓存
                     */
                    clear_cache_after_closing?: string;
                    /**
                     * @description 选填 字符串 默认: 0 仅限 Chrome 内核。 1: 是 0: 否
                     * @example 是否允许保存密码
                     */
                    enable_password_saving?: string;
                    /**
                     * @description 选填 字符串 默认: 1 在 iOS 和 Android 上强制启用。 1: 是 0: 否
                     * @example 是否屏蔽CDP检测。
                     */
                    cdp_mask?: string;
                    /**
                     * @description 选填 字符串 设为1代表100%原始大小。范围: 0.1 ~ 2。仅当 Chrome 128及以上 且 UA为 Android 或 iOS 时有效。
                     * @example 设置移动模式下的缩放比例。
                     */
                    device_scale?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            code?: number;
                            msg?: string;
                            data?: {
                                ws?: {
                                    puppeteer?: string;
                                    selenium?: string;
                                };
                                debug_port?: string;
                                webdriver?: string;
                            };
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/browser-profile/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 打开环境 v2
         * @description 通过指定 profile_id 或 profile_no 启动浏览器。两者不能同时为空。
         */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description 必填 字符串 创建环境后生成的唯一环境ID。
                     * @example 环境 ID
                     */
                    profile_id?: string;
                    /**
                     * @description 选填 字符串 填写 profile_id 时优先使用 user_id (或 profile_id)。
                     * @example 环境序号
                     */
                    profile_no?: string;
                    /**
                     * @description 选填 字符串 详情参考 Chromium 命令行开关。示例: ["--window-position=400,0", "--blink-settings=imagesEnabled=false", "--disable-notifications"]
                     * @example 浏览器启动参数[]
                     */
                    launch_args?: string;
                    /**
                     * @description `string` `Optional` `Default: 0`
                     *     `1`：Yes
                     *     `0`：No
                     * @example 是否以无头模式打开。
                     */
                    headless?: string;
                    /**
                     * @description `string` `Optional` `Default: 1`
                     *     `1`：Yes
                     *     `0`：No
                     * @example 是否继续浏览上次打开的页面。
                     */
                    last_opened_tabs?: string;
                    /**
                     * @description `string` `Optional` `Default: 1`
                     *     `1`：Yes
                     *     `0`：No
                     * @example 是否打开代理检测页面。
                     */
                    proxy_detection?: string;
                    /**
                     * @description 选填 字符串 默认: 0 仅在首次打开浏览器时有效。 1: 是 0: 否
                     * @example 是否启用密码填充功能。
                     */
                    password_filling?: string;
                    /**
                     * @description 选填 字符串 默认: 0 仅限 Chrome 内核。 1: 是 0: 否
                     * @example 是否保存密码。
                     */
                    password_saving?: string;
                    /**
                     * @description 选填 字符串 默认: 1 在 iOS 和 Android 上强制启用。 1: 是 0: 否
                     * @example 是否屏蔽CDP检测。
                     */
                    cdp_mask?: string;
                    /**
                     * @description 选填 字符串 设为1代表100%原始大小。范围: 0.1 ~ 2。仅当 Chrome 128及以上 且 UA为 Android 或 iOS 时有效。
                     * @example 设置移动操作系统环境的缩放比例。
                     */
                    device_scale?: string;
                    /**
                     * @description 选填 字符串 默认: 0 磁盘空间不足时可设置为1。 1: 是 0: 否
                     * @example 关闭环境后是否清除缓存。
                     */
                    delete_cache?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *         "profile_id": "abcdefg",
                     *         // "profile_no": "1234",
                     *         "launch_args": ["--window-position=400,0","--blink-settings=imagesEnabled=false", "--disable-notifications"],
                     *         "headless": "0",
                     *         "last_opened_tabs": "1",
                     *         "proxy_detection": "1",
                     *         "password_filling": "0",
                     *         "password_saving": "0",
                     *         "cdp_mask": "1",
                     *         "delete_cache": "0",
                     *         "device_scale": "1"
                     *     }
                     */
                    "application/json": {
                        profile_id: string;
                        launch_args: string[];
                        headless: string;
                        last_opened_tabs: string;
                        proxy_detection: string;
                        password_filling: string;
                        password_saving: string;
                        cdp_mask: string;
                        delete_cache: string;
                        device_scale: string;
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *         "code": 0,
                         *         "msg": "success",
                         *         "data": {
                         *             "ws": {
                         *                 "puppeteer": "ws://127.0.0.1:xxxx/devtools/browser/xxxxxxxx",// 浏览器调试接口，用于 puppeteer 自动化
                         *                 "selenium": "127.0.0.1:xxxx"  // 浏览器调试接口，用于 selenium 自动化
                         *             },
                         *              "debug_port": "xxxx", // 调试端口
                         *             "webdriver": "xxxxxxxxxxxx" // webdriver 路径
                         *         }
                         *     }
                         */
                        "application/json": {
                            code?: number;
                            msg?: string;
                            data?: {
                                ws?: {
                                    puppeteer?: string;
                                    selenium?: string;
                                };
                                debug_port?: string;
                                webdriver?: string;
                            };
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/browser/stop": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 关闭环境
         * @description 通过 user_id 或 serial_number 关闭指定的浏览器环境。两者不能同时为空。
         */
        get: {
            parameters: {
                query?: {
                    /**
                     * @description 必填 字符串 创建环境后生成的唯一环境ID。
                     * @example 环境 ID
                     */
                    user_id?: string;
                    /**
                     * @description 选填 字符串 填写 user_id 时优先使用 user_id。
                     * @example 环境序号
                     */
                    serial_number?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, never>;
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/browser-profile/stop": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 关闭环境 v2
         * @description 通过 profile_id 或 profile_no 关闭指定的浏览器环境。两者不能同时为空。
         */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description 选填 字符串 环境创建成功后生成的唯一ID。profile_id 和 profile_no 必须提供其一。
                     * @example 环境 ID
                     */
                    profile_id?: string;
                    /**
                     * @description 选填 字符串 填写 profile_id 时优先使用 user_id (或 profile_id)。
                     * @example 环境序号
                     */
                    profile_no?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *         // "profile_no": "1234",
                     *         "profile_id": "abcdefg"
                     *     }
                     */
                    "application/json": {
                        profile_id: string;
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *       "code": 0,
                         *       "msg": "success"
                         *     }
                         */
                        "application/json": {
                            code: number;
                            msg: string;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/browser/active": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 检查启动状态 (当前设备)
         * @description 用于检查环境启动状态。
         */
        get: {
            parameters: {
                query?: {
                    /**
                     * @description 必填 字符串 创建环境后生成的唯一环境ID。
                     * @example xxxxx
                     */
                    user_id?: string;
                    /**
                     * @description 选填 字符串 填写 profile_id 时优先使用 user_id (或 profile_id)。
                     * @example 123
                     */
                    serial_number?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *         "code": 0,
                         *         "msg": "success",
                         *         "data": {
                         *             "status": "Active", // “Active” 表示环境已打开；“Inactive” 表示未打开。
                         *             "ws": {
                         *                 "puppeteer": "ws://127.0.0.1:xxxx/devtools/browser/xxxxxx", // 浏览器调试 API，用于 Puppeteer 自动化。
                         *                 "selenium": "127.0.0.1:xxxx" // 浏览器调试 API，用于 Selenium 自动化。
                         *             },
                         *             "debug_port": "xxxx",
                         *             "webdriver": "xxxxxxx"
                         *         }
                         *     }
                         */
                        "application/json": {
                            code?: number;
                            msg?: string;
                            data?: {
                                status?: string;
                                ws?: {
                                    puppeteer?: string;
                                    selenium?: string;
                                };
                                debug_port?: string;
                                webdriver?: string;
                            };
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/browser-profile/active": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 检查启动状态 (当前设备) v2
         * @description 用于检查环境启动状态。
         */
        get: {
            parameters: {
                query?: {
                    /**
                     * @description 选填 字符串 环境创建成功后生成的唯一ID。profile_id 和 profile_no 必须提供其一。
                     * @example xxxxx
                     */
                    profile_id?: string;
                    /**
                     * @description 选填 字符串 填写 profile_id 时优先使用 user_id (或 profile_id)。
                     * @example 123
                     */
                    profile_no?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *       "code": 0,
                         *       "msg": "success",
                         *       "data": {
                         *         "status": "Inactive"
                         *       }
                         *     }
                         */
                        "application/json": {
                            code?: number;
                            msg?: string;
                            data?: {
                                status?: string;
                                ws?: {
                                    puppeteer?: string;
                                    selenium?: string;
                                };
                                debug_port?: string;
                                webdriver?: string;
                            };
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/browser/cloud-active": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 检查环境状态 (跨设备)
         * @description 通过 user_id 查询浏览器环境状态，每次请求最多 100 个环境。如果团队开启了“多设备模式”，则无法获取具体状态，且响应会提示“环境未打开”。
         */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description 必填 字符串 创建环境后生成的唯一环境ID。
                     * @example 环境 ID
                     */
                    user_ids?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "user_ids": "xxx"
                     *     }
                     */
                    "application/json": {
                        user_ids: string;
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *         "code": 0,
                         *         "msg": "success",
                         *         "data": [
                         *             {
                         *                 "user_id": "xxx", // 环境 ID
                         *                 "account": "user_xxx" // 打开该环境的用户账号。
                         *             }
                         *         ]
                         *     }
                         */
                        "application/json": Record<string, never>;
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 查询活动环境
         * @description 查询当前设备上所有活动环境。
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *         "code": 0,
                         *         "msg": "success",
                         *         "data": {
                         *             "list": [
                         *                 {
                         *                     "user_id": "xxxx",
                         *                     "ws": {
                         *                         "puppeteer": "ws://127.0.0.1:xxxx/devtools/browser/xxxxxx",  // 浏览器调试 API，用于 Puppeteer
                         *                         "selenium": "127.0.0.1:xxxx" // 浏览器调试 API，用于 Selenium 自动化。
                         *                     },
                         *                     "debug_port": "xxxx",
                         *                     "webdriver": "xxxxxx"
                         *                 }
                         *             ]
                         *         }
                         *     }
                         */
                        "application/json": Record<string, never>;
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/user/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 查询环境
         * @description 通过组合多个参数精准检索浏览器环境列表。使用 page 参数翻页。
         */
        get: {
            parameters: {
                query?: {
                    /**
                     * @description 选填 数组 通过环境ID查询。示例: ["abcd01","abcd02","abcd03"]
                     * @example 环境 ID[]
                     */
                    user_id?: string;
                    /**
                     * @description 选填 数组 通过环境序号查询。示例: ["1","2","3"]
                     * @example 环境序号[]
                     */
                    serial_number?: string;
                    /**
                     * @description 选填 字符串 通过分组ID查询。
                     * @example 分组 ID
                     */
                    group_id?: string;
                    /**
                     * @description 选填 整数 默认: 1 查看指定页面的数据。
                     * @example 页码
                     */
                    page?: string;
                    /**
                     * @description 选填 整数 默认: 1 每页返回的环境数量，范围 1 ~ 1000。
                     * @example 每页数量
                     */
                    page_size?: string;
                    /**
                     * @description 选填 对象 默认: {"serial_number":"desc"} 查询结果按指定类型排序，支持 serial_number、last_open_time、created_time 字段，可选 asc (升序) 和 desc (降序)。
                     * @example 排序类型
                     */
                    user_sort?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": Record<string, never>;
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *       "data": {
                         *         "list": [
                         *           {
                         *             "name": "",
                         *             "created_time": "1754534006",
                         *             "ip": "xxx",
                         *             "ip_country": "cn",
                         *             "password": "1",
                         *             "fbcc_proxy_acc_id": "",
                         *             "ipchecker": "ipapi",
                         *             "fakey": "",
                         *             "user_proxy_config": {
                         *               "proxy_soft": "no_proxy"
                         *             },
                         *             "group_id": "xxx",
                         *             "group_name": "xxx",
                         *             "remark": "",
                         *             "last_open_time": "0",
                         *             "username": "1",
                         *             "platform": "facebook.com",
                         *             "category_id": "0",
                         *             "profile_no": "xxx",
                         *             "profile_id": "xxx"
                         *           }
                         *         ],
                         *         "page": 1,
                         *         "page_size": 1
                         *       },
                         *       "code": 0,
                         *       "msg": "Success"
                         *     }
                         */
                        "application/json": {
                            code?: number;
                            msg?: string;
                            data?: {
                                list?: ({
                                    user_id?: string;
                                    name?: string;
                                    group_name?: string;
                                    domain_name?: string;
                                    remark?: string;
                                } & {
                                    [key: string]: unknown;
                                })[];
                            };
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/browser-profile/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 查询环境 v2
         * @description 通过组合多个参数精准检索浏览器环境列表。使用 page 参数翻页。
         */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description 选填 数组 通过环境ID查询。示例: ["abcd01","abcd02","abcd03"]
                     * @example 环境 ID[]
                     */
                    profile_id?: string;
                    /**
                     * @description 选填 数组 通过环境序号查询。示例: ["1","2","3"]
                     * @example 环境序号[]
                     */
                    profile_no?: string;
                    /**
                     * @description 选填 字符串 通过分组ID查询。
                     * @example 分组 ID
                     */
                    group_id?: string;
                    /**
                     * @description 选填 整数 默认: 1 每页返回的环境数量，范围 1 ~ 1000。
                     * @example 每页数量
                     */
                    limit?: string;
                    /**
                     * @description 选填 整数 默认: 1 查看指定页面的数据。
                     * @example 页码
                     */
                    page?: string;
                    /**
                     * @description 选填 字符串 默认: profile_no 按特定类型排序。支持的值: profile_no(序号), last_open_time(最后打开时间), created_time(创建时间)
                     * @example 应用的排序类型。
                     */
                    sort_type?: string;
                    /**
                     * @description 选填 字符串 默认: desc 排序顺序: asc(升序), desc(降序)
                     * @example 排序方向。
                     */
                    sort_order?: string;
                    /**
                     * @description 选填 数组 通过标签查询环境
                     * @example 标签 ID[]
                     */
                    tag_ids?: string;
                    /**
                     * @description 选填 字符串 标签过滤逻辑。支持的值: include(默认，包含指定标签), exclude(排除指定标签)
                     * @example 标签匹配方式
                     */
                    tags_filter?: string;
                    /**
                     * @description 选填 字符串 通过名称查询环境
                     * @example 环境名称
                     */
                    name?: string;
                    /**
                     * @description 选填 字符串 名称过滤逻辑。支持的值: include(默认，包含指定名称), exclude(排除指定名称)
                     * @example 环境名称匹配方式
                     */
                    name_filter?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": Record<string, never>;
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *       "data": {
                         *         "list": [
                         *           {
                         *             "name": "",
                         *             "created_time": "1754534006",
                         *             "ip": "xxx",
                         *             "ip_country": "cn",
                         *             "password": "1",
                         *             "fbcc_proxy_acc_id": "",
                         *             "ipchecker": "ipapi",
                         *             "fakey": "",
                         *             "user_proxy_config": {
                         *               "proxy_soft": "no_proxy"
                         *             },
                         *             "group_id": "xxx",
                         *             "group_name": "xxx",
                         *             "remark": "",
                         *             "last_open_time": "0",
                         *             "username": "1",
                         *             "platform": "facebook.com",
                         *             "category_id": "0",
                         *             "profile_no": "xxx",
                         *             "profile_id": "xxx"
                         *           }
                         *         ],
                         *         "page": 1,
                         *         "page_size": 1
                         *       },
                         *       "code": 0,
                         *       "msg": "Success"
                         *     }
                         */
                        "application/json": {
                            data: {
                                list: {
                                    name?: string;
                                    created_time?: string;
                                    ip?: string;
                                    ip_country?: string;
                                    password?: string;
                                    fbcc_proxy_acc_id?: string;
                                    ipchecker?: string;
                                    fakey?: string;
                                    user_proxy_config?: {
                                        proxy_soft: string;
                                    };
                                    group_id?: string;
                                    group_name?: string;
                                    remark?: string;
                                    last_open_time?: string;
                                    username?: string;
                                    platform?: string;
                                    category_id?: string;
                                    profile_no?: string;
                                    profile_id?: string;
                                }[];
                                page: number;
                                page_size: number;
                            };
                            code: number;
                            msg: string;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/user/create": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 创建环境
         * @description 创建一个带有可配置凭证、Cookies、代理、指纹信息等配置的新浏览器环境。
         */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description 选填 字符串 环境名称，最多100个字符
                     * @example 环境名称
                     */
                    name?: string;
                    /**
                     * @description 选填 字符串 示例: facebook.com
                     * @example 平台
                     */
                    domain_name?: string;
                    /**
                     * @description 选填 字符串
                     * @example 平台账号
                     */
                    username?: string;
                    /**
                     * @description 选填 字符串
                     * @example 平台密码
                     */
                    password?: string;
                    /**
                     * @description 选填 数组 示例: ["http://www.baidu.com","https://www.google.com"]
                     * @example 标签页
                     */
                    open_urls?: string;
                    /**
                     * @description 选填 字符串 0: 允许重复(默认) 2: 按账号密码去重 3: 按Cookies去重 4: 按c_user(Facebook专有标识)去重
                     * @example 账号去重
                     */
                    repeat_config?: string;
                    /**
                     * @description 选填 字符串
                     * @example 输入 2FA 密钥
                     */
                    fakey?: string;
                    /**
                     * @description 选填 字符串
                     * @example Cookie
                     */
                    cookie?: string;
                    /**
                     * @description 选填 字符串 0(默认): 格式错误也原样返回数据 1: 过滤格式错误的Cookies并只保留有效项(仅支持Netscape格式)。
                     * @example 指定 Cookie 验证失败时的处理方式。
                     */
                    ignore_cookie_error?: string;
                    /**
                     * @description 必填 字符串 设置分配环境的分组ID。未分组使用 0。
                     * @example 分组 ID
                     */
                    group_id?: string;
                    /**
                     * @description 选填 字符串
                     * @example IP
                     */
                    ip?: string;
                    /**
                     * @description 选填 字符串
                     * @example 国家/地区
                     */
                    country?: string;
                    /**
                     * @description 选填 字符串
                     * @example 地区
                     */
                    region?: string;
                    /**
                     * @description 选填 字符串
                     * @example 城市
                     */
                    city?: string;
                    /**
                     * @description 选填 字符串 最多 1500 字符。
                     * @example 环境备注
                     */
                    remark?: string;
                    /**
                     * @description 选填 字符串 如果为空，将使用全局设置。支持: ip2location/ipapi/ipfoxy
                     * @example IP 检测器
                     */
                    ipchecker?: string;
                    /**
                     * @description 选填 字符串
                     * @example 分类 ID
                     */
                    sys_app_cate_id?: string;
                    /**
                     * @description 选填 对象 user_proxy_config 和 proxyid 必须提供其一。
                     * @example 代理配置
                     */
                    user_proxy_config?: string;
                    /**
                     * @description 选填 字符串 user_proxy_config 和 proxyid 必须提供其一。
                     * @example 代理 ID
                     */
                    proxyid?: string;
                    /**
                     * @description 必填 对象
                     * @example 指纹配置
                     */
                    fingerprint_config?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "name": "profile name",
                     *       "domain_name": "facebook.com",
                     *       "repeat_config": [
                     *         "0"
                     *       ],
                     *       "username": "",
                     *       "password": "",
                     *       "ipchecker": "ip2location",
                     *       "open_urls": [
                     *         "http://www.baidu.com",
                     *         "https://www.google.com"
                     *       ],
                     *       "cookie": "[{\"domain\": \".baidu.com\",\"expirationDate\": 1724188800,\"name\": \"BAIDUID\",\"path\": \"/\",\"sameSite\": \"unspecified\",\"secure\": true,\"value\": \"xxxxxxxxxx\",\"id\": 1}]",
                     *       "group_id": "0",
                     *       "ip": "",
                     *       "user_proxy_config": {
                     *         "proxy_soft": "no_proxy"
                     *       },
                     *       "country": "us",
                     *       "region": "california ",
                     *       "city": "riverside",
                     *       "remark": "remark",
                     *       "fingerprint_config": {
                     *         "automatic_timezone": "1",
                     *         "flash": "block",
                     *         "scan_port_type": "1",
                     *         "location": "ask",
                     *         "location_switch": "1",
                     *         "accuracy": "1000",
                     *         "canvas": "0",
                     *         "webgl": "0",
                     *         "webgl_image": "0",
                     *         "audio": "0",
                     *         "longitude": "180",
                     *         "latitude": "90",
                     *         "webrtc": "local",
                     *         "do_not_track": "true",
                     *         "hardware_concurrency": "default",
                     *         "device_memory": "default",
                     *         "gpu": "2",
                     *         "mac_address_config": {
                     *           "model": "1",
                     *           "address": ""
                     *         },
                     *         "browser_kernel_config": {
                     *           "version": "latest",
                     *           "type": "firefox"
                     *         },
                     *         "random_ua": {
                     *           "ua_system_version": [
                     *             "Android"
                     *           ]
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": {
                        name: string;
                        domain_name: string;
                        repeat_config: string[];
                        username: string;
                        password: string;
                        ipchecker: string;
                        open_urls: string[];
                        cookie: string;
                        group_id: string;
                        ip: string;
                        user_proxy_config: {
                            proxy_soft: string;
                        };
                        country: string;
                        region: string;
                        city: string;
                        remark: string;
                        fingerprint_config: {
                            automatic_timezone: string;
                            flash: string;
                            scan_port_type: string;
                            location: string;
                            location_switch: string;
                            accuracy: string;
                            canvas: string;
                            webgl: string;
                            webgl_image: string;
                            audio: string;
                            longitude: string;
                            latitude: string;
                            webrtc: string;
                            do_not_track: string;
                            hardware_concurrency: string;
                            device_memory: string;
                            gpu: string;
                            mac_address_config: {
                                model: string;
                                address: string;
                            };
                            browser_kernel_config: {
                                version: string;
                                type: string;
                            };
                            random_ua: {
                                ua_system_version: string[];
                            };
                        };
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *       "data": {
                         *         "id": "xxx",
                         *         "serial_number": "xxx"
                         *       },
                         *       "code": 0,
                         *       "msg": "Success"
                         *     }
                         */
                        "application/json": {
                            data: {
                                id: string;
                                serial_number: string;
                            };
                            code: number;
                            msg: string;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/browser-profile/create": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 创建环境 v2
         * @description 创建一个带有可配置信息(凭证、Cookies、代理、指纹等)的新浏览器环境。成功后将返回环境ID。
         */
        post: {
            parameters: {
                query: {
                    /**
                     * @description 选填 字符串 环境名称，最多100个字符
                     * @example 环境名称
                     */
                    name?: string;
                    /**
                     * @description 必填 字符串 设置分配环境的分组ID。未分组使用 0。
                     * @example 分组 ID
                     */
                    group_id?: string;
                    /**
                     * @description 选填 字符串 最多 1500 字符。
                     * @example 环境备注
                     */
                    remark?: string;
                    /**
                     * @description 选填 字符串 示例: facebook.com 账号平台字段仅适用于单账号平台配置。如果需要配置多个账号平台，请使用 platform_account。
                     * @example 平台
                     */
                    platform?: string;
                    /**
                     * @description 选填 字符串
                     * @example 平台账号
                     */
                    username?: string;
                    /**
                     * @description 选填 字符串
                     * @example 平台密码
                     */
                    password?: string;
                    /**
                     * @description 选填 字符串
                     * @example 输入 2FA 密钥
                     */
                    fakey?: string;
                    /**
                     * @description 选填 数组 JS版本需升级到 2.8.8.4 及以上。domain_name: 账号平台, login_user: 账号, password: 密码, fakey: 2FA密钥。1. 适用于单/多账号平台场景。 2. 数组中每个对象代表一组独立账号。 3. 多平台需传入对象数组。
                     * @example 多账号平台
                     */
                    platform_account: string;
                    /**
                     * @description 选填 字符串
                     * @example Cookie
                     */
                    cookie?: string;
                    /**
                     * @description 选填 字符串 0: 允许重复(默认) 2: 按账号密码去重 3: 按Cookies去重 4: 按c_user(Facebook专有)去重
                     * @example 账号去重
                     */
                    repeat_config?: string;
                    /**
                     * @description 选填 字符串 0(默认): 格式错误也原样返回 1: 过滤格式错误的Cookies(仅支持Netscape)。
                     * @example 指定 Cookie 验证失败时的处理方式。
                     */
                    ignore_cookie_error?: string;
                    /**
                     * @description 选填 数组 示例: ["http://www.baidu.com","https://www.google.com"]
                     * @example 标签页
                     */
                    tabs?: string;
                    /**
                     * @description `object` `Optional`  Either user_proxy_config or proxyid must be provided. Only one is required.
                     * @example 代理配置
                     */
                    user_proxy_config?: string;
                    /**
                     * @description 选填 字符串 user_proxy_config 和 proxyid 必须提供其一。
                     * @example 代理 ID
                     */
                    proxyid?: string;
                    /**
                     * @description 选填 字符串
                     * @example IP
                     */
                    ip?: string;
                    /**
                     * @description 选填 字符串
                     * @example 国家/地区
                     */
                    country?: string;
                    /**
                     * @description 选填 字符串
                     * @example 地区
                     */
                    region?: string;
                    /**
                     * @description 选填 字符串
                     * @example 城市
                     */
                    city?: string;
                    /**
                     * @description 选填 字符串 如果为空，将使用全局设置。支持: ip2location/ipapi/ipfoxy
                     * @example IP 检测器
                     */
                    ipchecker?: string;
                    /**
                     * @description 必填 对象
                     * @example 指纹配置
                     */
                    fingerprint_config?: string;
                    /**
                     * @description 选填 字符串
                     * @example 分类 ID
                     */
                    category_id?: string;
                    /**
                     * @description 选填 字符串 每个环境最多分配 30 个标签。
                     * @example 标签 ID
                     */
                    profile_tag_ids?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *         "name": "profile name",
                     *         "platform": "baidu.com",
                     *         "tabs": ["https://google.com", "https://yuanbao.com"],
                     *         "repeat_config": [],
                     *         "username": "123",
                     *         "password": "123",
                     *         "fakey": "",
                     *         "platform_account": [
                     *         {
                     *           "domain_name": "https://www.google.com",
                     *           "login_user": "abc",
                     *           "password": "123",
                     *           "fakey": "abc123"
                     *         },
                     *         {
                     *           "domain_name": "https://www.facebook.com",
                     *           "login_user": "def",
                     *           "password": "456",
                     *           "fakey": "def456"
                     *         }
                     *       ],
                     *         "cookie":"[{\"domain\": \".baidu.com\",\"expirationDate\": 1724188800,\"name\": \"BAIDUID\",\"path\": \"/\",\"sameSite\": \"unspecified\",\"secure\": true,\"value\": \"xxxxxxxxxx\",\"id\": 1}]",
                     *         "ignore_cookie_error": "1",
                     *         "group_id": "0",
                     *         "ip": "",
                     *         "country": "sg",
                     *         "region": "",
                     *         "city": "sg",
                     *         "remark": "remarks",
                     *         "ipchecker": "ip2location",
                     *         //"category_id": "4",
                     *         // "user_proxy_config":{"proxy_soft":"proxy302auto","global_config":"1"},
                     *         "proxyid": "random",
                     *         "fingerprint_config": {
                     *             "automatic_timezone": "1",
                     *             "flash": "block",
                     *             "scan_port_type": "1",
                     *             "location": "ask",
                     *             "location_switch": "1",
                     *             "accuracy": "1000",
                     *             "canvas": "0",
                     *             "webgl": "0",
                     *             "webgl_image": "0",
                     *             "audio": "0",
                     *             "longitude":"180",
                     *             "latitude":"90",
                     *             "webrtc": "local",
                     *             "do_not_track": "true",
                     *             "hardware_concurrency": "default",
                     *             "device_memory": "default",
                     *             "gpu": "2",
                     *             "mac_address_config": {
                     *                 "model": "1",
                     *                 "address": ""
                     *             },
                     *             "browser_kernel_config": {
                     *                 "version": "latest",
                     *                 "type":"firefox"
                     *             },
                     *             "random_ua":{
                     *                 "ua_system_version": ["Android"]
                     *             }
                     *         }
                     *     }
                     */
                    "application/json": {
                        name: string;
                        platform: string;
                        tabs: string[];
                        repeat_config: unknown[];
                        username: string;
                        password: string;
                        fakey: string;
                        platform_account: {
                            domain_name: string;
                            login_user: string;
                            password: string;
                            fakey: string;
                        }[];
                        cookie: string;
                        ignore_cookie_error: string;
                        group_id: string;
                        ip: string;
                        country: string;
                        region: string;
                        city: string;
                        remark: string;
                        ipchecker: string;
                        proxyid: string;
                        fingerprint_config: {
                            automatic_timezone: string;
                            flash: string;
                            scan_port_type: string;
                            location: string;
                            location_switch: string;
                            accuracy: string;
                            canvas: string;
                            webgl: string;
                            webgl_image: string;
                            audio: string;
                            longitude: string;
                            latitude: string;
                            webrtc: string;
                            do_not_track: string;
                            hardware_concurrency: string;
                            device_memory: string;
                            gpu: string;
                            mac_address_config: {
                                model: string;
                                address: string;
                            };
                            browser_kernel_config: {
                                version: string;
                                type: string;
                            };
                            random_ua: {
                                ua_system_version: string[];
                            };
                        };
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *       "data": {
                         *         "profile_id": "xxx",
                         *         "profile_no": "xxx"
                         *       },
                         *       "code": 0,
                         *       "msg": "Success"
                         *     }
                         */
                        "application/json": {
                            data: {
                                profile_id: string;
                                profile_no: string;
                            };
                            code: number;
                            msg: string;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/user/update": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 更新环境
         * @description 更新指定浏览器环境的配置，包括名称、备注、账号信息、代理设置、指纹参数等。
         */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description 必填 字符串 创建环境后生成的唯一环境ID。
                     * @example 环境 ID
                     */
                    user_id?: string;
                    /**
                     * @description 选填 字符串 环境名称，最多100个字符
                     * @example 环境名称
                     */
                    name?: string;
                    /**
                     * @description `string` `Optional`
                     *     Example:`facebook.com`
                     * @example 平台
                     */
                    domain_name?: string;
                    /**
                     * @description 选填 字符串
                     * @example 平台账号
                     */
                    username?: string;
                    /**
                     * @description 选填 字符串
                     * @example 平台密码
                     */
                    password?: string;
                    /**
                     * @description 选填 数组 示例: ["http://www.baidu.com","https://www.google.com"]
                     * @example 标签页
                     */
                    open_urls?: string;
                    /**
                     * @description 选填 字符串
                     * @example 输入 2FA 密钥
                     */
                    fakey?: string;
                    /**
                     * @description 选填 字符串
                     * @example Cookie
                     */
                    cookie?: string;
                    /**
                     * @description 选填 字符串 0(默认): 格式错误也原样返回数据 1: 过滤格式错误的Cookies并只保留有效项(仅支持Netscape格式)。
                     * @example 指定 Cookie 验证失败时的处理方式。
                     */
                    ignore_cookie_error?: string;
                    /**
                     * @description 选填 字符串
                     * @example IP
                     */
                    ip?: string;
                    /**
                     * @description 选填 字符串
                     * @example 国家/地区
                     */
                    country?: string;
                    /**
                     * @description 选填 字符串
                     * @example 地区
                     */
                    region?: string;
                    /**
                     * @description 选填 字符串
                     * @example 城市
                     */
                    city?: string;
                    /**
                     * @description 选填 字符串 最多 1500 字符。
                     * @example 环境备注
                     */
                    remark?: string;
                    /**
                     * @description 选填 字符串
                     * @example 分类 ID
                     */
                    sys_app_cate_id?: string;
                    /**
                     * @description 选填 对象
                     * @example 代理配置
                     */
                    user_proxy_config?: string;
                    /**
                     * @description 选填 字符串
                     * @example 代理 ID
                     */
                    proxyid?: string;
                    /**
                     * @description 选填 对象
                     * @example 指纹配置
                     */
                    fingerprint_config?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "user_id": "xxx",
                     *       "name": "profile name"
                     *     }
                     */
                    "application/json": {
                        user_id: string;
                        name: string;
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *       "data": {},
                         *       "code": 0,
                         *       "msg": "Success"
                         *     }
                         */
                        "application/json": {
                            data: Record<string, never>;
                            code: number;
                            msg: string;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/browser-profile/update": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 更新环境 v2
         * @description 更新指定浏览器环境的配置，包括名称、备注、账号信息、代理设置、指纹参数等。
         */
        post: {
            parameters: {
                query: {
                    /**
                     * @description 必填 字符串 创建环境后生成的唯一环境ID。
                     * @example 环境 ID
                     */
                    profile_id?: string;
                    /**
                     * @description 选填 字符串 环境名称，最多100个字符
                     * @example 环境名称
                     */
                    name?: string;
                    /**
                     * @description 选填 字符串 最多 1500 字符。
                     * @example 环境备注
                     */
                    remark?: string;
                    /**
                     * @description 选填 字符串 示例: facebook.com 账号平台字段仅适用于单账号平台配置。如果需要配置多个账号平台，请使用 platform_account。
                     * @example 平台
                     */
                    platform?: string;
                    /**
                     * @description 选填 字符串
                     * @example 平台账号
                     */
                    username?: string;
                    /**
                     * @description 选填 字符串
                     * @example 平台密码
                     */
                    password?: string;
                    /**
                     * @description 选填 字符串
                     * @example 输入 2FA 密钥
                     */
                    fakey?: string;
                    /**
                     * @description 选填 数组 详情参考创建API的说明。
                     * @example 多账号平台
                     */
                    platform_account: string;
                    /**
                     * @description 选填 字符串
                     * @example Cookie
                     */
                    cookie?: string;
                    /**
                     * @description 选填 字符串 0(默认): 格式错误也原样返回数据 1: 过滤格式错误的Cookies并只保留有效项(仅支持Netscape格式)。
                     * @example 指定 Cookie 验证失败时的处理方式。
                     */
                    ignore_cookie_error?: string;
                    /**
                     * @description 选填 数组 示例: ["http://www.baidu.com","https://www.google.com"]
                     * @example 标签页
                     */
                    tabs?: string;
                    /**
                     * @description 选填 对象
                     * @example 代理配置
                     */
                    user_proxy_config?: string;
                    /**
                     * @description 选填 字符串
                     * @example 代理 ID
                     */
                    proxyid?: string;
                    /**
                     * @description 选填 字符串
                     * @example IP
                     */
                    ip?: string;
                    /**
                     * @description 选填 字符串
                     * @example 国家/地区
                     */
                    country?: string;
                    /**
                     * @description 选填 字符串
                     * @example 地区
                     */
                    region?: string;
                    /**
                     * @description 选填 字符串
                     * @example 城市
                     */
                    city?: string;
                    /**
                     * @description 选填 字符串
                     * @example 指纹配置
                     */
                    fingerprint_config?: string;
                    /**
                     * @description 选填 字符串
                     * @example 分类 ID
                     */
                    category_id?: string;
                    /**
                     * @description `string` `Optional` Refer to Chromium command-line switches for details.(https://peter.sh/experiments/chromium-command-line-switches/)
                     *     Example: ["--window-position=400,0", "--blink-settings=imagesEnabled=false", "--disable-notifications"]
                     * @example 浏览器启动参数[]
                     */
                    launch_args?: string;
                    /**
                     * @description 选填 数组
                     * @example 标签 ID[]
                     */
                    profile_tag_ids?: string;
                    /**
                     * @description 选填 字符串 1(默认): 替换 — 替换环境所有标签。 2: 追加 — 添加标签(若总数超30则截断)。
                     * @example 环境标签更新方式
                     */
                    tags_update_type?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "profile_id": "xxx",
                     *       "name": "profile name"
                     *     }
                     */
                    "application/json": {
                        profile_id: string;
                        name: string;
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *       "data": {},
                         *       "code": 0,
                         *       "msg": "Success"
                         *     }
                         */
                        "application/json": {
                            data: Record<string, never>;
                            code: number;
                            msg: string;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/user/delete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 删除环境
         * @description 删除指定的浏览器环境，支持批量删除。一次最多可删除100个环境。
         */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description 必填 数组 环境创建后生成的唯一环境ID。
                     * @example 环境 ID[]
                     */
                    user_ids?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "user_ids": [
                     *         "xxx",
                     *         "xxx"
                     *       ]
                     *     }
                     */
                    "application/json": {
                        user_ids: string[];
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *       "data": {},
                         *       "code": 0,
                         *       "msg": "Success"
                         *     }
                         */
                        "application/json": {
                            data: Record<string, never>;
                            code: number;
                            msg: string;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/browser-profile/delete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 删除环境 v2
         * @description 删除指定的浏览器环境，支持批量删除。一次最多可删除100个环境。
         */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description 必填 数组 环境创建后生成的唯一环境ID。
                     * @example 环境 ID[]
                     */
                    profile_id?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "profile_id": [
                     *         "xxx",
                     *         "xxx"
                     *       ]
                     *     }
                     */
                    "application/json": {
                        profile_id: string[];
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *       "data": {},
                         *       "code": 0,
                         *       "msg": "Success"
                         *     }
                         */
                        "application/json": {
                            data: Record<string, never>;
                            code: number;
                            msg: string;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/user/regroup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 移动环境
         * @description 通过指定目标分组ID，将浏览器环境重新分配到不同的分组。
         */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description 必填 数组 环境创建后生成的唯一环境ID。
                     * @example 环境 ID[]
                     */
                    user_ids?: string;
                    /**
                     * @description 必填 字符串 分组创建成功后生成的唯一ID。
                     * @example 分组 ID
                     */
                    group_id?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "user_ids": [
                     *         "xxx",
                     *         "xxx"
                     *       ],
                     *       "group_id": "123"
                     *     }
                     */
                    "application/json": {
                        user_ids: string[];
                        group_id: string;
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *       "data": {},
                         *       "code": 0,
                         *       "msg": "Success"
                         *     }
                         */
                        "application/json": {
                            data: Record<string, never>;
                            code: number;
                            msg: string;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/user/delete-cache": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 清除缓存
         * @description 用于清除所有打开的浏览器生成的本地缓存。为了账号安全，请确保使用此接口时设备上没有打开的浏览器。
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, never>;
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/browser-profile/delete-cache": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 清除缓存 v2
         * @description 清除特定环境的本地缓存。为了账号安全，请确保设备上没有打开这些浏览器。
         */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description 必填 数组 环境创建后生成的唯一环境ID。
                     * @example 环境 ID[]
                     */
                    profile_id?: string;
                    /**
                     * @description 必填 数组 可选: local_storage, indexeddb, extension_cache, cookie, history, image_file
                     * @example 要清除的缓存类型。[]
                     */
                    type?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "profile_id": [
                     *         "xxx"
                     *       ],
                     *       "type": [
                     *         "history",
                     *         "image_file"
                     *       ]
                     *     }
                     */
                    "application/json": {
                        profile_id: string[];
                        type: string[];
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, never>;
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/browser-profile/share": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 分享环境
         * @description 通过账号邮箱或手机号分享环境。每次最多分享 200 个环境。
         */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description 必填 数组 环境创建后生成的唯一环境ID。
                     * @example 环境 ID[]
                     */
                    profile_id?: string;
                    /**
                     * @description 必填 字符串 接收者的账号邮箱或手机号(不含区号)
                     * @example 接收者
                     */
                    receiver?: string;
                    /**
                     * @description 选填 整数 1: 邮箱分享(默认) 2: 手机号分享
                     * @example 分享类型
                     */
                    share_type?: string;
                    /**
                     * @description 选填 字符串 默认分享凭证、Cookies、指纹等。可额外分享: name(名称), proxy(代理), remark(备注), tabs(书签标签)
                     * @example 分享内容[]
                     */
                    content?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "profile_id": [
                     *         "xxx",
                     *         "xxx",
                     *         "xxx"
                     *       ],
                     *       "share_type": 1,
                     *       "receiver": "123@123.com",
                     *       "content": [
                     *         "name",
                     *         "proxy",
                     *         "remark",
                     *         "tabs"
                     *       ]
                     *     }
                     */
                    "application/json": {
                        profile_id: string[];
                        share_type: number;
                        receiver: string;
                        content: string[];
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, never>;
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/browser-profile/cookies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 查询环境 Cookies
         * @description 查询并返回指定环境的 Cookies。每次请求只能查询一个环境。
         */
        get: {
            parameters: {
                query?: {
                    /**
                     * @description 选填 字符串 环境创建成功后生成的唯一ID。profile_id 和 profile_no 必须提供其一。
                     * @example 环境 ID
                     */
                    profile_id?: string;
                    /**
                     * @description 选填 字符串 填写 profile_id 时优先使用 user_id (或 profile_id)。
                     * @example 环境序号
                     */
                    profile_no?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, never>;
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/browser-profile/ua": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 查询环境 User-Agent
         * @description 查询并返回指定环境的 User-Agent。每次最多查询 10 个环境。
         */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description `array` `Optional` A unique ID generated after the profile is successfully created. Either profile_id or profile_no must be provided.
                     * @example 环境 ID[]
                     */
                    profile_id?: string;
                    /**
                     * @description 选填 数组 填写 profile_id 时优先使用 user_id (或 profile_id)。
                     * @example 环境序号[]
                     */
                    profile_no?: string;
                };
                header: {
                    /** @example {{Authorization}} */
                    Authorization: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "profile_id": [
                     *         "xxx",
                     *         "xxx"
                     *       ],
                     *       "profile_no": [
                     *         "xxx",
                     *         "xxx"
                     *       ]
                     *     }
                     */
                    "application/json": {
                        profile_id: string[];
                        profile_no: string[];
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, never>;
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/browser-profile/stop-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 关闭所有环境
         * @description 关闭当前设备上所有打开的环境。
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "text/plain": string;
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, never>;
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/browser-profile/new-fingerprint": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 生成新指纹
         * @description 为指定环境生成新指纹。每次请求最多支持 10 个环境。
         */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description `array` `Optional` A unique ID generated after the profile is successfully created. Either profile_id or profile_no must be provided.
                     * @example 环境 ID[]
                     */
                    profile_id?: string;
                    /**
                     * @description `array` `Optional` Priority will be given to user id when profile_id is filled.
                     * @example 环境序号[]
                     */
                    profile_no?: string;
                };
                header: {
                    /** @example {{Authorization}} */
                    Authorization: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "profile_id": [
                     *         "xxx",
                     *         "xxx"
                     *       ],
                     *       "profile_no": [
                     *         "xxx",
                     *         "xxx"
                     *       ]
                     *     }
                     */
                    "application/json": {
                        profile_id: string[];
                        profile_no: string[];
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, never>;
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/browser-profile/kernels": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 获取内核列表
         * @description 获取支持的内核列表，可按 Chrome 或 Firefox 过滤，并指示是否在本地安装。
         */
        get: {
            parameters: {
                query?: {
                    /**
                     * @description 选填 字符串 支持 Chrome 或 Firefox。默认返回所有内核类型。
                     * @example 内核类型
                     */
                    kernel_type?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, never>;
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/browser-profile/download-kernel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 下载内核
         * @description 下载或更新指定的浏览器内核版本。一次只能请求一个版本。请确保下载前没有环境正在使用该内核，否则安装将失败。
         */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description 必填 字符串 浏览器内核类型。允许值: Chrome, Firefox。
                     * @example 内核类型
                     */
                    kernel_type?: string;
                    /**
                     * @description 必填 字符串 浏览器内核版本号，如: 141。
                     * @example 内核版本
                     */
                    kernel_version?: string;
                };
                header: {
                    /** @example {{Authorization}} */
                    Authorization: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "kernel_type": "Chrome",
                     *       "kernel_version": "143"
                     *     }
                     */
                    "application/json": {
                        kernel_type: string;
                        kernel_version: string;
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, never>;
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/browser-profile/update-patch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 更新到最新补丁
         * @description 更新到最新的补丁版本。stable(默认) 更稳定; beta 为预览版。更新前请确保没有环境打开。
         */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description 选填 字符串 补丁版本类型。支持: stable (默认) 或 beta。
                     * @example 版本类型
                     */
                    version_type?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "version_type": "beta"
                     *     }
                     */
                    "application/json": {
                        version_type: string;
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *       "code": 0,
                         *       "data": {
                         *         "before_version": "v2.8.4.6",
                         *         "after_version": "v2.8.4.7",
                         *         "version_type": "stable"
                         *       },
                         *       "msg": "Please pause operations for 60 seconds and wait for the restart to complete. Check availability via the status API."
                         *     }
                         */
                        "application/json": {
                            code: number;
                            data: {
                                before_version: string;
                                after_version: string;
                                version_type: string;
                            };
                            msg: string;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/browser-tags/create": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 创建标签 */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description 必填 字符串 标签名称，最多50个字符。
                     * @example 标签名称
                     */
                    name?: string;
                    /**
                     * @description 选填 字符串 标签颜色。可选: darkBlue(默认), blue, purple, red, yellow, orange, green, lightGreen。
                     * @example 标签颜色
                     */
                    color?: string;
                };
                header: {
                    /** @example {{Authorization}} */
                    Authorization: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "tags": [
                     *         {
                     *           "name": "1", // 标签名称
                     *           "color": "lightGreen" // 标签颜色
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": {
                        tags: {
                            name?: string;
                            color?: string;
                        }[];
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, never>;
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/browser-tags/update": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 更新标签 */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description 必填 字符串 标签 ID
                     * @example 标签 ID
                     */
                    id?: string;
                    /**
                     * @description 选填 字符串 标签名称
                     * @example 标签名称
                     */
                    name?: string;
                    /**
                     * @description 选填 字符串 标签颜色。可选: darkBlue(默认), blue, purple, red, yellow, orange, green, lightGreen。
                     * @example 标签颜色
                     */
                    color?: string;
                };
                header: {
                    /** @example {{Authorization}} */
                    Authorization: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "tags": [
                     *         {
                     *           "id": "1",
                     *           "name": "name", // 标签名称
                     *           "color": "lightGreen" // 标签颜色
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": {
                        tags: {
                            id?: string;
                            name?: string;
                            color?: string;
                        }[];
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, never>;
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/browser-tags/delete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 删除标签 */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description 必填 数组 标签 ID; 每次请求最多 100 个。
                     * @example 标签 ID[]
                     */
                    ids?: string;
                };
                header: {
                    /** @example {{Authorization}} */
                    Authorization: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "ids": [
                     *         "1"
                     *       ]
                     *     }
                     */
                    "application/json": {
                        ids: string[];
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, never>;
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/browser-tags/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 查询标签 */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description 选填 数组 标签 ID
                     * @example Tag id[]
                     */
                    ids?: string;
                    /**
                     * @description 选填 字符串 默认: 1 查看指定页面的数据。
                     * @example 页码
                     */
                    page?: string;
                    /**
                     * @description 选填 字符串 默认: 50 每页返回标签数量，范围: 1–200。
                     * @example 每页数量
                     */
                    limit?: string;
                };
                header: {
                    /** @example {{Authorization}} */
                    Authorization: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "ids": [
                     *         "1"
                     *       ],
                     *       "page": 1,
                     *       "limit": 10
                     *     }
                     */
                    "application/json": {
                        ids: string[];
                        page: number;
                        limit: number;
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, never>;
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/group/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 查询分组
         * @description 查询分组信息，包括分组ID和分组名称。group_id 0 是系统默认分组。
         */
        get: {
            parameters: {
                query?: {
                    /**
                     * @description 选填 字符串 指定分组名称查询。若留空则返回所有分组。
                     * @example 分组名称
                     */
                    group_name?: string;
                    /**
                     * @description 选填 整数 默认: 1 查看指定页面的数据。
                     * @example 页码
                     */
                    page?: string;
                    /**
                     * @description 选填 整数 默认: 1 每页返回分组数量，范围 1 ~ 200。
                     * @example 每页数量
                     */
                    page_size?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            code?: number;
                            msg?: string;
                            data?: {
                                list?: ({
                                    group_id?: string;
                                    group_name?: string;
                                    remark?: string;
                                } & {
                                    [key: string]: unknown;
                                })[];
                            };
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/group/create": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 创建分组
         * @description 创建环境分组。分组名称必须唯一。成功后将返回 group_id。group_id 0 是系统默认分组。
         */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description 必填 字符串 最多 30 个字符。分组名称必须唯一。
                     * @example 分组名称
                     */
                    group_name?: string;
                    /**
                     * @description 选填 字符串 最多 100 个字符。
                     * @example 分组备注
                     */
                    remark?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "group_name": "123",
                     *       "remark": "123456"
                     *     }
                     */
                    "application/json": {
                        group_name: string;
                        remark: string;
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, never>;
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/group/update": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 更新分组
         * @description 编辑分组信息（如名称），需确保唯一。
         */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description 必填 字符串 分组创建成功后生成的唯一ID。
                     * @example 分组 ID
                     */
                    group_id?: string;
                    /**
                     * @description 必填 字符串 修改分组名称(最多30字符)。必须唯一。
                     * @example 分组名称
                     */
                    group_name?: string;
                    /**
                     * @description 选填 字符串 修改分组备注(最多100字符)。
                     * @example 分组备注
                     */
                    remark?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "group_id": "6215915",
                     *       "group_name": "12345",
                     *       "remark": "123456"
                     *     }
                     */
                    "application/json": {
                        group_id: string;
                        group_name: string;
                        remark: string;
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, never>;
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/proxy-list/create": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 创建代理
         * @description 将代理添加到保存的代理列表中。一次最多可添加 500 个代理。不支持重复验证。
         */
        get: {
            parameters: {
                query?: {
                    /**
                     * @description 必填 字符串 支持: http/https/ssh/socks5
                     * @example 代理类型
                     */
                    type?: string;
                    /**
                     * @description 必填 字符串 支持: ipV4, ipV6
                     * @example 代理主机
                     */
                    host?: string;
                    /**
                     * @description 必填 字符串 范围: 0-65536
                     * @example 端口
                     */
                    port?: string;
                    /**
                     * @description 选填 字符串
                     * @example 代理用户名
                     */
                    user?: string;
                    /**
                     * @description 选填 字符串
                     * @example 代理密码
                     */
                    password?: string;
                    /**
                     * @description 选填 字符串
                     * @example 用于刷新代理的 URL
                     */
                    proxy_url?: string;
                    /**
                     * @description 选填 字符串 若留空则使用全局设置。支持: ip2location/ipapi/ipfoxy
                     * @example IP 检测器
                     */
                    ipchecker?: string;
                    /**
                     * @description 选填 字符串 最多 200 个字符。
                     * @example 代理备注
                     */
                    remark?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example [
                     *         {
                     *     	"type":"http", //http、https、socks5、ssh
                     *     	"host":"192.168.0.1",
                     *     	"port":"8000",
                     *     	//"user":"username",
                     *     	//"password":"password",
                     *     	//"proxy_url":"https://www.baidu.com/",
                     *     	"ipchecker":"ip2location",
                     *         "remark":"remark1"
                     *         },
                     *         {
                     *     	"type":"http", //http、https、socks5、ssh
                     *     	"host":"192.168.0.1",
                     *     	"port":"8000",
                     *     	//"user":"username",
                     *     	//"password":"password",
                     *     	//"proxy_url":"https://www.baidu.com/",
                     *     	"ipchecker":"ip2location",
                     *         "remark":"remark1"
                     *         },
                     *         {
                     *     	"type":"http", //http、https、socks5、ssh
                     *     	"host":"192.168.0.1",
                     *     	"port":"8000",
                     *     	//"user":"username",
                     *     	//"password":"password",
                     *     	//"proxy_url":"https://www.baidu.com/",
                     *     	"ipchecker":"ip2location",
                     *         "remark":"remark1"
                     *         }
                     *     ]
                     */
                    "application/json": {
                        type: string;
                        host: string;
                        port: string;
                        ipchecker: string;
                        remark: string;
                    }[];
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *       "data": {
                         *         "proxy_id": [
                         *           "369",
                         *           "370",
                         *           "371"
                         *         ]
                         *       },
                         *       "code": 0,
                         *       "msg": "Success"
                         *     }
                         */
                        "application/json": {
                            data: {
                                proxy_id: string[];
                            };
                            code: number;
                            msg: string;
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/proxy-list/update": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 更新代理
         * @description 更新指定代理的代理信息。对于 IPFoxy 代理，只能更新备注。
         */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description 必填 字符串 代理创建成功后生成的唯一 ID。
                     * @example 代理 ID
                     */
                    proxy_id?: string;
                    /**
                     * @description 选填 字符串 支持: http/https/ssh/socks5
                     * @example 代理类型
                     */
                    type?: string;
                    /**
                     * @description 选填 字符串 支持: ipV4, ipV6
                     * @example 代理主机
                     */
                    host?: string;
                    /**
                     * @description 选填 字符串 范围: 0-65536
                     * @example 端口
                     */
                    port?: string;
                    /**
                     * @description 选填 字符串
                     * @example 代理用户名
                     */
                    user?: string;
                    /**
                     * @description 选填 字符串
                     * @example 代理密码
                     */
                    password?: string;
                    /**
                     * @description 选填 字符串
                     * @example 用于刷新代理的 URL
                     */
                    proxy_url?: string;
                    /**
                     * @description 选填 字符串 若留空则使用全局设置。支持: ip2location/ipapi/ipfoxy
                     * @example IP 检测器
                     */
                    ipchecker?: string;
                    /**
                     * @description 选填 字符串 最多 200 个字符。
                     * @example 代理备注
                     */
                    remark?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "proxy_id": "xxx",
                     *       "type": "https",
                     *       "port": "8001",
                     *       "user": "username",
                     *       "password": "password",
                     *       "proxy_url": "https://www.baidu.com/",
                     *       "ipchecker": "ipfoxy",
                     *       "remark": "remark"
                     *     }
                     */
                    "application/json": {
                        proxy_id: string;
                        type: string;
                        port: string;
                        user: string;
                        password: string;
                        proxy_url: string;
                        ipchecker: string;
                        remark: string;
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *       "data": {},
                         *       "code": 0,
                         *       "msg": "Success"
                         *     }
                         */
                        "application/json": {
                            data: Record<string, never>;
                            code: number;
                            msg: string;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/proxy-list/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 查询代理
         * @description 查询已保存的代理信息
         */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description 选填 数组 每次请求最多 100 个代理 ID。
                     * @example 代理 ID
                     */
                    proxy_id?: string;
                    /**
                     * @description 选填 字符串 默认: 50 每页返回代理数量，范围 1 ~ 200。
                     * @example 每页数量
                     */
                    limit?: string;
                    /**
                     * @description `string` `Optional` `Default: 1` View data on the specified page.
                     * @example 页码
                     */
                    page?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "proxy_id": [
                     *         "xxx",
                     *         "xxx"
                     *       ],
                     *       "limit": "10",
                     *       "page": "1"
                     *     }
                     */
                    "application/json": {
                        proxy_id: string[];
                        limit: string;
                        page: string;
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *       "data": {
                         *         "list": [
                         *           {
                         *             "proxy_id": "371",
                         *             "type": "https",
                         *             "host": "192.168.0.1",
                         *             "port": "8001",
                         *             "user": "username",
                         *             "password": "password",
                         *             "proxy_url": "https://www.baidu.com/",
                         *             "remark": "remark",
                         *             "ipchecker": "ipfoxy",
                         *             "proxy_partner": "",
                         *             "profile_count": "0",
                         *             "related_profile_no": [],
                         *             "proxy_tags": []
                         *           },
                         *           {
                         *             "proxy_id": "370",
                         *             "type": "http",
                         *             "host": "192.168.0.1",
                         *             "port": "8000",
                         *             "user": "",
                         *             "password": "",
                         *             "proxy_url": "",
                         *             "remark": "remark1",
                         *             "ipchecker": "ip2location",
                         *             "proxy_partner": "",
                         *             "profile_count": "0",
                         *             "related_profile_no": [],
                         *             "proxy_tags": []
                         *           }
                         *         ],
                         *         "total": 2,
                         *         "page": 1,
                         *         "page_size": 10
                         *       },
                         *       "code": 0,
                         *       "msg": "Success"
                         *     }
                         */
                        "application/json": {
                            data: {
                                list: {
                                    proxy_id: string;
                                    type: string;
                                    host: string;
                                    port: string;
                                    user: string;
                                    password: string;
                                    proxy_url: string;
                                    remark: string;
                                    ipchecker: string;
                                    proxy_partner: string;
                                    profile_count: string;
                                    related_profile_no: unknown[];
                                    proxy_tags: unknown[];
                                }[];
                                total: number;
                                page: number;
                                page_size: number;
                            };
                            code: number;
                            msg: string;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/proxy-list/delete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 删除代理
         * @description Delete the specified proxies. Up to 100 proxies can be deleted at one time. Unexpired proxies of IPFoxy cannot be deleted.
         *
         *     Note: If the deleted proxies were configured in the profies, after delection, the proxy setting will become "Non proxy" in these profiles. Please pay attention to this modification.
         */
        post: {
            parameters: {
                query?: {
                    /**
                     * @description `array` `Required` The unique ID generated upon successful proxy creation.
                     * @example 代理 ID[]
                     */
                    proxy_id?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    /**
                     * @example {
                     *       "proxy_id": [
                     *         "xxx"
                     *       ]
                     *     }
                     */
                    "application/json": {
                        proxy_id: string[];
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *       "data": {},
                         *       "code": 0,
                         *       "msg": "Success"
                         *     }
                         */
                        "application/json": {
                            data: Record<string, never>;
                            code: number;
                            msg: string;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/application/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 应用分类列表
         * @description 查询应用分类列表，用于创建或编辑环境。
         */
        get: {
            parameters: {
                query?: {
                    /**
                     * @description 选填 整数 默认: 1 查看指定页面的数据。
                     * @example 页码
                     */
                    page?: string;
                    /**
                     * @description 选填 整数 默认: 50 每页返回数量，范围 1 ~ 200。
                     * @example 每页数量
                     */
                    page_size?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, never>;
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/category/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 插件分类列表 v2
         * @description 查询插件分类列表，可获取分类ID或详情。
         */
        get: {
            parameters: {
                query?: {
                    /**
                     * @description 选填 字符串 提供分类ID以获取其详情。
                     * @example 分类 ID
                     */
                    category_id?: string;
                    /**
                     * @description 选填 整数 默认: 50 每页返回数量，范围 1 ~ 200。
                     * @example 每页数量
                     */
                    limit?: string;
                    /**
                     * @description 选填 整数 默认: 1 查看指定页面的数据。
                     * @example 页码
                     */
                    page?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, never>;
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: never;
    responses: {
        "\u8BB0\u5F55\u4E0D\u5B58\u5728": {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    code: number;
                    message: string;
                };
            };
        };
        "\u53C2\u6570\u4E0D\u6B63\u786E": {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    code: number;
                    message: string;
                };
            };
        };
    };
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
