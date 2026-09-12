import { DEFAULT_MATRIX, emptyInfluence } from './fpa'
import type { Accessibility, AnalysisState, FpaFunction, Project, ProjectValues } from './types'

export const STORAGE_KEY = 'ohmyfpa-analysis-v2'
export const LEGACY_KEY = 'ohmyfpa-analysis-v1'
export const PREFS_KEY = 'ohmyfpa-preferences-v1'

export const DEFAULT_VALUES: ProjectValues = {
  hoursPerPoint: 1.65,
  workdayHours: 7.5,
  baseRate: 48,
  currency: 'USD',
  productivityLabel: 'Equipo producto estándar',
  developers: 3,
  pointMatrix: DEFAULT_MATRIX,
  otherCosts: [
    { id: 'cost-domain', label: 'Dominio y certificados', amount: 90, recurring: false },
    { id: 'cost-hosting', label: 'Hosting e infraestructura', amount: 45, recurring: true },
    { id: 'cost-training', label: 'Capacitación de usuarios', amount: 400, recurring: false },
  ],
}

export const DEFAULT_ACCESSIBILITY: Accessibility = {
  theme: 'system',
  scale: 1,
  contrast: 'normal',
  typeface: 'brand',
  reduceMotion: false,
}

const SEED_FUNCTIONS: FpaFunction[] = [
  {
    id: 'FN-104',
    title: 'Exportar informe de estimación',
    description: 'Genera un JSON con el inventario, los valores y el resultado ajustado del análisis.',
    type: 'EO',
    issue: 'Dashboard',
    complexity: 'Media',
    det: 12,
    ret: 0,
    ftr: 2,
    points: 5,
    origin: 'Manual',
    sourceUrl: '',
    confidence: 96,
    status: 'Listo',
  },
  {
    id: 'FN-103',
    title: 'Consultar desglose por issue',
    description: 'Recupera funciones agrupadas por issue sin aplicar lógica derivada.',
    type: 'EQ',
    issue: 'Dashboard',
    complexity: 'Media',
    det: 8,
    ret: 0,
    ftr: 2,
    points: 4,
    origin: 'GitHub',
    sourceUrl: '',
    confidence: 92,
    status: 'Listo',
  },
  {
    id: 'FN-102',
    title: 'Registrar función desde backlog',
    description: 'Ingresa una función nueva al inventario y actualiza el archivo lógico del análisis.',
    type: 'EI',
    issue: 'Ingesta',
    complexity: 'Media',
    det: 9,
    ret: 0,
    ftr: 2,
    points: 4,
    origin: 'IEEE830',
    sourceUrl: '',
    confidence: 88,
    status: 'Revisar',
  },
  {
    id: 'FN-101',
    title: 'Catálogo de reglas IFPUG',
    description: 'Archivo lógico interno con la matriz de pesos y las bandas de complejidad editables.',
    type: 'ILF',
    issue: 'Configuración',
    complexity: 'Alta',
    det: 55,
    ret: 3,
    ftr: 0,
    points: 15,
    origin: 'Manual',
    sourceUrl: '',
    confidence: 98,
    status: 'Listo',
  },
  {
    id: 'FN-100',
    title: 'Sincronizar issue externo',
    description: 'Toma un export de Trello o GitHub y lo normaliza contra el inventario local.',
    type: 'EI',
    issue: 'Integraciones',
    complexity: 'Alta',
    det: 18,
    ret: 0,
    ftr: 3,
    points: 6,
    origin: 'Trello',
    sourceUrl: '',
    confidence: 74,
    status: 'Revisar',
  },
  {
    id: 'FN-099',
    title: 'Leer repositorio de requisitos',
    description: 'Archivo de interfaz externa mantenido por el repositorio de documentación.',
    type: 'EIF',
    issue: 'Integraciones',
    complexity: 'Media',
    det: 25,
    ret: 3,
    ftr: 0,
    points: 7,
    origin: 'GitHub',
    sourceUrl: '',
    confidence: 81,
    status: 'Revisar',
  },
  {
    id: 'FN-098',
    title: 'Clasificar función semánticamente',
    description: 'Sugiere tipo FPA a partir del texto del requisito con heurísticas locales.',
    type: 'EQ',
    issue: 'AI local',
    complexity: 'Alta',
    det: 22,
    ret: 0,
    ftr: 4,
    points: 6,
    origin: 'IEEE830',
    sourceUrl: '',
    confidence: 67,
    status: 'Borrador',
  },
]

