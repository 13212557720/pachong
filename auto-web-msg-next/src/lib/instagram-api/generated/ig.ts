// 脚本自动生成，不要手动修改
import { request } from '../client'
import type { paths } from './schemas'
import type { JsonResponse } from './helpers'

/** Get Accounts */
export type GetIgAccountsResponse = JsonResponse<'/api/v1/ig/accounts', 'get'>
export async function getIgAccounts() {
  const response = await request<GetIgAccountsResponse>({
    method: 'get',
    url: '/ig/accounts',
  })
  return response.data
}

/** Create Account */
export type PostIgAccountsBody = NonNullable<paths['/api/v1/ig/accounts']['post']['requestBody']>['content']['application/json']
export interface PostIgAccountsArgs {
  body: PostIgAccountsBody
}
export type PostIgAccountsResponse = JsonResponse<'/api/v1/ig/accounts', 'post'>
export async function postIgAccounts(args: PostIgAccountsArgs) {
  const response = await request<PostIgAccountsResponse>({
    method: 'post',
    url: '/ig/accounts',
    data: args.body,
  })
  return response.data
}

/** Remove Account */
export type DeleteIgAccountsByUsernamePath = paths['/api/v1/ig/accounts/{username}']['delete']['parameters']['path']
export interface DeleteIgAccountsByUsernameArgs {
  path: DeleteIgAccountsByUsernamePath
}
export type DeleteIgAccountsByUsernameResponse = JsonResponse<'/api/v1/ig/accounts/{username}', 'delete'>
export async function deleteIgAccountsByUsername(args: DeleteIgAccountsByUsernameArgs) {
  const response = await request<DeleteIgAccountsByUsernameResponse>({
    method: 'delete',
    url: `/ig/accounts/${args.path.username}`,
  })
  return response.data
}

/** Get Me */
export type GetIgMeResponse = JsonResponse<'/api/v1/ig/me', 'get'>
export async function getIgMe() {
  const response = await request<GetIgMeResponse>({
    method: 'get',
    url: '/ig/me',
  })
  return response.data
}

/** Get User */
export type GetIgUserByUserIdPath = paths['/api/v1/ig/user/{user_id}']['get']['parameters']['path']
export interface GetIgUserByUserIdArgs {
  path: GetIgUserByUserIdPath
}
export type GetIgUserByUserIdResponse = JsonResponse<'/api/v1/ig/user/{user_id}', 'get'>
export async function getIgUserByUserId(args: GetIgUserByUserIdArgs) {
  const response = await request<GetIgUserByUserIdResponse>({
    method: 'get',
    url: `/ig/user/${args.path.user_id}`,
  })
  return response.data
}
