import fs from 'node:fs'
import path from 'node:path'

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (fs.statSync(full).isDirectory()) {
      if (!entry.includes('node_modules') && entry !== 'i18n') walk(full, acc)
    } else if (/\.(tsx|ts)$/.test(entry) && !entry.endsWith('.test.ts')) {
      acc.push(full)
    }
  }
  return acc
}

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

function flattenKeys(obj, prefix = '') {
  const keys = []
  for (const [key, value] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, next))
    } else {
      keys.push(next)
    }
  }
  return keys
}

const CSS_CLASS_PATTERN =
  /\b(flex|grid|rounded|border-|text-|bg-|px-|py-|absolute|relative|inline-flex|min-h-|max-w-|overflow-|shadow-|gap-|items-|justify-|w-full|h-|sm:|md:|lg:|from-|to-|via-|ring-|hover:|focus:|disabled:|animate-|pointer-events|backdrop-|glass-|surface-|scrollbar-|col-span|font-|tracking-|uppercase|leading-|shrink-|z-|inset|opacity-|blur-|translate-|rotate-|scale-|object-|aspect-|hidden|block|fixed|sticky|cursor-|kanban-)\b/

const SKIP_PATH_PREFIXES = [
  'constants/wallpapers.ts',
  'constants/chartPalette.ts',
  'constants/campusBlocks.ts',
  'constants/gridInventoryCategories.ts',
  'constants/gridRoles.ts',
  'config/navPermissions.ts',
  'routes/index.tsx',
  'utils/courseThemes.ts',
  'utils/inventoryImageFallback.ts',
  'utils/campusPeopleSimulation.ts',
  'utils/mediaUrl.ts',
  'utils/apiError.ts',
  'utils/wallpaperTone.ts',
  'utils/csvExport.ts',
  'utils/gridInventoryAvailability.ts',
  'utils/navI18n.ts',
  'hooks/useInterfacePreferences.ts',
  'hooks/useMapState.ts',
  'hooks/usePermissions.ts',
  'services/reportService.ts',
]

