
import fs from 'node:fs'
import path from 'node:path'
import openapiTS, { astToString } from 'openapi-typescript'

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'
type PathEntry = Record<string, unknown>
type OpenApiParameter = { in?: string }
type OpenApiOperation = {
  summary?: string
  parameters?: OpenApiParameter[]
  requestBody?: {
    content?: {
      'application/json'?: unknown
    }
  }
}

const OPENAPI_HTTP_SOURCE = 'http://127.0.0.1:8000/openapi.json'
const OPENAPI_SOURCE = process.env.OPENAPI_HTTP_SOURCE ?? OPENAPI_HTTP_SOURCE
const OPENAPI_FILE_SOURCE = ''
const OUTPUT_DIR = path.resolve(process.cwd(), 'src/api/generated')
const API_PREFIX = '/api/v1'
const SUPPORTED_METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete']

function toPascalCase(value: string) {
  return value
    .replace(/[{}]/g, '')
    .replace(/(^|[_\-/\s]+)(\w)/g, (_, __, char: string) => char.toUpperCase())
}

function toCamelCase(value: string) {
  const pascal = toPascalCase(value)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

function getModuleName(url: string) {
  const cleaned = url.replace(API_PREFIX, '').split('/').filter(Boolean)
  return cleaned[0] ?? 'index'
}

function buildOperationName(method: HttpMethod, url: string) {
  const cleaned = url
    .replace(API_PREFIX, '')
    .split('/')
    .filter(Boolean)
    .map((segment) =>
      segment.startsWith('{') ? `by_${segment.replace(/[{}]/g, '')}` : segment,
    )
    .join('_')
  return toCamelCase(`${method}_${cleaned || 'root'}`)
}

function buildTemplateUrl(url: string) {
  return url
    .replace(API_PREFIX, '')
    .replace(/{([^}]+)}/g, '${args.path.$1}')
}

function parsePathMethods(paths: Record<string, PathEntry>) {
  const grouped: Record<
    string,
    Array<{ url: string; method: HttpMethod; operation: OpenApiOperation }>
  > = {}

  Object.entries(paths).forEach(([url, methods]) => {
    if (!url.startsWith(API_PREFIX)) {
      return
    }

    Object.entries(methods).forEach(([method, operation]) => {
      if (!SUPPORTED_METHODS.includes(method as HttpMethod)) {
        return
      }

      const moduleName = getModuleName(url)
      grouped[moduleName] ??= []
      grouped[moduleName].push({
        url,
        method: method as HttpMethod,
        operation: operation as OpenApiOperation,
      })
    })
  })

  return grouped
}

function createHelpersContent() {
  return `// 脚本自动生成，不要手动修改
import type { paths } from './schemas'

export type JsonResponse<
  Path extends keyof paths,
  Method extends keyof paths[Path]
> = paths[Path][Method] extends {
  responses: { 200: { content: { 'application/json': infer R } } }
}
  ? R
  : unknown
`
}

