import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Info, PanelLeft, TriangleAlert } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { FunctionModal } from './components/FunctionModal'
import { Field, Modal } from './components/ui'
import { Overview } from './views/Overview'
import { Functions } from './views/Functions'
import { Imports } from './views/Imports'
import { Influence } from './views/Influence'
import { Values } from './views/Values'
import { Estimation } from './views/Estimation'
import { Settings } from './views/Settings'
import { Docs } from './views/Docs'
import { Mcp } from './views/Mcp'
import { Onboarding } from './views/Onboarding'
import {
  COMPLEXITIES,
  DEFAULT_MATRIX,
  FUNCTION_TYPES,
  TYPE_META,
  clampGrade,
  emptyInfluence,
  estimate,
  pointsFor,
} from './lib/fpa'
import { parseFile } from './lib/import'
import {
  DEFAULT_ACCESSIBILITY,
  PREFS_KEY,
  STORAGE_KEY,
  createProject,
  loadAccessibility,
  loadState,
  saveAccessibility,
  saveState,
} from './lib/storage'
import type {
  Accessibility,
  AnalysisState,
  Complexity,
  CostItem,
  FpaFunction,
  FunctionType,
  Project,
  Toast,
  ViewId,
} from './lib/types'

const DEPLOY_MODE = import.meta.env.VITE_DEPLOY_MODE ?? (import.meta.env.DEV ? 'dev' : 'production')
const SHOW_MCP = DEPLOY_MODE === 'dev' || DEPLOY_MODE === 'selfhost'

