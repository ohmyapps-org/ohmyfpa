import { useState } from 'react'
import {
  Accessibility as AccessibilityIcon,
  Bot,
  Contrast,
  Copy,
  Database,
  Download,
  FolderKanban,
  Monitor,
  Moon,
  Palette,
  Plug,
  ShieldCheck,
  Sun,
  Trash2,
  Type,
} from 'lucide-react'
import { SectionBar } from '../components/SectionBar'
import { Field, Kicker, NumberField, Segmented, Switch } from '../components/ui'
import type { Accessibility, Project, ThemeMode, TypefaceMode } from '../lib/types'

const AGENTS: { id: string; name: string; hint: string; config: string }[] = [
  {
    id: 'claude',
    name: 'Claude / Claude Code',
    hint: 'claude_desktop_config.json o .mcp.json',
    config: `{
  "mcpServers": {
    "ohmyfpa": {
      "command": "bun",
      "args": ["run", "mcp-server/index.ts"],
      "env": { "OHMYFPA_DATA": "/ruta/ohmyfpa-analysis.json" }
    }
  }
}`,
  },
  {
    id: 'openai',
    name: 'ChatGPT / OpenAI',
    hint: 'Developer mode · MCP server stdio',
    config: `{
  "mcp_servers": [
    {
      "name": "ohmyfpa",
      "transport": "stdio",
      "command": "bun",
      "args": ["run", "mcp-server/index.ts"]
    }
  ]
}`,
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    hint: 'settings.json · mcpServers',
    config: `{
  "mcpServers": {
    "ohmyfpa": { "command": "bun", "args": ["run", "mcp-server/index.ts"] }
  }
}`,
  },
  {
    id: 'hermes',
    name: 'Hermes Agent',
    hint: 'WeFaber · agente propio',
    config: `[tools.mcp.ohmyfpa]
command = "bun"
args = ["run", "mcp-server/index.ts"]
transport = "stdio"`,
  },
  {
    id: 'compatible',
    name: 'OpenAI Compatible',
    hint: 'Cualquier cliente con soporte MCP stdio',
    config: `{
  "name": "ohmyfpa",
  "transport": "stdio",
  "command": "bun",
  "args": ["run", "mcp-server/index.ts"]
}`,
  },
]

