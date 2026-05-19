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
 * Planet/Sun 양쪽에서 재사용. 컴포넌트 분리의 이유:
 *   - 행성/태양/미래의 달이 *같은 명함 모양* 공유
 *   - 변경 시 한 곳에서 (호버 라벨 디자인 정제, 한 줄 사실 추가 등)
 *   - *천체의 짧은 명함* 이라는 단일 책임
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
 *     항상 같은 크기*. 호버 라벨의 *읽기 좋음* 우선. 3D 평면 스케일 (transform=true)
 *     이면 멀어질수록 작아져 못 읽음.
 *   - `position={[0, radius * 1.5, 0]}`: 천체 정 위. 가려짐 회피의 가장 단순한 형태.
 *   - `style.pointerEvents='none'`: 라벨 자체는 클릭 안 됨 → 천체 클릭이 자연스럽게.
 *
 * ─── 미래 작업 ────────────────────────────────────────
 *   - Light 4: 한 줄 영어 사실 추가 (`description` 의 영어 버전 데이터 필드)
 *   - Light 4: Tailwind 클래스 → 디자인 토큰 (`cosmos-bg`, `cosmos-nebula` 등)
 *   - 추후: `occlude` prop 으로 라벨이 *행성 뒤* 일 때 자동 숨김 (필요 시)
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
      <div className="bg-black/70 text-white px-3 py-1 rounded-md whitespace-nowrap text-sm font-medium border border-white/20 backdrop-blur-sm">
        {name}
      </div>
    </Html>
  )
}
