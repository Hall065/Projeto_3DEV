export function mergeLocales<T extends Record<string, unknown>>(base: T, extra: Record<string, unknown>): T {
  const result = { ...base } as Record<string, unknown>

  for (const [key, value] of Object.entries(extra)) {
    const current = result[key]
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      current &&
      typeof current === 'object' &&
      !Array.isArray(current)
    ) {
      result[key] = mergeLocales(current as Record<string, unknown>, value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }

  return result as T
}
