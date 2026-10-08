import type {
  Complexity,
  CostItem,
  FpaFunction,
  FunctionType,
  InfluenceScores,
  PointMatrix,
  ProjectValues,
} from './types'

export const FUNCTION_TYPES: FunctionType[] = ['EI', 'EO', 'EQ', 'ILF', 'EIF']
export const COMPLEXITIES: Complexity[] = ['Baja', 'Media', 'Alta']

export const TYPE_META: Record<
  FunctionType,
  { label: string; short: string; description: string; family: 'transaccional' | 'datos'; hue: string }
> = {
  EI: {
    label: 'Entrada externa',
    short: 'Entrada',
    description: 'Proceso elemental que ingresa datos desde fuera del límite y mantiene uno o más ALI.',
    family: 'transaccional',
    hue: 'var(--type-ei)',
  },
  EO: {
    label: 'Salida externa',
    short: 'Salida',
    description: 'Proceso elemental que envía datos fuera del límite aplicando lógica derivada o cálculos.',
    family: 'transaccional',
    hue: 'var(--type-eo)',
  },
  EQ: {
    label: 'Consulta externa',
    short: 'Consulta',
    description: 'Proceso elemental que recupera datos sin lógica derivada ni mantenimiento de archivos.',
    family: 'transaccional',
    hue: 'var(--type-eq)',
  },
  ILF: {
    label: 'Archivo lógico interno',
    short: 'ALI',
    description: 'Grupo lógico de datos identificable por el usuario, mantenido dentro del límite de la aplicación.',
    family: 'datos',
    hue: 'var(--type-ilf)',
  },
  EIF: {
    label: 'Archivo de interfaz externa',
    short: 'AIE',
    description: 'Grupo lógico de datos referenciado por la aplicación pero mantenido por otro sistema.',
    family: 'datos',
    hue: 'var(--type-eif)',
  },
}

/** Pesos IFPUG CPM por tipo y complejidad. Baseline editable por proyecto. */
export const DEFAULT_MATRIX: PointMatrix = {
  EI: { Baja: 3, Media: 4, Alta: 6 },
  EO: { Baja: 4, Media: 5, Alta: 7 },
  EQ: { Baja: 3, Media: 4, Alta: 6 },
  ILF: { Baja: 7, Media: 10, Alta: 15 },
  EIF: { Baja: 5, Media: 7, Alta: 10 },
}

/** Las 14 características generales del sistema (niveles de influencia IFPUG). */
export const INFLUENCE_FACTORS: { id: string; label: string; description: string }[] = [
  {
    id: 'comunicacion',
    label: 'Comunicación de datos',
    description: 'Cuántos protocolos y recursos de comunicación usa la aplicación para enviar o recibir datos.',
  },
  {
    id: 'distribuido',
    label: 'Procesamiento distribuido',
    description: 'Grado en que datos y procesamiento se reparten entre varias unidades de procesamiento.',
  },
  {
    id: 'rendimiento',
    label: 'Objetivos de rendimiento',
    description: 'Exigencia de tiempo de respuesta y throughput acordada con el usuario.',
  },
  {
    id: 'configuracion',
    label: 'Configuración del equipamiento',
    description: 'Necesidad de consideraciones especiales para no sobrecargar el equipamiento de destino.',
  },
  {
    id: 'transacciones',
    label: 'Tasa de transacciones',
    description: 'Volumen y picos de transacciones que condicionan diseño, desarrollo y mantenimiento.',
  },
  {
    id: 'entrada-linea',
    label: 'Entrada de datos en línea',
    description: 'Porcentaje de transacciones que se ingresan de forma interactiva.',
  },
  {
    id: 'interfase',
    label: 'Interfase con el usuario',
    description: 'Facilidades de usabilidad: menús, ayuda en línea, atajos, scrolling, navegación.',
  },
  {
    id: 'actualizacion-linea',
    label: 'Actualización en línea',
    description: 'Alcance de la actualización on-line de los archivos lógicos internos.',
  },
  {
    id: 'procesamiento',
    label: 'Procesamiento complejo',
    description: 'Auditoría, seguridad, lógica o matemática extensiva y manejo de excepciones.',
  },
  {
    id: 'reusabilidad',
    label: 'Reusabilidad del código',
    description: 'Cuánto del código fue diseñado para reutilizarse en otras aplicaciones.',
  },
  {
    id: 'implementacion',
    label: 'Facilidad de implementación',
    description: 'Plan y herramientas de conversión e instalación provistos y probados.',
  },
  {
    id: 'operacion',
    label: 'Facilidad de operación',
    description: 'Inicialización, respaldo y recuperación automáticos que minimizan intervención manual.',
  },
  {
    id: 'multi-instalacion',
    label: 'Instalaciones múltiples',
    description: 'Diseño previsto para múltiples locales u organizaciones con ambientes distintos.',
  },
  {
    id: 'cambios',
    label: 'Facilidad de cambios',
    description: 'Consultas flexibles y datos de control mantenidos por el usuario sin recompilar.',
  },
]

export const INFLUENCE_LEVELS = [
  { grade: 0, label: 'Nulo', hint: 'Sin influencia' },
  { grade: 1, label: 'Incidental', hint: 'Influencia mínima' },
  { grade: 2, label: 'Moderado', hint: 'Influencia moderada' },
  { grade: 3, label: 'Medio', hint: 'Influencia media' },
  { grade: 4, label: 'Significativo', hint: 'Influencia significativa' },
  { grade: 5, label: 'Esencial', hint: 'Influencia esencial' },
]

