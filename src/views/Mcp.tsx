import { Bot, Copy, Network, ShieldCheck, Terminal } from 'lucide-react'
import { Kicker } from '../components/ui'

const TOOLS: [string, string][] = [
  ['analyze_function', 'Clasifica un requisito en EI, EO, EQ, ALI o AIE con heurísticas locales.'],
  ['calculate_effort', 'Calcula horas, duración y costo desde PF, developers y valores del proyecto.'],
  ['list_functions', 'Devuelve el inventario del análisis local configurado en OHMYFPA_DATA.'],
  ['import_ieee830', 'Extrae funciones candidatas desde texto de requisitos, sin red.'],
  ['adjust_points', 'Aplica los 14 niveles de influencia y devuelve PFA, TDI y VAF.'],
]

export function Mcp({ mode, onCopy }: { mode: string; onCopy: (text: string, label: string) => void }) {
  const command = 'bun run mcp-server/index.ts'
  return (
    <div className="view">
      <header className="view-head">
        <div className="view-head__text">
          <Kicker>Entorno {mode}</Kicker>
          <h1>MCP Server</h1>
          <p className="muted">
            Esta sección solo existe en desarrollo y self-host. En producción la conexión del agente vive en
            Configuración → Agente AI.
          </p>
        </div>
      </header>

      <div className="split-2">
        <section className="panel">
          <div className="panel__head">
            <div>
              <Kicker>Ejecución local</Kicker>
              <h2>Arrancar el servidor</h2>
            </div>
            <Bot size={16} className="muted-icon" />
          </div>
          <div className="formula">
            <Terminal size={14} />
            <b>{command}</b>
          </div>
          <button className="btn btn--sm" type="button" onClick={() => onCopy(command, 'Comando del servidor')}>
            <Copy size={13} />
            Copiar comando
          </button>
          <div className="note">
            <ShieldCheck size={14} />
            <span>
              Transporte stdio: sin listener HTTP, sin telemetría y sin prompts persistidos. Apagarlo no afecta al
              análisis.
            </span>
          </div>
        </section>

        <section className="panel">
          <div className="panel__head">
            <div>
              <Kicker>Capacidades</Kicker>
              <h2>Herramientas expuestas</h2>
            </div>
            <Network size={16} className="muted-icon" />
          </div>
          {TOOLS.map(([name, hint]) => (
            <div className="tool-row" key={name}>
              <span className="tool-row__symbol">ƒ</span>
              <span className="tool-row__body">
                <strong>{name}</strong>
                <span>{hint}</span>
              </span>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