function isCssLikeString(s) {
  if (CSS_CLASS_PATTERN.test(s)) return true
  if (/^[\w-]+(\s+[\w\[\]#.:!/-]+)+$/.test(s) && (s.includes(' ') && !/[áéíóúãõêçÁÉÍÓÚÃÕÊÇ]/.test(s))) {
    const tokens = s.split(/\s+/)
    if (tokens.length >= 3 && tokens.every((t) => /^[a-z0-9_./:#\[\]-]+$/i.test(t))) {
      return true
    }
  }
  return false
}

function isUserFacingString(s) {
  if (s.startsWith('http') || s.startsWith('/') || s.startsWith('#') || s.includes('className')) return false
  if (s.includes('{{') || s.includes('${')) return false
  if (s.includes('<') || s.includes('>') || s.includes('label=') || s.includes('status=')) return false
  if (isCssLikeString(s)) return false
  if (/^[a-z0-9_.-]+$/i.test(s) && !s.includes(' ')) return false
  if (/^mailto:/.test(s)) return false
  if (/^\.{1,2}\//.test(s)) return false
  if (/^#[0-9a-f]{3,8}$/i.test(s)) return false
  if (/^(senai-|hub-|bg-|text-|border-)/.test(s)) return false
  if (/^rgba?\(/.test(s)) return false
  if (/^linear-gradient/.test(s)) return false
  if (/^conic-gradient/.test(s)) return false
  if (/^M [\d.]/.test(s)) return false
  if (/stopOpacity|WebkitMaskImage|maskImage/.test(s)) return false

  const ptPattern =
    /[áéíóúàãõêçÁÉÍÓÚÀÃÕÊÇ]|(?:Nao |nao |Não |Usu[aá]rio|Salvar|Excluir|Carregando|Suporte|Editar|Chamado|Autoriz|Relat|Matric|Profess|Aluno|Turma|Configur|Informe|Selecione|Preencha|Nenhum|Sem |Dados |Hist[oó]rico|Contrato|Frequ|Professor|Funcion|Portaria|Aprov|Negad|Protocolo|Matr[ií]cula|Verificando|Fechar|Voltar|Mostrando|Presentes|Faltas|Aguardando)/

  return ptPattern.test(s) || /[A-Za-z]{3,} [A-Za-z]{3,}/.test(s)
}

const root = path.join(process.cwd(), 'src')
const files = walk(root)

const pt = merge(
  JSON.parse(fs.readFileSync('src/i18n/locales/pt.json', 'utf8')),
  JSON.parse(fs.readFileSync('src/i18n/locales/supplement/pt.json', 'utf8')),
)
const en = merge(
  JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8')),
  JSON.parse(fs.readFileSync('src/i18n/locales/supplement/en.json', 'utf8')),
)
const es = merge(
  JSON.parse(fs.readFileSync('src/i18n/locales/es.json', 'utf8')),
  JSON.parse(fs.readFileSync('src/i18n/locales/supplement/es.json', 'utf8')),
)

const ptKeys = new Set(flattenKeys(pt))
const enKeys = new Set(flattenKeys(en))
const esKeys = new Set(flattenKeys(es))
const missingEn = [...ptKeys].filter((k) => !enKeys.has(k))
const missingEs = [...ptKeys].filter((k) => !esKeys.has(k))

console.log('Locale keys pt/en/es:', ptKeys.size, enKeys.size, esKeys.size)
console.log('Missing en:', missingEn.length)
console.log('Missing es:', missingEs.length)

const noI18n = []
const partialI18n = []

for (const file of files) {
  const rel = path.relative(root, file).replace(/\\/g, '/')
  if (SKIP_PATH_PREFIXES.some((p) => rel === p || rel.endsWith(p))) continue

  const content = fs.readFileSync(file, 'utf8')
  const usesI18n = content.includes('useTranslation') || content.includes('i18n.t(')

  const stringLiterals = [...content.matchAll(/(['"`])((?:\\.|(?!\1)[^\\\n]){4,120})\1/g)].map((m) => m[2])
  const userFacing = stringLiterals.filter((s) => {
    if (/^(export |import |function |const |return |\}`.)/.test(s)) return false
    if (s.includes('export ') || s.includes('function ') || s.includes('const ')) return false
    return isUserFacingString(s)
  })

  if (userFacing.length === 0) continue

  if (!usesI18n) noI18n.push({ rel, count: userFacing.length, samples: userFacing.slice(0, 5) })
  else {
    const remaining = userFacing.filter((s) => {
      const ptPattern =
        /[áéíóúàãõêçÁÉÍÓÚÀÃÕÊÇ]|(?:Nao |nao |Não |Usu[aá]rio|Salvar|Excluir|Carregando|Suporte|Editar|Chamado|Autoriz|Relat|Matric|Profess|Aluno|Turma|Configur|Informe|Selecione|Preencha|Nenhum|Sem |Dados |Hist[oó]rico|Contrato|Frequ|Professor|Funcion|Portaria|Aprov|Negad|Protocolo|Matr[ií]cula|Verificando|Fechar|Voltar|Mostrando|Presentes|Faltas|Aguardando)/
      return ptPattern.test(s)
    })
    if (remaining.length > 0) {
      partialI18n.push({ rel, count: userFacing.length, samples: remaining.slice(0, 5) })
    }
  }
}

console.log('\nFiles without i18n hooks but with likely UI strings:', noI18n.length)
noI18n.sort((a, b) => b.count - a.count).forEach((x) => {
  console.log(`- ${x.rel} (${x.count}): ${x.samples.join(' | ')}`)
})

console.log('\nFiles with i18n but remaining hardcoded strings:', partialI18n.length)
partialI18n.sort((a, b) => b.count - a.count).forEach((x) => {
  console.log(`- ${x.rel} (${x.count}): ${x.samples.join(' | ')}`)
})

const hasGaps = noI18n.length > 0 || partialI18n.length > 0 || missingEn.length > 0 || missingEs.length > 0
if (hasGaps) {
  console.log('\n❌ i18n check failed')
  process.exit(1)
}

console.log('\n✅ i18n check passed — 0 gaps')
process.exit(0)
