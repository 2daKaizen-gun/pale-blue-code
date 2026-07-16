# Phase 9-B TechSpec — 울타리 열기 (Opening the Gate)

> *작성일: 2026-07-09*
> *상태: **완료 (2026-07-16)** — Phase 9-B 종료. 회고: `docs/checks/phase-9B/sub-9B-{1,2,3}.md`*
> *PRD: `docs/specs/phase-9B/PRD.md`*
> *전신 계획: `docs/specs/phase-9/9B-PLAN.md`*

---

## §1. 핵심 기술 결정 요약

| 영역 | 결정 | 이유 |
|------|------|------|
| 판별 로직 | **9-A `vetting.vet` 그대로 재사용** — 새 판별 0 | 9-B는 타깃 선정 + 흐름 + 정직성 UI만 추가. 판별은 이미 벼려졌다. |
| 무작위 미기록 타깃 | **사전 검증 씨드 풀** (`backend/data/frontier_seeds.json`) | KOI에 없고 Kepler LC 실존을 오프라인에서 미리 검증 → 즉시·결정론·테스트 가능·정직. |
| 씨드 풀 구축 | 일회성 오프라인 스크립트 `scripts/build_frontier_seeds.py` | 네트워크 프로브는 빌드 타임 1회. 런타임은 로컬 JSON 읽기만. |
| 미기록 판정 | `koi_catalog.csv` **kepid 멤버십** (주기 무관) | "이 별에 KOI 항목이 *하나라도* 있나?" — 있으면 사냥 대상 아님. `koi_check`(주기 대조)와 별개. |
| 진짜 사냥 진입점 | **별도 페이지/라우트** (교육 헌트와 분리) | PRD §5 분리 원칙. 섞으면 못 3 위반. |
| 사냥 집계 | localStorage 세션 카운터 ("N번 사냥, 후보 M") | 계정 없이 정직한 집계. 영속 저장소는 9-C. |
| 정직성 | 빈손 = 결과. "발견" 단어는 strong+미기록에만, "후보"로만 | PRD §3 못 3 + §7. |

---

## §2. 백엔드 아키텍처

### 신규/수정 파일

```
backend/
├── data/
│   └── frontier_seeds.json     # 사전 검증된 미기록 KIC 풀 (신규, git 추적)
├── services/
│   └── hunt.py                 # (수정) is_recorded / koi_entries / pick_frontier
└── routers/
    └── hunt.py                 # (수정) /hunt/frontier/random + /hunt/recorded/{kic}

scripts/
└── build_frontier_seeds.py     # (신규) 씨드 풀 오프라인 구축 — 일회성
```

### §2-1. 씨드 풀 (`frontier_seeds.json`)

```jsonc
{
  "schema": "pale-blue-code/frontier-seeds@1",
  "built_at": "2026-07-..",         // 빌드 스크립트가 기록
  "criteria": "no KOI entry (kepid absent from koi_catalog) AND Kepler long-cadence LC exists",
  "kics": [ 757450, 891901, ... ]   // 사전 검증된 KIC ~50-200개
}
```

각 KIC는 두 조건을 **오프라인에서** 통과한 것만:
1. `kepid`가 `koi_catalog.csv`에 **없음** (미기록)
2. `lk.search_lightcurve("KIC {id}", mission="Kepler", author="Kepler", exptime="long")` 결과 **존재** (관측 데이터 있음)

> 정직성: 이 풀은 "알려진 KOI를 숨긴 것"이 아니라 *"진짜로 KOI가 아닌, 그러나 케플러가 본 별"*이다. 못 3을 코드로 강제.

### §2-2. `scripts/build_frontier_seeds.py` (일회성)

```python
# 의사코드 — Kepler KIC 후보를 샘플링해 두 조건 통과분만 수집
recorded = set(int(r["kepid"]) for r in load_koi_catalog())   # 제외 집합
seeds = []
for kic in sample_kepler_kic_candidates():        # 케플러 KIC 범위 샘플
    if kic in recorded:                            # 조건1: 미기록
        continue
    if not has_kepler_lc(kic):                     # 조건2: LC 실존 (lightkurve 프로브)
        continue
    seeds.append(kic)
    if len(seeds) >= TARGET_N:
        break
write_json("backend/data/frontier_seeds.json", ...)
```

> KIC 후보 소스는 sub-9B-1 Plan에서 확정(예: KOI 카탈로그의 kepid 근방 이웃 / 케플러 관측 대상 목록 일부 / 범위 내 무작위). 어느 소스든 **두 조건 통과가 유일한 편입 기준**.

### §2-3. `services/hunt.py` (추가 함수)

