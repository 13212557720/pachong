// 脚本自动生成，不要手动修改
import { request } from '@/api/client'
import type { paths } from './schemas'
import type { JsonResponse } from './helpers'

/** 创建消息发送日志 */
export type PostSendMessageLogsCreateSendMessageLogBody = NonNullable<paths['/api/v1/send_message_logs/createSendMessageLog']['post']['requestBody']>['content']['application/json']
export interface PostSendMessageLogsCreateSendMessageLogArgs {
  body: PostSendMessageLogsCreateSendMessageLogBody
}
export type PostSendMessageLogsCreateSendMessageLogResponse = JsonResponse<'/api/v1/send_message_logs/createSendMessageLog', 'post'>
export async function postSendMessageLogsCreateSendMessageLog(args: PostSendMessageLogsCreateSendMessageLogArgs) {
  const response = await request<PostSendMessageLogsCreateSendMessageLogResponse>({
    method: 'post',
    url: '/send_message_logs/createSendMessageLog',
    data: args.body,
  })
  return response.data
}

/** 分页查询消息发送日志 */
export type GetSendMessageLogsListSendMessageLogsQuery = paths['/api/v1/send_message_logs/listSendMessageLogs']['get']['parameters']['query']
export interface GetSendMessageLogsListSendMessageLogsArgs {
  query?: GetSendMessageLogsListSendMessageLogsQuery
}
export type GetSendMessageLogsListSendMessageLogsResponse = JsonResponse<'/api/v1/send_message_logs/listSendMessageLogs', 'get'>
export async function getSendMessageLogsListSendMessageLogs(args: GetSendMessageLogsListSendMessageLogsArgs) {
  const response = await request<GetSendMessageLogsListSendMessageLogsResponse>({
    method: 'get',
    url: '/send_message_logs/listSendMessageLogs',
    params: args.query,
  })
  return response.data
}
