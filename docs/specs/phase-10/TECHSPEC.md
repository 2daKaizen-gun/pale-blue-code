# Phase 10 TechSpec — Skyward (온 하늘)

> *작성일: 2026-07-18*
> *상태: Draft → sub-10-1 진입 시 Confirmed*
> *PRD: `docs/specs/phase-10/PRD.md`*

---

## §1. 핵심 기술 결정 요약

| 영역 | 결정 | 이유 |
|------|------|------|
| 판별 로직 | **9-A `vetting` 4관문 그대로** — 새 판별 0 | 게이트 수학은 미션 무관. TESS는 데이터 소스만 다르다. |
| 미션 배선 | `planet_name` 문자열 스위치 (`"KIC {id}"` ↔ `"TIC {id}"`) | BLS는 이미 미션 무관(`_find_lc_cache`가 tess 순회, `_get_full_lc`가 `lc_meta["mission"]` 재검색). LC를 올바른 hostname·mission으로 캐시하면 파이프라인이 그냥 흐른다. |
| ID 충돌 | 라우트에 **`?mission=` 명시** (기본 `kepler`) | KIC·TIC는 서로 다른 카탈로그의 int — 같은 숫자가 양쪽에 유효할 수 있다. 미션은 항상 명시. 기존 Kepler 라우트는 기본값으로 하위호환. |
| TESS LC fetch | `fetch_lc_by_tic` — `mission="TESS"`, `exptime="long"`, hostname `"TIC {id}"`, 캐시 `lc_tic-XXXX_tess.json` | `fetch_lc_by_kic`의 형제. long cadence로 detrend 가정(30일 SG) 유지. |
| recorded-gate | `toi_catalog.csv` **TIC 멤버십**(`tid` 열) | KOI→TOI 대응. "이 별에 TOI 항목이 하나라도 있나?" 있으면 사냥 대상 아님(못 3). |
| 미기록 TIC 풀 | 사전 검증 씨드 풀 `frontier_seeds_tess.json` | 9-B 패턴 그대로. 오프라인 빌드, 런타임은 로컬 JSON. |
| 못 4 (관측량) | LC fetch가 `baseline_days`·`sector_count` 기록 → 응답에 노출 | 짧은 baseline = 무뎌진 판별. 숨기지 않는다. |
| 못 4 (겸손) | baseline 임계 미만이면 strong → **"잠정 strong"** (표현 계층 강등, `vet`은 순수 유지) | 확신을 관측량에 비례. `vet` 결과는 안 바꾸고 envelope/UI에서 강등. |
| 진짜 사냥 입구 | **개척지 허브** — 발견 가능, `phases.ts` 미사용(별도 nav 요소) | PRD §5 분리 원칙 + 접근성. nav는 PHASES 파생이므로 허브는 수동 배치. |

---

## §2. 백엔드 아키텍처

### 신규/수정 파일

```
backend/
├── data/
│   ├── toi_catalog.csv              # (신규) TESS Object of Interest 카탈로그 — recorded gate
│   └── frontier_seeds_tess.json     # (신규) 사전 검증된 미기록 TIC 풀 (git 추적)
├── services/
│   └── hunt.py                      # (수정) fetch_lc_by_tic / is_recorded_tess / pick_frontier_tess
├── services/
│   └── vetting.py                   # (수정) vet(id, mission) — 이름 짓기만 미션화, 게이트 불변
└── routers/
    └── hunt.py                      # (수정) 모든 사냥 라우트에 ?mission= 파라미터

scripts/
└── build_frontier_seeds_tess.py     # (신규) TESS 씨드 풀 오프라인 구축 — 일회성
```

### 미션 배선 (최소 침습)

파이프라인은 `planet_name`으로 굴러간다. 미션 스위치는 **이름 짓기 한 곳**에 모은다:

```python
# services/hunt.py
def star_name(star_id: int, mission: str) -> str:
    return f"TIC {star_id}" if mission == "tess" else f"KIC {star_id}"
```

- `vetting.vet(star_id, mission="kepler")` — 340·357행의 `f"KIC {kic_id}"`를 `star_name(...)`으로. **4관문 계산부(≈250행)는 한 줄도 안 바뀐다.**
- `VettingReport`에 `mission: str` + `baseline_days: float | None` + `sector_count: int | None` 필드 추가(못 4). 기존 `kic_id`는 하위호환 위해 유지하되 의미는 "star_id".
- 라우터: `planet_name = star_name(star_id, mission)`으로 BLS 호출.