export function Settings({
  project,
  accessibility,
  onAccessibilityChange,
  onProjectChange,
  onExport,
  onImportState,
  onWipe,
  onCopy,
  showMcpLink,
  onOpenMcp,
}: {
  project: Project
  accessibility: Accessibility
  onAccessibilityChange: (patch: Partial<Accessibility>) => void
  onProjectChange: (patch: Partial<Project>) => void
  onExport: () => void
  onImportState: (file: File) => void
  onWipe: () => void
  onCopy: (text: string, label: string) => void
  showMcpLink: boolean
  onOpenMcp: () => void
}) {
  const [section, setSection] = useState('general')
  const [agent, setAgent] = useState(AGENTS[0].id)
  const activeAgent = AGENTS.find((item) => item.id === agent) ?? AGENTS[0]

  return (
    <div className="view">
      <SectionBar
        label="Secciones de configuración"
        active={section}
        onChange={setSection}
        sections={[
          { id: 'general', label: 'General', icon: <FolderKanban size={13} /> },
          { id: 'apariencia', label: 'Apariencia', icon: <AccessibilityIcon size={13} /> },
          { id: 'agente', label: 'Agente AI', icon: <Bot size={13} /> },
          { id: 'datos', label: 'Datos', icon: <Database size={13} /> },
        ]}
      />

      <header className="view-head">
        <div className="view-head__text">
          <Kicker>Preferencias locales</Kicker>
          <h1>Configuración</h1>
        </div>
      </header>

      {section === 'general' ? (
        <section className="panel">
          <div className="field-grid">
            <Field label="Nombre del proyecto">
              <input
                className="input"
                value={project.name}
                onChange={(event) => onProjectChange({ name: event.target.value })}
              />
            </Field>
            <Field label="Cliente o área">
              <input
                className="input"
                value={project.client}
                onChange={(event) => onProjectChange({ client: event.target.value })}
              />
            </Field>
          </div>
          <div className="note">
            <ShieldCheck size={14} />
            <span>
              El análisis vive únicamente en este navegador. Los términos de uso detallan el alcance de la Zero Data
              Policy.
            </span>
          </div>
        </section>
      ) : null}

      {section === 'apariencia' ? (
        <div className="settings-grid">
          <section className="panel">
            <div className="panel__head">
              <div>
                <Kicker>Tema</Kicker>
                <h2>Claro, oscuro o del sistema</h2>
              </div>
              <Palette size={16} className="muted-icon" />
            </div>
            <Field label="Tema" hint="«Sistema» sigue la preferencia del sistema operativo.">
              <Segmented<ThemeMode>
                label="Tema"
                value={accessibility.theme}
                onChange={(theme) => onAccessibilityChange({ theme })}
                options={[
                  { value: 'light', label: 'Claro', icon: <Sun size={13} /> },
                  { value: 'dark', label: 'Oscuro', icon: <Moon size={13} /> },
                  { value: 'system', label: 'Sistema', icon: <Monitor size={13} /> },
                ]}
              />
            </Field>
          </section>

          <section className="panel">
            <div className="panel__head">
              <div>
                <Kicker>Lectura</Kicker>
                <h2>Escala y tipografía</h2>
              </div>
            </div>
            <Field label="Escala de interfaz" hint="Multiplica el tamaño base de todo el UI (80% a 160%).">
              <NumberField
                label="Escala de interfaz"
                value={Math.round(accessibility.scale * 100)}
                min={80}
                max={160}
                step={5}
                suffix="%"
                onChange={(value) => onAccessibilityChange({ scale: value / 100 })}
              />
            </Field>
            <Field label="Tipografía" hint="«Legible» fija una familia de alta legibilidad y más interletrado.">
              <Segmented<TypefaceMode>
                label="Tipografía"
                value={accessibility.typeface}
                onChange={(typeface) => onAccessibilityChange({ typeface })}
                options={[
                  { value: 'brand', label: 'DM Sans', icon: <Type size={13} /> },
                  { value: 'system', label: 'Sistema' },
                  { value: 'readable', label: 'Legible' },
                ]}
              />
            </Field>
          </section>

          <section className="panel">
            <div className="panel__head">
              <div>
                <Kicker>Percepción</Kicker>
                <h2>Contraste y movimiento</h2>
              </div>
              <Contrast size={16} className="muted-icon" />
            </div>
            <Switch
              title="Alto contraste"
              description="Superficies opacas, bordes fuertes y sin transparencias."
              checked={accessibility.contrast === 'high'}
              onChange={(checked) => onAccessibilityChange({ contrast: checked ? 'high' : 'normal' })}
            />
            <Switch
              title="Reducir movimiento"
              description="Desactiva transiciones y animaciones de entrada."
              checked={accessibility.reduceMotion}
              onChange={(reduceMotion) => onAccessibilityChange({ reduceMotion })}
            />
          </section>
        </div>
      ) : null}

      {section === 'agente' ? (
        <div className="settings-grid">
          <section className="panel">
            <div className="panel__head">
              <div>
                <Kicker>Model Context Protocol</Kicker>
                <h2>Conectar tu agente</h2>
                <p className="muted">
                  El servidor corre en tu máquina por stdio. No abre puertos ni envía prompts a ningún servicio.
                </p>
              </div>
              <Plug size={16} className="muted-icon" />
            </div>
            <div className="agent-grid">
              {AGENTS.map((item) => (
                <button
                  key={item.id}
                  className="agent-card"
                  type="button"
                  aria-pressed={item.id === agent}
                  onClick={() => setAgent(item.id)}
                >
                  <strong>{item.name}</strong>
                  <span>{item.hint}</span>
                </button>
              ))}
            </div>
            <pre className="code-block">
              <code>{activeAgent.config}</code>
            </pre>
            <div className="view-head__actions">
              <button
                className="btn btn--sm"
                type="button"
                onClick={() => onCopy(activeAgent.config, `Configuración de ${activeAgent.name}`)}
              >
                <Copy size={13} />
                Copiar configuración
              </button>
              {showMcpLink ? (
                <button className="btn btn--sm btn--ghost" type="button" onClick={onOpenMcp}>
                  <Bot size={13} />
                  Ver herramientas expuestas
                </button>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {section === 'datos' ? (
        <div className="settings-grid">
          <section className="panel">
            <div className="panel__head">
              <div>
                <Kicker>Portabilidad</Kicker>
                <h2>Exportar e importar</h2>
              </div>
            </div>
            <button className="btn" type="button" onClick={onExport}>
              <Download size={14} />
              Exportar análisis (JSON)
            </button>
            <label className="btn" style={{ display: 'inline-flex' }}>
              <Database size={14} />
              Restaurar desde JSON
              <input
                className="visually-hidden"
                type="file"
                accept=".json"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) onImportState(file)
                  event.target.value = ''
                }}
              />
            </label>
          </section>

          <section className="panel">
            <div className="panel__head">
              <div>
                <Kicker>Zona sensible</Kicker>
                <h2>Borrar datos locales</h2>
                <p className="muted">Elimina proyectos, funciones y preferencias de este navegador.</p>
              </div>
            </div>
            <button className="btn btn--danger" type="button" onClick={onWipe}>
              <Trash2 size={14} />
              Borrar todo el almacenamiento local
            </button>
          </section>
        </div>
      ) : null}
    </div>
  )
}
