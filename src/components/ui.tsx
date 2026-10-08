import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'

export function Kicker({ children }: { children: ReactNode }) {
  return <span className="kicker">{children}</span>
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint ? <small className="field__hint">{hint}</small> : null}
    </label>
  )
}

/** Input numérico con steppers propios: las flechas nativas están ocultas en base.css. */
export function NumberField({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  suffix,
  label,
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  label: string
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, Number(next.toFixed(4))))
  return (
    <div className="numfield">
      <input
        className="numfield__input"
        type="number"
        inputMode="decimal"
        aria-label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const next = Number(event.target.value)
          if (Number.isFinite(next)) onChange(clamp(next))
        }}
      />
      {suffix ? <span className="numfield__suffix">{suffix}</span> : null}
      <span className="numfield__steppers">
        <button
          className="numfield__step"
          type="button"
          aria-label={`Aumentar ${label}`}
          disabled={value >= max}
          onClick={() => onChange(clamp(value + step))}
        >
          <ChevronUp size={12} strokeWidth={2.5} />
        </button>
        <button
          className="numfield__step"
          type="button"
          aria-label={`Disminuir ${label}`}
          disabled={value <= min}
          onClick={() => onChange(clamp(value - step))}
        >
          <ChevronDown size={12} strokeWidth={2.5} />
        </button>
      </span>
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  title: string
  description?: string
}) {
  return (
    <button className="switch" type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}>
      <span className="switch__text">
        <strong>{title}</strong>
        {description ? <span>{description}</span> : null}
      </span>
      <span className="switch__track">
        <span className="switch__thumb" />
      </span>
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string; icon?: ReactNode }[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          className="segmented__item"
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Modal({
  title,
  kicker,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string
  kicker?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  const titleId = useId()
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    cardRef.current?.focus()
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="modal-scrim"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={wide ? 'modal modal--wide' : 'modal'}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={cardRef}
        tabIndex={-1}
      >
        <div className="modal__head">
          <div>
            {kicker ? <Kicker>{kicker}</Kicker> : null}
            <h2 id={titleId}>{title}</h2>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Cerrar">
            <X size={17} />
          </button>
        </div>
        {children}
        {footer ? <div className="modal__foot">{footer}</div> : null}
      </div>
    </div>
  )
}

export function Empty({ icon, title, hint }: { icon: ReactNode; title: string; hint: string }) {
  return (
    <div className="empty">
      {icon}
      <strong>{title}</strong>
      <span>{hint}</span>
    </div>
  )
}
