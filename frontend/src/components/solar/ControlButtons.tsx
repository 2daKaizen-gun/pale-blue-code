/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * ControlPanel 의 반복 버튼 두 종류 추출 (sub-2-6 L9).
 *   - ToggleButton: 텍스트 + active 상태 (속도 / 거리·자전·전체진실 토글)
 *   - IconButton:   아이콘 정사각형 (정지·재생 / ↺ / 🎥). active 는 정지만 사용.
 */

type ToggleButtonProps = {
  label: string
  active: boolean
  onClick: () => void
  ariaLabel: string
}

export function ToggleButton({ label, active, onClick, ariaLabel }: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={`h-10 rounded-lg px-3 text-sm font-medium transition ${
        active ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  )
}

type IconButtonProps = {
  icon: string
  onClick: () => void
  ariaLabel: string
  /** 정지/재생 버튼만 사용 — aria-pressed + active 배경. 그 외(↺/🎥)는 생략. */
  active?: boolean
  /** 🎥 는 'base', 나머지 'lg'. */
  size?: 'lg' | 'base'
}

export function IconButton({ icon, onClick, ariaLabel, active, size = 'lg' }: IconButtonProps) {
  const sizeClass = size === 'base' ? 'text-base' : 'text-lg'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      {...(active !== undefined ? { 'aria-pressed': active } : {})}
      className={`flex h-10 w-10 items-center justify-center rounded-lg ${sizeClass} transition ${
        active ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'
      }`}
    >
      {icon}
    </button>
  )
}
