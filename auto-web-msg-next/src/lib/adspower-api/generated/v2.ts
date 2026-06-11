// 脚本自动生成，不要手动修改
import { ApiClient } from '../client'
import type { paths } from './schemas'
import type { JsonResponse } from './helpers'

declare module '../client' {
  interface ApiClient {
    postV2BrowserProfileStart(args: PostV2BrowserProfileStartArgs): Promise<PostV2BrowserProfileStartResponse>
    postV2BrowserProfileStop(args: PostV2BrowserProfileStopArgs): Promise<PostV2BrowserProfileStopResponse>
    getV2BrowserProfileActive(args: GetV2BrowserProfileActiveArgs): Promise<GetV2BrowserProfileActiveResponse>
    postV2BrowserProfileList(args: PostV2BrowserProfileListArgs): Promise<PostV2BrowserProfileListResponse>
    postV2BrowserProfileCreate(args: PostV2BrowserProfileCreateArgs): Promise<PostV2BrowserProfileCreateResponse>
    postV2BrowserProfileUpdate(args: PostV2BrowserProfileUpdateArgs): Promise<PostV2BrowserProfileUpdateResponse>
    postV2BrowserProfileDelete(args: PostV2BrowserProfileDeleteArgs): Promise<PostV2BrowserProfileDeleteResponse>
    postV2BrowserProfileDeleteCache(args: PostV2BrowserProfileDeleteCacheArgs): Promise<PostV2BrowserProfileDeleteCacheResponse>
    postV2BrowserProfileShare(args: PostV2BrowserProfileShareArgs): Promise<PostV2BrowserProfileShareResponse>
    getV2BrowserProfileCookies(args: GetV2BrowserProfileCookiesArgs): Promise<GetV2BrowserProfileCookiesResponse>
    postV2BrowserProfileUa(args: PostV2BrowserProfileUaArgs): Promise<PostV2BrowserProfileUaResponse>
    postV2BrowserProfileStopAll(): Promise<PostV2BrowserProfileStopAllResponse>
    postV2BrowserProfileNewFingerprint(args: PostV2BrowserProfileNewFingerprintArgs): Promise<PostV2BrowserProfileNewFingerprintResponse>
    getV2BrowserProfileKernels(args: GetV2BrowserProfileKernelsArgs): Promise<GetV2BrowserProfileKernelsResponse>
    postV2BrowserProfileDownloadKernel(args: PostV2BrowserProfileDownloadKernelArgs): Promise<PostV2BrowserProfileDownloadKernelResponse>
    postV2BrowserProfileUpdatePatch(args: PostV2BrowserProfileUpdatePatchArgs): Promise<PostV2BrowserProfileUpdatePatchResponse>
    postV2BrowserTagsCreate(args: PostV2BrowserTagsCreateArgs): Promise<PostV2BrowserTagsCreateResponse>
    postV2BrowserTagsUpdate(args: PostV2BrowserTagsUpdateArgs): Promise<PostV2BrowserTagsUpdateResponse>
    postV2BrowserTagsDelete(args: PostV2BrowserTagsDeleteArgs): Promise<PostV2BrowserTagsDeleteResponse>
    postV2BrowserTagsList(args: PostV2BrowserTagsListArgs): Promise<PostV2BrowserTagsListResponse>
    getV2ProxyListCreate(args: GetV2ProxyListCreateArgs): Promise<GetV2ProxyListCreateResponse>
    postV2ProxyListUpdate(args: PostV2ProxyListUpdateArgs): Promise<PostV2ProxyListUpdateResponse>
    postV2ProxyListList(args: PostV2ProxyListListArgs): Promise<PostV2ProxyListListResponse>
    postV2ProxyListDelete(args: PostV2ProxyListDeleteArgs): Promise<PostV2ProxyListDeleteResponse>
    getV2CategoryList(args: GetV2CategoryListArgs): Promise<GetV2CategoryListResponse>
  }
}