### BLS 계층 — 손댈 것 거의 없음

`_find_lc_cache`는 이미 `("kepler","tess","k2")` 순회, `_get_full_lc`는 `lc_meta["mission"]`으로 재검색. **TESS LC를 올바르게 캐시하기만 하면 BLS는 그대로 동작.** 유일한 주의: `_detrend`의 SG 윈도우가 `_KEPLER_CADENCE_DAYS(0.0204d)` 기준 — TESS long cadence(FFI ~0.0208d, 또는 10분)와 근사하면 OK. 2분 cadence를 쓰면 윈도우가 과대 → **`exptime="long"` 강제로 회피**(Plan에서 author/exptime 확정).

---

## §3. 못 4 구현 — 관측량 노출 + 잠정 strong

### 어디서 계산하나

- **baseline·sector**: `fetch_lc_by_tic`가 다운로드 시점에 `baseline_days = time[-1]-time[0]`, `sector_count = len(search)`(또는 `lc.meta`)를 기록해 LC 캐시에 저장 → vet이 읽어 report에 실음.
- **잠정 강등**: `vet` 자체는 순수 유지(strong/weak/unlikely 그대로). 강등은 **표현 계층 규칙**:

```
if trust == "strong" and n_transits(baseline, bls_period) < N_MIN:
    display_trust = "provisional_strong"   # "잠정 strong (짧은 관측)"
```

- 물리적으로 정직한 구동 지표는 **관측된 transit 수** `n_transits = floor(baseline_days / bls_period)`. odd/even은 홀·짝 최소 2개, 견고하려면 여럿. `N_MIN`(예: 5)은 Plan에서 보정.
- 강등은 백엔드 envelope 필드(`provisional: bool`)로 내려주거나 프론트 `FrontierVerdict`에서 계산 — **둘 다 `vet` 결과 불변**. 결정: 백엔드가 `provisional` 플래그를 실어 단일 진실원.

---

## §4. 프론트엔드 아키텍처

### 라우트 재편 (개척지 허브)

```
/hunt                     교육 데모 (그대로)
/hunt/frontier            → FrontierHubPage (신규) — Kepler/TESS 개척지 선택
/hunt/frontier/kepler     → FrontierHuntPage (mission="kepler") — 기존 UI 이관
/hunt/frontier/tess       → FrontierHuntPage (mission="tess")   — 신규
```

- `/hunt/frontier`를 **허브로 승격**. 기존 Kepler 사냥은 `/kepler` 자식으로 이관(HuntPage의 기존 링크는 허브로 향함).
- `FrontierHuntPage`를 **mission 파라미터화** — API 호출·카피·로그 키를 mission으로 구동. Kepler/TESS 병렬이 아니라 **한 컴포넌트 재사용**.

### 발견성 (분리 원칙 유지)

- nav는 `AppLayout`이 `PHASES`에서 파생 → **`phases.ts`는 손대지 않는다**(넣으면 로드맵에 노출·분리 붕괴).
- 대신 `AppLayout`에 **PHASES 맵 바깥의 수동 nav 요소** "🌌 개척 사냥" 하나를 `/hunt/frontier`로. 로드맵과 시각적으로 구분(별도 그룹/구분선). → 발견 가능 + 분리 동시 충족.

### 컴포넌트

- `FrontierHubPage.tsx` (신규) — 두 개척지 카드(깊은 응시 / 온 하늘) + 각 미션 한 줄 설명.
- `FrontierHuntPage.tsx` (수정) — `mission` prop, 못 4 배지(baseline·sector), 잠정 strong 어법.
- `FrontierVerdict.tsx` / `HuntLog.tsx` (수정) — 미션별 로그 키(`huntLog:kepler` / `huntLog:tess`), 관측량 배지, 잠정 strong.
- `lib/api/hunt.ts` (수정) — 모든 호출에 mission 인자, `?mission=` 부착.

---

## §5. 데이터 소스

### TOI 카탈로그

- 출처: NASA Exoplanet Archive **TOI 테이블** (또는 ExoFOP). 오프라인 다운로드 → `data/toi_catalog.csv` 커밋.
- recorded-gate 열: `tid`(TIC ID). `is_recorded_tess(tic) = tic in {int(r["tid"])}`.
- 규모 ~7,000행 — CSV 로컬 대조로 충분(KOI와 동일 패턴, 새 API 없음).

