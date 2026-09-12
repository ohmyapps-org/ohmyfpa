import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent, ComponentType } from 'react'
import { ArrowUpRight, BarChart3, BookOpen, Bot, Boxes, Calculator, Check, ChevronRight, CircleHelp, Clock3, Download, FileInput, FileText, Filter, FolderKanban, GitBranch, HardDrive, Info, Layers3, Library, ListTodo, LockKeyhole, Menu, Network, Plus, Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, SquareKanban, Upload, Users, X } from 'lucide-react'
import './App.css'

type ViewId = 'overview' | 'functions' | 'imports' | 'values' | 'mcp' | 'docs'
type FunctionType = 'EI' | 'EO' | 'EQ' | 'ILF' | 'EIF'
type Complexity = 'Baja' | 'Media' | 'Alta'
type FunctionStatus = 'Listo' | 'Revisar' | 'Borrador'
type FpaFunction = { id: string; title: string; type: FunctionType; issue: string; complexity: Complexity; det: number; ret: number; points: number; origin: string; confidence: number; status: FunctionStatus }
type PointMatrix = Record<FunctionType, Record<Complexity, number>>
type CustomValues = { hoursPerPoint: number; workdayHours: number; baseRate: number; productivityLabel: string; pointMatrix: PointMatrix }
type Toast = { message: string; tone: 'info' | 'success' }
type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>

