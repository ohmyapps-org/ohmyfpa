type JsonRecord = Record<string, unknown>
type FunctionType = 'EI' | 'EO' | 'EQ' | 'ILF' | 'EIF'
type Complexity = 'Baja' | 'Media' | 'Alta'

const points: Record<FunctionType, Record<Complexity, number>> = {
  EI: { Baja: 3, Media: 4, Alta: 6 }, EO: { Baja: 4, Media: 5, Alta: 7 },
  EQ: { Baja: 3, Media: 4, Alta: 6 }, ILF: { Baja: 7, Media: 10, Alta: 15 }, EIF: { Baja: 5, Media: 7, Alta: 10 },
}
const defaultAnalysis = { functions: [{ id: 'FN-104', title: 'Exportar informe de estimación', type: 'EO', points: 5 }, { id: 'FN-103', title: 'Consultar desglose por issue', type: 'EQ', points: 4 }], values: { hoursPerPoint: 1.65, workdayHours: 7.5 }, developers: 3 }
function inferType(title: string): FunctionType {
  const text = title.toLocaleLowerCase()
  if (/(export|informe|reporte|notific|calcular)/.test(text)) return 'EO'
  if (/(consult|buscar|filtrar|ver|listar)/.test(text)) return 'EQ'
  if (/(archivo|base|catalog|guardar|persistir|registro)/.test(text)) return 'ILF'
  if (/(integrar|externo|sincron|api|repositorio)/.test(text)) return 'EIF'
  return 'EI'
}
function record(value: unknown): JsonRecord { return typeof value === 'object' && value !== null ? value as JsonRecord : {} }
function textResult(value: unknown): JsonRecord { return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] } }
async function loadAnalysis(): Promise<JsonRecord> {
  const path = Bun.env.OHMYFPA_DATA ?? '.ohmyfpa/analysis.json'
  try { return await Bun.file(path).json() as JsonRecord } catch { return defaultAnalysis }
}
function response(id: unknown, result: JsonRecord): string { return JSON.stringify({ jsonrpc: '2.0', id, result }) }
async function handle(request: JsonRecord): Promise<string | null> {
  const id = request.id
  const method = String(request.method ?? '')
  if (!('id' in request)) return null
  if (method === 'initialize') return response(id, { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'ohmyfpa', version: '0.1.0' } })
  if (method === 'ping') return response(id, {})
  if (method === 'tools/list') return response(id, { tools: [
    { name: 'analyze_function', description: 'Classify a requirement using local FPA heuristics.', inputSchema: { type: 'object', properties: { requirement: { type: 'string' } }, required: ['requirement'] } },
    { name: 'calculate_effort', description: 'Calculate effort from function points and team size.', inputSchema: { type: 'object', properties: { functionPoints: { type: 'number' }, developers: { type: 'number' }, hoursPerPoint: { type: 'number' }, workdayHours: { type: 'number' } }, required: ['functionPoints'] } },
    { name: 'list_functions', description: 'Read the local analysis file, if configured.', inputSchema: { type: 'object', properties: {} } },
    { name: 'import_ieee830', description: 'Extract candidate functions from local IEEE830 text.', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  ] })
  if (method !== 'tools/call') return response(id, { isError: true, content: [{ type: 'text', text: 'Unsupported MCP method' }] })
  const params = record(request.params)
  const name = String(params.name ?? '')
  const args = record(params.arguments)
  if (name === 'analyze_function') {
    const requirement = String(args.requirement ?? '')
    const type = inferType(requirement)
    return response(id, textResult({ requirement, type, complexity: 'Media', points: points[type].Media, confidence: 0.64, localOnly: true }))
  }
  if (name === 'calculate_effort') {
    const functionPoints = Number(args.functionPoints ?? 0)
    const developers = Math.max(1, Number(args.developers ?? 3))
    const hoursPerPoint = Number(args.hoursPerPoint ?? 1.65)
    const workdayHours = Math.max(1, Number(args.workdayHours ?? 7.5))
    return response(id, textResult({ functionPoints, developers, hours: functionPoints * hoursPerPoint, teamDays: functionPoints * hoursPerPoint / developers / workdayHours, localOnly: true }))
  }
  if (name === 'list_functions') return response(id, textResult(await loadAnalysis()))
  if (name === 'import_ieee830') {
    const text = String(args.text ?? '')
    const functions = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 8).slice(0, 30).map((title, index) => { const type = inferType(title); return { id: 'IEEE-' + String(index + 1).padStart(3, '0'), title, type, complexity: 'Media', points: points[type].Media } })
    return response(id, textResult({ functions, localOnly: true }))
  }
  return response(id, { isError: true, content: [{ type: 'text', text: 'Unknown tool: ' + name }] })
}
async function main(): Promise<void> {
  const decoder = new TextDecoder(); let buffer = ''
  for await (const chunk of Bun.stdin.stream()) {
    buffer += decoder.decode(chunk)
    const lines = buffer.split('\n'); buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.trim()) continue
      try { const output = await handle(JSON.parse(line) as JsonRecord); if (output) await Bun.write(Bun.stdout, output + '\n') }
      catch (error) { const message = error instanceof Error ? error.message : 'Invalid request'; await Bun.write(Bun.stdout, JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message } }) + '\n') }
    }
  }
}
await main()
