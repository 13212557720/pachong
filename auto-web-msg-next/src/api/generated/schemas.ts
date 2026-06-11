export interface paths {
    "/api/v1/instagram_users/bulkUpsertInstagramUsers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 批量插入或更新Instagram用户
         * @description 使用极速批量拷贝技术，适合单次 100 条以上的数据导入。
         */
        post: operations["bulkUpsertInstagramUsers"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/instagram_users/getInstagramUser": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取单个Instagram用户 */
        get: operations["getInstagramUser"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/instagram_users/listDistinctIpLocations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取所有去重后的IP归属地 */
        get: operations["listDistinctIpLocations"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/instagram_users/listInstagramUsers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 分页查询Instagram用户列表 */
        get: operations["listInstagramUsers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/instagram_users/updateInstagramUserCompletion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 更新用户完成状态 */
        post: operations["updateInstagramUserCompletion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/instagram_users/updateInstagramUserExtra": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 更新用户粉丝数和IP归属地 */
        post: operations["updateInstagramUserExtra"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/instagram_users/upsertInstagramUser": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 插入或更新Instagram用户 */
        post: operations["upsertInstagramUser"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/opened_urls/createOpenedUrl": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 创建页面打开记录 */
        post: operations["createOpenedUrl"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/opened_urls/existsOpenedUrl": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 检查URL是否已打开过 */
        get: operations["existsOpenedUrl"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/pg_meta/getPgStatus": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取PostgreSQL状态 */
        get: operations["getPgStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/pg_meta/getPgTableColumns": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取表列信息 */
        get: operations["getPgTableColumns"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/pg_meta/getPgTableCount": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取表行数 */
        get: operations["getPgTableCount"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/pg_meta/getPgTableRows": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 分页查询表数据 */
        get: operations["getPgTableRows"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/pg_meta/listPgTables": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取所有表名 */
        get: operations["listPgTables"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/send_message_logs/createSendMessageLog": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 创建消息发送日志 */
        post: operations["createSendMessageLog"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/send_message_logs/listSendMessageLogs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 分页查询消息发送日志 */
        get: operations["listSendMessageLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/task_events/createTaskEvent": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 创建批量任务事件 */
        post: operations["createTaskEvent"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/task_events/listTaskEvents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 查询批量任务事件列表 */
        get: operations["listTaskEvents"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/token/createToken": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 创建一个新Token */
        post: operations["createToken"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/token/deleteToken": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 按token_id删除Token */
        post: operations["deleteToken"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/token/getToken": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 按token_id获取单个Token */
        get: operations["getToken"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/token/getTokenList": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取所有Token列表 */
        get: operations["getTokenList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/token/updateToken": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 更新Token黑名单状态 */
        post: operations["updateToken"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        BodyResponseTokenBody: {
            /** @description 响应体 */
            body: components["schemas"]["TokenBody"];
        };
        BulkInsertTempInstagramUsersParams: {
            biography: string | null;
            followers_count: string | null;
            full_name: string | null;
            id: string;
            ip_location: string | null;
            is_private: boolean | null;
            is_verified: boolean | null;
            raw_json: string;
            username: string | null;
        };
        BulkUpsertRequestBody: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/BulkUpsertRequestBody.json
             */
            readonly $schema?: string;
            /** @description 批量用户列表 */
            items: components["schemas"]["BulkInsertTempInstagramUsersParams"][] | null;
        };
        BulkUpsertResponseBody: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/BulkUpsertResponseBody.json
             */
            readonly $schema?: string;
            /**
             * Format: int64
             * @description 受支持的失败记录数（暂不支持详细失败列表）
             */
            failed: number;
            /**
             * Format: int64
             * @description 成功插入或更新的记录数
             */
            inserted: number;
        };
        CreateOpenedUrlParams: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/CreateOpenedUrlParams.json
             */
            readonly $schema?: string;
            action: string;
            automation_action: string | null;
            canonical_url: string;
            forced: boolean;
            id: string;
            /** Format: int32 */
            port: number | null;
            url: string | null;
        };
        CreateSendMessageLogParams: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/CreateSendMessageLogParams.json
             */
            readonly $schema?: string;
            error_message: string | null;
            id: string;
            message: string;
            /** Format: int32 */
            port: number;
            status: string;
            target_url: string;
            target_username: string | null;
        };
        CreateTaskEventParams: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/CreateTaskEventParams.json
             */
            readonly $schema?: string;
            event_json: string;
            id: string;
            run_id: string;
        };
        CreateTokenRequestBody: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/CreateTokenRequestBody.json
             */
            readonly $schema?: string;
            remark?: string;
            username?: string;
            /** Format: int64 */
            valid_days?: number;
        };
        DeleteTokenRequestBody: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/DeleteTokenRequestBody.json
             */
            readonly $schema?: string;
            token_id: string;
        };
        ErrorDetail: {
            /** @description Where the error occurred, e.g. 'body.items[3].tags' or 'path.thing-id' */
            location?: string;
            /** @description Error message text */
            message?: string;
            /** @description The value at the given location */
            value?: unknown;
        };
        ErrorModel: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/ErrorModel.json
             */
            readonly $schema?: string;
            /**
             * @description A human-readable explanation specific to this occurrence of the problem.
             * @example Property foo is required but is missing.
             */
            detail?: string;
            /** @description Optional list of individual error details */
            errors?: components["schemas"]["ErrorDetail"][] | null;
            /**
             * Format: uri
             * @description A URI reference that identifies the specific occurrence of the problem.
             * @example https://example.com/error-log/abc123
             */
            instance?: string;
            /**
             * Format: int64
             * @description HTTP status code
             * @example 400
             */
            status?: number;
            /**
             * @description A short, human-readable summary of the problem type. This value should not change between occurrences of the error.
             * @example Bad Request
             */
            title?: string;
            /**
             * Format: uri
             * @description A URI reference to human-readable documentation for the error.
             * @default about:blank
             * @example https://example.com/errors/example
             */
            type: string;
        };
        InstagramUser: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/InstagramUser.json
             */
            readonly $schema?: string;
            biography: string | null;
            /** Format: date-time */
            created_at: string;
            followers_count: string | null;
            full_name: string | null;
            id: string;
            ip_location: string | null;
            is_completed: boolean;
            is_private: boolean | null;
            is_verified: boolean | null;
            raw_json: string;
            /** Format: int32 */
            repeat_count: number;
            username: string | null;
        };
        ListBodyBodyResponseTokenBody: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/ListBodyBodyResponseTokenBody.json
             */
            readonly $schema?: string;
            /** @description 数据列表 */
            items: components["schemas"]["BodyResponseTokenBody"][] | null;
            /**
             * Format: int64
             * @description 总数
             * @example 100
             */
            total: number;
        };
        ListBodyInstagramUser: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/ListBodyInstagramUser.json
             */
            readonly $schema?: string;
            /** @description 数据列表 */
            items: components["schemas"]["InstagramUser"][] | null;
            /**
             * Format: int64
             * @description 总数
             * @example 100
             */
            total: number;
        };
        ListBodySendMessageLog: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/ListBodySendMessageLog.json
             */
            readonly $schema?: string;
            /** @description 数据列表 */
            items: components["schemas"]["SendMessageLog"][] | null;
            /**
             * Format: int64
             * @description 总数
             * @example 100
             */
            total: number;
        };
        ListBodyTaskEvent: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/ListBodyTaskEvent.json
             */
            readonly $schema?: string;
            /** @description 数据列表 */
            items: components["schemas"]["TaskEvent"][] | null;
            /**
             * Format: int64
             * @description 总数
             * @example 100
             */
            total: number;
        };
        ListDistinctIpLocationsResponseBody: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/ListDistinctIpLocationsResponseBody.json
             */
            readonly $schema?: string;
            /** @description IP属地列表 */
            items: string[] | null;
        };
        OpenedUrl: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/OpenedUrl.json
             */
            readonly $schema?: string;
            action: string;
            automation_action: string | null;
            canonical_url: string;
            forced: boolean;
            id: string;
            /** Format: int32 */
            port: number | null;
            /** Format: date-time */
            timestamp: string;
            url: string | null;
        };
        OpenedUrlExistsBody: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/OpenedUrlExistsBody.json
             */
            readonly $schema?: string;
            /** @description 是否已存在 */
            exists: boolean;
        };
        PgColumnInfo: {
            /** @description 默认值 */
            column_default: string | null;
            /** @description 列名 */
            column_name: string;
            /** @description 数据类型 */
            data_type: string;
            /** @description 是否可空 */
            is_nullable: string;
        };
        PgColumnsBody: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/PgColumnsBody.json
             */
            readonly $schema?: string;
            /** @description 列信息列表 */
            columns: components["schemas"]["PgColumnInfo"][] | null;
        };
        PgCountBody: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/PgCountBody.json
             */
            readonly $schema?: string;
            /**
             * Format: int64
             * @description 总行数
             */
            total: number;
        };
        PgRowsBody: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/PgRowsBody.json
             */
            readonly $schema?: string;
            /**
             * Format: int64
             * @description 当前页
             */
            page: number;
            /**
             * Format: int64
             * @description 每页数量
             */
            page_size: number;
            /** @description 行数据 */
            rows: {
                [key: string]: unknown;
            }[] | null;
            /**
             * Format: int64
             * @description 总行数
             */
            total: number;
            /**
             * Format: int64
             * @description 总页数
             */
            total_pages: number;
        };
        PgStatusBody: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/PgStatusBody.json
             */
            readonly $schema?: string;
            /**
             * Format: int64
             * @description 当前活跃连接数
             */
            active_connections: number;
            /** @description 当前数据库名 */
            database: string;
            /** @description 数据库大小 */
            database_size: string;
            /**
             * Format: int64
             * @description 最大连接数
             */
            max_connections: number;
            /** @description PostgreSQL 版本 */
            version: string;
        };
        PgTablesBody: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/PgTablesBody.json
             */
            readonly $schema?: string;
            /** @description public schema 下的表名列表 */
            tables: string[] | null;
        };
        SendMessageLog: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/SendMessageLog.json
             */
            readonly $schema?: string;
            /** Format: date-time */
            created_at: string;
            error_message: string | null;
            id: string;
            message: string;
            /** Format: int32 */
            port: number;
            /** Format: date-time */
            sent_at: string;
            status: string;
            target_url: string;
            target_username: string | null;
        };
        TaskEvent: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/TaskEvent.json
             */
            readonly $schema?: string;
            /** Format: date-time */
            created_at: string;
            event_json: string;
            id: string;
            run_id: string;
        };
        TokenBody: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/TokenBody.json
             */
            readonly $schema?: string;
            created_at: string;
            id: string;
            is_blacklisted: boolean;
            remark: string | null;
            token_value: string;
            updated_at: string;
        };
        UpdateInstagramUserCompletionParams: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/UpdateInstagramUserCompletionParams.json
             */
            readonly $schema?: string;
            id: string;
            is_completed: boolean;
        };
        UpdateInstagramUserExtraParams: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/UpdateInstagramUserExtraParams.json
             */
            readonly $schema?: string;
            biography: string | null;
            followers_count: string | null;
            id: string;
            ip_location: string | null;
        };
        UpdateTokenRequestBody: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/UpdateTokenRequestBody.json
             */
            readonly $schema?: string;
            is_blacklisted: boolean;
            token_id: string;
        };
        UpsertInstagramUserParams: {
            /**
             * Format: uri
             * @description A URL to the JSON Schema for this object.
             * @example https://example.com/schemas/UpsertInstagramUserParams.json
             */
            readonly $schema?: string;
            biography: string | null;
            followers_count: string | null;
            full_name: string | null;
            id: string;
            ip_location: string | null;
            is_private: boolean | null;
            is_verified: boolean | null;
            raw_json: string;
            username: string | null;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    bulkUpsertInstagramUsers: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BulkUpsertRequestBody"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BulkUpsertResponseBody"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    getInstagramUser: {
        parameters: {
            query?: {
                /** @description 用户唯一ID */
                id?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InstagramUser"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    listDistinctIpLocations: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListDistinctIpLocationsResponseBody"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    listInstagramUsers: {
        parameters: {
            query?: {
                /** @description 每页数量 */
                limit?: number;
                /** @description 偏移量 */
                offset?: number;
                /** @description 搜索关键词(匹配id/username/full_name) */
                keyword?: string;
                /** @description 按完成状态筛选(true/false，留空不筛选) */
                is_completed?: string;
                /** @description 按IP属地精准匹配 */
                ip_location?: string;
                /** @description 按IP属地包含(OR)匹配 */
                ip_location_in?: string[] | null;
                /** @description 按IP属地排除(NOT IN)匹配 */
                ip_location_not_in?: string[] | null;
                /** @description 是否排除缺省/空IP属地(true/false) */
                ip_location_not_include_null?: string;
                /** @description 重复次数最小值 */
                repeat_count_min?: number;
                /** @description 重复次数最大值 */
                repeat_count_max?: number;
                /** @description 粉丝数最小值 */
                followers_count_min?: number;
                /** @description 粉丝数最大值 */
                followers_count_max?: number;
                /** @description 按账号是否私密状态多选过滤 */
                is_private_in?: boolean[] | null;
                /** @description 创建时间晚于(如：2023-10-01) */
                created_at_min?: string;
                /** @description 创建时间早于(如：2023-10-02) */
                created_at_max?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListBodyInstagramUser"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    updateInstagramUserCompletion: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateInstagramUserCompletionParams"];
            };
        };
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    updateInstagramUserExtra: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateInstagramUserExtraParams"];
            };
        };
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    upsertInstagramUser: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpsertInstagramUserParams"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InstagramUser"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    createOpenedUrl: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateOpenedUrlParams"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OpenedUrl"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    existsOpenedUrl: {
        parameters: {
            query?: {
                /** @description 去重核心URL */
                canonical_url?: string;
                /** @description 动作类型 */
                action?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OpenedUrlExistsBody"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    getPgStatus: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PgStatusBody"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    getPgTableColumns: {
        parameters: {
            query?: {
                /** @description 表名 */
                table?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PgColumnsBody"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    getPgTableCount: {
        parameters: {
            query?: {
                /** @description 表名 */
                table?: string;
                /** @description 全局关键词搜索 */
                keyword?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PgCountBody"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    getPgTableRows: {
        parameters: {
            query?: {
                /** @description 表名 */
                table?: string;
                /** @description 页码 */
                page?: number;
                /** @description 每页数量 */
                page_size?: number;
                /** @description 全局关键词搜索（匹配所有文本列） */
                keyword?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PgRowsBody"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    listPgTables: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PgTablesBody"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    createSendMessageLog: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateSendMessageLogParams"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SendMessageLog"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    listSendMessageLogs: {
        parameters: {
            query?: {
                /** @description 每页数量 */
                limit?: number;
                /** @description 偏移量 */
                offset?: number;
                /** @description 按状态筛选(success/failed/skipped，留空不筛选) */
                status?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListBodySendMessageLog"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    createTaskEvent: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateTaskEventParams"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TaskEvent"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    listTaskEvents: {
        parameters: {
            query?: {
                /** @description 任务运行ID */
                run_id?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListBodyTaskEvent"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    createToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateTokenRequestBody"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenBody"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    deleteToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeleteTokenRequestBody"];
            };
        };
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    getToken: {
        parameters: {
            query?: {
                /** @description Token UUID */
                token_id?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenBody"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    getTokenList: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListBodyBodyResponseTokenBody"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
    updateToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateTokenRequestBody"];
            };
        };
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ErrorModel"];
                };
            };
        };
    };
}