export function emptyInfluence(): InfluenceScores {
  return Object.fromEntries(INFLUENCE_FACTORS.map((factor) => [factor.id, 0]))
}

/** Complejidad IFPUG para archivos lógicos: RET x DET. */
function fileComplexity(ret: number, det: number): Complexity {
  const rows = ret <= 1 ? 0 : ret <= 5 ? 1 : 2
  const cols = det <= 19 ? 0 : det <= 50 ? 1 : 2
  const table: Complexity[][] = [
    ['Baja', 'Baja', 'Media'],
    ['Baja', 'Media', 'Alta'],
    ['Media', 'Alta', 'Alta'],
  ]
  return table[rows][cols]
}

/** Complejidad IFPUG para entradas externas: FTR x DET. */
function inputComplexity(ftr: number, det: number): Complexity {
  const rows = ftr <= 1 ? 0 : ftr === 2 ? 1 : 2
  const cols = det <= 4 ? 0 : det <= 15 ? 1 : 2
  const table: Complexity[][] = [
    ['Baja', 'Baja', 'Media'],
    ['Baja', 'Media', 'Alta'],
    ['Media', 'Alta', 'Alta'],
  ]
  return table[rows][cols]
}

/** Complejidad IFPUG para salidas y consultas externas: FTR x DET. */
function outputComplexity(ftr: number, det: number): Complexity {
  const rows = ftr <= 1 ? 0 : ftr <= 3 ? 1 : 2
  const cols = det <= 5 ? 0 : det <= 19 ? 1 : 2
  const table: Complexity[][] = [
    ['Baja', 'Baja', 'Media'],
    ['Baja', 'Media', 'Alta'],
    ['Media', 'Alta', 'Alta'],
  ]
  return table[rows][cols]
}

export type ComplexityRule = { axis: string; bands: string; matched: string }

/** Deriva la complejidad desde DET/RET/FTR y explica qué tabla se aplicó. */
export function deriveComplexity(
  type: FunctionType,
  det: number,
  ret: number,
  ftr: number,
): { complexity: Complexity; rule: ComplexityRule } | null {
  if (det <= 0) return null
  if (type === 'ILF' || type === 'EIF') {
    if (ret <= 0) return null
    return {
      complexity: fileComplexity(ret, det),
      rule: { axis: 'RET x DET', bands: 'RET 1 / 2-5 / 6+ · DET 1-19 / 20-50 / 51+', matched: `RET ${ret} · DET ${det}` },
    }
  }
  if (ftr <= 0) return null
  if (type === 'EI') {
    return {
      complexity: inputComplexity(ftr, det),
      rule: { axis: 'FTR x DET', bands: 'FTR 0-1 / 2 / 3+ · DET 1-4 / 5-15 / 16+', matched: `FTR ${ftr} · DET ${det}` },
    }
  }
  return {
    complexity: outputComplexity(ftr, det),
    rule: { axis: 'FTR x DET', bands: 'FTR 0-1 / 2-3 / 4+ · DET 1-5 / 6-19 / 20+', matched: `FTR ${ftr} · DET ${det}` },
  }
}

export function pointsFor(type: FunctionType, complexity: Complexity, matrix: PointMatrix = DEFAULT_MATRIX): number {
  return matrix[type]?.[complexity] ?? DEFAULT_MATRIX[type][complexity]
}

export function totalDegreeOfInfluence(influence: InfluenceScores): number {
  return INFLUENCE_FACTORS.reduce((sum, factor) => sum + clampGrade(influence[factor.id]), 0)
}

export function clampGrade(value: unknown): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.min(5, Math.max(0, Math.round(numeric)))
}

/** VAF = 0.65 + 0.01 x TDI */
export function valueAdjustmentFactor(tdi: number): number {
  return 0.65 + 0.01 * tdi
}

export type Estimation = {
  ufp: number
  tdi: number
  vaf: number
  afp: number
  hours: number
  teamHours: number
  days: number
  weeks: number
  laborCost: number
  otherCost: number
  totalCost: number
}

export function estimate(functions: FpaFunction[], values: ProjectValues, influence: InfluenceScores): Estimation {
  const ufp = functions.reduce((sum, item) => sum + item.points, 0)
  const tdi = totalDegreeOfInfluence(influence)
  const vaf = valueAdjustmentFactor(tdi)
  const afp = ufp * vaf
  const hours = afp * values.hoursPerPoint
  const developers = Math.max(1, values.developers)
  const workday = Math.max(1, values.workdayHours)
  const teamHours = hours / developers
  const days = teamHours / workday
  const laborCost = hours * values.baseRate
  const otherCost = sumCosts(values.otherCosts, days)
  return {
    ufp,
    tdi,
    vaf,
    afp,
    hours,
    teamHours,
    days,
    weeks: days / 5,
    laborCost,
    otherCost,
    totalCost: laborCost + otherCost,
  }
}

/** Los costos recurrentes se prorratean por mes de proyecto (21 jornadas hábiles). */
export function sumCosts(costs: CostItem[], projectDays: number): number {
  const months = Math.max(1, Math.ceil(projectDays / 21))
  return costs.reduce((sum, item) => sum + (item.recurring ? item.amount * months : item.amount), 0)
}

export function formatNumber(value: number, digits = 1): string {
  return new Intl.NumberFormat('es-UY', { maximumFractionDigits: digits }).format(value)
}

export function formatMoney(value: number, currency: string): string {
  return `${currency} ${new Intl.NumberFormat('es-UY', { maximumFractionDigits: 0 }).format(value)}`
}