function createModuleFileContent(
  entries: Array<{ url: string; method: HttpMethod; operation: OpenApiOperation }>,
) {
  const isAdsPower = OUTPUT_DIR.toLowerCase().includes('adspower')
  const isInstagram = OUTPUT_DIR.toLowerCase().includes('instagram')
  const clientImportPath = isAdsPower || isInstagram ? '../client' : '@/api/client'

  const lines: string[] = []
  lines.push('// 脚本自动生成，不要手动修改')
  if (isAdsPower) {
    lines.push(`import { ApiClient } from '${clientImportPath}'`)
  } else {
    lines.push(`import { request } from '${clientImportPath}'`)
  }
  lines.push("import type { paths } from './schemas'")
  lines.push("import type { JsonResponse } from './helpers'")
  lines.push('')

  if (isAdsPower && entries.length > 0) {
    lines.push(`declare module '${clientImportPath}' {`)
    lines.push(`  interface ApiClient {`)
    entries.forEach(({ url, method, operation }) => {
      const operationName = buildOperationName(method, url)
      const typeBase = toPascalCase(operationName)

      const params = operation.parameters ?? []
      const hasPath = params.some((item) => item.in === 'path')
      const hasQuery = params.some((item) => item.in === 'query')
      const hasBody = Boolean(operation?.requestBody?.content?.['application/json'])

      const argsProps: string[] = []
      if (hasPath) argsProps.push('path')
      if (hasQuery) argsProps.push('query')
      if (hasBody) argsProps.push('body')

      const argsTypeName = `${typeBase}Args`
      const argSignature = argsProps.length > 0 ? `args: ${argsTypeName}` : ''
      lines.push(`    ${operationName}(${argSignature}): Promise<${typeBase}Response>`)
    })
    lines.push(`  }`)
    lines.push(`}`)
    lines.push('')
  }

  entries.forEach(({ url, method, operation }) => {
    const operationName = buildOperationName(method, url)
    const typeBase = toPascalCase(operationName)
    const summary = operation?.summary ?? `${method.toUpperCase()} ${url}`

    const params = operation.parameters ?? []
    const hasPath = params.some((item) => item.in === 'path')
    const hasQuery = params.some((item) => item.in === 'query')
    const hasBody = Boolean(operation?.requestBody?.content?.['application/json'])

    const pathRef = `paths['${url}']['${method}']`

    lines.push(`/** ${summary} */`)
    if (hasPath) {
      lines.push(`export type ${typeBase}Path = ${pathRef}['parameters']['path']`)
    }
    if (hasQuery) {
      lines.push(`export type ${typeBase}Query = ${pathRef}['parameters']['query']`)
    }
    if (hasBody) {
      lines.push(
        `export type ${typeBase}Body = NonNullable<${pathRef}['requestBody']>['content']['application/json']`,
      )
    }

    const argsTypeName = `${typeBase}Args`
    const argsProps: string[] = []
    if (hasPath) {
      argsProps.push(`path: ${typeBase}Path`)
    }
    if (hasQuery) {
      argsProps.push(`query?: ${typeBase}Query`)
    }
    if (hasBody) {
      const required = method === 'post' || method === 'put' || method === 'patch'
      argsProps.push(`body${required ? '' : '?'}: ${typeBase}Body`)
    }

    if (argsProps.length > 0) {
      lines.push(`export interface ${argsTypeName} {`)
      argsProps.forEach((prop) => lines.push(`  ${prop}`))
      lines.push('}')
    }

    lines.push(`export type ${typeBase}Response = JsonResponse<'${url}', '${method}'>`)

    const urlExpr = hasPath
      ? `\`${buildTemplateUrl(url)}\``
      : `'${url.replace(API_PREFIX, '')}'`
    const argSignature = argsProps.length > 0 ? `args: ${argsTypeName}` : ''

    if (isAdsPower) {
      lines.push(`ApiClient.prototype.${operationName} = async function(${argSignature}) {`)
      lines.push(`  const response = await this.request<${typeBase}Response>({`)
    } else {
      lines.push(`export async function ${operationName}(${argSignature}) {`)
      lines.push(`  const response = await request<${typeBase}Response>({`)
    }
    lines.push(`    method: '${method}',`)
    lines.push(`    url: ${urlExpr},`)
    if (hasQuery) {
      lines.push('    params: args.query,')
    }
    if (hasBody) {
      lines.push('    data: args.body,')
    }
    lines.push('  })')
    lines.push('  return response.data')
    lines.push('}')
    lines.push('')
  })

  return lines.join('\n')
}

async function loadOpenApiSpec() {
  if (OPENAPI_FILE_SOURCE) {
    const filePath = path.resolve(process.cwd(), OPENAPI_FILE_SOURCE)
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  }

  const response = await fetch(OPENAPI_SOURCE)
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Failed to fetch OpenAPI from ${OPENAPI_SOURCE}: ${response.status} ${errorText}`,
    )
  }
  return response.json()
}

async function generate() {
  console.log('Start generating frontend API code...')

  const spec = await loadOpenApiSpec()
  const schemaAst = await openapiTS(spec)

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.writeFileSync(path.join(OUTPUT_DIR, 'schemas.ts'), astToString(schemaAst))
  fs.writeFileSync(path.join(OUTPUT_DIR, 'helpers.ts'), createHelpersContent())

  const grouped = parsePathMethods(spec.paths ?? {})
  const indexExports: string[] = []

  Object.entries(grouped).forEach(([moduleName, entries]) => {
    const fileName = `${moduleName}.ts`
    fs.writeFileSync(path.join(OUTPUT_DIR, fileName), createModuleFileContent(entries))
    indexExports.push(`export * from './${moduleName}'`)
  })

  indexExports.push("export * from './schemas'")
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), `${indexExports.join('\n')}\n`)

  console.log(`Generated ${Object.keys(grouped).length} API modules at ${OUTPUT_DIR}`)
}

generate().catch((error) => {
  console.error(error)
  process.exit(1)
})