export function createProject(name: string, client = ''): Project {
  return {
    id: 'prj-' + Math.random().toString(36).slice(2, 9),
    name,
    client,
    createdAt: new Date().toISOString(),
    functions: [],
    values: { ...DEFAULT_VALUES, otherCosts: DEFAULT_VALUES.otherCosts.map((cost) => ({ ...cost })) },
    influence: emptyInfluence(),
  }
}

function seedState(): AnalysisState {
  const project = createProject('Plataforma Eternum', 'WeFaber')
  project.functions = SEED_FUNCTIONS
  return { version: 2, activeProjectId: project.id, projects: [project], onboarded: false }
}

/** Rellena los campos que no existían en versiones anteriores del esquema. */
function normalizeFunction(item: Partial<FpaFunction>, index: number): FpaFunction {
  return {
    id: item.id ?? 'FN-' + String(index).padStart(3, '0'),
    title: item.title ?? 'Función sin título',
    description: item.description ?? '',
    type: item.type ?? 'EI',
    issue: item.issue ?? 'Sin asignar',
    complexity: item.complexity ?? 'Media',
    det: item.det ?? 0,
    ret: item.ret ?? 0,
    ftr: item.ftr ?? 0,
    points: item.points ?? 0,
    origin: item.origin ?? 'Manual',
    sourceUrl: item.sourceUrl ?? '',
    confidence: item.confidence ?? 60,
    status: item.status ?? 'Revisar',
  }
}

function normalizeProject(raw: Partial<Project>): Project {
  const base = createProject(raw.name ?? 'Proyecto sin nombre', raw.client ?? '')
  return {
    ...base,
    id: raw.id ?? base.id,
    createdAt: raw.createdAt ?? base.createdAt,
    functions: (raw.functions ?? []).map(normalizeFunction),
    values: { ...base.values, ...(raw.values ?? {}) },
    influence: { ...base.influence, ...(raw.influence ?? {}) },
  }
}

export function loadState(): AnalysisState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AnalysisState>
      const projects = (parsed.projects ?? []).map(normalizeProject)
      if (!projects.length) return seedState()
      const active = projects.some((project) => project.id === parsed.activeProjectId)
        ? String(parsed.activeProjectId)
        : projects[0].id
      return { version: 2, activeProjectId: active, projects, onboarded: parsed.onboarded === true }
    }
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) return migrateLegacy(legacy)
  } catch {
    /* almacenamiento no disponible o corrupto: se arranca desde la semilla */
  }
  return seedState()
}

function migrateLegacy(raw: string): AnalysisState {
  try {
    const parsed = JSON.parse(raw) as { functions?: FpaFunction[]; values?: Partial<ProjectValues> }
    const project = normalizeProject({
      name: 'Plataforma Eternum',
      client: 'WeFaber',
      functions: parsed.functions ?? SEED_FUNCTIONS,
      values: { ...DEFAULT_VALUES, ...(parsed.values ?? {}) },
    })
    return { version: 2, activeProjectId: project.id, projects: [project], onboarded: true }
  } catch {
    return seedState()
  }
}

export function saveState(state: AnalysisState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* cuota llena o modo privado: el análisis sigue en memoria */
  }
}

export function loadAccessibility(): Accessibility {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_ACCESSIBILITY
    return { ...DEFAULT_ACCESSIBILITY, ...(JSON.parse(raw) as Partial<Accessibility>) }
  } catch {
    return DEFAULT_ACCESSIBILITY
  }
}

export function saveAccessibility(value: Accessibility): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(value))
  } catch {
    /* preferencias no persistidas */
  }
}
