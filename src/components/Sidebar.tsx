import { useRef, useState } from 'react'
import {
  BarChart3,
  Bot,
  Boxes,
  BookOpen,
  Check,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileInput,
  FolderKanban,
  Gauge,
  Moon,
  Network,
  Plus,
  Settings2,
  SlidersHorizontal,
  Sun,
  Trash2,
  Wallet,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { Project, ThemeMode, ViewId } from '../lib/types'
import { useDismiss } from '../hooks/useDismiss'

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>

const NAV_ITEMS: { id: ViewId; label: string; icon: Icon }[] = [
  { id: 'overview', label: 'Resumen', icon: BarChart3 },
  { id: 'functions', label: 'Funciones', icon: Boxes },
  { id: 'imports', label: 'Importaciones', icon: FileInput },
  { id: 'influence', label: 'Influencia', icon: Gauge },
  { id: 'values', label: 'Valores FPA', icon: SlidersHorizontal },
  { id: 'estimation', label: 'Estimación', icon: Wallet },
]

export function Sidebar({
  view,
  onNavigate,
  collapsed,
  onToggleCollapse,
  projects,
  activeProject,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  functionsCount,
  theme,
  onCycleTheme,
  onExport,
  showMcp,
}: {
  view: ViewId
  onNavigate: (view: ViewId) => void
  collapsed: boolean
  onToggleCollapse: () => void
  projects: Project[]
  activeProject: Project
  onSelectProject: (id: string) => void
  onCreateProject: () => void
  onDeleteProject: (id: string) => void
  functionsCount: number
  theme: ThemeMode
  onCycleTheme: () => void
  onExport: () => void
  showMcp: boolean
}) {
  const [projectsOpen, setProjectsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const projectRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useDismiss(projectRef, projectsOpen, () => setProjectsOpen(false))
  useDismiss(profileRef, profileOpen, () => setProfileOpen(false))

  function go(next: ViewId) {
    onNavigate(next)
    setProfileOpen(false)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__top">
        <div className="brand">
          <span className="brand__mark">
            <Network size={18} />
          </span>
          <span className="brand__text">
            <strong>OhMyFPA</strong>
            <span>by WeFaber</span>
          </span>
        </div>
        <button
          className="rail-toggle"
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>

      <div className="project-switch" ref={projectRef}>
        <button
          className="project-switch__trigger"
          type="button"
          aria-expanded={projectsOpen}
          aria-haspopup="menu"
          onClick={() => setProjectsOpen(!projectsOpen)}
          title={activeProject.name}
        >
          <span className="project-switch__icon">
            <FolderKanban size={15} />
          </span>
          <span className="project-switch__body">
            <span>Proyecto</span>
            <strong>{activeProject.name}</strong>
          </span>
        </button>
        {projectsOpen ? (
          <div className="popover popover--down" role="menu">
            <p className="popover__label">Proyectos</p>
            {projects.map((project) => (
              <button
                key={project.id}
                className="popover__item"
                type="button"
                role="menuitem"
                aria-current={project.id === activeProject.id}
                onClick={() => {
                  onSelectProject(project.id)
                  setProjectsOpen(false)
                }}
              >
                {project.id === activeProject.id ? <Check size={14} /> : <FolderKanban size={14} />}
                {project.name}
                <small>{project.functions.length} fn</small>
              </button>
            ))}
            <div className="popover__sep" />
            <button
              className="popover__item"
              type="button"
              role="menuitem"
              onClick={() => {
                onCreateProject()
                setProjectsOpen(false)
              }}
            >
              <Plus size={14} />
              Nuevo proyecto
            </button>
            {projects.length > 1 ? (
              <button
                className="popover__item"
                type="button"
                role="menuitem"
                onClick={() => {
                  onDeleteProject(activeProject.id)
                  setProjectsOpen(false)
                }}
              >
                <Trash2 size={14} />
                Eliminar «{activeProject.name}»
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <nav className="sidebar__scroll" aria-label="Secciones del workspace">
        <p className="nav-caption">Workspace</p>
        {NAV_ITEMS.map(({ id, label, icon: ItemIcon }) => (
          <button
            key={id}
            className="nav-item"
            type="button"
            aria-current={view === id ? 'page' : undefined}
            onClick={() => onNavigate(id)}
            title={collapsed ? label : undefined}
          >
            <ItemIcon size={16} />
            <span className="nav-item__label">{label}</span>
            {id === 'functions' ? <span className="nav-count">{functionsCount}</span> : null}
          </button>
        ))}

        {showMcp ? (
          <>
            <p className="nav-caption">Entorno local</p>
            <button
              className="nav-item"
              type="button"
              aria-current={view === 'mcp' ? 'page' : undefined}
              onClick={() => onNavigate('mcp')}
              title={collapsed ? 'MCP Server' : undefined}
            >
              <Bot size={16} />
              <span className="nav-item__label">MCP Server</span>
            </button>
          </>
        ) : null}
      </nav>

      <div className="sidebar__bottom">
        <div className="profile" ref={profileRef}>
          <button
            className="profile__trigger"
            type="button"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            onClick={() => setProfileOpen(!profileOpen)}
            title="Perfil y atajos"
          >
            <span className="avatar">FP</span>
            <span className="profile__body">
              <strong>Facundo Presa</strong>
              <span>Owner · local</span>
            </span>
          </button>
          {profileOpen ? (
            <div className="popover popover--up" role="menu">
              <p className="popover__label">Atajos</p>
              <button className="popover__item" type="button" role="menuitem" onClick={() => go('settings')}>
                <Settings2 size={14} />
                Configuración
              </button>
              <button className="popover__item" type="button" role="menuitem" onClick={() => go('docs')}>
                <BookOpen size={14} />
                Documentación
              </button>
              <button
                className="popover__item"
                type="button"
                role="menuitem"
                onClick={() => {
                  onExport()
                  setProfileOpen(false)
                }}
              >
                <Download size={14} />
                Exportar análisis
              </button>
              <div className="popover__sep" />
              <button
                className="popover__item"
                type="button"
                role="menuitem"
                onClick={() => {
                  onCycleTheme()
                }}
              >
                {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                Tema
                <small>{theme === 'system' ? 'sistema' : theme === 'dark' ? 'oscuro' : 'claro'}</small>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
