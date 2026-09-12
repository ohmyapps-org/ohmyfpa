import { DEFAULT_MATRIX, deriveComplexity, pointsFor } from './fpa'
import type { Complexity, FpaFunction, FunctionType, OriginKind, PointMatrix } from './types'

export type ImportResult = { functions: FpaFunction[]; origin: OriginKind; notes: string[] }

export const ACCEPTED_EXTENSIONS = ['.json', '.csv', '.tsv', '.xlsx', '.xls', '.docx', '.pdf', '.md', '.txt'] as const

const TYPE_HINTS: { type: FunctionType; pattern: RegExp; weight: number }[] = [
  { type: 'EO', pattern: /\b(export|exporta|informe|reporte|imprim|notific|calcul|totaliz|estad[íi]stic)/i, weight: 24 },
  { type: 'EQ', pattern: /\b(consult|buscar|filtr|listar|visualiz|mostrar|ver\b|detalle)/i, weight: 22 },
  { type: 'ILF', pattern: /\b(archivo|maestro|cat[áa]logo|base de datos|almacen|persist|registro de)/i, weight: 20 },
  { type: 'EIF', pattern: /\b(interfaz externa|sistema externo|integr|sincroniz|api de terceros|repositorio externo)/i, weight: 20 },
  { type: 'EI', pattern: /\b(alta|ingres|registr|crear|agregar|modific|actualiz|eliminar|baja|cargar)/i, weight: 18 },
]

export function inferType(text: string): { type: FunctionType; confidence: number } {
  let best: { type: FunctionType; confidence: number } = { type: 'EI', confidence: 45 }
  for (const hint of TYPE_HINTS) {
    if (hint.pattern.test(text)) {
      const confidence = 50 + hint.weight
      if (confidence > best.confidence) best = { type: hint.type, confidence }
    }
  }
  return best
}

function toNumber(value: unknown): number {
  const parsed = Number(String(value ?? '').replace(',', '.'))
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0
}

function pick(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim()
  }
  return ''
}

function normalizeComplexity(raw: string): Complexity | null {
  const value = raw.toLocaleLowerCase()
  if (value.startsWith('baj') || value.startsWith('low')) return 'Baja'
  if (value.startsWith('alt') || value.startsWith('high')) return 'Alta'
  if (value.startsWith('med') || value.startsWith('avg') || value.startsWith('average')) return 'Media'
  return null
}

/** Normaliza un registro arbitrario (issue, card, fila de planilla) a una función FPA. */
export function toFunction(
  record: Record<string, unknown>,
  index: number,
  origin: OriginKind,
  matrix: PointMatrix = DEFAULT_MATRIX,
): FpaFunction {
  const title = pick(record, ['title', 'titulo', 'name', 'nombre', 'summary', 'función', 'funcion', 'requisito']) ||
    `Función importada ${index + 1}`
  const description = pick(record, ['description', 'descripcion', 'descripción', 'body', 'desc', 'detalle'])
  const rawType = pick(record, ['type', 'tipo', 'fpatype', 'fpa_type']).toUpperCase()
  const guess = inferType(`${title} ${description}`)
  const type: FunctionType = ['EI', 'EO', 'EQ', 'ILF', 'EIF'].includes(rawType) ? (rawType as FunctionType) : guess.type
  const det = toNumber(pick(record, ['det', 'dataelementtypes', 'data_element_types']))
  const ret = toNumber(pick(record, ['ret', 'recordelementtypes', 'record_element_types']))
  const ftr = toNumber(pick(record, ['ftr', 'filetypesreferenced', 'file_types_referenced']))
  const derived = deriveComplexity(type, det, ret, ftr)
  const complexity =
    normalizeComplexity(pick(record, ['complexity', 'complejidad'])) ?? derived?.complexity ?? 'Media'
  return {
    id: pick(record, ['id', 'number', 'key', 'clave']) || `IMP-${String(index + 1).padStart(3, '0')}`,
    title,
    description,
    type,
    issue: pick(record, ['issue', 'labels', 'list', 'epic', 'modulo', 'módulo', 'milestone']) || 'Importado',
    complexity,
    det,
    ret,
    ftr,
    points: pointsFor(type, complexity, matrix),
    origin,
    sourceUrl: pick(record, ['url', 'html_url', 'shorturl', 'shortUrl', 'link', 'enlace']),
    confidence: rawType ? 95 : guess.confidence,
    status: 'Revisar',
  }
}

