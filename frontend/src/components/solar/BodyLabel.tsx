import { Html } from '@react-three/drei'

type BodyLabelProps = {
  /**
   * 라벨에 표시할 천체 이름. 영어 이름 사용 (`PlanetData.name.en`,
   * `SUN.name.en`). 일본 커리어 + 글로벌 톤의 일관성.
   */
  name: string

  /**
   * 천체의 *visual radius* (압축된 반지름). 라벨을 천체 위쪽으로 띄우는 거리를
   * 결정. 천체에 가려지지 않도록 `radius * 1.5` 위치에 부착.
   */
  radius: number
}

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * BodyLabel — 천체 호버 시 표시되는 영어 이름 라벨 (sub-2-5 [Light 3]).
 *
 * Planet/Sun 양쪽에서 재사용. *천체의 짧은 명함* 이라는 단일 책임.
 *
 * ─── 부모 컴포넌트의 부착 위치 ────────────────────────
 *   Planet/Sun 의 *외부 group* 자식 (= 공전 위치만 적용된 group).
 *   *자전축 기울기 group 밖* — 라벨이 기울어지지 않음.
 *   *자전 mesh 밖* — 라벨이 회전하지 않음.
 *   결과: 라벨은 *공전 위치만* 따라감. 행성이 자전해도 라벨은 위쪽 고정.
 *
 * ─── drei `<Html>` 동작 ──────────────────────────────
 *   - `center`: transform-origin 을 중앙으로 → position 의 위치가 라벨 중앙
 *   - `transform={false}` (기본): DOM overlay 모드 — *카메라 거리 무관하게
 *     항상 같은 크기*. 호버 라벨의 *읽기 좋음* 우선.
 *   - `position={[0, radius * 1.5, 0]}`: 천체 정 위. 가려짐 회피.
 *   - `style.pointerEvents='none'`: 라벨이 클릭 막지 않음 → 천체 클릭 자연.
 *
 * ─── 스타일: 박스 없이 글자 + text-shadow 글로우 ──────
 *   초기 골격에서는 어두운 박스를 깔았지만, *우주 배경 (별, 행성 텍스처) 가림*
 *   이 문제. 박스를 빼고 *글자 자체에 검은 글로우 (text-shadow)* 로 가독성 확보.
 *
 *   결정의 결:
 *     - 박스 제거 = *별 한 점도 가리지 않음*. Phase 2 의 영혼인 *살아있는 우주*
 *       에 라벨이 *덧붙는* 느낌이 아니라 *깃드는* 느낌.
 *     - text-shadow 다층 = 어떤 배경 위에서도 글자가 떠 보임:
 *         - 밝은 배경 (태양 표면) → 검은 외곽이 글자 분리
 *         - 어두운 배경 (우주 빈 공간) → 약간의 글로우가 글자 강조
 *     - inline style 사용 = Tailwind v3 기본에 text-shadow 유틸 없음. Tailwind v4
 *       마이그레이션 시점에 `text-shadow-md` 같은 유틸로 옮길 수 있음.
 */
export function BodyLabel({ name, radius }: BodyLabelProps) {
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
          color: 'white',
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
    </Html>
  )
}
