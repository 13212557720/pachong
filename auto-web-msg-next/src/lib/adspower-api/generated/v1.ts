// 脚本自动生成，不要手动修改
import { ApiClient } from '../client'
import type { paths } from './schemas'
import type { JsonResponse } from './helpers'

declare module '../client' {
  interface ApiClient {
    getV1BrowserStart(args: GetV1BrowserStartArgs): Promise<GetV1BrowserStartResponse>
    getV1BrowserStop(args: GetV1BrowserStopArgs): Promise<GetV1BrowserStopResponse>
    getV1BrowserActive(args: GetV1BrowserActiveArgs): Promise<GetV1BrowserActiveResponse>
    postV1BrowserCloudActive(args: PostV1BrowserCloudActiveArgs): Promise<PostV1BrowserCloudActiveResponse>
    getV1UserList(args: GetV1UserListArgs): Promise<GetV1UserListResponse>
    postV1UserCreate(args: PostV1UserCreateArgs): Promise<PostV1UserCreateResponse>
    postV1UserUpdate(args: PostV1UserUpdateArgs): Promise<PostV1UserUpdateResponse>
    postV1UserDelete(args: PostV1UserDeleteArgs): Promise<PostV1UserDeleteResponse>
    postV1UserRegroup(args: PostV1UserRegroupArgs): Promise<PostV1UserRegroupResponse>
    postV1UserDeleteCache(): Promise<PostV1UserDeleteCacheResponse>
    getV1GroupList(args: GetV1GroupListArgs): Promise<GetV1GroupListResponse>
    postV1GroupCreate(args: PostV1GroupCreateArgs): Promise<PostV1GroupCreateResponse>
    postV1GroupUpdate(args: PostV1GroupUpdateArgs): Promise<PostV1GroupUpdateResponse>
    getV1ApplicationList(args: GetV1ApplicationListArgs): Promise<GetV1ApplicationListResponse>
  }
}

/** 打开环境 */
export type GetV1BrowserStartQuery = paths['/api/v1/browser/start']['get']['parameters']['query']
export interface GetV1BrowserStartArgs {
  query?: GetV1BrowserStartQuery
}
export type GetV1BrowserStartResponse = JsonResponse<'/api/v1/browser/start', 'get'>
ApiClient.prototype.getV1BrowserStart = async function(args: GetV1BrowserStartArgs) {
  const response = await this.request<GetV1BrowserStartResponse>({
    method: 'get',
    url: '/v1/browser/start',
    params: args.query,
  })
  return response.data
}

/** 关闭环境 */
export type GetV1BrowserStopQuery = paths['/api/v1/browser/stop']['get']['parameters']['query']
export interface GetV1BrowserStopArgs {
  query?: GetV1BrowserStopQuery
}
export type GetV1BrowserStopResponse = JsonResponse<'/api/v1/browser/stop', 'get'>
ApiClient.prototype.getV1BrowserStop = async function(args: GetV1BrowserStopArgs) {
  const response = await this.request<GetV1BrowserStopResponse>({
    method: 'get',
    url: '/v1/browser/stop',
    params: args.query,
  })
  return response.data
}

/** 检查启动状态 (当前设备) */
export type GetV1BrowserActiveQuery = paths['/api/v1/browser/active']['get']['parameters']['query']
export interface GetV1BrowserActiveArgs {
  query?: GetV1BrowserActiveQuery
}
export type GetV1BrowserActiveResponse = JsonResponse<'/api/v1/browser/active', 'get'>
ApiClient.prototype.getV1BrowserActive = async function(args: GetV1BrowserActiveArgs) {
  const response = await this.request<GetV1BrowserActiveResponse>({
    method: 'get',
    url: '/v1/browser/active',
    params: args.query,
  })
  return response.data
}

