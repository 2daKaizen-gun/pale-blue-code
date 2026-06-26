# [Check] sub-8-2: HuntPage 프론트엔드

**날짜**: 2026-06-27
**Issue**: #37
**브랜치**: main @ `1b3046b`
**결과**: ✅ 정적 검증 통과 / ⚠️ 라이브 브라우저 E2E는 push 전 권이건 확인 권고

---

## 범위

신규 4파일 + 수정 1파일:
- `lib/api/hunt.ts` — fetchHuntTargets / fetchHuntLC / fetchHuntBLS / fetchKOICheck (`4a0d99f`)
- `components/hunt/HuntTargetCard.tsx` — 타깃 선택 카드 (`ad131a7`)
- `components/hunt/KOIMatchCard.tsx` — KOI 대조 reveal (CANDIDATE/CONFIRMED/미등록) (`3af2747`)
- `pages/HuntPage.tsx` — placeholder → 순차 LC→BLS→KOI 흐름 (`eb35d92`)
- `constants/phases.ts` — Phase 8 status planned → done (`1b3046b`)

Phase 7 컴포넌트 `PeriodogramChart` · `BLSResultCard` 수정 0으로 재사용.

---

## Test

### 자동 (이번 세션 실행)

```
✅ npm run build — 5회 전부 통과 (각 Light 커밋 전)
✅ npx eslint (신규 4파일) — 에러 0
✅ tsc strict — lcData 미사용 TS6133 잡아서 제거 (LC fetch는 BLS 캐시 prime 용도라 표시 불필요)
```

### 백엔드 계약 (sub-8-1에서 검증됨)

- `GET /api/hunt/targets` → 5 타깃 / `lc/{kic}` → LC / `bls/{kic}` → BLSResponse / `koi-check` → KOIMatch[]
- 에러 경로: LC 캐시 없이 BLS → 424, 없는 KIC → 404 — HuntPage가 `detail.message`를 파싱해 표시

### 라이브 브라우저 E2E (⚠️ 미실행 — push 전 권고)

이번 세션에서는 dev 서버 + 백엔드를 띄운 실제 클릭 흐름을 돌리지 않았다. push 전 다음 확인 권고:
- `/hunt` → 타깃 그리드 5장 렌더
- CANDIDATE 타깃(KIC 9140402) 클릭 → LC→BLS→KOI 순차 로딩 메시지 → 주기도그램 + BLSResultCard + KOIMatchCard
- KIC 직접입력(유효/무효) 동작
- 주의: BLS는 정수배 alias(½×·4×)를 피크로 잡는 경향(sub-8-1 findings) — KOIMatchCard가 "미등록"으로 뜰 수 있음. 주기도그램에서 참주기 시각 확인이 사용자 몫.

---

## 잘된 점

- `runHunt`를 이벤트 핸들러에서만 호출 — effect 내 동기 setState 회피(sub-7-2 교훈 적용). 처음부터 분리 구조로 작성해 lint 경고 0.
- `hunt.ts`의 4개 GET을 `getJSON<T>` 헬퍼로 묶어 `bls.ts` 에러 처리 패턴 재사용.
- LC fetch를 "표시용 데이터"가 아니라 "백엔드 BLS 캐시 prime(424 방지)"으로 명확히 정의 — 불필요한 상태 제거.
- KOIMatchCard 3상태(amber/green/purple)를 disposition 룩업 테이블로 — 분기 단순화.

---

## 막혔던 점

### 1. 존재하지 않는 Tailwind 토큰 `bg-cosmos-base`

- **문제**: KOIMatchCard에 `bg-cosmos-base` 사용 — `npm run build`는 통과하지만 스타일이 안 먹는다(Tailwind가 미정의 유틸리티를 조용히 무시).
- **원인**: 토큰 이름 추정. 실제 배경 토큰은 `cosmos-bg / cosmos-surface / cosmos-elevated`뿐.
- **해결**: `tokens.css`를 읽고 `cosmos-bg`(#0a0a0f)로 교정. 교훈: 빌드 통과 ≠ 클래스 유효. 토큰은 실물(`tokens.css`) 확인 후 사용.

### 2. TS6133 — lcData 미사용

- **문제**: `lcData` 상태를 저장만 하고 렌더에서 안 읽어 strict 빌드 실패.
- **해결**: LC는 화면에 안 그리므로(BLS가 서버에서 재다운) 상태 제거, `await fetchHuntLC` side-effect로만.

---

## 리팩토링 후보

- 순차 흐름의 단계별 `setXxxLoading` 3쌍 → reducer로 stage 머신(`idle|lc|bls|koi|done|error`) 정리 가능. 현재 가독성엔 충분.
- 결과 JSON 내보내기(PRD §4 발견 기록)는 이번 범위에서 빠짐 — 향후 작은 Light로 추가 가능.

---

## 🌌 이번에 알게 된 우주의 한 조각

**"카탈로그에 없음"은 실패가 아니라 결과다.**

BLS가 피크를 올렸는데 KOI 대조에서 빈 배열이 돌아오는 순간 — 그건 버그가 아니라 과학이다. NASA 파이프라인은 단주기·깊은 transit에 최적화돼 있어, 장주기·낮은 S/N 신호는 여전히 카탈로그 밖에 남아 있다. 같은 데이터에 독립 알고리즘으로 동일 신호를 다시 찾는 것 = 후보 신뢰도 상승. 우리 화면의 보라색 배지 하나가 "아직 아무도 기록하지 않은 신호일 수 있다"를 뜻하는 이유다.
