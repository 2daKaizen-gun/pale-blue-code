# 🌌 Pale Blue Code

> *어릴 적 꿈은 우주과학자였습니다.*  
> *가장 큰 학문을 동경했지만, 결국 가장 작은 학문 — 컴퓨터 공학 — 을 선택했습니다.*  
> *시간이 지나 깨달았습니다. 컴퓨터에도 우주가 있다는 것을.*  
> *Pale Blue Code는 그 두 우주가 만나는 곳입니다.*

<br/>

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r160-000000?logo=three.js&logoColor=white)
![D3.js](https://img.shields.io/badge/D3.js-7-F9A03C?logo=d3.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi&logoColor=white)
![License](https://img.shields.io/badge/License-AGPL_3.0-blue)

<br/>

🔗 **Live**: [pale-blue-code.vercel.app](https://pale-blue-code.vercel.app)

<br/>

## 📖 프로젝트의 영혼

이 프로젝트는 단순한 포트폴리오가 아닙니다.

한국에서 우주과학의 길은 너무 좁았고, 저는 가장 큰 학문 대신 가장 작은 학문을 선택했습니다. 그러나 컴퓨터 공학을 깊이 들여다볼수록 — 비트가 모여 의미가 되고, 알고리즘이 예측 불가능한 패턴을 만들고, 데이터 깊은 곳에는 아직 발견되지 않은 신호가 잠들어 있다는 것을 알게 되었습니다.

**Pale Blue Code는 가장 작은 단위(비트)로 가장 큰 질문(우주)에 다가가는 실험입니다.** NASA가 공개한 천체 데이터를 컴퓨터의 언어로 다시 읽어내며, 최종적으로는 미발견 외계행성을 직접 탐색하는 것을 목표로 합니다.

이름은 칼 세이건의 *Pale Blue Dot* 에서 왔습니다. 보이저 1호가 60억 km 밖에서 찍은 지구 사진 — 우리가 아는 모든 것이 담긴 작은 점. 코드 또한 가장 작은 단위에서 가장 큰 것을 비추는 도구입니다.

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

<br/>

## 🗺️ 8 Phase 로드맵

각 Phase는 독립된 산출물을 가지면서 다음 Phase의 토대가 됩니다. 인류가 우주를 이해해온 순서를 그대로 코드로 다시 그립니다.

| Phase | 이름 | 핵심 질문 | 예상 기간 |
|:---:|---|---|:---:|
| 0 | 출항 준비 — *Pre-flight* | 어떻게 일할 것인가? | 1주 |
| 1 | 기반 — *Foundation* | 토대를 어떻게 놓는가? | 2~3주 |
| 2 | 태양계 — *Solar System* | 우리가 아는 우주는 어떻게 생겼는가? | 3~4주 |
| 3 | 중력 — *Gravity* | 우주는 무엇으로 움직이는가? | 4~5주 |
| 4 | 빛이 휘는 곳 — *Light Bent* | 빛은 무엇 앞에서 휘어지는가? | 3~4주 |
| 5 | 데이터 — *Data* | 우리는 다른 별을 어떻게 알게 되었는가? | 3~4주 |
| 6 | 신호 — *Signal* | 어떻게 행성을 찾는가? | 6~8주 |
| 7 | 사냥 — *Hunt* | 그래서 — 새 행성을 찾을 수 있는가? | 무기한 |

**Phase 1~6 합산**: 약 6~7개월  
**Phase 7**: 별도 트랙, 무기한 진행 — *지금도 이 연구는 계속됩니다.*

> 📜 Phase별 상세 작업은 `docs/phase-handoffs/` 에서 추적됩니다.

<br/>

## 🛠️ 기술 스택

### Frontend
| 카테고리 | 기술 |
|---|---|
| Framework | React 18, TypeScript 5 |
| Build Tool | Vite |
| 2D 시각화 | D3.js, Plotly.js |
| 3D 시각화 | Three.js, React Three Fiber |
| 셰이더 | GLSL (Phase 4) |
| 상태 관리 | Zustand |
| 스타일링 | TailwindCSS |

### Backend (Phase 5부터)
| 카테고리 | 기술 |
|---|---|
| Framework | FastAPI (Python 3.11) |
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
├── docs/
│   ├── COLLABORATION.md             📜 협업 헌장 (약속)
│   ├── WORKFLOW.md                  🔄 PCTC 사이클 (작업)
│   ├── HANDOFF.md                   🛰️ 인수인계 템플릿 (인계)
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
    └── app/
        ├── routers/
        ├── services/
        │   ├── lightkurve_service.py
        │   ├── bls_algorithm.py
        │   └── exoplanet_archive.py
        └── models/
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
uvicorn app.main:app --reload    # http://localhost:8000
```

### 환경 변수

`.env.example` 참고하여 `.env` 생성:

```env
VITE_NASA_API_KEY=your_api_key_here    # https://api.nasa.gov 무료 발급
```

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

🪐 *Phase 7은 끝나지 않습니다. 지금도 새로운 TESS 데이터가 들어올 때마다 외계행성 후보를 탐색하고 있습니다.*