const REQUIREMENT_LINE =
  /^(?:\s*(?:[-*•]|\d+(?:\.\d+)*[.)]?|R[FN]\s*-?\s*\d+|REQ\s*-?\s*\d+)\s*)?(.{12,240})$/i

/** Extrae requisitos candidatos de texto plano estilo IEEE 830. */
export function parseRequirementText(content: string, origin: OriginKind, matrix: PointMatrix): FpaFunction[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 12 && line.length < 260)
    .filter((line) => /[a-záéíóúñ]/i.test(line))
    .filter((line) => !/^(p[áa]gina|page|tabla de contenido|[íi]ndice|contents)\b/i.test(line))

  const candidates = lines.filter(
    (line) => /^(?:[-*•]|\d+[.)]|R[FN]\s*-?\s*\d+|REQ)/i.test(line) || /\b(el sistema|la aplicaci[óo]n|el usuario)\b.*\b(deber[áa]|podr[áa]|permitir[áa]|debe|permite)\b/i.test(line),
  )
  const source = candidates.length >= 3 ? candidates : lines
  const seen = new Set<string>()

  return source
    .slice(0, 120)
    .map((line) => {
      const match = REQUIREMENT_LINE.exec(line)
      return (match?.[1] ?? line).trim()
    })
    .filter((title) => {
      const key = title.toLocaleLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((title, index) => {
      const guess = inferType(title)
      return {
        id: `REQ-${String(index + 1).padStart(3, '0')}`,
        title: title.length > 96 ? `${title.slice(0, 93)}…` : title,
        description: title.length > 96 ? title : '',
        type: guess.type,
        issue: 'Requisitos importados',
        complexity: 'Media' as Complexity,
        det: 0,
        ret: 0,
        ftr: 0,
        points: pointsFor(guess.type, 'Media', matrix),
        origin,
        sourceUrl: '',
        confidence: Math.max(40, guess.confidence - 10),
        status: 'Borrador' as const,
      }
    })
}

function detectDelimiter(header: string): string {
  const counts = [',', ';', '\t', '|'].map((char) => ({ char, count: header.split(char).length }))
  return counts.sort((a, b) => b.count - a.count)[0].char
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = []
  let current = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else quoted = !quoted
    } else if (char === delimiter && !quoted) {
      cells.push(current)
      current = ''
    } else current += char
  }
  cells.push(current)
  return cells.map((cell) => cell.trim())
}

export function parseCsv(content: string, origin: OriginKind, matrix: PointMatrix): FpaFunction[] {
  const rows = content.split(/\r?\n/).filter((line) => line.trim())
  if (rows.length < 2) return []
  const delimiter = detectDelimiter(rows[0])
  const headers = splitCsvLine(rows[0], delimiter).map((header) => header.toLocaleLowerCase())
  return rows.slice(1).map((row, index) => {
    const cells = splitCsvLine(row, delimiter)
    const record = Object.fromEntries(headers.map((header, cell) => [header, cells[cell] ?? '']))
    return toFunction(record, index, origin, matrix)
  })
}