### TESS 씨드 풀 빌드 (오프라인 일회성)

`scripts/build_frontier_seeds_tess.py`:
1. TIC 후보 표집(관측 sector 있는 밝은 별 풀에서).
2. 각 후보: (i) `lk.search_lightcurve(mission="TESS", exptime="long")` 실존? (ii) `toi_catalog`에 **없음**?
3. 둘 다 충족한 TIC N개 → `data/frontier_seeds_tess.json` (`{"kics": [...]}` 대칭 위해 `{"tics": [...]}`).
4. 런타임은 이 JSON만 읽음(9-B와 동일 — 결정론·즉시·정직).

---

## §6. 재사용 vs 신규 경계

| 그대로 재사용 | 신규/수정 |
|---|---|
| `vetting` 4관문 + de-alias (게이트 수학) | `vet` 이름 짓기 미션화 + report 필드 3개 |
| `bls.run_bls` / `_find_lc_cache` / `_get_full_lc` | (거의 무수정 — mission이 LC 캐시서 흐름) |
| `fetch_lc_by_kic` 구조 | `fetch_lc_by_tic` (형제) |
| `koi_entries`/`is_recorded` 구조 | `is_recorded_tess` (TOI판) |
| `pick_frontier` 구조 | `pick_frontier_tess` |
| `FrontierHuntPage` 흐름 | mission 파라미터화 + 허브 페이지 |
| `DiscoveryActions` (discovery@2) | 그대로 (strong+미기록만 export) |

---

## §7. 테스트 전략

- **백엔드 pytest**: `star_name` 미션 스위치, `is_recorded_tess`(TOI 멤버십), `pick_frontier_tess`(RNG 주입), `n_transits`/잠정 강등 경계. LC/BLS/vet 통합은 캐시 픽스처로.
- **못 4 단위 테스트**: `baseline < 임계`일 때 strong→provisional 강등, `baseline ≥ 임계`면 유지 — 경계값 명시.
- **프론트 vitest**: `huntLog` 미션별 키 분리, mission 파라미터 라우팅.
- **라이브 E2E (마무리)**: 실제 미기록 TIC 하나를 mission=tess로 완주 — 정적 검증이 못 잡는 TESS detrend/alias seam 확인.

---

## §8. 리스크 & 완화

| 리스크 | 완화 |
|---|---|
| TESS 짧은 baseline → 4관문 무력 | **이게 못 4의 존재 이유** — 숨기지 않고 계량 노출·잠정 강등. 결함이 아니라 정직. |
| KIC/TIC ID 충돌 | 라우트 `?mission=` 필수, 기본 kepler 하위호환. |
| detrend SG 윈도우가 Kepler cadence 가정 | `exptime="long"` 강제 → TESS long cadence가 Kepler와 근사. Plan에서 확정. |
| TESS 씨드 빌드가 오래 걸림(네트워크) | 9-B처럼 빌드 타임 1회 오프라인. 런타임 프로브 없음. |
| 허브 승격이 기존 `/hunt/frontier` 링크 깸 | HuntPage 링크는 허브로, Kepler 사냥은 `/kepler` 자식으로 이관 — 리다이렉트/이관 명시. |

---

## §9. Sub-phase 분할

| Sub-phase | 범위 | 산출 |
|---|---|---|
| **sub-10-1** | TESS 사냥 백엔드 — `fetch_lc_by_tic`, `is_recorded_tess`(TOI), 미션 배선(`vet`/라우트), 씨드 빌드 스크립트 + JSON | backend + pytest |
| **sub-10-2** | 못 4 — baseline·sector 노출 + 잠정 strong 강등(백엔드 플래그 + report 필드) | backend + pytest |
| **sub-10-3** | 개척지 허브 + TESS 사냥 UI — `FrontierHubPage`, `FrontierHuntPage` 미션화, nav 발견성, 미션별 로그 | frontend + vitest + 라이브 E2E |

---

*"BLS는 이미 미션을 몰라도 됐다. 우리가 별에 어떤 이름을 붙이느냐만 바꾸면, 같은 판별기가 온 하늘을 심문한다 — 대신 얕게 본 만큼 겸손하게."*
