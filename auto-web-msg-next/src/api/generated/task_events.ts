// 脚本自动生成，不要手动修改
import { request } from '@/api/client'
import type { paths } from './schemas'
import type { JsonResponse } from './helpers'

/** 创建批量任务事件 */
export type PostTaskEventsCreateTaskEventBody = NonNullable<paths['/api/v1/task_events/createTaskEvent']['post']['requestBody']>['content']['application/json']
export interface PostTaskEventsCreateTaskEventArgs {
  body: PostTaskEventsCreateTaskEventBody
}
export type PostTaskEventsCreateTaskEventResponse = JsonResponse<'/api/v1/task_events/createTaskEvent', 'post'>
export async function postTaskEventsCreateTaskEvent(args: PostTaskEventsCreateTaskEventArgs) {
  const response = await request<PostTaskEventsCreateTaskEventResponse>({
    method: 'post',
    url: '/task_events/createTaskEvent',
    data: args.body,
  })
  return response.data
}

/** 查询批量任务事件列表 */
export type GetTaskEventsListTaskEventsQuery = paths['/api/v1/task_events/listTaskEvents']['get']['parameters']['query']
export interface GetTaskEventsListTaskEventsArgs {
  query?: GetTaskEventsListTaskEventsQuery
}
export type GetTaskEventsListTaskEventsResponse = JsonResponse<'/api/v1/task_events/listTaskEvents', 'get'>
export async function getTaskEventsListTaskEvents(args: GetTaskEventsListTaskEventsArgs) {
  const response = await request<GetTaskEventsListTaskEventsResponse>({
    method: 'get',
    url: '/task_events/listTaskEvents',
    params: args.query,
  })
  return response.data
}