const STORAGE_KEY = 'ohmyfpa-analysis-v1'
const META: Record<FunctionType, { label: string; description: string; color: string }> = {
  EI: { label: 'Entrada externa', description: 'Datos que ingresan y actualizan el sistema', color: '#1c4d8d' },
  EO: { label: 'Salida externa', description: 'Informes o resultados con lógica derivada', color: '#4988c4' },
  EQ: { label: 'Consulta externa', description: 'Lectura sin lógica derivada compleja', color: '#0f2854' },
  ILF: { label: 'Archivo lógico interno', description: 'Grupo de datos mantenido dentro del producto', color: '#1c4d8d' },
  EIF: { label: 'Archivo de interfaz', description: 'Datos referenciados por otro sistema', color: '#4988c4' },
}
const POINTS: Record<FunctionType, Record<Complexity, number>> = { EI: { Baja: 3, Media: 4, Alta: 6 }, EO: { Baja: 4, Media: 5, Alta: 7 }, EQ: { Baja: 3, Media: 4, Alta: 6 }, ILF: { Baja: 7, Media: 10, Alta: 15 }, EIF: { Baja: 5, Media: 7, Alta: 10 } }
const DEFAULT_VALUES: CustomValues = { hoursPerPoint: 1.65, workdayHours: 7.5, baseRate: 48, productivityLabel: 'Equipo producto estándar', pointMatrix: POINTS }
const DEFAULT_FUNCTIONS: FpaFunction[] = [
  { id: 'FN-104', title: 'Exportar informe de estimación', type: 'EO', issue: 'Dashboard', complexity: 'Media', det: 12, ret: 2, points: 5, origin: 'Manual', confidence: 96, status: 'Listo' },
  { id: 'FN-103', title: 'Consultar desglose por issue', type: 'EQ', issue: 'Dashboard', complexity: 'Media', det: 8, ret: 2, points: 4, origin: 'GitHub', confidence: 92, status: 'Listo' },
  { id: 'FN-102', title: 'Registrar función desde backlog', type: 'EI', issue: 'Ingesta', complexity: 'Media', det: 9, ret: 1, points: 4, origin: 'IEEE830', confidence: 88, status: 'Revisar' },
  { id: 'FN-101', title: 'Catálogo de reglas IFPUG', type: 'ILF', issue: 'Configuración', complexity: 'Alta', det: 15, ret: 3, points: 15, origin: 'Manual', confidence: 98, status: 'Listo' },
  { id: 'FN-100', title: 'Sincronizar issue externo', type: 'EI', issue: 'Integraciones', complexity: 'Alta', det: 14, ret: 2, points: 6, origin: 'Trello', confidence: 74, status: 'Revisar' },
  { id: 'FN-099', title: 'Leer repositorio de requisitos', type: 'EIF', issue: 'Integraciones', complexity: 'Media', det: 7, ret: 2, points: 7, origin: 'GitHub', confidence: 81, status: 'Revisar' },
  { id: 'FN-098', title: 'Clasificar función semánticamente', type: 'EQ', issue: 'AI local', complexity: 'Alta', det: 6, ret: 1, points: 6, origin: 'IEEE830', confidence: 67, status: 'Borrador' },
]
const NAV: { id: ViewId; label: string; icon: Icon }[] = [
  { id: 'overview', label: 'Resumen', icon: BarChart3 }, { id: 'functions', label: 'Funciones', icon: Boxes },
  { id: 'imports', label: 'Importaciones', icon: FileInput }, { id: 'values', label: 'Valores FPA', icon: SlidersHorizontal }, { id: 'mcp', label: 'MCP Server', icon: Bot },
]
const TYPES = Object.keys(META) as FunctionType[]
function loadState(): { functions: FpaFunction[]; values: CustomValues } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { functions: DEFAULT_FUNCTIONS, values: DEFAULT_VALUES }
    const saved = JSON.parse(raw) as { functions?: FpaFunction[]; values?: CustomValues }
    return { functions: Array.isArray(saved.functions) && saved.functions.length ? saved.functions : DEFAULT_FUNCTIONS, values: { ...DEFAULT_VALUES, ...(saved.values ?? {}) } }
  } catch { return { functions: DEFAULT_FUNCTIONS, values: DEFAULT_VALUES } }
}
function pointsFor(type: FunctionType, complexity: Complexity, matrix: PointMatrix = POINTS): number { return matrix[type][complexity] }
function formatNumber(value: number): string { return new Intl.NumberFormat('es-UY', { maximumFractionDigits: 1 }).format(value) }
function inferType(title: string): FunctionType {
  const text = title.toLocaleLowerCase()
  if (/(export|informe|reporte|notific|calcular)/.test(text)) return 'EO'
  if (/(consult|buscar|filtrar|ver|listar)/.test(text)) return 'EQ'
  if (/(archivo|base|catalog|guardar|persistir|registro)/.test(text)) return 'ILF'
  if (/(integrar|externo|sincron|api|repositorio)/.test(text)) return 'EIF'
  return 'EI'
}
function parseRow(record: Record<string, unknown>, index: number, origin: string): FpaFunction {
  const title = String(record.title ?? record.name ?? record.summary ?? record.description ?? 'Función importada ' + (index + 1))
  const candidate = String(record.type ?? record.fpaType ?? inferType(title)).toUpperCase()
  const type = candidate in META ? candidate as FunctionType : inferType(title)
  const candidateComplexity = String(record.complexity ?? record.complejidad ?? 'Media')
  const complexity: Complexity = candidateComplexity === 'Baja' || candidateComplexity === 'Alta' ? candidateComplexity : 'Media'
  return { id: String(record.id ?? record.number ?? 'IMP-' + String(index + 1).padStart(3, '0')), title, type, issue: String(record.issue ?? record.labels ?? record.list ?? 'Importado'), complexity, det: Number(record.det ?? record.dataElementTypes ?? 0) || 0, ret: Number(record.ret ?? record.recordElementTypes ?? 0) || 0, points: pointsFor(type, complexity), origin, confidence: 72, status: 'Revisar' }
}
function parseImport(content: string, name: string): FpaFunction[] {
  if (name.toLocaleLowerCase().endsWith('.csv')) {
    const rows = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    if (rows.length < 2) return []
    const separator = rows[0].includes(';') ? ';' : ','
    const headers = rows[0].split(separator).map((header) => header.trim().toLocaleLowerCase())
    return rows.slice(1).map((row, index) => parseRow(Object.fromEntries(headers.map((header, cell) => [header, row.split(separator)[cell]?.trim() ?? ''])), index, 'CSV local'))
  }
  try {
    const parsed = JSON.parse(content) as unknown
    const list = Array.isArray(parsed) ? parsed : typeof parsed === 'object' && parsed !== null ? ((parsed as { functions?: unknown[]; issues?: unknown[]; cards?: unknown[] }).functions ?? (parsed as { issues?: unknown[] }).issues ?? (parsed as { cards?: unknown[] }).cards ?? []) : []
    const origin = name.toLocaleLowerCase().includes('trello') ? 'Trello local' : name.toLocaleLowerCase().includes('github') ? 'GitHub local' : 'JSON local'
    return list.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null).map((record, index) => parseRow(record, index, origin))
  } catch {
    return content.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 8).slice(0, 30).map((line, index) => {
      const title = line.replace(/^[-*#\d.\s]+/, '').trim()
      const type = inferType(title)
      return { id: 'IEEE-' + String(index + 1).padStart(3, '0'), title, type, issue: 'IEEE830 local', complexity: 'Media', det: 0, ret: 0, points: pointsFor(type, 'Media'), origin: 'IEEE830 local', confidence: 64, status: 'Borrador' }
    })
  }
}

