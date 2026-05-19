import { Html } from '@react-three/drei'

type BodyLabelProps = {
  /**
   * 라벨에 표시할 천체 이름. 영어 (`PlanetData.name.en`, `SUN.name.en`).
   */
  name: string

  /**
   * 호버 라벨용 영어 한 줄 시그니처 (선택). 이름 아래 흐리게 작게 표시.
   * 데이터의 `taglineEn` 필드. 미래의 천체 (예: 달) 에서 미정의 시 대비 optional.
   */
  tagline?: string

  /**
   * 천체의 *visual radius* (압축된 반지름). 라벨을 천체 위쪽으로 띄우는 거리를
   * 결정. 천체에 가려지지 않도록 `radius * 1.5` 위치에 부착.
   */
  radius: number
}

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * BodyLabel — 천체 호버 시 표시되는 영어 명함 (sub-2-5 [Light 3/4]).
 *
 * Planet/Sun 양쪽에서 재사용. *천체의 짧은 명함* 이라는 단일 책임.
 *
 * ─── 부모 컴포넌트의 부착 위치 ────────────────────────
 *   Planet/Sun 의 *외부 group* 자식 (= 공전 위치만 적용된 group).
 *   자전축 group/자전 mesh 밖 → 라벨은 *공전 위치만* 따라감.
 *
 * ─── drei `<Html>` 동작 ──────────────────────────────
 *   - `center`: transform-origin 을 중앙으로 → position 의 위치가 라벨 중앙
 *   - `transform={false}` (기본): DOM overlay — 카메라 거리 무관 같은 크기
 *   - `position={[0, radius * 1.5, 0]}`: 천체 정 위
 *   - `style.pointerEvents='none'`: 라벨이 클릭 막지 않음
 *
 * ─── 스타일: 박스 없이 글자 + text-shadow 글로우 ──────
 *   *우주 배경 (별, 행성 텍스처) 가림* 방지 — 박스 제거, 글자 자체에 text-shadow.
 *   text-shadow 다층 = 어떤 배경 위에서도 글자가 분리되어 떠 보임.
 *
 *   [Light 4]: 디자인 토큰 적용 (`tokens.css`):
 *     - 이름:    `--color-cosmos-text` (#e2e8f0)
 *     - tagline: `--color-cosmos-muted` (#64748b, 흐림)
 *     - 폰트:    `--font-sans` (Inter)
 *
 *   inline style 의 `var(...)` 사용 = Tailwind config 매핑 의존 X.
 *   Tailwind v4 마이그레이션 시점에 `text-shadow-md` 같은 유틸 + `text-cosmos-text`
 *   같은 유틸로 옮길 수 있음.
 */
export function BodyLabel({ name, tagline, radius }: BodyLabelProps) {
  return (
    <Html
      center
      position={[0, radius * 1.5, 0]}
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <div
          style={{
            color: 'var(--color-cosmos-text)',
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap',
            textShadow:
              '0 0 4px rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.9)',
          }}
        >
          {name}
        </div>
        {tagline && (
          <div
            style={{
              color: 'var(--color-cosmos-muted)',
              fontSize: '11px',
              fontWeight: 400,
              fontStyle: 'italic',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
              textShadow:
                '0 0 4px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)',
            }}
          >
            {tagline}
          </div>
        )}
      </div>
    </Html>
  )
}
