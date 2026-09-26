# 구조와 기술 스택

> README에서 옮겨 옴 (2026-09-27, v1.0).

## 🛠️ 기술 스택

### Frontend
| 카테고리 | 기술 |
|---|---|
| Framework | React 19, TypeScript 6 |
| Build Tool | Vite |
| 2D 시각화 | D3.js |
| 3D 시각화 | Three.js, React Three Fiber |
| 셰이더 | GLSL (Phase 4) |
| 상태 관리 | Zustand |
| 스타일링 | TailwindCSS |

### Backend (Phase 5부터)
| 카테고리 | 기술 |
|---|---|
| Framework | FastAPI (Python 3.14) |
| 과학 계산 | NumPy, SciPy, Astropy |
| 천문학 라이브러리 | Lightkurve, AstroQuery |
| 데이터 처리 | Pandas |

### Infra
| 카테고리 | 기술 |
|---|---|
| Frontend 배포 | Vercel |
| Backend 배포 | Railway (데모 때만 — 평소엔 로컬) |
| CI | GitHub Actions — pytest · eslint · vitest · build, 프론티어 풀 2주 자동 갱신 |
| 버전 관리 | GitHub |

<br/>

## 📂 프로젝트 구조

```
pale-blue-code/
├── README.md
├── LICENSE                          AGPL-3.0
│
├── .github/workflows/
│   ├── ci.yml                       push·PR마다 pytest · eslint · build · vitest
│   └── frontier-refresh.yml         개척지 씨드 풀 2주마다 자동 갱신 (Phase 10)
│
├── scripts/                         오프라인 도구 — 런타임은 커밋된 결과만 읽음
│   ├── download_koi_catalog.py      KOI 스냅샷 내려받기
│   ├── build_frontier_seeds.py      미기록 KIC 씨드 풀 (배치 MAST 질의)
│   ├── build_frontier_seeds_tess.py 미기록 TIC 씨드 풀 (최신 섹터 자동 감지)
│   ├── find_single_sector_targets.py 단일섹터 미기록 TIC 탐색 (보정용 사냥터)
│   ├── measure_detrend_window.py    디트렌드 창 ↔ 트랜짓 깊이 주입-회수 측정
│   ├── calibrate_min_transits.py    _N_MIN_TRANSITS 실측 보정 (행성/쌍성 주입)
│   ├── measure_detection_significance.py  검출 유의성 지표 실측 (SDE·트랜짓 S/N, Phase 11)
│   ├── measure_monotransit_false_alarm.py 단일 트랜짓 오경보율 실측 (Phase 11)
│   ├── measure_monotransit_completeness.py 단일 트랜짓 완전성 (주입-회수, Phase 11)
│   ├── measure_monotransit_significance.py 단일 트랜짓 유의성 임계 실측 (Phase 11)
│   ├── measure_baseline_step.py     baseline 판별자 임계 실측 — 램프/트랜짓 갭 (sub-11-18)
│   ├── fetch_plausible.py           유력 왜성 광도곡선 로컬 fetch (Phase 11, MAST)
│   ├── search_pending.py            fetch됐지만 미검색인 왜성 검색 (fetch/search/count 삼종의 가운데)
│   ├── tally_hunt.py                캐시에서 누적 사냥 집계 재계산 (Phase 11)
│   ├── completeness_hunt.py         실측 바닥에서 달성 감도 보고 — null의 정직한 한계 (sub-11-19)
│   ├── rank_by_sensitivity.py       실측 floor로 별을 줄 세움 — 지구크기에 닿은 표적 (path A)
│   ├── measure_flux_choice.py       감도 레버 1 — SAP vs PDCSAP (sub-11-23, null)
│   ├── measure_detrend_floor.py     감도 레버 2 — detrend 창 ↔ floor (sub-11-24, null)
│   ├── inspect_target_sectors.py    감도 레버 3 정찰 — 표적의 섹터·baseline (sub-11-24)
│   ├── measure_binning_floor.py     감도 레버 4 — binning ↔ floor (sub-11-25, null)
│   ├── earth_size_dossier.py        지구크기 감도 표적 + 실측 floor + 후속확인 경로 (결정 D)
│   ├── predict_earth_reach.py       안 본 별의 지구크기 도달 예측 + held-out 실력 보고 (넓히기)
│   └── expected_yield.py            기대 수율 — 발생률×기하×관측시간×실측감도 (Phase 12)
│
├── docs/
│   ├── COLLABORATION.md             📜 협업 헌장 (약속)
│   ├── WORKFLOW.md                  🔄 PCTC 사이클 (작업)
│   ├── HANDOFF.md                   🛰️ 인수인계 템플릿 (인계)
│   ├── deploy.md                    배포·운영·비용 런북
│   ├── maintenance.md               v1.0 이후 유지 모드 — 새 섹터 사냥 절차, 후보가 나오면
│   ├── journey.md                   Phase 0~12 여정과 사냥 일지 (README에서 옮김)
│   ├── architecture.md              이 문서
│   │
│   ├── report/
│   │   └── final-report.md          최종 보고서 — 결과의 정본 (Phase 12)
│   │
│   ├── vision/                      북극성 문서 (spec 아님, 방향과 가드레일)
│   │   ├── finding-our-own-planet.md   단일 트랜짓으로 진짜 발견 (Phase 11 방향)
│   │   └── making-the-tool-legible.md  도구를 읽히게 (하나의 어휘·하나의 이야기)
│   │
│   ├── observations/                실측 장부 — 진짜 별에 검출기를 댄 정직한 기록
│   │   └── instrument-log.md           별별 실측 결과 + 감도 레버 실측 (Phase 11)
│   │
│   ├── issues/                      GitHub 이슈 본문 원고 (issue-{N}-{M}-body.md)
│   │
│   ├── phase-handoffs/              Phase 종료 시 작성
│   │   └── phase-{N}-to-{M}.md
│   │
│   └── checks/                      sub-phase별 회고 누적 (회고의 정본)
│       ├── phase-{N}/
│       │   └── sub-{N}-{M}.md
│       └── infra/                   Phase 밖 인프라 회고 (배포 부활 등)
│
├── frontend/                        React + TypeScript
│   └── src/
│       ├── pages/                   Phase별 페이지
│       ├── components/              공통 컴포넌트
│       ├── lib/
│       │   ├── physics/             N-body 적분기
│       │   └── api/                 백엔드 클라이언트
│       └── styles/                  디자인 토큰
│
└── backend/                         FastAPI (Phase 5+)
    ├── main.py
    ├── routers/
    │   ├── planets.py               NASA Exoplanet Archive
    │   ├── lightcurves.py           광도곡선 (Phase 6)
    │   ├── bls.py                   BLS 주기 탐색 (Phase 7)
    │   ├── hunt.py                  외계행성 사냥 (Phase 8)
    │   └── monotransit.py           단일 트랜짓 사냥·풀·fetch-plan (Phase 11)
    ├── services/
    │   ├── archive.py               NASA Exoplanet Archive
    │   ├── mast.py                  Lightkurve + 파일 캐시
    │   ├── bls.py                   Box Least Squares
    │   ├── hunt.py                  KIC/TIC 광도곡선 + KOI/TOI 대조 + frontier (Kepler·TESS)
    │   ├── vetting.py               4관문 판별 + de-alias (Phase 9-A, 미션 무관)
    │   ├── monotransit.py           단일 트랜짓: 정합필터·유의성·판별자·최소주기·최대온도 (Phase 11)
    │   ├── pool_assessment.py       개척지 풀 트리아지 — 검출이 행성일 수 있는 곳 (Phase 11)
    │   └── fetch_plan.py            유력 왜성 fetch 계획 (캐시 대조, Phase 11)
    ├── models/
    │   ├── planet.py
    │   ├── lightcurve.py
    │   ├── bls.py
    │   ├── hunt.py
    │   ├── vetting.py
    │   └── monotransit.py           생존자·원장·풀·fetch-plan 스키마 (Phase 11)
    ├── tests/                       pytest — 순수 계산 경계를 못박음
    │   ├── test_archive.py
    │   ├── test_bls.py              디트렌드 창·cadence 유도·세그먼트 clamp
    │   ├── test_hunt.py             KOI/TOI 게이트 · 씨드 풀 불변식 · 섹터 계수
    │   ├── test_hunt_api.py         HTTP 계약
    │   ├── test_vetting.py          4관문 · de-alias · 관측 트랜짓 계수
    │   ├── test_monotransit.py      정합필터·유의성·판별자·최소주기·최대온도·사냥 원장 (Phase 11)
    │   ├── test_monotransit_api.py  단일 트랜짓 HTTP 계약 (Phase 11)
    │   ├── test_pool_assessment.py  풀 트리아지 기하 · 달성 완전성 (Phase 11)
    │   ├── test_fetch_plan.py       fetch 계획 (Phase 11)
    │   └── test_*.py                오프라인 도구도 순수부를 테스트 (tally · rank · 레버 3종 · dossier · 예측기)
    ├── data/
    │   ├── koi_catalog.csv          KOI 스냅샷 (kepid/kepoi/disposition/period)
    │   ├── toi_catalog.csv          TOI 스냅샷 (tid/toi/disposition/period, Phase 10)
    │   ├── frontier_seeds.json      미기록 KIC 씨드 풀 (Phase 9-B)
    │   ├── frontier_seeds_tess.json 미기록 TIC 씨드 풀 — 최신 섹터, 2주 자동 갱신 (Phase 10)
    │   ├── pool_s0104.json          섹터 104 왜성 풀 (이력에서 복원, 100/100 완주)
    │   ├── pool_s0105.json          섹터 105 왜성 풀 (이력에서 복원, 100/100 완주)
    │   ├── pool_s0103.json          섹터 103 왜성 풀 (--pool, sub-11-21 · 100/100 완주)
    │   ├── pool_s0102.json          섹터 102 왜성 풀 (--pool, sub-11-27 · 12-1)
    │   └── pool_s0106.json          섹터 106 왜성 풀 (고정, 12-2)
    └── cache/                       lc_*.json · bls_*.json · mono_*.json (gitignore)
                                     mono_*.json = 사냥 결과 디스크 메모 (sub-11-12, 즉시 로딩)
```