/** 检查环境状态 (跨设备) */
export type PostV1BrowserCloudActiveQuery = paths['/api/v1/browser/cloud-active']['post']['parameters']['query']
export type PostV1BrowserCloudActiveBody = NonNullable<paths['/api/v1/browser/cloud-active']['post']['requestBody']>['content']['application/json']
export interface PostV1BrowserCloudActiveArgs {
  query?: PostV1BrowserCloudActiveQuery
  body: PostV1BrowserCloudActiveBody
}
export type PostV1BrowserCloudActiveResponse = JsonResponse<'/api/v1/browser/cloud-active', 'post'>
ApiClient.prototype.postV1BrowserCloudActive = async function(args: PostV1BrowserCloudActiveArgs) {
  const response = await this.request<PostV1BrowserCloudActiveResponse>({
    method: 'post',
    url: '/v1/browser/cloud-active',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 查询环境 */
export type GetV1UserListQuery = paths['/api/v1/user/list']['get']['parameters']['query']
export type GetV1UserListBody = NonNullable<paths['/api/v1/user/list']['get']['requestBody']>['content']['application/json']
export interface GetV1UserListArgs {
  query?: GetV1UserListQuery
  body?: GetV1UserListBody
}
export type GetV1UserListResponse = JsonResponse<'/api/v1/user/list', 'get'>
ApiClient.prototype.getV1UserList = async function(args: GetV1UserListArgs) {
  const response = await this.request<GetV1UserListResponse>({
    method: 'get',
    url: '/v1/user/list',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 创建环境 */
export type PostV1UserCreateQuery = paths['/api/v1/user/create']['post']['parameters']['query']
export type PostV1UserCreateBody = NonNullable<paths['/api/v1/user/create']['post']['requestBody']>['content']['application/json']
export interface PostV1UserCreateArgs {
  query?: PostV1UserCreateQuery
  body: PostV1UserCreateBody
}
export type PostV1UserCreateResponse = JsonResponse<'/api/v1/user/create', 'post'>
ApiClient.prototype.postV1UserCreate = async function(args: PostV1UserCreateArgs) {
  const response = await this.request<PostV1UserCreateResponse>({
    method: 'post',
    url: '/v1/user/create',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 更新环境 */
export type PostV1UserUpdateQuery = paths['/api/v1/user/update']['post']['parameters']['query']
export type PostV1UserUpdateBody = NonNullable<paths['/api/v1/user/update']['post']['requestBody']>['content']['application/json']
export interface PostV1UserUpdateArgs {
  query?: PostV1UserUpdateQuery
  body: PostV1UserUpdateBody
}
export type PostV1UserUpdateResponse = JsonResponse<'/api/v1/user/update', 'post'>
ApiClient.prototype.postV1UserUpdate = async function(args: PostV1UserUpdateArgs) {
  const response = await this.request<PostV1UserUpdateResponse>({
    method: 'post',
    url: '/v1/user/update',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 删除环境 */
export type PostV1UserDeleteQuery = paths['/api/v1/user/delete']['post']['parameters']['query']
export type PostV1UserDeleteBody = NonNullable<paths['/api/v1/user/delete']['post']['requestBody']>['content']['application/json']
export interface PostV1UserDeleteArgs {
  query?: PostV1UserDeleteQuery
  body: PostV1UserDeleteBody
}
export type PostV1UserDeleteResponse = JsonResponse<'/api/v1/user/delete', 'post'>
ApiClient.prototype.postV1UserDelete = async function(args: PostV1UserDeleteArgs) {
  const response = await this.request<PostV1UserDeleteResponse>({
    method: 'post',
    url: '/v1/user/delete',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 移动环境 */
export type PostV1UserRegroupQuery = paths['/api/v1/user/regroup']['post']['parameters']['query']
export type PostV1UserRegroupBody = NonNullable<paths['/api/v1/user/regroup']['post']['requestBody']>['content']['application/json']
export interface PostV1UserRegroupArgs {
  query?: PostV1UserRegroupQuery
  body: PostV1UserRegroupBody
}
export type PostV1UserRegroupResponse = JsonResponse<'/api/v1/user/regroup', 'post'>
ApiClient.prototype.postV1UserRegroup = async function(args: PostV1UserRegroupArgs) {
  const response = await this.request<PostV1UserRegroupResponse>({
    method: 'post',
    url: '/v1/user/regroup',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 清除缓存 */
export type PostV1UserDeleteCacheResponse = JsonResponse<'/api/v1/user/delete-cache', 'post'>
ApiClient.prototype.postV1UserDeleteCache = async function() {
  const response = await this.request<PostV1UserDeleteCacheResponse>({
    method: 'post',
    url: '/v1/user/delete-cache',
  })
  return response.data
}

/** 查询分组 */
export type GetV1GroupListQuery = paths['/api/v1/group/list']['get']['parameters']['query']
export interface GetV1GroupListArgs {
  query?: GetV1GroupListQuery
}
export type GetV1GroupListResponse = JsonResponse<'/api/v1/group/list', 'get'>
ApiClient.prototype.getV1GroupList = async function(args: GetV1GroupListArgs) {
  const response = await this.request<GetV1GroupListResponse>({
    method: 'get',
    url: '/v1/group/list',
    params: args.query,
  })
  return response.data
}

/** 创建分组 */
export type PostV1GroupCreateQuery = paths['/api/v1/group/create']['post']['parameters']['query']
export type PostV1GroupCreateBody = NonNullable<paths['/api/v1/group/create']['post']['requestBody']>['content']['application/json']
export interface PostV1GroupCreateArgs {
  query?: PostV1GroupCreateQuery
  body: PostV1GroupCreateBody
}
export type PostV1GroupCreateResponse = JsonResponse<'/api/v1/group/create', 'post'>
ApiClient.prototype.postV1GroupCreate = async function(args: PostV1GroupCreateArgs) {
  const response = await this.request<PostV1GroupCreateResponse>({
    method: 'post',
    url: '/v1/group/create',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 更新分组 */
export type PostV1GroupUpdateQuery = paths['/api/v1/group/update']['post']['parameters']['query']
export type PostV1GroupUpdateBody = NonNullable<paths['/api/v1/group/update']['post']['requestBody']>['content']['application/json']
export interface PostV1GroupUpdateArgs {
  query?: PostV1GroupUpdateQuery
  body: PostV1GroupUpdateBody
}
export type PostV1GroupUpdateResponse = JsonResponse<'/api/v1/group/update', 'post'>
ApiClient.prototype.postV1GroupUpdate = async function(args: PostV1GroupUpdateArgs) {
  const response = await this.request<PostV1GroupUpdateResponse>({
    method: 'post',
    url: '/v1/group/update',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 应用分类列表 */
export type GetV1ApplicationListQuery = paths['/api/v1/application/list']['get']['parameters']['query']
export interface GetV1ApplicationListArgs {
  query?: GetV1ApplicationListQuery
}
export type GetV1ApplicationListResponse = JsonResponse<'/api/v1/application/list', 'get'>
ApiClient.prototype.getV1ApplicationList = async function(args: GetV1ApplicationListArgs) {
  const response = await this.request<GetV1ApplicationListResponse>({
    method: 'get',
    url: '/v1/application/list',
    params: args.query,
  })
  return response.data
}