```python
def koi_entries(kic_id: int) -> list[dict]:
    """이 KIC의 모든 KOI 항목 (주기 무관). 미기록 판정용."""
    return [r for r in _load_koi_catalog() if int(r["kepid"]) == kic_id]

def is_recorded(kic_id: int) -> bool:
    return len(koi_entries(kic_id)) > 0

_FRONTIER: dict | None = None
def _load_frontier() -> list[int]:
    global _FRONTIER
    if _FRONTIER is None:
        _FRONTIER = json.loads((_DATA_DIR / "frontier_seeds.json").read_text("utf-8"))
    return _FRONTIER["kics"]

def pick_frontier(rng: random.Random) -> int:
    """씨드 풀에서 미기록 KIC 하나. rng 주입 → 테스트 결정론."""
    return rng.choice(_load_frontier())
```

### §2-4. `routers/hunt.py` (추가 엔드포인트)

```python
@router.get("/hunt/frontier/random")
async def frontier_random() -> dict:
    kic = hunt_service.pick_frontier(random.Random())
    return {"kic_id": kic, "recorded": False}   # 풀은 미기록만 담음 (불변식)

@router.get("/hunt/recorded/{kic_id}")
async def recorded(kic_id: int) -> dict:
    entries = hunt_service.koi_entries(kic_id)
    return {
        "kic_id": kic_id,
        "recorded": len(entries) > 0,
        "entries": [{"kepoi_name": e["kepoi_name"],
                     "disposition": e["koi_disposition"]} for e in entries],
    }
```

이후 흐름은 **기존 계약 재사용**: `/hunt/lc/{kic}` → `/hunt/bls/{kic}` → `/hunt/vet/{kic}`.

---

## §3. 프론트엔드 아키텍처

### 신규/수정 파일

```
frontend/src/
├── pages/
│   └── FrontierHuntPage.tsx        # 진짜 사냥 페이지 (신규, 교육 헌트와 별도 라우트)
├── components/hunt/
│   ├── FrontierTargetPicker.tsx    # 무작위 버튼 + 자유입력 (신규)
│   ├── FrontierVerdict.tsx         # trust별 결과 분기 + 정직한 빈손 (신규)
│   └── HuntLog.tsx                 # "N번 사냥, 후보 M" 정직 집계 (신규)
├── lib/api/hunt.ts                 # (수정) frontierRandom / checkRecorded + 타입
└── App/router                      # (수정) /hunt/frontier 라우트 추가
```

### §3-1. 흐름 (`FrontierHuntPage`)

```
타깃 선택 (무작위 pick or 자유입력 KIC)
  → checkRecorded(kic)
       ├ recorded → "이미 기록된 천체입니다" 카드 (사냥 대상 아님, entries 표시) → 종료
       └ 미기록  → fetchLC → fetchBLS → fetchVetting
                     → FrontierVerdict(trust):
                          ├ strong  → ★ "우리가 찾은 신뢰 후보" + 발견기록 v2 내보내기
                          ├ weak    → "애매 — 추가 검토 필요"
                          └ unlikely→ "여기엔 행성이 없습니다. 그것도 답입니다."
  → HuntLog 갱신 (사냥 +1, strong이면 후보 +1)
```

### §3-2. 재사용 (신규 판별 UI 없음)

- **`VettingReportCard`** (9-A) — 4관문 리포트는 그대로 렌더. `FrontierVerdict`는 그 위에 trust별 프레이밍만 감싼다.
- **`discovery@2` + `DiscoveryActions`** (9-A) — strong+미기록일 때 발견기록 내보내기. `vetting` 근거가 이미 임베드됨.
- **`Reveal`** (9-A) — 순차 공개 애니메이션.

### §3-3. 정직성 UI 규칙 (못 3의 구현)

- 빈손을 **실패가 아니라 결과로**: *"이 별에는 행성 신호가 없습니다 — 그것도 답입니다."* (에러 스타일 금지, 중립/정보 스타일)
- "발견" 단어는 **strong+미기록**에만, "후보"로만.
- `HuntLog`가 사냥/빈손 횟수를 정직하게 노출 (localStorage): *"37번 사냥, 후보 0 — 개척은 원래 이렇다."*
- recorded 타깃은 숨기지 말고 *"이미 기록됨"*으로 정직하게 표시.

---

## §4. API 클라이언트 (`hunt.ts` 추가)

```typescript
export interface FrontierPick { kic_id: number; recorded: boolean }
export interface RecordedCheck {
  kic_id: number
  recorded: boolean
  entries: { kepoi_name: string; disposition: string }[]
}
export async function frontierRandom(): Promise<FrontierPick>
export async function checkRecorded(kicId: number): Promise<RecordedCheck>
```

`base.ts` + `getJSON` 헬퍼 재사용 (Phase 8 패턴). vet/lc/bls는 기존 `fetchVetting` 등 그대로.

---

## §5. sub-phase 분할

### sub-9B-1: 백엔드 개척 (씨드 풀 + 미기록 판정) — 부분 TDD

**Goal**: 씨드 풀 구축 + `/hunt/frontier/random` · `/hunt/recorded/{kic}`. 풀 불변식(미기록·LC실존) 검증.