/** 打开环境 v2 */
export type PostV2BrowserProfileStartQuery = paths['/api/v2/browser-profile/start']['post']['parameters']['query']
export type PostV2BrowserProfileStartBody = NonNullable<paths['/api/v2/browser-profile/start']['post']['requestBody']>['content']['application/json']
export interface PostV2BrowserProfileStartArgs {
  query?: PostV2BrowserProfileStartQuery
  body: PostV2BrowserProfileStartBody
}
export type PostV2BrowserProfileStartResponse = JsonResponse<'/api/v2/browser-profile/start', 'post'>
ApiClient.prototype.postV2BrowserProfileStart = async function(args: PostV2BrowserProfileStartArgs) {
  const response = await this.request<PostV2BrowserProfileStartResponse>({
    method: 'post',
    url: '/v2/browser-profile/start',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 关闭环境 v2 */
export type PostV2BrowserProfileStopQuery = paths['/api/v2/browser-profile/stop']['post']['parameters']['query']
export type PostV2BrowserProfileStopBody = NonNullable<paths['/api/v2/browser-profile/stop']['post']['requestBody']>['content']['application/json']
export interface PostV2BrowserProfileStopArgs {
  query?: PostV2BrowserProfileStopQuery
  body: PostV2BrowserProfileStopBody
}
export type PostV2BrowserProfileStopResponse = JsonResponse<'/api/v2/browser-profile/stop', 'post'>
ApiClient.prototype.postV2BrowserProfileStop = async function(args: PostV2BrowserProfileStopArgs) {
  const response = await this.request<PostV2BrowserProfileStopResponse>({
    method: 'post',
    url: '/v2/browser-profile/stop',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 检查启动状态 (当前设备) v2 */
export type GetV2BrowserProfileActiveQuery = paths['/api/v2/browser-profile/active']['get']['parameters']['query']
export interface GetV2BrowserProfileActiveArgs {
  query?: GetV2BrowserProfileActiveQuery
}
export type GetV2BrowserProfileActiveResponse = JsonResponse<'/api/v2/browser-profile/active', 'get'>
ApiClient.prototype.getV2BrowserProfileActive = async function(args: GetV2BrowserProfileActiveArgs) {
  const response = await this.request<GetV2BrowserProfileActiveResponse>({
    method: 'get',
    url: '/v2/browser-profile/active',
    params: args.query,
  })
  return response.data
}

/** 查询环境 v2 */
export type PostV2BrowserProfileListQuery = paths['/api/v2/browser-profile/list']['post']['parameters']['query']
export type PostV2BrowserProfileListBody = NonNullable<paths['/api/v2/browser-profile/list']['post']['requestBody']>['content']['application/json']
export interface PostV2BrowserProfileListArgs {
  query?: PostV2BrowserProfileListQuery
  body: PostV2BrowserProfileListBody
}
export type PostV2BrowserProfileListResponse = JsonResponse<'/api/v2/browser-profile/list', 'post'>
ApiClient.prototype.postV2BrowserProfileList = async function(args: PostV2BrowserProfileListArgs) {
  const response = await this.request<PostV2BrowserProfileListResponse>({
    method: 'post',
    url: '/v2/browser-profile/list',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 创建环境 v2 */
export type PostV2BrowserProfileCreateQuery = paths['/api/v2/browser-profile/create']['post']['parameters']['query']
export type PostV2BrowserProfileCreateBody = NonNullable<paths['/api/v2/browser-profile/create']['post']['requestBody']>['content']['application/json']
export interface PostV2BrowserProfileCreateArgs {
  query?: PostV2BrowserProfileCreateQuery
  body: PostV2BrowserProfileCreateBody
}
export type PostV2BrowserProfileCreateResponse = JsonResponse<'/api/v2/browser-profile/create', 'post'>
ApiClient.prototype.postV2BrowserProfileCreate = async function(args: PostV2BrowserProfileCreateArgs) {
  const response = await this.request<PostV2BrowserProfileCreateResponse>({
    method: 'post',
    url: '/v2/browser-profile/create',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 更新环境 v2 */
export type PostV2BrowserProfileUpdateQuery = paths['/api/v2/browser-profile/update']['post']['parameters']['query']
export type PostV2BrowserProfileUpdateBody = NonNullable<paths['/api/v2/browser-profile/update']['post']['requestBody']>['content']['application/json']
export interface PostV2BrowserProfileUpdateArgs {
  query?: PostV2BrowserProfileUpdateQuery
  body: PostV2BrowserProfileUpdateBody
}
export type PostV2BrowserProfileUpdateResponse = JsonResponse<'/api/v2/browser-profile/update', 'post'>
ApiClient.prototype.postV2BrowserProfileUpdate = async function(args: PostV2BrowserProfileUpdateArgs) {
  const response = await this.request<PostV2BrowserProfileUpdateResponse>({
    method: 'post',
    url: '/v2/browser-profile/update',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 删除环境 v2 */
export type PostV2BrowserProfileDeleteQuery = paths['/api/v2/browser-profile/delete']['post']['parameters']['query']
export type PostV2BrowserProfileDeleteBody = NonNullable<paths['/api/v2/browser-profile/delete']['post']['requestBody']>['content']['application/json']
export interface PostV2BrowserProfileDeleteArgs {
  query?: PostV2BrowserProfileDeleteQuery
  body: PostV2BrowserProfileDeleteBody
}
export type PostV2BrowserProfileDeleteResponse = JsonResponse<'/api/v2/browser-profile/delete', 'post'>
ApiClient.prototype.postV2BrowserProfileDelete = async function(args: PostV2BrowserProfileDeleteArgs) {
  const response = await this.request<PostV2BrowserProfileDeleteResponse>({
    method: 'post',
    url: '/v2/browser-profile/delete',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 清除缓存 v2 */
export type PostV2BrowserProfileDeleteCacheQuery = paths['/api/v2/browser-profile/delete-cache']['post']['parameters']['query']
export type PostV2BrowserProfileDeleteCacheBody = NonNullable<paths['/api/v2/browser-profile/delete-cache']['post']['requestBody']>['content']['application/json']
export interface PostV2BrowserProfileDeleteCacheArgs {
  query?: PostV2BrowserProfileDeleteCacheQuery
  body: PostV2BrowserProfileDeleteCacheBody
}
export type PostV2BrowserProfileDeleteCacheResponse = JsonResponse<'/api/v2/browser-profile/delete-cache', 'post'>
ApiClient.prototype.postV2BrowserProfileDeleteCache = async function(args: PostV2BrowserProfileDeleteCacheArgs) {
  const response = await this.request<PostV2BrowserProfileDeleteCacheResponse>({
    method: 'post',
    url: '/v2/browser-profile/delete-cache',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 分享环境 */
export type PostV2BrowserProfileShareQuery = paths['/api/v2/browser-profile/share']['post']['parameters']['query']
export type PostV2BrowserProfileShareBody = NonNullable<paths['/api/v2/browser-profile/share']['post']['requestBody']>['content']['application/json']
export interface PostV2BrowserProfileShareArgs {
  query?: PostV2BrowserProfileShareQuery
  body: PostV2BrowserProfileShareBody
}
export type PostV2BrowserProfileShareResponse = JsonResponse<'/api/v2/browser-profile/share', 'post'>
ApiClient.prototype.postV2BrowserProfileShare = async function(args: PostV2BrowserProfileShareArgs) {
  const response = await this.request<PostV2BrowserProfileShareResponse>({
    method: 'post',
    url: '/v2/browser-profile/share',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 查询环境 Cookies */
export type GetV2BrowserProfileCookiesQuery = paths['/api/v2/browser-profile/cookies']['get']['parameters']['query']
export interface GetV2BrowserProfileCookiesArgs {
  query?: GetV2BrowserProfileCookiesQuery
}
export type GetV2BrowserProfileCookiesResponse = JsonResponse<'/api/v2/browser-profile/cookies', 'get'>
ApiClient.prototype.getV2BrowserProfileCookies = async function(args: GetV2BrowserProfileCookiesArgs) {
  const response = await this.request<GetV2BrowserProfileCookiesResponse>({
    method: 'get',
    url: '/v2/browser-profile/cookies',
    params: args.query,
  })
  return response.data
}

/** 查询环境 User-Agent */
export type PostV2BrowserProfileUaQuery = paths['/api/v2/browser-profile/ua']['post']['parameters']['query']
export type PostV2BrowserProfileUaBody = NonNullable<paths['/api/v2/browser-profile/ua']['post']['requestBody']>['content']['application/json']
export interface PostV2BrowserProfileUaArgs {
  query?: PostV2BrowserProfileUaQuery
  body: PostV2BrowserProfileUaBody
}
export type PostV2BrowserProfileUaResponse = JsonResponse<'/api/v2/browser-profile/ua', 'post'>
ApiClient.prototype.postV2BrowserProfileUa = async function(args: PostV2BrowserProfileUaArgs) {
  const response = await this.request<PostV2BrowserProfileUaResponse>({
    method: 'post',
    url: '/v2/browser-profile/ua',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 关闭所有环境 */
export type PostV2BrowserProfileStopAllResponse = JsonResponse<'/api/v2/browser-profile/stop-all', 'post'>
ApiClient.prototype.postV2BrowserProfileStopAll = async function() {
  const response = await this.request<PostV2BrowserProfileStopAllResponse>({
    method: 'post',
    url: '/v2/browser-profile/stop-all',
  })
  return response.data
}

/** 生成新指纹 */
export type PostV2BrowserProfileNewFingerprintQuery = paths['/api/v2/browser-profile/new-fingerprint']['post']['parameters']['query']
export type PostV2BrowserProfileNewFingerprintBody = NonNullable<paths['/api/v2/browser-profile/new-fingerprint']['post']['requestBody']>['content']['application/json']
export interface PostV2BrowserProfileNewFingerprintArgs {
  query?: PostV2BrowserProfileNewFingerprintQuery
  body: PostV2BrowserProfileNewFingerprintBody
}
export type PostV2BrowserProfileNewFingerprintResponse = JsonResponse<'/api/v2/browser-profile/new-fingerprint', 'post'>
ApiClient.prototype.postV2BrowserProfileNewFingerprint = async function(args: PostV2BrowserProfileNewFingerprintArgs) {
  const response = await this.request<PostV2BrowserProfileNewFingerprintResponse>({
    method: 'post',
    url: '/v2/browser-profile/new-fingerprint',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 获取内核列表 */
export type GetV2BrowserProfileKernelsQuery = paths['/api/v2/browser-profile/kernels']['get']['parameters']['query']
export interface GetV2BrowserProfileKernelsArgs {
  query?: GetV2BrowserProfileKernelsQuery
}
export type GetV2BrowserProfileKernelsResponse = JsonResponse<'/api/v2/browser-profile/kernels', 'get'>
ApiClient.prototype.getV2BrowserProfileKernels = async function(args: GetV2BrowserProfileKernelsArgs) {
  const response = await this.request<GetV2BrowserProfileKernelsResponse>({
    method: 'get',
    url: '/v2/browser-profile/kernels',
    params: args.query,
  })
  return response.data
}

/** 下载内核 */
export type PostV2BrowserProfileDownloadKernelQuery = paths['/api/v2/browser-profile/download-kernel']['post']['parameters']['query']
export type PostV2BrowserProfileDownloadKernelBody = NonNullable<paths['/api/v2/browser-profile/download-kernel']['post']['requestBody']>['content']['application/json']
export interface PostV2BrowserProfileDownloadKernelArgs {
  query?: PostV2BrowserProfileDownloadKernelQuery
  body: PostV2BrowserProfileDownloadKernelBody
}
export type PostV2BrowserProfileDownloadKernelResponse = JsonResponse<'/api/v2/browser-profile/download-kernel', 'post'>
ApiClient.prototype.postV2BrowserProfileDownloadKernel = async function(args: PostV2BrowserProfileDownloadKernelArgs) {
  const response = await this.request<PostV2BrowserProfileDownloadKernelResponse>({
    method: 'post',
    url: '/v2/browser-profile/download-kernel',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 更新到最新补丁 */
export type PostV2BrowserProfileUpdatePatchQuery = paths['/api/v2/browser-profile/update-patch']['post']['parameters']['query']
export type PostV2BrowserProfileUpdatePatchBody = NonNullable<paths['/api/v2/browser-profile/update-patch']['post']['requestBody']>['content']['application/json']
export interface PostV2BrowserProfileUpdatePatchArgs {
  query?: PostV2BrowserProfileUpdatePatchQuery
  body: PostV2BrowserProfileUpdatePatchBody
}
export type PostV2BrowserProfileUpdatePatchResponse = JsonResponse<'/api/v2/browser-profile/update-patch', 'post'>
ApiClient.prototype.postV2BrowserProfileUpdatePatch = async function(args: PostV2BrowserProfileUpdatePatchArgs) {
  const response = await this.request<PostV2BrowserProfileUpdatePatchResponse>({
    method: 'post',
    url: '/v2/browser-profile/update-patch',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 创建标签 */
export type PostV2BrowserTagsCreateQuery = paths['/api/v2/browser-tags/create']['post']['parameters']['query']
export type PostV2BrowserTagsCreateBody = NonNullable<paths['/api/v2/browser-tags/create']['post']['requestBody']>['content']['application/json']
export interface PostV2BrowserTagsCreateArgs {
  query?: PostV2BrowserTagsCreateQuery
  body: PostV2BrowserTagsCreateBody
}
export type PostV2BrowserTagsCreateResponse = JsonResponse<'/api/v2/browser-tags/create', 'post'>
ApiClient.prototype.postV2BrowserTagsCreate = async function(args: PostV2BrowserTagsCreateArgs) {
  const response = await this.request<PostV2BrowserTagsCreateResponse>({
    method: 'post',
    url: '/v2/browser-tags/create',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 更新标签 */
export type PostV2BrowserTagsUpdateQuery = paths['/api/v2/browser-tags/update']['post']['parameters']['query']
export type PostV2BrowserTagsUpdateBody = NonNullable<paths['/api/v2/browser-tags/update']['post']['requestBody']>['content']['application/json']
export interface PostV2BrowserTagsUpdateArgs {
  query?: PostV2BrowserTagsUpdateQuery
  body: PostV2BrowserTagsUpdateBody
}
export type PostV2BrowserTagsUpdateResponse = JsonResponse<'/api/v2/browser-tags/update', 'post'>
ApiClient.prototype.postV2BrowserTagsUpdate = async function(args: PostV2BrowserTagsUpdateArgs) {
  const response = await this.request<PostV2BrowserTagsUpdateResponse>({
    method: 'post',
    url: '/v2/browser-tags/update',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 删除标签 */
export type PostV2BrowserTagsDeleteQuery = paths['/api/v2/browser-tags/delete']['post']['parameters']['query']
export type PostV2BrowserTagsDeleteBody = NonNullable<paths['/api/v2/browser-tags/delete']['post']['requestBody']>['content']['application/json']
export interface PostV2BrowserTagsDeleteArgs {
  query?: PostV2BrowserTagsDeleteQuery
  body: PostV2BrowserTagsDeleteBody
}
export type PostV2BrowserTagsDeleteResponse = JsonResponse<'/api/v2/browser-tags/delete', 'post'>
ApiClient.prototype.postV2BrowserTagsDelete = async function(args: PostV2BrowserTagsDeleteArgs) {
  const response = await this.request<PostV2BrowserTagsDeleteResponse>({
    method: 'post',
    url: '/v2/browser-tags/delete',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 查询标签 */
export type PostV2BrowserTagsListQuery = paths['/api/v2/browser-tags/list']['post']['parameters']['query']
export type PostV2BrowserTagsListBody = NonNullable<paths['/api/v2/browser-tags/list']['post']['requestBody']>['content']['application/json']
export interface PostV2BrowserTagsListArgs {
  query?: PostV2BrowserTagsListQuery
  body: PostV2BrowserTagsListBody
}
export type PostV2BrowserTagsListResponse = JsonResponse<'/api/v2/browser-tags/list', 'post'>
ApiClient.prototype.postV2BrowserTagsList = async function(args: PostV2BrowserTagsListArgs) {
  const response = await this.request<PostV2BrowserTagsListResponse>({
    method: 'post',
    url: '/v2/browser-tags/list',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 创建代理 */
export type GetV2ProxyListCreateQuery = paths['/api/v2/proxy-list/create']['get']['parameters']['query']
export type GetV2ProxyListCreateBody = NonNullable<paths['/api/v2/proxy-list/create']['get']['requestBody']>['content']['application/json']
export interface GetV2ProxyListCreateArgs {
  query?: GetV2ProxyListCreateQuery
  body?: GetV2ProxyListCreateBody
}
export type GetV2ProxyListCreateResponse = JsonResponse<'/api/v2/proxy-list/create', 'get'>
ApiClient.prototype.getV2ProxyListCreate = async function(args: GetV2ProxyListCreateArgs) {
  const response = await this.request<GetV2ProxyListCreateResponse>({
    method: 'get',
    url: '/v2/proxy-list/create',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 更新代理 */
export type PostV2ProxyListUpdateQuery = paths['/api/v2/proxy-list/update']['post']['parameters']['query']
export type PostV2ProxyListUpdateBody = NonNullable<paths['/api/v2/proxy-list/update']['post']['requestBody']>['content']['application/json']
export interface PostV2ProxyListUpdateArgs {
  query?: PostV2ProxyListUpdateQuery
  body: PostV2ProxyListUpdateBody
}
export type PostV2ProxyListUpdateResponse = JsonResponse<'/api/v2/proxy-list/update', 'post'>
ApiClient.prototype.postV2ProxyListUpdate = async function(args: PostV2ProxyListUpdateArgs) {
  const response = await this.request<PostV2ProxyListUpdateResponse>({
    method: 'post',
    url: '/v2/proxy-list/update',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 查询代理 */
export type PostV2ProxyListListQuery = paths['/api/v2/proxy-list/list']['post']['parameters']['query']
export type PostV2ProxyListListBody = NonNullable<paths['/api/v2/proxy-list/list']['post']['requestBody']>['content']['application/json']
export interface PostV2ProxyListListArgs {
  query?: PostV2ProxyListListQuery
  body: PostV2ProxyListListBody
}
export type PostV2ProxyListListResponse = JsonResponse<'/api/v2/proxy-list/list', 'post'>
ApiClient.prototype.postV2ProxyListList = async function(args: PostV2ProxyListListArgs) {
  const response = await this.request<PostV2ProxyListListResponse>({
    method: 'post',
    url: '/v2/proxy-list/list',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 删除代理 */
export type PostV2ProxyListDeleteQuery = paths['/api/v2/proxy-list/delete']['post']['parameters']['query']
export type PostV2ProxyListDeleteBody = NonNullable<paths['/api/v2/proxy-list/delete']['post']['requestBody']>['content']['application/json']
export interface PostV2ProxyListDeleteArgs {
  query?: PostV2ProxyListDeleteQuery
  body: PostV2ProxyListDeleteBody
}
export type PostV2ProxyListDeleteResponse = JsonResponse<'/api/v2/proxy-list/delete', 'post'>
ApiClient.prototype.postV2ProxyListDelete = async function(args: PostV2ProxyListDeleteArgs) {
  const response = await this.request<PostV2ProxyListDeleteResponse>({
    method: 'post',
    url: '/v2/proxy-list/delete',
    params: args.query,
    data: args.body,
  })
  return response.data
}

/** 插件分类列表 v2 */
export type GetV2CategoryListQuery = paths['/api/v2/category/list']['get']['parameters']['query']
export interface GetV2CategoryListArgs {
  query?: GetV2CategoryListQuery
}
export type GetV2CategoryListResponse = JsonResponse<'/api/v2/category/list', 'get'>
ApiClient.prototype.getV2CategoryList = async function(args: GetV2CategoryListArgs) {
  const response = await this.request<GetV2CategoryListResponse>({
    method: 'get',
    url: '/v2/category/list',
    params: args.query,
  })
  return response.data
}
