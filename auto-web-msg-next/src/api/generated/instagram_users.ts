// 脚本自动生成，不要手动修改
import { request } from '@/api/client'
import type { paths } from './schemas'
import type { JsonResponse } from './helpers'

/** 批量插入或更新Instagram用户 */
export type PostInstagramUsersBulkUpsertInstagramUsersBody = NonNullable<paths['/api/v1/instagram_users/bulkUpsertInstagramUsers']['post']['requestBody']>['content']['application/json']
export interface PostInstagramUsersBulkUpsertInstagramUsersArgs {
  body: PostInstagramUsersBulkUpsertInstagramUsersBody
}
export type PostInstagramUsersBulkUpsertInstagramUsersResponse = JsonResponse<'/api/v1/instagram_users/bulkUpsertInstagramUsers', 'post'>
export async function postInstagramUsersBulkUpsertInstagramUsers(args: PostInstagramUsersBulkUpsertInstagramUsersArgs) {
  const response = await request<PostInstagramUsersBulkUpsertInstagramUsersResponse>({
    method: 'post',
    url: '/instagram_users/bulkUpsertInstagramUsers',
    data: args.body,
  })
  return response.data
}

/** 获取单个Instagram用户 */
export type GetInstagramUsersGetInstagramUserQuery = paths['/api/v1/instagram_users/getInstagramUser']['get']['parameters']['query']
export interface GetInstagramUsersGetInstagramUserArgs {
  query?: GetInstagramUsersGetInstagramUserQuery
}
export type GetInstagramUsersGetInstagramUserResponse = JsonResponse<'/api/v1/instagram_users/getInstagramUser', 'get'>
export async function getInstagramUsersGetInstagramUser(args: GetInstagramUsersGetInstagramUserArgs) {
  const response = await request<GetInstagramUsersGetInstagramUserResponse>({
    method: 'get',
    url: '/instagram_users/getInstagramUser',
    params: args.query,
  })
  return response.data
}

/** 获取所有去重后的IP归属地 */
export type GetInstagramUsersListDistinctIpLocationsResponse = JsonResponse<'/api/v1/instagram_users/listDistinctIpLocations', 'get'>
export async function getInstagramUsersListDistinctIpLocations() {
  const response = await request<GetInstagramUsersListDistinctIpLocationsResponse>({
    method: 'get',
    url: '/instagram_users/listDistinctIpLocations',
  })
  return response.data
}

/** 分页查询Instagram用户列表 */
export type GetInstagramUsersListInstagramUsersQuery = paths['/api/v1/instagram_users/listInstagramUsers']['get']['parameters']['query']
export interface GetInstagramUsersListInstagramUsersArgs {
  query?: GetInstagramUsersListInstagramUsersQuery
}
export type GetInstagramUsersListInstagramUsersResponse = JsonResponse<'/api/v1/instagram_users/listInstagramUsers', 'get'>
export async function getInstagramUsersListInstagramUsers(args: GetInstagramUsersListInstagramUsersArgs) {
  const response = await request<GetInstagramUsersListInstagramUsersResponse>({
    method: 'get',
    url: '/instagram_users/listInstagramUsers',
    params: args.query,
  })
  return response.data
}

/** 更新用户完成状态 */
export type PostInstagramUsersUpdateInstagramUserCompletionBody = NonNullable<paths['/api/v1/instagram_users/updateInstagramUserCompletion']['post']['requestBody']>['content']['application/json']
export interface PostInstagramUsersUpdateInstagramUserCompletionArgs {
  body: PostInstagramUsersUpdateInstagramUserCompletionBody
}
export type PostInstagramUsersUpdateInstagramUserCompletionResponse = JsonResponse<'/api/v1/instagram_users/updateInstagramUserCompletion', 'post'>
export async function postInstagramUsersUpdateInstagramUserCompletion(args: PostInstagramUsersUpdateInstagramUserCompletionArgs) {
  const response = await request<PostInstagramUsersUpdateInstagramUserCompletionResponse>({
    method: 'post',
    url: '/instagram_users/updateInstagramUserCompletion',
    data: args.body,
  })
  return response.data
}

/** 更新用户粉丝数和IP归属地 */
export type PostInstagramUsersUpdateInstagramUserExtraBody = NonNullable<paths['/api/v1/instagram_users/updateInstagramUserExtra']['post']['requestBody']>['content']['application/json']
export interface PostInstagramUsersUpdateInstagramUserExtraArgs {
  body: PostInstagramUsersUpdateInstagramUserExtraBody
}
export type PostInstagramUsersUpdateInstagramUserExtraResponse = JsonResponse<'/api/v1/instagram_users/updateInstagramUserExtra', 'post'>
export async function postInstagramUsersUpdateInstagramUserExtra(args: PostInstagramUsersUpdateInstagramUserExtraArgs) {
  const response = await request<PostInstagramUsersUpdateInstagramUserExtraResponse>({
    method: 'post',
    url: '/instagram_users/updateInstagramUserExtra',
    data: args.body,
  })
  return response.data
}

/** 插入或更新Instagram用户 */
export type PostInstagramUsersUpsertInstagramUserBody = NonNullable<paths['/api/v1/instagram_users/upsertInstagramUser']['post']['requestBody']>['content']['application/json']
export interface PostInstagramUsersUpsertInstagramUserArgs {
  body: PostInstagramUsersUpsertInstagramUserBody
}
export type PostInstagramUsersUpsertInstagramUserResponse = JsonResponse<'/api/v1/instagram_users/upsertInstagramUser', 'post'>
export async function postInstagramUsersUpsertInstagramUser(args: PostInstagramUsersUpsertInstagramUserArgs) {
  const response = await request<PostInstagramUsersUpsertInstagramUserResponse>({
    method: 'post',
    url: '/instagram_users/upsertInstagramUser',
    data: args.body,
  })
  return response.data
}
