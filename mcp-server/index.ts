/**
 * Servidor MCP local de OhMyFPA.
 *
 * Transporte stdio, sin listener de red y sin telemetría. Reutiliza las mismas
 * reglas de cálculo que la interfaz (src/lib/fpa.ts) para que un agente y una
 * persona nunca obtengan números distintos del mismo análisis.
 */
import {
  DEFAULT_MATRIX,
  INFLUENCE_FACTORS,
  deriveComplexity,
  emptyInfluence,
  estimate,
  pointsFor,
  totalDegreeOfInfluence,
  valueAdjustmentFactor,
} from '../src/lib/fpa.ts'
import type { Complexity, FpaFunction, FunctionType, InfluenceScores, Project, ProjectValues } from '../src/lib/types.ts'

type JsonRecord = Record<string, unknown>

const FALLBACK_VALUES: ProjectValues = {
  hoursPerPoint: 1.65,
  workdayHours: 7.5,
  baseRate: 48,
  currency: 'USD',
  productivityLabel: 'Equipo producto estándar',
  developers: 3,
  pointMatrix: DEFAULT_MATRIX,
  otherCosts: [],
}

const TYPE_PATTERNS: { type: FunctionType; pattern: RegExp }[] = [
  { type: 'EO', pattern: /\b(export|exporta|informe|reporte|imprim|notific|calcul|totaliz)/i },
  { type: 'EQ', pattern: /\b(consult|buscar|filtr|listar|visualiz|mostrar|detalle)/i },
  { type: 'ILF', pattern: /\b(archivo|maestro|cat[áa]logo|base de datos|almacen|persist)/i },
  { type: 'EIF', pattern: /\b(interfaz externa|sistema externo|integr|sincroniz|api de terceros)/i },
  { type: 'EI', pattern: /\b(alta|ingres|registr|crear|agregar|modific|actualiz|eliminar|cargar)/i },
]

function inferType(text: string): FunctionType {
  for (const candidate of TYPE_PATTERNS) {
    if (candidate.pattern.test(text)) return candidate.type
  }
  return 'EI'
}

function record(value: unknown): JsonRecord {
  return typeof value === 'object' && value !== null ? (value as JsonRecord) : {}
}

function textResult(value: unknown): JsonRecord {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] }
}

function response(id: unknown, result: JsonRecord): string {
  return JSON.stringify({ jsonrpc: '2.0', id, result })
}

/** Lee el JSON exportado por la app. OHMYFPA_DATA apunta al archivo local. */
async function loadProject(): Promise<Project | null> {
  const path = Bun.env.OHMYFPA_DATA ?? '.ohmyfpa/analysis.json'
  try {
    const parsed = (await Bun.file(path).json()) as { project?: Project; projects?: Project[] }
    return parsed.project ?? parsed.projects?.[0] ?? null
  } catch {
    return null
  }
}

const TOOLS = [
  {
    name: 'list_functions',
    description: 'Lee el inventario del análisis local configurado en OHMYFPA_DATA.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'analyze_function',
    description: 'Clasifica un requisito en EI, EO, EQ, ILF o EIF y calcula su complejidad IFPUG.',
    inputSchema: {
      type: 'object',
      properties: {
        requirement: { type: 'string' },
        det: { type: 'number', description: 'Tipos de dato elementales' },
        ret: { type: 'number', description: 'Tipos de registro, solo para ILF y EIF' },
        ftr: { type: 'number', description: 'Archivos referenciados, solo para EI, EO y EQ' },
      },
      required: ['requirement'],
    },
  },
  {
    name: 'import_ieee830',
    description: 'Extrae funciones candidatas desde texto de requisitos IEEE 830, sin red.',
    inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
  },
  {
    name: 'adjust_points',
    description: 'Aplica los 14 niveles de influencia y devuelve TDI, VAF y puntos ajustados.',
    inputSchema: {
      type: 'object',
      properties: {
        unadjustedPoints: { type: 'number' },
        influence: {
          type: 'object',
          description: 'Grados 0-5 por característica. Claves: ' + INFLUENCE_FACTORS.map((f) => f.id).join(', '),
        },
      },
      required: ['unadjustedPoints'],
    },
  },
  {
    name: 'calculate_effort',
    description: 'Calcula esfuerzo, duración y costo del análisis local o de los valores recibidos.',
    inputSchema: {
      type: 'object',
      properties: {
        developers: { type: 'number' },
        hoursPerPoint: { type: 'number' },
        workdayHours: { type: 'number' },
        baseRate: { type: 'number' },
      },
    },
  },
  {
    name: 'list_influence_factors',
    description: 'Devuelve las 14 características generales del sistema con su descripción.',
    inputSchema: { type: 'object', properties: {} },
  },
]

