export type FunctionType = 'EI' | 'EO' | 'EQ' | 'ILF' | 'EIF'
export type Complexity = 'Baja' | 'Media' | 'Alta'
export type FunctionStatus = 'Listo' | 'Revisar' | 'Borrador'
export type OriginKind = 'Manual' | 'GitHub' | 'Trello' | 'IEEE830' | 'CSV' | 'XLSX' | 'DOCX' | 'PDF' | 'JSON'

export type FpaFunction = {
  id: string
  title: string
  description: string
  type: FunctionType
  issue: string
  complexity: Complexity
  det: number
  ret: number
  ftr: number
  points: number
  origin: OriginKind
  sourceUrl: string
  confidence: number
  status: FunctionStatus
}

export type PointMatrix = Record<FunctionType, Record<Complexity, number>>

export type CostItem = { id: string; label: string; amount: number; recurring: boolean }

export type ProjectValues = {
  hoursPerPoint: number
  workdayHours: number
  baseRate: number
  currency: string
  productivityLabel: string
  developers: number
  pointMatrix: PointMatrix
  otherCosts: CostItem[]
}

/** Grados de influencia de las 14 características generales (0-5). */
export type InfluenceScores = Record<string, number>

export type Project = {
  id: string
  name: string
  client: string
  createdAt: string
  functions: FpaFunction[]
  values: ProjectValues
  influence: InfluenceScores
}

export type AnalysisState = {
  version: 2
  activeProjectId: string
  projects: Project[]
  onboarded: boolean
}

export type ThemeMode = 'light' | 'dark' | 'system'
export type TypefaceMode = 'brand' | 'system' | 'readable'

export type Accessibility = {
  theme: ThemeMode
  scale: number
  contrast: 'normal' | 'high'
  typeface: TypefaceMode
  reduceMotion: boolean
}

export type ViewId =
  | 'overview'
  | 'functions'
  | 'imports'
  | 'influence'
  | 'values'
  | 'estimation'
  | 'settings'
  | 'docs'
  | 'mcp'

export type Toast = { id: number; message: string; tone: 'info' | 'success' | 'warn' }
