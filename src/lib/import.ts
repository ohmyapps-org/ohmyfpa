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

/** Saca énfasis Markdown y espacios repetidos de una celda o línea. */
function cleanText(raw: string): string {
  return raw
    .replace(/\*\*|__|`|~~/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Recorta un texto largo a un título legible sin partir palabras. */
export function shortTitle(text: string, max = 96): string {
  const clean = cleanText(text)
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trim()}…`
}

/** Normaliza un texto para comparar títulos contra entradas del índice. */
function comparisonKey(text: string): string {
  return cleanText(text)
    .toLocaleLowerCase()
    .replace(/^\d+(?:\.\d+)*[.)]?\s*/, '')
    .replace(/[^0-9a-záéíóúüñ ]+/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Normaliza un registro arbitrario (issue, card, fila de tabla) a una función FPA. */
export function toFunction(
  record: Record<string, unknown>,
  index: number,
  origin: OriginKind,
  matrix: PointMatrix = DEFAULT_MATRIX,
): FpaFunction {
  const namedTitle = pick(record, ['title', 'titulo', 'título', 'name', 'nombre', 'summary', 'función', 'funcion'])
  const longText = pick(record, ['description', 'descripcion', 'descripción', 'requisito', 'body', 'desc', 'detalle'])
  const acceptance = pick(record, [
    'criterio de aceptación',
    'criterio de aceptacion',
    'criterio',
    'acceptance',
    'acceptance criteria',
    'métrica o restricción',
    'metrica o restriccion',
  ])
  // Una tabla de requisitos suele traer sólo ID y descripción: el título sale de ahí.
  const title = namedTitle || shortTitle(longText) || `Función importada ${index + 1}`
  const body = namedTitle ? longText : longText === title ? '' : longText
  const description = [body, acceptance ? `Criterio de aceptación: ${acceptance}` : ''].filter(Boolean).join('\n\n')
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

const HEADING_LINE = /^(#{1,6})\s+(.*\S)\s*$/
const TABLE_LINE = /^\s*\|(.+)\|\s*$/
const TABLE_RULE = /^\s*\|[\s:|-]+\|\s*$/
const INDEX_HEADING = /^(?:\d+(?:\.\d+)*[.)]?\s*)?(?:[íi]ndice|tabla de contenidos?|contents|table of contents)\b/i
/** Los requisitos no funcionales no cuentan puntos de función. */
const NON_FUNCTIONAL_ID = /^(?:rnf|nfr|rn)(?:\b|[-_ ])/i
const ID_HEADER = /^(?:id|ids|identificador|c[óo]digo|codigo|clave|key|ref|referencia|n[°ºo])$/
const DESCRIPTION_HEADER =
  /^(?:descripci[óo]n|description|detalle|requisito|requerimiento|funci[óo]n|funcion|funcionalidad|nombre|t[íi]tulo|titulo|summary|resumen|enunciado)$/

export type TableBlock = { section: string; headers: string[]; rows: Record<string, string>[] }

function splitTableRow(line: string): string[] {
  const match = TABLE_LINE.exec(line)
  if (!match) return []
  return match[1].split('|').map(cleanText)
}

/** Quita la numeración de un encabezado: "3.2.1. Control de acceso (AUTH)" -> "Control de acceso (AUTH)". */
function sectionLabel(raw: string): string {
  return cleanText(raw)
    .replace(/^\d+(?:\.\d+)*[.)]?\s*/, '')
    .trim()
}

/** Lee las tablas Markdown de un documento y las asocia al encabezado que las precede. */
export function extractTables(content: string): TableBlock[] {
  const lines = content.split(/\r?\n/)
  const tables: TableBlock[] = []
  let section = ''
  let index = 0
  while (index < lines.length) {
    const heading = HEADING_LINE.exec(lines[index])
    if (heading) {
      section = sectionLabel(heading[2])
      index += 1
      continue
    }
    if (!TABLE_LINE.test(lines[index]) || TABLE_RULE.test(lines[index])) {
      index += 1
      continue
    }
    const headers = splitTableRow(lines[index]).map((header) => header.toLocaleLowerCase())
    let cursor = index + 1
    if (cursor < lines.length && TABLE_RULE.test(lines[cursor])) cursor += 1
    const rows: Record<string, string>[] = []
    while (cursor < lines.length && TABLE_LINE.test(lines[cursor])) {
      if (!TABLE_RULE.test(lines[cursor])) {
        const cells = splitTableRow(lines[cursor])
        if (cells.some(Boolean)) rows.push(Object.fromEntries(headers.map((header, cell) => [header, cells[cell] ?? ''])))
      }
      cursor += 1
    }
    if (headers.length >= 2 && rows.length) tables.push({ section, headers, rows })
    index = cursor
  }
  return tables
}

/** Una tabla es inventario de requisitos sólo si tiene columna de ID y columna de descripción. */
export function isRequirementTable(headers: string[]): boolean {
  return headers.some((header) => ID_HEADER.test(header)) && headers.some((header) => DESCRIPTION_HEADER.test(header))
}

/** "RF-AUTH-001" -> "AUTH", para agrupar por módulo cuando no hay encabezado. */
function moduleOf(id: string): string {
  return /^[a-z]{1,4}[-_]([a-z]{2,8})[-_]\d+/i.exec(id)?.[1]?.toLocaleUpperCase() ?? ''
}

function functionsFromTables(
  tables: TableBlock[],
  origin: OriginKind,
  matrix: PointMatrix,
): { functions: FpaFunction[]; notes: string[] } {
  const functions: FpaFunction[] = []
  const notes: string[] = []
  let skipped = 0
  for (const table of tables) {
    if (!isRequirementTable(table.headers)) continue
    const idColumn = table.headers.find((header) => ID_HEADER.test(header)) ?? 'id'
    const taken: FpaFunction[] = []
    for (const row of table.rows) {
      const id = row[idColumn] ?? ''
      if (NON_FUNCTIONAL_ID.test(id)) {
        skipped += 1
        continue
      }
      const record: Record<string, unknown> = { ...row, id }
      if (!record.issue) record.issue = table.section || moduleOf(id) || 'Requisitos importados'
      taken.push(toFunction(record, functions.length + taken.length, origin, matrix))
    }
    if (!taken.length) continue
    functions.push(...taken)
    notes.push(`${table.section || 'Tabla'}: ${taken.length} ${taken.length === 1 ? 'requisito' : 'requisitos'}`)
  }
  if (skipped) {
    const label = skipped === 1 ? 'requisito no funcional omitido' : 'requisitos no funcionales omitidos'
    notes.push(`${skipped} ${label}: no cuentan puntos de función`)
  }
  return { functions, notes }
}

/** Conjunto de encabezados del documento, para descartar las entradas del índice. */
function headingKeys(content: string): Set<string> {
  const keys = new Set<string>()
  for (const line of content.split(/\r?\n/)) {
    const heading = HEADING_LINE.exec(line)
    if (heading) keys.add(comparisonKey(heading[2]))
  }
  keys.delete('')
  return keys
}

const BULLET_PREFIX = /^(?:[-*•]|\d+(?:\.\d+)*[.)]|R[FN]\s*-?\s*\d+[.)]?|REQ\s*-?\s*\d+[.)]?)\s+/i

