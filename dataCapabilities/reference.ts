import type { SavedQueryReference } from './types'
export const CUSTOM_SOURCE_NAMESPACE = 'datasource.saved-query'

/** UTF-8 hex keeps arbitrary IDs inside the public dotted capability ID grammar; names never affect identity. */
export function sourceCapabilityId(reference: SavedQueryReference): string {
  const encoded = new TextEncoder().encode(JSON.stringify([reference.queryId, reference.commandId]))
  return `${CUSTOM_SOURCE_NAMESPACE}.${Array.from(encoded, byte => byte.toString(16).padStart(2, '0')).join('')}`
}
export function parseSourceCapabilityId(id: string): SavedQueryReference | undefined {
  const prefix = `${CUSTOM_SOURCE_NAMESPACE}.`
  if (!id.startsWith(prefix)) return undefined
  const encoded = id.slice(prefix.length)
  if (!/^(?:[0-9a-f]{2})+$/.test(encoded) || encoded.length > 8192) return undefined
  try {
    const bytes = Uint8Array.from(encoded.match(/../g)!, pair => parseInt(pair, 16))
    const value: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
    if (!Array.isArray(value) || value.length !== 2 || value.some(item => typeof item !== 'string' || !item)) return undefined
    return { queryId: value[0], commandId: value[1] }
  } catch { return undefined }
}
