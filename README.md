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
![Python](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![License](https://img.shields.io/badge/License-AGPL_3.0-blue)
[![Release](https://img.shields.io/github/v/release/2daKaizen-gun/pale-blue-code)](https://github.com/2daKaizen-gun/pale-blue-code/releases)
[![CI](https://github.com/2daKaizen-gun/pale-blue-code/actions/workflows/ci.yml/badge.svg)](https://github.com/2daKaizen-gun/pale-blue-code/actions/workflows/ci.yml)

<br/>

🔗 **Live**: [pale-blue-code.vercel.app](https://pale-blue-code.vercel.app)

<br/>

## 📖 프로젝트의 영혼

이 프로젝트는 단순한 포트폴리오가 아닙니다.

한국에서 우주과학의 길은 너무 좁았고, 저는 가장 큰 학문 대신 가장 작은 학문을 선택했습니다. 그러나 컴퓨터 공학을 깊이 들여다볼수록 비트가 모여 의미가 되고, 알고리즘이 예측 불가능한 패턴을 만들고, 데이터 깊은 곳에는 아직 발견되지 않은 신호가 잠들어 있다는 것을 알게 되었습니다.

**Pale Blue Code는 가장 작은 단위(비트)로 가장 큰 질문(우주)에 다가가는 실험입니다.** NASA가 공개한 천체 데이터를 컴퓨터의 언어로 다시 읽어내며, 최종적으로는 미발견 외계행성을 직접 탐색하는 것을 목표로 합니다.

이름은 칼 세이건의 *Pale Blue Dot* 에서 왔습니다. 보이저 1호가 60억 km 밖에서 찍은 지구 사진 - 우리가 아는 모든 것이 담긴 작은 점. 코드 또한 가장 작은 단위에서 가장 큰 것을 비추는 도구입니다.

<br/>

## 🔭 무엇을 찾았나 — 결과

> **TESS 섹터 102–106에서, 어떤 행성 카탈로그(TOI)에도 없는 가장 작은 왜성 328개를
> 단일 트랜짓으로 뒤졌습니다. 유의한 이벤트 55개는 전부 계기 인공물로 판명됐고,
> 살아남은 후보는 0개입니다.**

- 그 빈손은 **실측 감도와 함께** 진술됩니다: 22개 별은 지구 크기까지, 중앙값 별은
  4.7 R⊕까지 볼 수 있었습니다. 그보다 작은 행성에 대해서는 아무것도 말하지 않습니다.
- 행성 발생률·궤도 기하·관측 시간·실측 감도로 계산한 **기대 발견 수는 0.42개,
  아무것도 못 찾을 확률 66%** — 0은 시작 전부터 가장 그럴듯한 답이었습니다.
- 망원경이 없으니 이 파이프라인이 도달할 수 있는 최고점은 "후보"이고, 확정은 우리 천장 밖입니다.
  그래서 끝은 발견이 아니라 **진술된 결과 + 계속 도는 도구**입니다. 문은 열려 있습니다.

📄 **최종 보고서: [`docs/report/final-report.md`](./docs/report/final-report.md)** — 방법, 실측 임계, 섹터별
결과, 감도, 기대 수율, 한계, 재현 명령.

<br/>

## ✨ 무엇이 들어 있나

**📖 배우기** — 인류가 우주를 이해해 온 순서대로

| | |
|---|---|
| 🪐 태양계 3D | Three.js로 8개 행성의 공전 |
| ⚛️ N-body 중력 | Runge-Kutta 4차 적분, 보존량(에너지·각운동량) 게이지로 적분기의 정직성을 보여줌 |
| 🕳️ 블랙홀 | GLSL 셰이더로 중력 렌즈 |
| 🔭 외계행성 DB | NASA Exoplanet Archive의 확인된 외계행성 6,000여 개 |
| 📉 광도곡선 · 🎯 BLS | 케플러/TESS 데이터에서 transit 검출, Box Least Squares 직접 구현 |

**🛰 사냥하기** — 진짜 하늘을 뒤지는 라이브 도구

| | |
|---|---|
| 🔎 반복 트랜짓 판별 | 4관문(홀짝·2차식·모양·크기) + 검출 유의성 전제조건 — NASA 표준 재구현 |
| 🌌 개척지 | KOI/TOI에 *없는* 별만, 최신 TESS 섹터를 2주마다 자동 갱신 |
| ⚡ 단일 트랜짓 사냥 | 정합필터 → 유의성 5σ → 실측으로 정한 판별자 5개(edge·coherence·flare·symmetry·baseline) |
| 🌍 지구크기 dossier | 지구 크기까지 감도가 닿은 별과 그 판정, 후속확인(ExoFOP/TFOP) 경로 |

<br/>

## 🗺️ 여정

Phase 0(출항 준비)부터 8(사냥)까지 학습 트랙을 완성한 뒤, 판별(9-A) → 울타리 열기(9-B) →
온 하늘(10, TESS) → 기계가 놓친 것(11, 단일 트랜짓) → 하늘을 닫으며(12, v1.0)로 이어졌습니다.
Phase별 서사와 사냥 일지는 **[`docs/journey.md`](./docs/journey.md)**, sub-phase마다의 회고는
[`docs/checks/`](./docs/checks/), 인계는 [`docs/phase-handoffs/`](./docs/phase-handoffs/)에 있습니다.

<br/>

## 🚀 시작하기

### 사전 요구사항
- Node.js 20.19+ (CI는 24)
- Python 3.12+ (CI·배포·`requirements.txt` 고정 기준 3.12, 개발 PC는 3.14)

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/2daKaizen-gun/pale-blue-code.git
cd pale-blue-code

# Frontend
cd frontend
npm ci
npm run dev          # http://localhost:5173

# Backend (Phase 5 이후)
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000   # http://localhost:8000

# 테스트
cd backend && pip install -r requirements-dev.txt && python -m pytest
cd frontend && npm run lint && npm run build && npx vitest run
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

<br/>

## 🗂️ 문서 지도

| 문서 | 무엇 |
|---|---|
| [`docs/report/final-report.md`](./docs/report/final-report.md) | 최종 보고서 — 결과의 정본 |
| [`docs/journey.md`](./docs/journey.md) | Phase 0~12의 여정과 사냥 일지 |
| [`docs/architecture.md`](./docs/architecture.md) | 기술 스택과 폴더 구조 |
| [`docs/maintenance.md`](./docs/maintenance.md) | v1.0 이후 — 저절로 도는 것, 새 섹터 사냥 절차, 후보가 나오면 |
| [`docs/deploy.md`](./docs/deploy.md) | 배포·운영·비용 런북 |
| [`docs/observations/instrument-log.md`](./docs/observations/instrument-log.md) | 별별 실측 원장 |
| [`docs/vision/`](./docs/vision/) | 북극성 문서 — 방향과 천장 |

**협업 방식.** 이 프로젝트는 **Claude (Anthropic)** 와의 페어 프로그래밍으로 진행됐습니다.
[`COLLABORATION.md`](./docs/COLLABORATION.md)(약속) · [`WORKFLOW.md`](./docs/WORKFLOW.md)(PCTC 사이클:
Plan-Code-Test-Check) · [`HANDOFF.md`](./docs/HANDOFF.md)(Phase 인계) 세 문서로, 긴 협업에서 맥락이 썩거나
불안해지는 것(Context Rot / Anxiety)을 막았습니다.

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

🪐 *하늘은 닫히지 않습니다. 판별기를 벼렸고(9-A), 아무도 안 간 별을 사냥했으며(9-B), 사냥터를 온 하늘로 넓혔습니다(10, Skyward). 기계가 눈먼 곳 — 단일 트랜짓 — 을 겨누는 도구를 지었고(11), 진짜 별 328개에 대봤습니다. 대부분 조용했고, 그 조용함을 감도와 함께 정직하게 기록한 뒤 v1.0으로 맺었습니다(12) — 그것이 진짜 발견이 서 있을 바닥입니다.*
