import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { isValidIsoDate, maxStartDate, today, validateDateRange } from '@/lib/trip'
import { cn } from '@/lib/utils'

/**
 * Accessible date input that:
 * 1. Opens the native calendar picker when clicked anywhere on the field/label (`showPicker()`).
 * 2. Allows manual keyboard date entry without clobbering intermediate keystrokes (e.g. typing a 4-digit year).
 * 3. Validates against `min` (default `today()`) and `max` (default `maxStartDate()`), preventing previous dates
 *    from being selected or submitted via calendar or manual typing.
 */
export function DateInput({
  value,
  min = today(),
  max = maxStartDate(),
  onChange,
  onErrorChange,
  fieldLabel = 'Pick-up date',
  showInlineError = true,
  className,
  onClick,
  onBlur,
  onKeyDown,
  ...props
}) {
  const inputRef = useRef(null)
  const [draft, setDraft] = useState(null)
  const [error, setError] = useState(null)
  const displayValue = draft ?? value

  const openPicker = () => {
    try {
      inputRef.current?.showPicker?.()
    } catch {
      // Fallback for browsers or programmatic clicks where showPicker is unsupported
    }
  }

  const updateError = (nextErr) => {
    setError(nextErr)
    onErrorChange?.(nextErr)
  }

  const commitOrClamp = (rawValue, notifyToast = true) => {
    const err = validateDateRange(rawValue, min, max, fieldLabel)
    if (!err) {
      setDraft(null)
      updateError(null)
      if (rawValue !== value) onChange?.(rawValue)
      return true
    }

    const clamped = rawValue && isValidIsoDate(rawValue) && rawValue > max ? max : min
    if (notifyToast) toast.error(err)
    setDraft(null)
    updateError(null)
    if (clamped !== value) onChange?.(clamped)
    return false
  }

  const handleChange = (e) => {
    const raw = e.target.value

    // Allow intermediate typing while subfields are incomplete or year is being typed (0002 -> 0020 -> 0202 -> 2026)
    if (!raw || /^0/.test(raw)) {
      setDraft(raw)
      return
    }

    const err = validateDateRange(raw, min, max, fieldLabel)
    if (!err) {
      setDraft(null)
      updateError(null)
      onChange?.(raw)
    } else {
      setDraft(raw)
      updateError(err)
    }
  }

  const handleBlur = (e) => {
    if (draft !== null || error) {
      commitOrClamp(displayValue, true)
    }
    onBlur?.(e)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (draft !== null || error)) {
      const ok = commitOrClamp(displayValue, true)
      if (!ok) e.preventDefault()
    }
    onKeyDown?.(e)
  }

  const handleClick = (e) => {
    openPicker()
    onClick?.(e)
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="date"
        value={displayValue}
        min={min}
        max={max}
        aria-invalid={!!error}
        onClick={handleClick}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          className,
          error && 'border-red-deep text-red-deep focus:border-red-deep',
        )}
        {...props}
      />
      {showInlineError && error && (
        <p role="alert" className="mt-1 flex items-center gap-1 text-xs font-medium text-red-deep">
          <span aria-hidden className="mono font-bold">!</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
