import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export type Section = { id: string; label: string; icon?: ReactNode }

/**
 * Navegación flotante que solo aparece cuando la vista tiene subsecciones.
 * El indicador se mide sobre el botón activo, así que la animación sigue al texto real.
 */
export function SectionBar({
  sections,
  active,
  onChange,
  label,
}: {
  sections: Section[]
  active: string
  onChange: (id: string) => void
  label: string
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)

  const measure = useCallback(() => {
    const container = listRef.current
    if (!container) return
    const target = container.querySelector<HTMLElement>(`[data-section="${CSS.escape(active)}"]`)
    if (!target) return
    setPill({ left: target.offsetLeft, width: target.offsetWidth })
  }, [active])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  if (sections.length < 2) return null

  return (
    <div className="sectionbar" role="tablist" aria-label={label} ref={listRef}>
      {pill ? (
        <span
          className="sectionbar__pill"
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: pill.left,
            width: pill.width,
            top: '0.3125rem',
            bottom: '0.3125rem',
            transition: 'left var(--speed) var(--ease), width var(--speed) var(--ease)',
          }}
        />
      ) : null}
      {sections.map((section) => (
        <button
          key={section.id}
          className="sectionbar__item"
          type="button"
          role="tab"
          data-section={section.id}
          aria-current={section.id === active}
          aria-selected={section.id === active}
          onClick={() => onChange(section.id)}
        >
          {section.icon}
          {section.label}
        </button>
      ))}
    </div>
  )
}