**Lights (예상 커밋 순서)**:
1. `scripts/build_frontier_seeds.py` — 오프라인 구축 스크립트
2. `backend/data/frontier_seeds.json` — 스크립트 산출물 커밋 (풀 ~50-200)
3. `services/hunt.py` — `koi_entries` / `is_recorded` / `pick_frontier` + 테스트(멤버십·풀 불변식)
4. `routers/hunt.py` — 두 엔드포인트

**성공 기준**:
- 풀의 모든 KIC가 `is_recorded == False` (테스트로 불변식 강제)
- KOI에 있는 KIC(예: 11446443) → `/hunt/recorded` `recorded: true` + entries 반환
- `/hunt/frontier/random` → 풀 내 KIC 반환, 항상 미기록
- `pytest` 통과

### sub-9B-2: 진짜 사냥 페이지 (프론트) — 결과 분기

**Goal**: `FrontierHuntPage` + 타깃 선정 + 미기록 게이트 + trust 분기 UI. 9-A 판별 카드 재사용.

**Lights**:
1. `lib/api/hunt.ts` — `frontierRandom` / `checkRecorded` + 타입
2. `FrontierTargetPicker` — 무작위 버튼 + 자유입력
3. `FrontierHuntPage` — recorded 게이트 → LC→BLS→vet 흐름 배선 + 라우트
4. `FrontierVerdict` — trust별 분기 + `VettingReportCard` 감싸기
5. 정직한 빈손 프레이밍 + 모바일 + `npm run build`

**성공 기준**:
- 무작위 버튼 → 미기록 KIC 라이브 사냥 완주 (대부분 unlikely/빈손)
- recorded KIC 자유입력 → "이미 기록됨" 카드 (사냥 미진입)
- 빈손이 에러가 아닌 **결과**로 렌더
- `npm run build` 통과

### sub-9B-3: 정직한 사냥 로그 + 발견기록 v2 결선

**Goal**: `HuntLog` 집계 + strong+미기록 발견기록 v2 내보내기 + 최종 정직성 점검.

**Lights**:
1. `HuntLog` — localStorage 사냥/후보 카운터 + "개척은 원래 이렇다" 카피
2. `DiscoveryActions` 배선 — strong+미기록일 때 v2 내보내기 (판별 근거 임베드 확인)
3. 정직성 규칙 최종 감사 ("발견" 단어 위치, 빈손 스타일, recorded 표시)
4. Check 문서 + `npm run build`

**성공 기준**:
- 사냥할수록 "N번 사냥, 후보 M" 정직 갱신
- strong 발견기록 JSON에 4관문 근거 + trust 포함 (`discovery@2`)
- "발견" 단어가 strong+미기록 외에 등장하지 않음 (감사)
- `npm run build` 통과

---

## §6. 위험 요소

| 위험 | 가능성 | 대응 |
|------|--------|------|
| 씨드 풀 구축 시 lightkurve 프로브가 느림/불안정 | 중 | 오프라인 일회성. 실패 KIC는 건너뛰고 목표 수 채울 때까지. 결과만 커밋. |
| 풀이 편향(특정 영역만) → "무작위" 느낌 약함 | 낮 | KIC 후보 소스를 넓게 샘플. 편향은 정직성엔 무해(전부 진짜 미기록). |
| 미기록 KIC라도 BLS가 노이즈 주기를 뱉음 | 높(의도됨) | **그게 핵심** — 4관문이 걸러 unlikely/빈손. 정직한 결과로 제시. |
| 자유입력 KIC에 Kepler 데이터 없음 | 중 | `/hunt/lc` 404 → 프론트가 "이 별은 케플러가 안 봤어요" 안내. |
| recorded 판정이 kepid만 봄(주기 무관) | 낮 | 의도됨 — "이 별에 KOI가 하나라도 있으면 미기록 아님". 정직한 보수 판정. |

---

## §7. 불변 규칙 (Phase 8·9-A 계승)

- **판별 로직 신규 금지** — 9-B는 `vetting.vet`를 감싸기만. 판별을 다시 짜면 9-A와 갈라진다.
- **manualChunks**: `@react-three` → `/three/` 먼저 매칭 — 절대 변경 금지
- **커밋 게이트**: `npm run build`(+백엔드 `pytest`) 통과 → `git add` → 메시지 제시 → 권이건 OK → `git commit`
- **push 게이트**: sub-phase 완료 후 권이건이 직접 push
- **이슈 본문**: 영어만 (한글 U+AC00~U+D7A3 금지)
- **Tailwind 토큰**: `tokens.css` 실물 or 표준 팔레트 — 빌드 통과 ≠ 클래스 유효
- **정직성 못 3**: 교육 데모와 진짜 사냥 분리. 빈손은 결과. "발견"은 strong+미기록에만.
- **PCTC**: Plan 없이 Code 금지, Check 생략 금지

---

*"TechSpec은 결정의 근거다. 실물이 정본이고, TechSpec은 왜 그렇게 만들었나를 기록한다."*
*"판별은 9-A에서 끝났다. 9-B는 그 칼을 들고 갈 정직한 사냥터를 짓는다."*