async function callTool(name: string, args: JsonRecord): Promise<JsonRecord> {
  if (name === 'list_functions') {
    const project = await loadProject()
    if (!project) return textResult({ functions: [], note: 'OHMYFPA_DATA no está configurado o no es legible.' })
    return textResult({ project: project.name, functions: project.functions, localOnly: true })
  }

  if (name === 'analyze_function') {
    const requirement = String(args.requirement ?? '')
    const type = inferType(requirement)
    const det = Number(args.det ?? 0)
    const ret = Number(args.ret ?? 0)
    const ftr = Number(args.ftr ?? 0)
    const derived = deriveComplexity(type, det, ret, ftr)
    const complexity: Complexity = derived?.complexity ?? 'Media'
    return textResult({
      requirement,
      type,
      complexity,
      points: pointsFor(type, complexity, DEFAULT_MATRIX),
      rule: derived?.rule ?? 'Sin DET/RET/FTR suficientes: se asume complejidad media.',
      localOnly: true,
    })
  }

  if (name === 'import_ieee830') {
    const text = String(args.text ?? '')
    const functions = text
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter((line) => line.length > 12)
      .slice(0, 120)
      .map((title, index) => {
        const type = inferType(title)
        return {
          id: 'REQ-' + String(index + 1).padStart(3, '0'),
          title,
          type,
          complexity: 'Media' as Complexity,
          points: pointsFor(type, 'Media', DEFAULT_MATRIX),
        }
      })
    return textResult({ functions, localOnly: true })
  }

  if (name === 'adjust_points') {
    const unadjusted = Number(args.unadjustedPoints ?? 0)
    const influence: InfluenceScores = { ...emptyInfluence(), ...record(args.influence) }
    const tdi = totalDegreeOfInfluence(influence)
    const vaf = valueAdjustmentFactor(tdi)
    return textResult({
      unadjustedPoints: unadjusted,
      tdi,
      vaf,
      adjustedPoints: unadjusted * vaf,
      formula: 'PFA = PFSA × (0.65 + 0.01 × TDI)',
      localOnly: true,
    })
  }

  if (name === 'calculate_effort') {
    const project = await loadProject()
    const values: ProjectValues = {
      ...(project?.values ?? FALLBACK_VALUES),
      ...(args.developers === undefined ? {} : { developers: Number(args.developers) }),
      ...(args.hoursPerPoint === undefined ? {} : { hoursPerPoint: Number(args.hoursPerPoint) }),
      ...(args.workdayHours === undefined ? {} : { workdayHours: Number(args.workdayHours) }),
      ...(args.baseRate === undefined ? {} : { baseRate: Number(args.baseRate) }),
    }
    const functions: FpaFunction[] = project?.functions ?? []
    const influence = project?.influence ?? emptyInfluence()
    return textResult({ ...estimate(functions, values, influence), currency: values.currency, localOnly: true })
  }

  if (name === 'list_influence_factors') return textResult({ factors: INFLUENCE_FACTORS, range: '0 a 5', maxTdi: 70 })

  return { isError: true, content: [{ type: 'text', text: 'Unknown tool: ' + name }] }
}

async function handle(request: JsonRecord): Promise<string | null> {
  if (!('id' in request)) return null
  const id = request.id
  const method = String(request.method ?? '')
  if (method === 'initialize') {
    return response(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'ohmyfpa', version: '0.2.0' },
    })
  }
  if (method === 'ping') return response(id, {})
  if (method === 'tools/list') return response(id, { tools: TOOLS })
  if (method !== 'tools/call') {
    return response(id, { isError: true, content: [{ type: 'text', text: 'Unsupported MCP method' }] })
  }
  const params = record(request.params)
  return response(id, await callTool(String(params.name ?? ''), record(params.arguments)))
}

async function main(): Promise<void> {
  const decoder = new TextDecoder()
  let buffer = ''
  for await (const chunk of Bun.stdin.stream()) {
    buffer += decoder.decode(chunk)
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const output = await handle(JSON.parse(line) as JsonRecord)
        if (output) await Bun.write(Bun.stdout, output + '\n')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid request'
        await Bun.write(
          Bun.stdout,
          JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message } }) + '\n',
        )
      }
    }
  }
}

await main()