export default function App() {
  const initial = useMemo(() => loadState(), [])
  const [view, setView] = useState<ViewId>('overview')
  const [functions, setFunctions] = useState(initial.functions)
  const [values, setValues] = useState(initial.values)
  const [developers, setDevelopers] = useState(3)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FunctionType | 'Todas'>('Todas')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [modal, setModal] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<FunctionType>('EI')
  const [newComplexity, setNewComplexity] = useState<Complexity>('Media')
  const inputRef = useRef<HTMLInputElement>(null)
  const totalPoints = functions.reduce((sum, item) => sum + item.points, 0)
  const hours = totalPoints * values.hoursPerPoint
  const days = hours / Math.max(developers, 1) / values.workdayHours
  const counts = TYPES.map((type) => ({ type, count: functions.filter((item) => item.type === type).length, points: functions.filter((item) => item.type === type).reduce((sum, item) => sum + item.points, 0) }))
  const filtered = functions.filter((item) => (filter === 'Todas' || item.type === filter) && (!query || (item.title + item.issue + item.id).toLocaleLowerCase().includes(query.toLocaleLowerCase())))

  function notify(message: string, tone: Toast['tone'] = 'info') { setToast({ message, tone }); window.setTimeout(() => setToast(null), 3200) }
  function persist(nextFunctions: FpaFunction[], nextValues = values) { localStorage.setItem(STORAGE_KEY, JSON.stringify({ functions: nextFunctions, values: nextValues })) }
  function addFunction() {
    const item: FpaFunction = { id: 'FN-' + String(105 + functions.length).padStart(3, '0'), title: newTitle.trim() || 'Nueva función de negocio', type: newType, issue: 'Nuevo issue', complexity: newComplexity, det: 0, ret: 0, points: pointsFor(newType, newComplexity, values.pointMatrix), origin: 'Manual', confidence: 58, status: 'Borrador' }
    const next = [item, ...functions]; setFunctions(next); persist(next); setModal(false); setNewTitle(''); notify('Función agregada al análisis', 'success')
  }
  function removeFunction(id: string) { const next = functions.filter((item) => item.id !== id); setFunctions(next); persist(next); notify('Función removida del análisis') }
  function updateValue(field: keyof CustomValues, raw: string) { const next = { ...values, [field]: field === 'productivityLabel' ? raw : Number(raw) } as CustomValues; setValues(next); persist(functions, next) }
  function updatePointValue(type: FunctionType, complexity: Complexity, raw: string) { const nextMatrix: PointMatrix = { ...values.pointMatrix, [type]: { ...values.pointMatrix[type], [complexity]: Math.max(1, Number(raw) || 1) } }; const nextValues = { ...values, pointMatrix: nextMatrix }; const nextFunctions = functions.map((item) => ({ ...item, points: pointsFor(item.type, item.complexity, nextMatrix) })); setValues(nextValues); setFunctions(nextFunctions); persist(nextFunctions, nextValues) }
  function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return
    const reader = new FileReader(); reader.onload = () => { const imported = parseImport(String(reader.result ?? ''), file.name); if (!imported.length) { notify('No se encontraron funciones importables'); return }; const next = [...imported, ...functions]; setFunctions(next); persist(next); notify(imported.length + ' funciones importadas localmente', 'success') }
    reader.readAsText(file); event.target.value = ''
  }
  function exportAnalysis() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), zeroDataPolicy: true, developers, values, functions }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'ohmyfpa-analysis.json'; link.click(); URL.revokeObjectURL(url); notify('Análisis exportado como JSON local', 'success')
  }
  const pageTitle = view === 'overview' ? 'Estimación de punto de función' : NAV.find((item) => item.id === view)?.label ?? 'Documentación'
  return <div className="app-shell">
    <Sidebar view={view} setView={(next) => { setView(next); setMobileOpen(false) }} mobileOpen={mobileOpen} functionsCount={functions.length} />
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} type="button" aria-label="Abrir menú"><Menu size={20} /></button><div className="breadcrumbs"><span>Proyectos</span><ChevronRight size={13} /><span>Plataforma Eternum</span><ChevronRight size={13} /><strong>Análisis FPA</strong></div><div className="topbar-actions"><span className="saved-indicator"><span className="saved-dot" /> Guardado localmente</span><button className="icon-button" type="button" aria-label="Ayuda" title="Centro de ayuda próximamente" disabled><CircleHelp size={17} /></button><span className="avatar avatar--small" aria-label="Perfil de Facundo Presa">FP</span></div></header>
      <div className="content-wrap">
        <section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> FUNCTION POINT ANALYSIS <span className="eyebrow-version">v0.1 local</span></div><h1>{pageTitle}</h1><p>{view === 'overview' ? 'Convertí requisitos en una estimación trazable, revisable y lista para planificar.' : 'Workspace local para organizar funciones, reglas IFPUG e importaciones sin salir de tu equipo.'}</p></div><div className="heading-actions"><button className="button button--ghost" onClick={exportAnalysis} type="button"><Download size={16} /> Exportar</button><button className="button button--primary" onClick={() => setModal(true)} type="button"><Plus size={16} /> Nueva función</button></div></section>
        {view === 'overview' && <MetricStrip total={totalPoints} functions={functions.length} ready={functions.filter((item) => item.status === 'Listo').length} hours={hours} days={days} />}
        {view === 'overview' && <Overview total={totalPoints} counts={counts} functions={functions} developers={developers} setDevelopers={setDevelopers} hours={hours} days={days} onAdd={() => setModal(true)} onExport={exportAnalysis} />}
        {view === 'functions' && <FunctionsView functions={filtered} query={query} filter={filter} setQuery={setQuery} setFilter={setFilter} onAdd={() => setModal(true)} onDelete={removeFunction} />}
        {view === 'imports' && <ImportsView onPick={() => inputRef.current?.click()} />}
        {view === 'values' && <ValuesView values={values} onChange={updateValue} onPointChange={updatePointValue} />}
        {view === 'mcp' && <McpView onCopy={() => notify('Configuración MCP lista para copiar', 'success')} />}
        {view === 'docs' && <DocsView onOpen={() => setView('imports')} />}
      </div>
    </main>
    <input ref={inputRef} type="file" accept=".json,.csv,.md,.txt" className="hidden-input" onChange={importFile} />
    {modal && <AddModal title={newTitle} type={newType} complexity={newComplexity} close={() => setModal(false)} setTitle={setNewTitle} setType={setNewType} setComplexity={setNewComplexity} submit={addFunction} />}
    {toast && <div className={'toast toast--' + toast.tone}><span>{toast.tone === 'success' ? <Check size={16} /> : <Info size={16} />}</span>{toast.message}</div>}
  </div>
}