/** Camino de respaldo: documentos sin tablas, donde cada requisito es una línea de prosa. */
function functionsFromProse(content: string, origin: OriginKind, matrix: PointMatrix): FpaFunction[] {
  const headings = headingKeys(content)
  const bullets: string[] = []
  const prose: string[] = []
  let insideIndex = false
  for (const original of content.split(/\r?\n/)) {
    const heading = HEADING_LINE.exec(original)
    if (heading) {
      insideIndex = INDEX_HEADING.test(cleanText(heading[2]))
      continue
    }
    if (insideIndex) continue
    if (TABLE_LINE.test(original)) continue
    const line = cleanText(original)
    if (line.length < 13 || line.length > 260) continue
    if (!/[a-záéíóúñ]/i.test(line)) continue
    if (/^(?:p[áa]gina|page)\b/i.test(line)) continue
    const marked = BULLET_PREFIX.test(line)
    const body = line.replace(BULLET_PREFIX, '').trim()
    if (body.length < 13) continue
    // Una línea que repite un encabezado del documento es una entrada del índice, no un requisito.
    if (headings.has(comparisonKey(body))) continue
    if (marked) bullets.push(body)
    else if (
      /\b(el sistema|la aplicaci[óo]n|el usuario|the system)\b/i.test(body) &&
      /\b(deber[áa]|podr[áa]|permit|debe|puede)/i.test(body)
    ) {
      prose.push(body)
    }
  }

  const source = bullets.length + prose.length >= 3 ? [...bullets, ...prose] : bullets.length ? bullets : prose
  const seen = new Set<string>()
  return source
    .filter((line) => {
      const key = comparisonKey(line)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 200)
    .map((text, index) => {
      const guess = inferType(text)
      const title = shortTitle(text)
      return {
        id: `REQ-${String(index + 1).padStart(3, '0')}`,
        title,
        description: title === text ? '' : text,
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

/** Lee un documento IEEE 830: primero sus tablas de requisitos, y si no hay, su prosa. */
export function parseRequirementDocument(
  content: string,
  origin: OriginKind,
  matrix: PointMatrix,
): { functions: FpaFunction[]; notes: string[] } {
  const fromTables = functionsFromTables(extractTables(content), origin, matrix)
  if (fromTables.functions.length) return fromTables
  const functions = functionsFromProse(content, origin, matrix)
  const notes = fromTables.notes.slice()
  if (functions.length) {
    const label = functions.length === 1 ? 'requisito leído' : 'requisitos leídos'
    notes.push(`${functions.length} ${label} del texto, sin tablas de requisitos`)
  }
  return { functions, notes }
}

export function parseRequirementText(content: string, origin: OriginKind, matrix: PointMatrix): FpaFunction[] {
  return parseRequirementDocument(content, origin, matrix).functions
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

/** Convierte el HTML de mammoth al mismo Markdown estructurado que lee el parser de tablas. */
export function htmlToStructuredText(html: string): string {
  if (typeof DOMParser === 'undefined') return cleanText(html.replace(/<[^>]+>/g, ' '))
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  const out: string[] = []
  const visit = (element: Element) => {
    const tag = element.tagName.toLocaleLowerCase()
    const heading = /^h([1-6])$/.exec(tag)
    if (heading) {
      out.push(`${'#'.repeat(Number(heading[1]))} ${cleanText(element.textContent ?? '')}`)
      return
    }
    if (tag === 'table') {
      const rows = Array.from(element.querySelectorAll('tr'))
      rows.forEach((row, index) => {
        const cells = Array.from(row.children).map((cell) => cleanText(cell.textContent ?? '').replace(/\|/g, '/'))
        out.push(`| ${cells.join(' | ')} |`)
        if (index === 0) out.push(`|${cells.map(() => ' --- ').join('|')}|`)
      })
      out.push('')
      return
    }
    if (element.children.length && /^(?:div|section|article|main|ul|ol)$/.test(tag)) {
      for (const child of Array.from(element.children)) visit(child)
      return
    }
    const text = cleanText(element.textContent ?? '')
    if (text) out.push(tag === 'li' ? `- ${text}` : text)
  }
  for (const child of Array.from(parsed.body.children)) visit(child)
  return out.join('\n')
}

async function parseDocx(file: File, matrix: PointMatrix): Promise<ImportResult> {
  const mammoth = await import('mammoth/mammoth.browser.js')
  const api = (mammoth as unknown as { default?: typeof mammoth }).default ?? mammoth
  // convertToHtml conserva encabezados y tablas; extractRawText las aplana y pierde los requisitos.
  const result = await api.convertToHtml({ arrayBuffer: await file.arrayBuffer() })
  const document = parseRequirementDocument(htmlToStructuredText(result.value), 'DOCX', matrix)
  return {
    functions: document.functions,
    origin: 'DOCX',
    notes: [...document.notes, ...result.messages.slice(0, 2).map((message: { message: string }) => message.message)],
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
  const document = parseRequirementDocument(pages.join('\n'), 'PDF', matrix)
  return { functions: document.functions, origin: 'PDF', notes: [...notes, ...document.notes] }
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
  const document = parseRequirementDocument(await readText(file), 'IEEE830', matrix)
  return { functions: document.functions, origin: 'IEEE830', notes: document.notes }
}