export function parseJson(content: string, fileName: string, matrix: PointMatrix): ImportResult {
  const parsed = JSON.parse(content) as unknown
  const container = parsed as Record<string, unknown>
  const list = Array.isArray(parsed)
    ? parsed
    : ((container?.functions ?? container?.issues ?? container?.cards ?? container?.items ?? []) as unknown[])
  const lower = fileName.toLocaleLowerCase()
  const looksTrello = lower.includes('trello') || (Array.isArray(list) && list.some((item) => isRecord(item) && 'idBoard' in item))
  const looksGithub = lower.includes('github') || (Array.isArray(list) && list.some((item) => isRecord(item) && 'html_url' in item))
  const origin: OriginKind = looksTrello ? 'Trello' : looksGithub ? 'GitHub' : 'JSON'
  const functions = list
    .filter(isRecord)
    .map((record, index) => toFunction(flattenRecord(record), index, origin, matrix))
  return { functions, origin, notes: [] }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Aplana claves anidadas comunes de GitHub y Trello (labels, list, milestone). */
function flattenRecord(record: Record<string, unknown>): Record<string, unknown> {
  const flat: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    flat[key.toLocaleLowerCase()] = value
  }
  if (Array.isArray(record.labels)) {
    flat.labels = record.labels
      .map((label) => (isRecord(label) ? String(label.name ?? '') : String(label)))
      .filter(Boolean)
      .join(', ')
  }
  if (isRecord(record.milestone)) flat.milestone = record.milestone.title
  if (isRecord(record.list)) flat.list = record.list.name
  if (record.desc) flat.description = record.desc
  return flat
}

async function readText(file: File): Promise<string> {
  return await file.text()
}

async function parseXlsx(file: File, matrix: PointMatrix): Promise<ImportResult> {
  const xlsx = await import('xlsx')
  const workbook = xlsx.read(await file.arrayBuffer(), { type: 'array' })
  const notes: string[] = []
  const functions: FpaFunction[] = []
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
    if (!rows.length) continue
    const normalized = rows.map((row) => {
      const flat: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(row)) flat[String(key).trim().toLocaleLowerCase()] = value
      if (!flat.issue) flat.issue = sheetName
      return flat
    })
    functions.push(...normalized.map((row, index) => toFunction(row, functions.length + index, 'XLSX', matrix)))
    notes.push(`Hoja "${sheetName}": ${rows.length} filas`)
  }
  return { functions, origin: 'XLSX', notes }
}

async function parseDocx(file: File, matrix: PointMatrix): Promise<ImportResult> {
  const mammoth = await import('mammoth/mammoth.browser.js')
  const api = (mammoth as unknown as { default?: typeof mammoth }).default ?? mammoth
  const result = await api.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return {
    functions: parseRequirementText(result.value, 'DOCX', matrix),
    origin: 'DOCX',
    notes: result.messages.slice(0, 3).map((message: { message: string }) => message.message),
  }
}

async function parsePdf(file: File, matrix: PointMatrix): Promise<ImportResult> {
  const pdfjs = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
  const task = pdfjs.getDocument({ data: await file.arrayBuffer() })
  const doc = await task.promise
  const pages: string[] = []
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber)
    const content = await page.getTextContent()
    const items = content.items as { str?: string; hasEOL?: boolean }[]
    pages.push(items.map((item) => (item.str ?? '') + (item.hasEOL ? '\n' : ' ')).join(''))
  }
  const notes = [`${doc.numPages} páginas leídas en el navegador`]
  await task.destroy()
  return { functions: parseRequirementText(pages.join('\n'), 'PDF', matrix), origin: 'PDF', notes }
}

/** Punto de entrada único: decide el parser por extensión. Todo corre en el dispositivo. */
export async function parseFile(file: File, matrix: PointMatrix): Promise<ImportResult> {
  const name = file.name.toLocaleLowerCase()
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return await parseXlsx(file, matrix)
  if (name.endsWith('.docx')) return await parseDocx(file, matrix)
  if (name.endsWith('.pdf')) return await parsePdf(file, matrix)
  if (name.endsWith('.csv') || name.endsWith('.tsv')) {
    const origin: OriginKind = name.includes('trello') ? 'Trello' : name.includes('github') ? 'GitHub' : 'CSV'
    return { functions: parseCsv(await readText(file), origin, matrix), origin, notes: [] }
  }
  if (name.endsWith('.json')) return parseJson(await readText(file), file.name, matrix)
  return { functions: parseRequirementText(await readText(file), 'IEEE830', matrix), origin: 'IEEE830', notes: [] }
}
