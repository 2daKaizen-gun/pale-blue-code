# 🌌 Pale Blue Code

> *어릴 적 꿈은 우주과학자였습니다.*  
> *가장 큰 학문을 동경했지만, 결국 가장 작은 학문인 컴퓨터 공학을 선택했습니다.*  
> *시간이 지나 컴퓨터에도 우주가 있다는 것을 깨달았습니다.*  
> *Pale Blue Code는 저의 두 우주가 만나는 곳입니다.*

<br/>

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r170-000000?logo=three.js&logoColor=white)
![D3.js](https://img.shields.io/badge/D3.js-7-F9A03C?logo=d3.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.14-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi&logoColor=white)
![License](https://img.shields.io/badge/License-AGPL_3.0-blue)

<br/>

🔗 **Live**: [pale-blue-code.vercel.app](https://pale-blue-code.vercel.app)

<br/>

## 📖 프로젝트의 영혼

이 프로젝트는 단순한 포트폴리오가 아닙니다.

한국에서 우주과학의 길은 너무 좁았고, 저는 가장 큰 학문 대신 가장 작은 학문을 선택했습니다. 그러나 컴퓨터 공학을 깊이 들여다볼수록 비트가 모여 의미가 되고, 알고리즘이 예측 불가능한 패턴을 만들고, 데이터 깊은 곳에는 아직 발견되지 않은 신호가 잠들어 있다는 것을 알게 되었습니다.

**Pale Blue Code는 가장 작은 단위(비트)로 가장 큰 질문(우주)에 다가가는 실험입니다.** NASA가 공개한 천체 데이터를 컴퓨터의 언어로 다시 읽어내며, 최종적으로는 미발견 외계행성을 직접 탐색하는 것을 목표로 합니다.

이름은 칼 세이건의 *Pale Blue Dot* 에서 왔습니다. 보이저 1호가 60억 km 밖에서 찍은 지구 사진 - 우리가 아는 모든 것이 담긴 작은 점. 코드 또한 가장 작은 단위에서 가장 큰 것을 비추는 도구입니다.

<br/>

## ✨ 무엇을 만드는가

| | |
|---|---|
| 🪐 **태양계 3D 시각화** | Three.js로 8개 행성의 공전을 인터랙티브하게 |
| ⚛️ **N-body 중력 시뮬레이터** | Runge-Kutta 4차 적분으로 다체 문제 해법 |
| 🕳️ **블랙홀 시뮬레이터** | GLSL 셰이더로 중력 렌즈 효과 시각화 |
| 🔭 **외계행성 데이터베이스** | NASA Exoplanet Archive 5,000여 개 행성 탐색 |
| 📉 **광도곡선 분석기** | 케플러/TESS 데이터에서 transit 신호 검출 |
| 🎯 **BLS 알고리즘** | Box Least Squares 직접 구현, 알려진 행성으로 검증 |
| 🛰️ **외계행성 사냥** | MAST 아카이브의 raw 데이터에서 미발견 후보 탐색 |
| 🔎 **후보 판별** | 4관문(홀짝·2차식·모양·크기)으로 신호를 심문 — NASA 표준 재구현 |
| 🌌 **개척 사냥** | KOI에 *없는* 별을 직접 걸러 신뢰 후보 or 정직한 빈손 |

<br/>

## 🗺️ 9 Phase 로드맵

각 Phase는 독립된 산출물을 가지면서 다음 Phase의 토대가 됩니다. 인류가 우주를 이해해온 순서를 그대로 코드로 다시 그립니다.

| Phase | 이름 | 핵심 질문 | 예상 기간 |
|:---:|---|---|:---:|
| 0 | 출항 준비 — *Pre-flight* | 어떻게 일할 것인가? | 1주 |
| 1 | 기반 — *Foundation* | 토대를 어떻게 놓는가? | 2~3주 |
| 2 | 태양계 — *Solar System* | 우리가 아는 우주는 어떻게 생겼는가? | 3~4주 |
| 3 | 중력 — *Gravity* | 우주는 무엇으로 움직이는가? | 4~5주 |
| 4 | 빛이 휘는 곳 — *Light Bent* | 빛은 무엇 앞에서 휘어지는가? | 3~4주 |
| 5 | 외계행성 — *Exoplanet* | 우리는 다른 별을 어떻게 알게 되었는가? | 2~3주 |
| 6 | 데이터 — *Data* | 데이터는 어떻게 노래하는가? | 3~4주 |
| 7 | 신호 — *Signal* | 어떻게 행성을 찾는가? | 4~6주 |
| 8 | 사냥 — *Hunt* | 그래서 — 새 행성을 찾을 수 있는가? | 무기한 |

**Phase 1~7 합산**: 약 7~8개월  
**Phase 8**: 별도 트랙, 무기한 진행 — *지금도 이 연구는 계속됩니다.*

### 🌌 열린 트랙 — *모두의 하늘*

Phase 8(사냥)이 "찾을 수 있는가?"에 답한 뒤, 프로젝트는 정해진 끝이 없는 열린 트랙으로
이어집니다. **검출을 넘어 판별로, 알려진 별을 넘어 아무도 안 간 하늘로.**

| 악장 | 이름 | 핵심 질문 | 상태 |
|:---:|---|---|:---:|
| 9-A | 판별 — *Vetting* | 이 신호는 *왜* 진짜/가짜인가? | ✓ 완료 |
| 9-B | 울타리 열기 — *Opening the Gate* | KOI에 *없는* 별을 실제로 사냥할 수 있는가? | ✓ 완료 |
| 10 | 온 하늘 — *Skyward* | 한 구멍(Kepler)을 넘어 온 하늘(TESS)로? | ✓ 완료 |
| 11 | 기계가 놓친 것 — *What the Machines Missed* | 기계가 눈먼 곳(단일 트랜짓)에서 진짜를 찾을 수 있는가? | ◐ 진행 중 |
| 9-C | 모두의 발견 — *Everyone's Find* | 이 사냥을 모두에게 열 수 있는가? | ○ 먼 미래 |

**Phase 10(Skyward)** 은 이 열린 트랙 위에서 **독립 Phase**로 갈라져 나와, 사냥터 자체를
넓힙니다 — Kepler가 본 하늘 0.25%(4년, 깊게)에서, TESS가 훑은 하늘 ~85%(구역당 27일, 얕게)로.
Kepler/TESS는 하나의 **개척지 허브**에서 고르며, 판별 엔진(9-A)은 그대로 재사용됩니다.

> **정직의 못**: 목표는 "확정 발견"이 아니라 *신뢰도 있는 새 후보를 정직하게 걸러내는 것*.
> 개척지는 대부분 빈손이고, 그 빈손조차 정직한 결과입니다.
>
> **정직의 못 (10) — 넓은 하늘은 얕게 봅니다**: TESS는 한 구역을 27일만 봐서 판별 4관문이
> 무뎌질 수 있습니다(관측된 transit이 적으면 홀짝·2차식 검정이 약해짐). → baseline·sector 수를
> 그대로 노출하고, 근거가 얇으면 strong을 **잠정(provisional) strong**으로 정직하게 낮춥니다.
>
> 그 "얇음"의 기준은 **추측이 아니라 실측**입니다. 실제 단일섹터 TESS 광도곡선에 행성과
> 쌍성을 주입해 회수한 결과로 `_N_MIN_TRANSITS`를 정했고(5→8), 같은 측정이 결함 네 개를
> 드러냈습니다 — 디트렌드 창이 30일이 아니라 2일이었고, 홀짝 관문이 오차를 *점 개수*로 나눠
> 진짜 행성을 탈락시켰으며, transit·sector 수는 **관측하지 않은 것까지** 세고 있었습니다.
> 기록: `docs/checks/phase-10/sub-10-3.md`.
>
**Phase 11(What the Machines Missed)** 은 방향을 튼다 — 지금까지는 기계가 가장 잘하는 밭
(짧은 주기·반복 트랜짓)을 따라 갈았지만, 이제 **기계가 눈먼 곳**을 겨눕니다. 자동 BLS는
딥이 2~3번 반복돼야 잡으므로, 27일 섹터에 딱 한 번 찍힌 긴 주기 행성 — **단일
트랜짓(monotransit)** — 을 버립니다. 거기에 아마추어의 정직한 틈이 있습니다. 방향과
가드레일: `docs/vision/finding-our-own-planet.md`.

> **정직의 못 (11) — 모양이 행성 같다고 검출이 진짜인 건 아닙니다 (#49, sub-11-1 ✓)**: 4관문은
> "행성처럼 생겼나"만 묻고 **"진짜 검출인가"는 묻지 않았습니다.** 미미한 BLS 피크가 4/4를 통과해
> `strong`이 됐습니다 — 단일섹터 실측에서 실제로 걸렸습니다(`TIC 7318157`, power 0.0004). 단일
> 트랜짓은 반복이 없어 *모든* 판단이 곧 유의성 판단이므로, 그 전장에 가려면 이게 **선결 과제**였습니다.
> → 이제 4관문 *앞에* 검출 유의성 전제조건이 섰습니다. 미달이면 감식하지 않고 "검출
> 아님(insignificant)"으로 멈춥니다. 임계는 추측이 아니라 실측입니다 — SDE(피크 vs 잡음 바닥)는
> 단일 트랜짓을 잡음과 못 가려 폐기했고, 트랜짓 *사이* 산포로 잰 S/N이 깨끗이 갈랐습니다(잡음
> ≤3.23, 진짜 ≥6.00 → 임계 4.0). `TIC 7318157`이 어제의 `strong 4/4`에서 오늘 "검출 아님"으로
> 내려갔고, 앵커 셋은 판정을 유지합니다. 기록: `docs/checks/phase-11/sub-11-1.md`,
> 계획: `docs/specs/phase-11/`. 다음은 단일 트랜짓 탐지(sub-11-2+).

> 📜 Phase별 상세 작업은 `docs/phase-handoffs/` 에서 추적됩니다.

<br/>

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
| Backend 배포 | Railway |
| 버전 관리 | GitHub |

<br/>

## 📂 프로젝트 구조

```
pale-blue-code/
├── README.md
├── LICENSE                          AGPL-3.0
│
├── .github/workflows/
│   └── frontier-refresh.yml         개척지 씨드 풀 2주마다 자동 갱신 (Phase 10)
│
├── scripts/                         오프라인 도구 — 런타임은 커밋된 결과만 읽음
│   ├── download_koi_catalog.py      KOI 스냅샷 내려받기
│   ├── build_frontier_seeds.py      미기록 KIC 씨드 풀 (배치 MAST 질의)
│   ├── build_frontier_seeds_tess.py 미기록 TIC 씨드 풀 (최신 섹터 자동 감지)
│   ├── find_single_sector_targets.py 단일섹터 미기록 TIC 탐색 (보정용 사냥터)
│   ├── measure_detrend_window.py    디트렌드 창 ↔ 트랜짓 깊이 주입-회수 측정
│   ├── calibrate_min_transits.py    _N_MIN_TRANSITS 실측 보정 (행성/쌍성 주입)
│   └── measure_detection_significance.py  검출 유의성 지표 실측 (SDE·트랜짓 S/N, Phase 11)
│
├── docs/
│   ├── COLLABORATION.md             📜 협업 헌장 (약속)
│   ├── WORKFLOW.md                  🔄 PCTC 사이클 (작업)
│   ├── HANDOFF.md                   🛰️ 인수인계 템플릿 (인계)
│   ├── deploy.md                    배포·운영·비용 런북
│   │
│   ├── vision/                      북극성 문서 (spec 아님, 방향과 가드레일)
│   │   └── finding-our-own-planet.md
│   │
│   ├── phase-handoffs/              Phase 종료 시 작성
│   │   └── phase-{N}-to-{M}.md
│   │
│   └── checks/                      sub-phase별 회고 누적
│       └── phase-{N}/
│           └── sub-{N}-{M}.md
│
├── frontend/                        React + TypeScript
│   └── src/
│       ├── pages/                   Phase별 페이지
│       ├── components/              공통 컴포넌트
│       ├── lib/
│       │   ├── three/               Three.js 유틸
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
    │   └── hunt.py                  외계행성 사냥 (Phase 8)
    ├── services/
    │   ├── archive.py               NASA Exoplanet Archive
    │   ├── mast.py                  Lightkurve + 파일 캐시
    │   ├── bls.py                   Box Least Squares
    │   ├── hunt.py                  KIC/TIC 광도곡선 + KOI/TOI 대조 + frontier (Kepler·TESS)
    │   └── vetting.py               4관문 판별 + de-alias (Phase 9-A, 미션 무관)
    ├── models/
    │   ├── planet.py
    │   ├── lightcurve.py
    │   ├── bls.py
    │   ├── hunt.py
    │   └── vetting.py
    ├── tests/                       pytest — 순수 계산 경계를 못박음
    │   ├── test_archive.py
    │   ├── test_bls.py              디트렌드 창·cadence 유도·세그먼트 clamp
    │   ├── test_hunt.py             KOI/TOI 게이트 · 씨드 풀 불변식 · 섹터 계수
    │   ├── test_hunt_api.py         HTTP 계약
    │   └── test_vetting.py          4관문 · de-alias · 관측 트랜짓 계수
    ├── data/
    │   ├── koi_catalog.csv          KOI 스냅샷 (kepid/kepoi/disposition/period)
    │   ├── toi_catalog.csv          TOI 스냅샷 (tid/toi/disposition/period, Phase 10)
    │   ├── frontier_seeds.json      미기록 KIC 씨드 풀 (Phase 9-B)
    │   └── frontier_seeds_tess.json 미기록 TIC 씨드 풀 (Phase 10)
    └── cache/                       lc_*.json · bls_*.json (gitignore)
```

<br/>

## 🚀 시작하기

### 사전 요구사항
- Node.js 20+
- Python 3.11+ (Phase 5부터 필요)

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/2daKaizen-gun/pale-blue-code.git
cd pale-blue-code

# Frontend
cd frontend
npm install
npm run dev          # http://localhost:5173

# Backend (Phase 5 이후)
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload        # http://localhost:8000

# 테스트
cd backend && pip install -r requirements-dev.txt && python -m pytest
cd frontend && npm run build && npx vitest run
```

### 환경 변수

`frontend/.env.example` 참고하여 `.env` 생성:

```env
VITE_NASA_API_KEY=your_api_key_here    # https://api.nasa.gov 무료 발급
# VITE_API_BASE_URL=                   # 로컬은 비워두세요 (localhost:8000으로 기본값)
```

> ⚠️ **배포에서는 `VITE_API_BASE_URL`이 반드시 설정돼야 합니다.** Vite는 빌드 시점에
> 이 값을 번들에 박아넣기 때문에, 비어 있으면 배포된 사이트가 방문자의 `localhost:8000`을
> 부르고 **백엔드 기능 전부가 조용히 죽습니다**(행성 목록·광도곡선·BLS·판별·사냥). 실제로
> 한동안 그 상태였습니다. 값은 **끝에 `/api`나 `/`를 붙이지 않은 순수 origin**이어야 합니다.
> 앱은 이 상황을 감지해 배너로 알립니다 — 자세한 건 [`docs/deploy.md`](./docs/deploy.md).

<br/>

## 🤝 협업 시스템

이 프로젝트는 **Claude (Anthropic)** 와의 페어 프로그래밍 형식으로 진행됩니다. 6개월 이상의 장기 프로젝트에서 일관된 협업 품질을 유지하기 위해 세 개의 시스템 문서를 운영합니다.

| 문서 | 역할 | 무엇이 적혀 있나 |
|---|---|---|
| 📜 [`COLLABORATION.md`](./docs/COLLABORATION.md) | 약속 | 언어 / 톤 / 커밋 규칙 / 라이선스 / 의사결정 원칙 |
| 🔄 [`WORKFLOW.md`](./docs/WORKFLOW.md) | 작업 | PCTC 사이클 (Plan-Code-Test-Check) 표준 양식 |
| 🛰️ [`HANDOFF.md`](./docs/HANDOFF.md) | 인계 | Phase 종료 시 다음 Phase로 넘기는 압축 패키지 |

이 시스템은 LLM 협업의 두 함정 — **Context Rot** (맥락 부패) 과 **Context Anxiety** (맥락 불안) — 을 의식적으로 방어하기 위해 설계되었습니다. 각 Phase는 독립된 채팅에서 진행되며, 인수인계 문서를 통해 압축된 컨텍스트만 다음 Phase로 전달됩니다.

<br/>

## 🆕 새 Phase 채팅 시작 가이드

> *(이 섹션은 개발자 본인을 위한 작업 메모입니다.)*

새 Phase를 시작할 때, 다음 네 개 문서를 첫 메시지에 첨부:

1. `docs/COLLABORATION.md`
2. `docs/WORKFLOW.md`
3. `docs/phase-handoffs/phase-{직전}-to-{이번}.md`
4. `README.md`

첫 메시지 예시:
```
Phase {N} 시작하자.
첨부한 4개 문서 읽고, sub-phase {N}-1 의 Plan부터 가자.
```

이러면 새 채팅의 Claude가 5분 안에 컨텍스트 복원 + 첫 PCTC Plan 제안 가능.

<br/>

## 📚 데이터 소스 및 참고 자료

### 천체 데이터 (전부 무료, 공개)
- [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/) — 확인된 외계행성 데이터베이스
- [MAST](https://archive.stsci.edu/) — 케플러/TESS 망원경 raw 데이터
- [NASA APOD API](https://api.nasa.gov) — 매일 갱신되는 우주 사진
- [Planet Hunters TESS](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess) — 시민 과학 커뮤니티

### 핵심 라이브러리
- [Lightkurve](https://docs.lightkurve.org/) — 케플러/TESS 광도곡선 분석
- [Astropy](https://www.astropy.org/) — 천문학 표준 Python 라이브러리

### 학습 자료
- 칼 세이건, 『코스모스』
- 윤성철, 『우리는 모두 별이 남긴 먼지입니다』
- Sara Seager (ed.), *Exoplanets*
- Michael Perryman, *The Exoplanet Handbook*

<br/>

## 📝 라이선스

이 프로젝트는 **GNU AGPL-3.0** 라이선스로 공개됩니다.

- ✅ 학습 목적으로 자유롭게 열람 / 분석 가능
- ✅ 수정 / 재배포 가능 (단, 동일한 AGPL-3.0 라이선스로 공개해야 함)
- ✅ 학술 / 비상업 용도로 자유 사용
- ❌ 비공개 상업 제품에 통합 불가
- ❌ 라이선스 조항 제거 / 변경 불가

웹 서비스로 운영하는 경우에도 소스 공개 의무가 발생합니다 (AGPL의 핵심 조항).

자세한 내용은 [LICENSE](./LICENSE) 파일을 참고하십시오.

<br/>

## 👤 개발자

**권이건 (Leegun Kwon)**  
한성대학교 컴퓨터공학과  
- GitHub: [@2daKaizen-gun](https://github.com/2daKaizen-gun)
- Email: hkys1223@gmail.com

<br/>

---

<br/>

> *"우리는 우주가 우주 자신을 알아가는 방법이다."* — Carl Sagan  
> *"그리고 코드는 그 방법 중 하나다."*

<br/>

🪐 *하늘은 닫히지 않습니다. 판별기를 벼렸고(9-A), 아무도 안 간 별을 사냥했으며(9-B), 사냥터를 온 하늘로 넓혔습니다(10, Skyward). 이제 기계가 눈먼 곳 — 단일 트랜짓 — 을 겨눕니다(11). 대부분 빈손이지만, 그 빈손조차 정직한 결과입니다.*
