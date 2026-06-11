// 脚本自动生成，不要手动修改
import { request } from '@/api/client'
import type { paths } from './schemas'
import type { JsonResponse } from './helpers'

/** 创建一个新Token */
export type PostTokenCreateTokenBody = NonNullable<paths['/api/v1/token/createToken']['post']['requestBody']>['content']['application/json']
export interface PostTokenCreateTokenArgs {
  body: PostTokenCreateTokenBody
}
export type PostTokenCreateTokenResponse = JsonResponse<'/api/v1/token/createToken', 'post'>
export async function postTokenCreateToken(args: PostTokenCreateTokenArgs) {
  const response = await request<PostTokenCreateTokenResponse>({
    method: 'post',
    url: '/token/createToken',
    data: args.body,
  })
  return response.data
}

/** 按token_id删除Token */
export type PostTokenDeleteTokenBody = NonNullable<paths['/api/v1/token/deleteToken']['post']['requestBody']>['content']['application/json']
export interface PostTokenDeleteTokenArgs {
  body: PostTokenDeleteTokenBody
}
export type PostTokenDeleteTokenResponse = JsonResponse<'/api/v1/token/deleteToken', 'post'>
export async function postTokenDeleteToken(args: PostTokenDeleteTokenArgs) {
  const response = await request<PostTokenDeleteTokenResponse>({
    method: 'post',
    url: '/token/deleteToken',
    data: args.body,
  })
  return response.data
}

/** 按token_id获取单个Token */
export type GetTokenGetTokenQuery = paths['/api/v1/token/getToken']['get']['parameters']['query']
export interface GetTokenGetTokenArgs {
  query?: GetTokenGetTokenQuery
}
export type GetTokenGetTokenResponse = JsonResponse<'/api/v1/token/getToken', 'get'>
export async function getTokenGetToken(args: GetTokenGetTokenArgs) {
  const response = await request<GetTokenGetTokenResponse>({
    method: 'get',
    url: '/token/getToken',
    params: args.query,
  })
  return response.data
}

/** 获取所有Token列表 */
export type GetTokenGetTokenListResponse = JsonResponse<'/api/v1/token/getTokenList', 'get'>
export async function getTokenGetTokenList() {
  const response = await request<GetTokenGetTokenListResponse>({
    method: 'get',
    url: '/token/getTokenList',
  })
  return response.data
}

/** 更新Token黑名单状态 */
export type PostTokenUpdateTokenBody = NonNullable<paths['/api/v1/token/updateToken']['post']['requestBody']>['content']['application/json']
export interface PostTokenUpdateTokenArgs {
  body: PostTokenUpdateTokenBody
}
export type PostTokenUpdateTokenResponse = JsonResponse<'/api/v1/token/updateToken', 'post'>
export async function postTokenUpdateToken(args: PostTokenUpdateTokenArgs) {
  const response = await request<PostTokenUpdateTokenResponse>({
    method: 'post',
    url: '/token/updateToken',
    data: args.body,
  })
  return response.data
}
