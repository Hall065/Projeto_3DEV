import fs from 'node:fs'
import path from 'node:path'

function merge(a, b) {
  const result = { ...a }
  for (const [key, value] of Object.entries(b)) {
    const current = result[key]
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      current &&
      typeof current === 'object' &&
      !Array.isArray(current)
    ) {
      result[key] = merge(current, value)
    } else {
      result[key] = value
    }
  }
  return result
}

const additions = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts/i18n-additions.json'), 'utf8'))

for (const lang of ['pt', 'en', 'es']) {
  const filePath = path.join(process.cwd(), `src/i18n/locales/supplement/${lang}.json`)
  const current = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const merged = merge(current, additions[lang])
  fs.writeFileSync(filePath, `${JSON.stringify(merged, null, 2)}\n`)
  console.log(`Merged ${lang}: ${Object.keys(merged).length} top-level keys`)
}
