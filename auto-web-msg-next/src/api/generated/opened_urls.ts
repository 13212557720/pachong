// 脚本自动生成，不要手动修改
import { request } from '@/api/client'
import type { paths } from './schemas'
import type { JsonResponse } from './helpers'

/** 创建页面打开记录 */
export type PostOpenedUrlsCreateOpenedUrlBody = NonNullable<paths['/api/v1/opened_urls/createOpenedUrl']['post']['requestBody']>['content']['application/json']
export interface PostOpenedUrlsCreateOpenedUrlArgs {
  body: PostOpenedUrlsCreateOpenedUrlBody
}
export type PostOpenedUrlsCreateOpenedUrlResponse = JsonResponse<'/api/v1/opened_urls/createOpenedUrl', 'post'>
export async function postOpenedUrlsCreateOpenedUrl(args: PostOpenedUrlsCreateOpenedUrlArgs) {
  const response = await request<PostOpenedUrlsCreateOpenedUrlResponse>({
    method: 'post',
    url: '/opened_urls/createOpenedUrl',
    data: args.body,
  })
  return response.data
}

/** 检查URL是否已打开过 */
export type GetOpenedUrlsExistsOpenedUrlQuery = paths['/api/v1/opened_urls/existsOpenedUrl']['get']['parameters']['query']
export interface GetOpenedUrlsExistsOpenedUrlArgs {
  query?: GetOpenedUrlsExistsOpenedUrlQuery
}
export type GetOpenedUrlsExistsOpenedUrlResponse = JsonResponse<'/api/v1/opened_urls/existsOpenedUrl', 'get'>
export async function getOpenedUrlsExistsOpenedUrl(args: GetOpenedUrlsExistsOpenedUrlArgs) {
  const response = await request<GetOpenedUrlsExistsOpenedUrlResponse>({
    method: 'get',
    url: '/opened_urls/existsOpenedUrl',
    params: args.query,
  })
  return response.data
}