export default function App() {
  const [state, setState] = useState<AnalysisState>(() => loadState())
  const [accessibility, setAccessibility] = useState<Accessibility>(() => loadAccessibility())
  const [view, setView] = useState<ViewId>('overview')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [selected, setSelected] = useState<FpaFunction | null>(null)
  const [creating, setCreating] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftType, setDraftType] = useState<FunctionType>('EI')
  const [draftComplexity, setDraftComplexity] = useState<Complexity>('Media')
  const [importBusy, setImportBusy] = useState(false)
  const [importNotes, setImportNotes] = useState<string[]>([])
  const toastId = useRef(0)

  const project = state.projects.find((item) => item.id === state.activeProjectId) ?? state.projects[0]

  // --- Persistencia ---
  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    saveAccessibility(accessibility)
  }, [accessibility])

  // --- Preferencias aplicadas al documento ---
  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolved =
        accessibility.theme === 'system' ? (media.matches ? 'dark' : 'light') : accessibility.theme
      root.dataset.theme = resolved
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [accessibility.theme])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--ui-scale', String(accessibility.scale))
    root.dataset.contrast = accessibility.contrast
    root.dataset.typeface = accessibility.typeface
    root.dataset.motion = accessibility.reduceMotion ? 'reduced' : 'full'
  }, [accessibility])

  const notify = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    toastId.current += 1
    const id = toastId.current
    setToasts((current) => [...current, { id, message, tone }])
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 3600)
  }, [])

  const patchProject = useCallback((patch: Partial<Project> | ((current: Project) => Partial<Project>)) => {
    setState((current) => ({
      ...current,
      projects: current.projects.map((item) =>
        item.id === current.activeProjectId
          ? { ...item, ...(typeof patch === 'function' ? patch(item) : patch) }
          : item,
      ),
    }))
  }, [])

  const estimation = useMemo(
    () => estimate(project.functions, project.values, project.influence),
    [project.functions, project.values, project.influence],
  )

  const slices = useMemo(
    () =>
      FUNCTION_TYPES.map((type) => {
        const matching = project.functions.filter((item) => item.type === type)
        return {
          type,
          count: matching.length,
          points: matching.reduce((sum, item) => sum + item.points, 0),
        }
      }),
    [project.functions],
  )

  // --- Acciones sobre funciones ---
  function createFunction() {
    const title = draftTitle.trim() || 'Nueva función de negocio'
    const item: FpaFunction = {
      id: `FN-${String(100 + project.functions.length + 1).padStart(3, '0')}`,
      title,
      description: '',
      type: draftType,
      issue: 'Sin asignar',
      complexity: draftComplexity,
      det: 0,
      ret: 0,
      ftr: 0,
      points: pointsFor(draftType, draftComplexity, project.values.pointMatrix),
      origin: 'Manual',
      sourceUrl: '',
      confidence: 58,
      status: 'Borrador',
    }
    patchProject((current) => ({ functions: [item, ...current.functions] }))
    setCreating(false)
    setDraftTitle('')
    notify('Función agregada al análisis', 'success')
  }

  function saveFunction(next: FpaFunction) {
    patchProject((current) => ({
      functions: current.functions.map((item) => (item.id === next.id ? next : item)),
    }))
    setSelected(null)
    notify('Función actualizada', 'success')
  }

  function deleteFunction(id: string) {
    patchProject((current) => ({ functions: current.functions.filter((item) => item.id !== id) }))
    setSelected(null)
    notify('Función removida del análisis')
  }

  // --- Importación ---
  async function handleFiles(files: FileList) {
    setImportBusy(true)
    const notes: string[] = []
    const imported: FpaFunction[] = []
    for (const file of Array.from(files)) {
      try {
        const result = await parseFile(file, project.values.pointMatrix)
        if (!result.functions.length) {
          notes.push(`${file.name}: sin funciones reconocibles`)
          continue
        }
        imported.push(...result.functions)
        notes.push(`${file.name}: ${result.functions.length} funciones (${result.origin})`)
        notes.push(...result.notes)
      } catch (error) {
        notes.push(`${file.name}: ${error instanceof Error ? error.message : 'no se pudo leer'}`)
      }
    }
    setImportNotes(notes)
    setImportBusy(false)
    if (!imported.length) {
      notify('No se encontraron funciones importables', 'warn')
      return
    }
    const existing = new Set(project.functions.map((item) => item.id))
    const deduped = imported.map((item, index) =>
      existing.has(item.id) ? { ...item, id: `${item.id}-${index + 1}` } : item,
    )
    patchProject((current) => ({ functions: [...deduped, ...current.functions] }))
    notify(`${deduped.length} funciones importadas localmente`, 'success')
    setView('functions')
  }

  // --- Exportar / restaurar ---
  function exportAnalysis() {
    const payload = {
      exportedAt: new Date().toISOString(),
      zeroDataPolicy: true,
      project,
      estimation,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ohmyfpa-${project.name.toLocaleLowerCase().replace(/\s+/g, '-')}.json`
    link.click()
    URL.revokeObjectURL(url)
    notify('Análisis exportado como JSON local', 'success')
  }

  async function importAnalysis(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as { project?: Project }
      if (!parsed.project?.functions) throw new Error('El archivo no contiene un proyecto válido')
      const restored: Project = { ...parsed.project, id: createProject('tmp').id }
      setState((current) => ({
        ...current,
        projects: [...current.projects, restored],
        activeProjectId: restored.id,
      }))
      notify(`Proyecto «${restored.name}» restaurado`, 'success')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'No se pudo leer el archivo', 'warn')
    }
  }

  function wipeStorage() {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(PREFS_KEY)
    setState(loadState())
    setAccessibility(DEFAULT_ACCESSIBILITY)
    notify('Almacenamiento local borrado', 'success')
  }

  function cycleTheme() {
    const order: Accessibility['theme'][] = ['light', 'dark', 'system']
    const next = order[(order.indexOf(accessibility.theme) + 1) % order.length]
    setAccessibility((current) => ({ ...current, theme: next }))
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      notify(`${label} copiada al portapapeles`, 'success')
    } catch {
      notify('El navegador bloqueó el portapapeles', 'warn')
    }
  }

  function navigate(next: ViewId) {
    setView(next)
    setMobileOpen(false)
  }

  if (!state.onboarded) {
    return (
      <Onboarding
        onFinish={({ name, client }) => {
          setState((current) => ({
            ...current,
            onboarded: true,
            projects: current.projects.map((item) =>
              item.id === current.activeProjectId ? { ...item, name, client } : item,
            ),
          }))
        }}
        onOpenImports={() => setView('imports')}
      />
    )
  }

  return (
    <div className="shell" data-collapsed={collapsed} data-mobile-open={mobileOpen}>
      <Sidebar
        view={view}
        onNavigate={navigate}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        projects={state.projects}
        activeProject={project}
        onSelectProject={(id) => setState((current) => ({ ...current, activeProjectId: id }))}
        onCreateProject={() => {
          const next = createProject(`Proyecto ${state.projects.length + 1}`)
          setState((current) => ({
            ...current,
            projects: [...current.projects, next],
            activeProjectId: next.id,
          }))
          setView('settings')
          notify('Proyecto creado', 'success')
        }}
        onDeleteProject={(id) => {
          setState((current) => {
            const projects = current.projects.filter((item) => item.id !== id)
            return {
              ...current,
              projects,
              activeProjectId: projects[0]?.id ?? current.activeProjectId,
            }
          })
          notify('Proyecto eliminado')
        }}
        functionsCount={project.functions.length}
        theme={accessibility.theme}
        onCycleTheme={cycleTheme}
        onExport={exportAnalysis}
        showMcp={SHOW_MCP}
      />

      {mobileOpen ? (
        <button className="rail-scrim" type="button" aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} />
      ) : null}

      <button
        className="rail-fab"
        type="button"
        aria-label="Abrir menú"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <PanelLeft size={18} />
      </button>

      <main className="main">
        {view === 'overview' ? (
          <Overview
            project={project}
            slices={slices}
            estimation={estimation}
            onDevelopersChange={(developers) =>
              patchProject((current) => ({ values: { ...current.values, developers } }))
            }
            onNavigate={navigate}
          />
        ) : null}

        {view === 'functions' ? (
          <Functions functions={project.functions} onOpen={setSelected} onCreate={() => setCreating(true)} />
        ) : null}

        {view === 'imports' ? (
          <Imports onFiles={handleFiles} busy={importBusy} lastNotes={importNotes} />
        ) : null}

        {view === 'influence' ? (
          <Influence
            influence={project.influence}
            estimation={estimation}
            onChange={(id, grade) =>
              patchProject((current) => ({ influence: { ...current.influence, [id]: clampGrade(grade) } }))
            }
            onReset={() => {
              patchProject({ influence: emptyInfluence() })
              notify('Grados de influencia reiniciados')
            }}
          />
        ) : null}

        {view === 'values' ? (
          <Values
            values={project.values}
            onChange={(patch) => patchProject((current) => ({ values: { ...current.values, ...patch } }))}
            onMatrixChange={(type, complexity, value) =>
              patchProject((current) => {
                const pointMatrix = {
                  ...current.values.pointMatrix,
                  [type]: { ...current.values.pointMatrix[type], [complexity]: value },
                }
                return {
                  values: { ...current.values, pointMatrix },
                  functions: current.functions.map((item) => ({
                    ...item,
                    points: pointsFor(item.type, item.complexity, pointMatrix),
                  })),
                }
              })
            }
            onResetMatrix={() => {
              patchProject((current) => ({
                values: { ...current.values, pointMatrix: DEFAULT_MATRIX },
                functions: current.functions.map((item) => ({
                  ...item,
                  points: pointsFor(item.type, item.complexity, DEFAULT_MATRIX),
                })),
              }))
              notify('Matriz restaurada al baseline IFPUG', 'success')
            }}
          />
        ) : null}

        {view === 'estimation' ? (
          <Estimation
            project={project}
            estimation={estimation}
            onCostsChange={(otherCosts: CostItem[]) =>
              patchProject((current) => ({ values: { ...current.values, otherCosts } }))
            }
          />
        ) : null}

        {view === 'settings' ? (
          <Settings
            project={project}
            accessibility={accessibility}
            onAccessibilityChange={(patch) => setAccessibility((current) => ({ ...current, ...patch }))}
            onProjectChange={(patch) => patchProject(patch)}
            onExport={exportAnalysis}
            onImportState={importAnalysis}
            onWipe={wipeStorage}
            onCopy={copyText}
            showMcpLink={SHOW_MCP}
            onOpenMcp={() => setView('mcp')}
          />
        ) : null}

        {view === 'docs' ? <Docs /> : null}

        {view === 'mcp' && SHOW_MCP ? <Mcp mode={DEPLOY_MODE} onCopy={copyText} /> : null}
      </main>

      {selected ? (
        <FunctionModal
          item={selected}
          matrix={project.values.pointMatrix}
          onSave={saveFunction}
          onDelete={deleteFunction}
          onClose={() => setSelected(null)}
        />
      ) : null}

      {creating ? (
        <Modal
          kicker="Nuevo elemento"
          title="Agregar función"
          onClose={() => setCreating(false)}
          footer={
            <>
              <span className="muted">Podés ajustar DET, RET y FTR después.</span>
              <button className="btn btn--primary" type="button" onClick={createFunction}>
                Crear función
              </button>
            </>
          }
        >
          <Field label="Nombre del requisito o función">
            <input
              className="input"
              autoFocus
              value={draftTitle}
              placeholder="Ej. Registrar cliente"
              onChange={(event) => setDraftTitle(event.target.value)}
            />
          </Field>
          <Field label="Tipo de función" hint={TYPE_META[draftType].description}>
            <select
              className="select"
              value={draftType}
              onChange={(event) => setDraftType(event.target.value as FunctionType)}
            >
              {FUNCTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type} · {TYPE_META[type].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Complejidad inicial">
            <select
              className="select"
              value={draftComplexity}
              onChange={(event) => setDraftComplexity(event.target.value as Complexity)}
            >
              {COMPLEXITIES.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </Field>
        </Modal>
      ) : null}

      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div className={`toast toast--${toast.tone}`} key={toast.id}>
            {toast.tone === 'success' ? (
              <Check size={15} />
            ) : toast.tone === 'warn' ? (
              <TriangleAlert size={15} />
            ) : (
              <Info size={15} />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}
