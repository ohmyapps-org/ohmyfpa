import { useMemo, useState } from 'react'
import { ExternalLink, Filter, Plus, Search } from 'lucide-react'
import { Empty, Kicker } from '../components/ui'
import { FUNCTION_TYPES, TYPE_META } from '../lib/fpa'
import type { FpaFunction, FunctionType } from '../lib/types'

type StatusFilter = 'Todos' | FpaFunction['status']

export function Functions({
  functions,
  onOpen,
  onCreate,
}: {
  functions: FpaFunction[]
  onOpen: (item: FpaFunction) => void
  onCreate: () => void
}) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<FunctionType | 'Todas'>('Todas')
  const [status, setStatus] = useState<StatusFilter>('Todos')

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return functions.filter((item) => {
      if (type !== 'Todas' && item.type !== type) return false
      if (status !== 'Todos' && item.status !== status) return false
      if (!needle) return true
      return `${item.id} ${item.title} ${item.issue} ${item.description}`.toLocaleLowerCase().includes(needle)
    })
  }, [functions, query, type, status])

  return (
    <div className="view">
      <header className="view-head">
        <div className="view-head__text">
          <Kicker>Inventario FPA</Kicker>
          <h1>Funciones del análisis</h1>
          <p className="muted">Clasificá y auditá cada función antes de consolidar la estimación.</p>
        </div>
        <div className="view-head__actions">
          <button className="btn btn--primary" type="button" onClick={onCreate}>
            <Plus size={15} />
            Nueva función
          </button>
        </div>
      </header>

      <section className="panel">
        <div className="toolbar">
          <label className="search">
            <Search size={14} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por función, issue o ID"
              aria-label="Buscar funciones"
            />
          </label>
          <label className="field" style={{ minWidth: '10rem' }}>
            <span className="visually-hidden">Filtrar por tipo</span>
            <select
              className="select"
              value={type}
              onChange={(event) => setType(event.target.value as FunctionType | 'Todas')}
            >
              <option value="Todas">Todos los tipos</option>
              {FUNCTION_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item} · {TYPE_META[item].label}
                </option>
              ))}
            </select>
          </label>
          <label className="field" style={{ minWidth: '8.5rem' }}>
            <span className="visually-hidden">Filtrar por estado</span>
            <select
              className="select"
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
            >
              <option value="Todos">Todos los estados</option>
              <option value="Listo">Listo</option>
              <option value="Revisar">Revisar</option>
              <option value="Borrador">Borrador</option>
            </select>
          </label>
          <span className="status">
            <Filter size={12} />
            {filtered.length} de {functions.length}
          </span>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Función</th>
                <th>Tipo</th>
                <th>Issue / origen</th>
                <th>Complejidad</th>
                <th>DET · RET/FTR</th>
                <th>PF</th>
                <th>Confianza</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onOpen(item)}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onOpen(item)
                    }
                  }}
                >
                  <td>
                    <span className="cell-title">
                      <strong>{item.title}</strong>
                      <span>{item.id}</span>
                    </span>
                  </td>
                  <td>
                    <span className="type-pill" style={{ color: TYPE_META[item.type].hue }}>
                      {item.type}
                    </span>
                  </td>
                  <td>
                    <span className="cell-title">
                      <strong style={{ fontWeight: 500 }}>{item.issue}</strong>
                      <span>
                        {item.origin}
                        {item.sourceUrl ? <ExternalLink size={10} style={{ marginLeft: 4 }} /> : null}
                      </span>
                    </span>
                  </td>
                  <td>{item.complexity}</td>
                  <td className="cell-num">
                    {item.det || '—'} · {(item.type === 'ILF' || item.type === 'EIF' ? item.ret : item.ftr) || '—'}
                  </td>
                  <td className="cell-num">
                    <strong>{item.points}</strong>
                  </td>
                  <td>
                    <span className="meter">
                      <span className="meter__track">
                        <span className="meter__fill" style={{ width: `${item.confidence}%` }} />
                      </span>
                      <small>{item.confidence}%</small>
                    </span>
                  </td>
                  <td>
                    <span className={`status status--${item.status.toLocaleLowerCase()}`}>
                      <i />
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <Empty
              icon={<Search size={22} />}
              title="No hay funciones que coincidan"
              hint="Probá otro filtro o importá una fuente local desde Importaciones."
            />
          ) : null}
        </div>
      </section>
    </div>
  )
}