function Sidebar({ view, setView, mobileOpen, functionsCount }: { view: ViewId; setView: (view: ViewId) => void; mobileOpen: boolean; functionsCount: number }) {
  return <aside className={'sidebar ' + (mobileOpen ? 'sidebar--open' : '')}><div className="brand-lockup"><span className="brand-mark"><Network size={19} /></span><div><strong>OhMyFPA</strong><span>by WeFaber</span></div></div><div className="sidebar-project"><div className="project-icon"><FolderKanban size={17} /></div><div><span>Proyecto activo</span><strong>Plataforma Eternum</strong></div><ChevronRight size={15} className="muted-icon" /></div><nav className="main-nav"><span className="nav-caption">Workspace</span>{NAV.map(({ id, label, icon: Icon }) => <button key={id} className={'nav-item ' + (view === id ? 'nav-item--active' : '')} onClick={() => setView(id)} type="button"><Icon size={17} /><span>{label}</span>{id === 'functions' && <span className="nav-count">{functionsCount}</span>}</button>)}<span className="nav-caption nav-caption--spaced">Conectores</span><button className="nav-item" onClick={() => setView('imports')} type="button"><GitBranch size={17} /><span>GitHub</span><span className="connector-dot connector-dot--green" /></button><button className="nav-item" onClick={() => setView('imports')} type="button"><SquareKanban size={17} /><span>Trello</span><span className="connector-dot connector-dot--yellow" /></button></nav><div className="sidebar-bottom"><button className="nav-item" onClick={() => setView('docs')} type="button"><BookOpen size={17} /><span>Documentación</span></button><div className="offline-card"><span className="offline-pulse" /><div><strong>Modo offline</strong><span>Datos solo en este dispositivo</span></div><ShieldCheck size={16} /></div><div className="user-chip"><span className="avatar">FP</span><div><strong>Facundo Presa</strong><span>Owner</span></div><Settings2 size={15} className="muted-icon" /></div></div></aside>
}
function MetricStrip({ total, functions, ready, hours, days }: { total: number; functions: number; ready: number; hours: number; days: number }) {
  return <section className="metric-strip"><Metric label="Puntos de función" value={formatNumber(total)} detail="estimados" icon={Calculator} tone="teal" /><Metric label="Funciones relevadas" value={String(functions)} detail={ready + ' listas para validar'} icon={Layers3} tone="blue" /><Metric label="Esfuerzo estimado" value={formatNumber(hours) + ' h'} detail={formatNumber(days) + ' días de equipo'} icon={Clock3} tone="amber" /><Metric label="Cobertura del análisis" value={Math.round(ready / Math.max(functions, 1) * 100) + '%'} detail={functions - ready + ' requieren revisión'} icon={ShieldCheck} tone="rose" /></section>
}
function Metric({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: Icon; tone: string }) {
  return <article className="metric-card"><div className={'metric-icon metric-icon--' + tone}><Icon size={18} /></div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>
}
function TriangleAnalysis({ total, counts }: { total: number; counts: { type: FunctionType; count: number; points: number }[] }) {
  const byType = (type: FunctionType) => counts.find((item) => item.type === type) ?? { type, count: 0, points: 0 }
  const input = byType('EI')
  const data = [byType('ILF'), byType('EIF')]
  const output = [byType('EO'), byType('EQ')]
  const sum = (items: { points: number }[]) => items.reduce((value, item) => value + item.points, 0)
  const nodes = [
    { key: 'entry', label: 'Entradas', detail: `${input.count} EI · ${input.points} FP`, type: 'EI' as FunctionType },
    { key: 'data', label: 'Datos internos', detail: `${data[0].count + data[1].count} ILF / EIF · ${sum(data)} FP`, type: 'ILF' as FunctionType },
    { key: 'output', label: 'Salidas y consultas', detail: `${output[0].count + output[1].count} EO / EQ · ${sum(output)} FP`, type: 'EO' as FunctionType },
  ]
  return <div className="triangle-analysis" aria-label="Triángulo de análisis funcional">
    <svg className="triangle-shape" viewBox="0 0 720 352" role="img" aria-label="Triángulo de entradas, datos y salidas">
      <defs><linearGradient id="triangle-fill" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4988C4" stopOpacity=".22" /><stop offset="1" stopColor="#BDE8F5" stopOpacity=".8" /></linearGradient></defs>
      <path className="triangle-grid" d="M360 38 L80 296 H640 Z M360 96 L144 276 H576 Z M360 153 L208 256 H512 Z" />
      <path className="triangle-fill" d="M360 38 L80 296 H640 Z" />
      <path className="triangle-line" d="M360 38 L80 296 H640 Z" />
      <path className="triangle-axis" d="M360 38 V296 M80 296 H640" />
    </svg>
    <div className="triangle-total"><span>ANÁLISIS TOTAL</span><strong>{formatNumber(total)}<small> FP</small></strong><em>Estimación local</em></div>
    {nodes.map((node) => <div className={'triangle-node triangle-node--' + node.key} key={node.key}><i style={{ background: META[node.type].color }} /><div><strong>{node.label}</strong><span>{node.detail}</span></div></div>)}
    <div className="triangle-legend">{TYPES.map((type) => <span key={type}><i style={{ background: META[type].color }} />{type}</span>)}<span className="triangle-privacy"><LockKeyhole size={12} /> Datos locales</span></div>
  </div>
}
function Overview({ total, counts, functions, developers, setDevelopers, hours, days, onAdd, onExport }: { total: number; counts: { type: FunctionType; count: number; points: number }[]; functions: FpaFunction[]; developers: number; setDevelopers: (value: number) => void; hours: number; days: number; onAdd: () => void; onExport: () => void }) {
  const max = Math.max(...counts.map((item) => item.points), 1)
  return <div className="overview-layout"><div className="overview-main"><section className="panel diagram-panel"><div className="panel-heading"><div><span className="section-kicker">MAPA DE FUNCIONES</span><h2>Lectura del análisis</h2></div><span className="panel-meta">Recalculo automático</span></div><TriangleAnalysis total={total} counts={counts} /></section><section className="panel distribution-panel"><div className="panel-heading"><div><span className="section-kicker">DISTRIBUCIÓN</span><h2>Volumen por tipo de función</h2></div><span className="panel-meta">{functions.length} elementos</span></div><div className="bar-list">{counts.map((item) => <div className="bar-row" key={item.type}><div className="bar-label"><span className="type-pill" style={{ color: META[item.type].color, borderColor: META[item.type].color + '55', background: META[item.type].color + '12' }}>{item.type}</span><span>{META[item.type].label}</span></div><div className="bar-track"><span style={{ width: Math.max(item.points / max * 100, item.count > 0 ? 4 : 0) + '%', background: META[item.type].color }} /></div><strong>{item.points} <small>FP</small></strong></div>)}</div></section><section className="panel recent-panel"><div className="panel-heading"><div><span className="section-kicker">TRAZABILIDAD</span><h2>Funciones recientes</h2></div><span className="panel-meta">Últimas 4</span></div><div className="recent-list">{functions.slice(0, 4).map((item) => <div className="recent-row" key={item.id}><span className="recent-type" style={{ color: META[item.type].color }}>{item.type}</span><div className="recent-main"><strong>{item.title}</strong><span>{item.id} · {item.origin}</span></div><span className={'status status--' + item.status.toLocaleLowerCase()}><i />{item.status}</span><strong className="recent-points">{item.points} <small>FP</small></strong></div>)}</div></section></div><aside className="overview-side"><section className="panel effort-card"><div className="panel-heading"><div><span className="section-kicker">PLANIFICACIÓN</span><h2>Esfuerzo y equipo</h2></div><Users size={17} className="muted-icon" /></div><div className="effort-total"><strong>{formatNumber(hours)}<small> h</small></strong><span>esfuerzo base</span></div><div className="effort-breakdown"><div><span>Desarrolladores</span><div className="stepper"><button type="button" onClick={() => setDevelopers(Math.max(1, developers - 1))}>−</button><strong>{developers}</strong><button type="button" onClick={() => setDevelopers(Math.min(12, developers + 1))}>+</button></div></div><div><span>Jornadas de equipo</span><strong>{formatNumber(days)} días</strong></div><div><span>Productividad</span><strong>1.65 h / FP</strong></div></div><div className="effort-note"><Info size={14} /><span>La estimación se recalcula en vivo con los valores del panel FPA.</span></div></section><section className="panel standards-card"><span className="section-kicker">MÉTODO</span><h2>Reglas de referencia</h2><p>Clasificación IFPUG de EI, EO, EQ, ILF y EIF, con complejidad editable por proyecto.</p><div className="standards-source"><div className="source-icon"><Library size={16} /></div><div><strong>IFPUG baseline</strong><span>Valores locales versionados</span></div><Check size={16} className="source-check" /></div><button className="button button--soft" onClick={onAdd} type="button"><Plus size={15} /> Agregar función</button></section><section className="panel export-card"><div className="export-icon"><HardDrive size={17} /></div><div><strong>Portabilidad local</strong><span>JSON sin servidor ni telemetría.</span></div><button className="icon-button icon-button--filled" onClick={onExport} type="button" aria-label="Exportar análisis"><Download size={15} /></button></section></aside></div>
}
function FunctionsView({ functions, query, filter, setQuery, setFilter, onAdd, onDelete }: { functions: FpaFunction[]; query: string; filter: FunctionType | 'Todas'; setQuery: (value: string) => void; setFilter: (value: FunctionType | 'Todas') => void; onAdd: () => void; onDelete: (id: string) => void }) {
  return <section className="panel table-panel"><div className="table-toolbar"><div><span className="section-kicker">INVENTARIO FPA</span><h2>Funciones del análisis</h2><p>Clasificá y auditá cada función antes de consolidar la estimación.</p></div><button className="button button--primary" onClick={onAdd} type="button"><Plus size={16} /> Nueva función</button></div><div className="filter-row"><div className="search-input"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por función, issue o ID" /></div><div className="filter-control"><Filter size={14} /><select value={filter} onChange={(event) => setFilter(event.target.value as FunctionType | 'Todas')}><option value="Todas">Todos los tipos</option>{TYPES.map((type) => <option key={type} value={type}>{type} · {META[type].label}</option>)}</select></div><span className="filter-result">{functions.length} resultados</span></div><div className="data-table-wrap"><table className="data-table"><thead><tr><th>Función</th><th>Tipo</th><th>Issue / origen</th><th>Complejidad</th><th>DET / RET</th><th>FP</th><th>Confianza</th><th aria-label="Acciones" /></tr></thead><tbody>{functions.map((item) => <tr key={item.id}><td><div className="function-cell"><span className="function-id">{item.id}</span><strong>{item.title}</strong></div></td><td><span className="type-pill" style={{ color: META[item.type].color, borderColor: META[item.type].color + '55', background: META[item.type].color + '12' }}>{item.type}</span></td><td><div className="issue-cell"><span>{item.issue}</span><small>{item.origin}</small></div></td><td><span className="complexity-dot"><i className={'complexity-' + item.complexity.toLocaleLowerCase()} />{item.complexity}</span></td><td><span className="det-ret">{item.det || '—'} <i>/</i> {item.ret || '—'}</span></td><td><strong className="points-cell">{item.points}</strong></td><td><div className="confidence"><span><i style={{ width: item.confidence + '%' }} /></span><small>{item.confidence}%</small></div></td><td><button className="row-delete" onClick={() => onDelete(item.id)} type="button" aria-label={'Eliminar ' + item.title}><X size={14} /></button></td></tr>)}</tbody></table>{functions.length === 0 && <div className="empty-state"><Search size={22} /><strong>No hay funciones que coincidan</strong><span>Probá otro filtro o importá una fuente local.</span></div>}</div></section>
}
function ImportsView({ onPick }: { onPick: () => void }) {
  return <div className="subview-grid"><section className="panel import-hero"><div className="import-orbit"><FileInput size={24} /></div><span className="section-kicker">INGESTA LOCAL</span><h2>Traé requisitos sin exponerlos</h2><p>Procesá exports de GitHub, Trello o IEEE830 directamente en tu navegador. La extracción semántica corre en el dispositivo y no sube archivos.</p><button className="button button--primary" onClick={onPick} type="button"><Upload size={16} /> Importar archivo</button><span className="drop-hint">JSON · CSV · Markdown · TXT</span></section><section className="panel source-list"><div className="panel-heading"><div><span className="section-kicker">FUENTES COMPATIBLES</span><h2>Adaptadores locales</h2></div><ShieldCheck size={17} className="muted-icon" /></div><Source icon={GitBranch} title="GitHub Issues" text="issues.json o CSV exportado" tone="green" /><Source icon={SquareKanban} title="Trello" text="cards.json o CSV exportado" tone="yellow" /><Source icon={FileText} title="IEEE830" text="requisitos en Markdown o texto" tone="blue" /><div className="source-policy"><LockKeyhole size={14} /><span>Zero Data Policy activa. Sin tokens, cookies ni llamadas externas.</span></div></section><section className="panel import-steps"><span className="section-kicker">FLUJO</span><h2>De requisito a FP</h2><Step number="01" title="Importar" text="Leé un archivo local y conservá su origen." /><Step number="02" title="Clasificar" text="Asigná EI, EO, EQ, ILF o EIF con reglas semánticas." /><Step number="03" title="Revisar" text="Confirmá DET, RET, complejidad y confianza." /></section></div>
}
function Source({ icon: Icon, title, text, tone }: { icon: Icon; title: string; text: string; tone: string }) { return <div className="import-source"><span className={'source-brand source-brand--' + tone}><Icon size={17} /></span><div><strong>{title}</strong><span>{text}</span></div><span className="local-badge">local</span></div> }
function Step({ number, title, text }: { number: string; title: string; text: string }) { return <div className="step-item"><span>{number}</span><div><strong>{title}</strong><p>{text}</p></div><ChevronRight size={15} /></div> }
function ValuesView({ values, onChange, onPointChange }: { values: CustomValues; onChange: (field: keyof CustomValues, value: string) => void; onPointChange: (type: FunctionType, complexity: Complexity, value: string) => void }) {
  return <div className="subview-grid values-grid"><section className="panel values-main"><div className="panel-heading"><div><span className="section-kicker">CONFIGURACIÓN DEL MÉTODO</span><h2>Valores personalizados</h2><p>Adaptá la estimación a tu equipo sin modificar la referencia base.</p></div><Settings2 size={18} className="muted-icon" /></div><div className="field-grid"><Field label="Horas por punto de función" value={values.hoursPerPoint} type="number" onChange={(value) => onChange('hoursPerPoint', value)} hint="Multiplica el volumen total de FP." /><Field label="Horas por jornada" value={values.workdayHours} type="number" onChange={(value) => onChange('workdayHours', value)} hint="Convierte horas a días." /><Field label="Tarifa base por hora" value={values.baseRate} type="number" onChange={(value) => onChange('baseRate', value)} hint="Referencia opcional para costo." /><Field label="Nombre del perfil" value={values.productivityLabel} onChange={(value) => onChange('productivityLabel', value)} hint="Etiqueta visible en el análisis." /></div><div className="inline-notice"><Info size={15} /><span>Los valores se guardan en el almacenamiento local de este navegador.</span></div></section><section className="panel rule-card"><span className="section-kicker">MATRIZ DE PUNTOS</span><h2>Referencia IFPUG</h2><p>Editable desde el navegador y persistida dentro del análisis.</p><div className="rules-matrix"><div className="rules-row rules-head"><span>Tipo</span><span>Baja</span><span>Media</span><span>Alta</span></div>{TYPES.map((type) => <div className="rules-row" key={type}><span className="rule-type" style={{ color: META[type].color }}>{type}</span>{(['Baja', 'Media', 'Alta'] as Complexity[]).map((level) => <input className="matrix-input" key={level} type="number" min="1" value={values.pointMatrix[type][level]} onChange={(event) => onPointChange(type, level, event.target.value)} aria-label={type + ' ' + level} />)}</div>)}</div><div className="rule-foot"><Library size={14} /><span>IFPUG CPM como baseline editable para el análisis local.</span></div></section></div>
}
function Field({ label, value, type = 'text', hint, onChange }: { label: string; value: string | number; type?: string; hint: string; onChange: (value: string) => void }) { return <label><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} /><small>{hint}</small></label> }
function McpView({ onCopy }: { onCopy: () => void }) {
  const config = '{\n  "mcpServers": {\n    "ohmyfpa": {\n      "command": "bun",\n      "args": ["run", "mcp-server/index.ts"]\n    }\n  }\n}'
  return <div className="subview-grid mcp-grid"><section className="panel mcp-hero"><div className="mcp-status"><span className="mcp-status-dot" /><span>Servidor disponible localmente</span></div><div className="mcp-icon"><Bot size={28} /></div><span className="section-kicker">MODEL CONTEXT PROTOCOL</span><h2>Asistencia AI con cero salida de datos</h2><p>Tools para consultar el análisis, clasificar requisitos y recalcular esfuerzo. Solo atiende en loopback.</p><div className="mcp-command"><span>$</span><code>bun run mcp-server/index.ts</code><button onClick={() => { void navigator.clipboard?.writeText(config); onCopy() }} type="button" aria-label="Copiar comando"><Download size={14} /></button></div></section><section className="panel tools-panel"><div className="panel-heading"><div><span className="section-kicker">CAPACIDADES</span><h2>Tools expuestas</h2></div><Network size={17} className="muted-icon" /></div>{[['analyze_function', 'Clasifica un requisito en EI, EO, EQ, ILF o EIF.'], ['calculate_effort', 'Calcula horas y días según FP y developers.'], ['list_functions', 'Devuelve el inventario local actual.'], ['import_ieee830', 'Extrae funciones desde texto sin red.']].map(([name, text]) => <div className="mcp-tool" key={name}><span className="tool-symbol">ƒ</span><div><strong>{name}</strong><span>{text}</span></div><ChevronRight size={14} className="muted-icon" /></div>)}<div className="zero-data-banner"><ShieldCheck size={16} /><div><strong>Loopback only</strong><span>127.0.0.1 · sin telemetría · sin prompts persistentes</span></div></div></section><section className="panel config-panel"><div className="panel-heading"><div><span className="section-kicker">CONFIGURACIÓN</span><h2>Conectar un cliente MCP</h2></div><button className="small-action" type="button" onClick={() => { void navigator.clipboard?.writeText(config); onCopy() }}><Download size={14} /> Copiar JSON</button></div><pre><code>{config}</code></pre><p>El cliente debe ejecutar el servidor incluido en este repositorio.</p></section></div>
}
function DocsView({ onOpen }: { onOpen: () => void }) { return <div className="subview-grid docs-grid"><section className="panel docs-intro"><span className="section-kicker">DOCUMENTACIÓN DEL SISTEMA</span><h2>Un análisis entendible por humanos y máquinas</h2><p>La carpeta docs contiene arquitectura, modelo de datos, política de privacidad y guía del servidor MCP.</p><button className="button button--soft" onClick={onOpen} type="button"><BookOpen size={15} /> Ver flujo de importación</button></section><section className="panel docs-list"><Doc icon={Network} title="ARCHITECTURE.md" text="Componentes, flujo de datos y decisiones offline." /><Doc icon={LockKeyhole} title="PRIVACY.md" text="Zero Data Policy y límites de los conectores." /><Doc icon={Bot} title="MCP_SERVER.md" text="Herramientas AI y ejecución local con Bun." /><Doc icon={ListTodo} title="USER_GUIDE.md" text="Procedimiento de análisis, revisión y exportación." /><Doc icon={FileText} title="REFERENCE_NOTES.md" text="Integración de PDFs y referencia visual." /></section></div> }
function Doc({ icon: Icon, title, text }: { icon: Icon; title: string; text: string }) { return <div className="doc-item"><span className="doc-icon"><Icon size={17} /></span><div><strong>{title}</strong><span>{text}</span></div><ArrowUpRight size={15} className="muted-icon" /></div> }
function AddModal({ title, type, complexity, close, setTitle, setType, setComplexity, submit }: { title: string; type: FunctionType; complexity: Complexity; close: () => void; setTitle: (value: string) => void; setType: (value: FunctionType) => void; setComplexity: (value: Complexity) => void; submit: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="add-title"><div className="modal-heading"><div><span className="section-kicker">NUEVO ELEMENTO</span><h2 id="add-title">Agregar función</h2></div><button className="icon-button" onClick={close} type="button" aria-label="Cerrar"><X size={17} /></button></div><label className="modal-field"><span>Nombre del requisito o función</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Registrar cliente" /></label><label className="modal-field"><span>Tipo de función</span><select value={type} onChange={(event) => setType(event.target.value as FunctionType)}>{TYPES.map((item) => <option key={item} value={item}>{item} · {META[item].label}</option>)}</select><small>{META[type].description}</small></label><label className="modal-field"><span>Complejidad inicial</span><select value={complexity} onChange={(event) => setComplexity(event.target.value as Complexity)}><option>Baja</option><option>Media</option><option>Alta</option></select></label><div className="modal-footer"><span><Sparkles size={14} /> Se puede revisar después</span><button className="button button--primary" onClick={submit} type="button"><Plus size={16} /> Crear función</button></div></section></div>
}


