import { PRESETS } from '../../data/presets'
import { useGravityStore } from '../../store/gravityStore'

/**
 * Pale Blue Code — Phase 3: Gravity
 *
 * PresetSelector — switch the active N-body system. Canvas 밖, 화면 상단 고정
 * (하단은 3-5/3-6 의 ControlPanel 자리 → 충돌 방지).
 *
 * sub-3-7 [fix]: `fixed` → `absolute`. `fixed left-1/2` 는 *뷰포트* 정중앙에
 * 거는데, 데스크톱 사이드바(AppLayout `md:w-48`, 레이아웃 안 flex 자식)가
 * 왼쪽을 차지하므로 셀렉터가 네비 위로 흘러넘쳤다. GravityPage 의 부모
 * (`relative h-screen w-full`)가 곧 *콘텐츠 영역* 이므로, `absolute` 로 그
 * 부모 기준 중앙에 걸면 사이드바 폭을 하드코딩하지 않고도 콘텐츠 중앙에
 * 정렬된다 — 사이드바 폭이 바뀌어도 자동 적응. 모바일(md 미만)은 사이드바가
 * 드로어로 숨으므로 콘텐츠 = 전체 폭, 그대로 중앙.
 *
 * 스타일은 Phase 2 ControlPanel 미러 (rounded-2xl / border-white/10 /
 * bg-black/40 / backdrop-blur / overflow-x-auto). 좁은 폰에선 가로 스크롤,
 * 라벨은 한 줄 유지.
 *
 * 접근성 (PRD §6): 네이티브 <button> → tab + Enter/Space 로 조작 가능,
 * 활성 프리셋은 `aria-pressed`. *숫자키는 안 뺏음* — 1~4 는 3-6 속도 컨트롤 몫.
 *
 * 프리셋이 곧 학습 슬라이드 — 각 버튼의 `title` 에 한 줄 설명.
 */
export function PresetSelector() {
  const presetId = useGravityStore((s) => s.presetId)
  const selectPreset = useGravityStore((s) => s.selectPreset)

  return (
    <div className="absolute top-4 md:top-6 left-1/2 z-10 -translate-x-1/2 max-w-[calc(100%-1rem)]">
      <div
        role="group"
        aria-label="시스템 프리셋"
        className="flex items-center gap-1 overflow-x-auto whitespace-nowrap rounded-2xl border border-white/10 bg-black/40 px-3 py-2 shadow-2xl backdrop-blur-md"
      >
        {PRESETS.map((preset) => {
          const active = preset.id === presetId
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => selectPreset(preset.id)}
              aria-pressed={active}
              title={preset.description}
              className={[
                'rounded-xl px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-white/90 text-black'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              ].join(' ')}
            >
              {preset.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
