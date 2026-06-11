// 脚本自动生成，不要手动修改
import type { paths } from './schemas'

export type JsonResponse<
  Path extends keyof paths,
  Method extends keyof paths[Path]
> = paths[Path][Method] extends {
  responses: { 200: { content: { 'application/json': infer R } } }
}
  ? R
  : unknown
