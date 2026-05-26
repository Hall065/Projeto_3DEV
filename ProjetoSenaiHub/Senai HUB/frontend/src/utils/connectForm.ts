/** FK opcional: vazio ou inválido → não envia vínculo (undefined omite no JSON). */
export function optionalForeignId(value: string | number | null | undefined): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return undefined
  return n
}

/** Para atualização quando precisa limpar vínculo no backend (null explícito). */
export function optionalForeignIdOrNull(value: string | number | null | undefined): number | null | undefined {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

export function slugClassCode(name: string, fallback = 'TURMA'): string {
  const code = name
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toUpperCase()
  return code.length >= 2 ? code : `${fallback}-${Date.now().toString(36).slice(-4).toUpperCase()}`
}
