# Pale Blue Code

**[한국어](#ko)** · **[日本語](#ja)** · **[English](#en)**

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

**Live**: [pale-blue-code.vercel.app](https://pale-blue-code.vercel.app)

<a id="ko"></a>

## 소개

NASA 공개 데이터로 외계행성을 공부하고, 직접 찾아보는 웹 앱입니다.

어릴 때 꿈은 우주과학자였는데, 전공은 컴퓨터공학을 골랐습니다. 둘을 같이 해보고 싶어서 시작했습니다.
이름은 칼 세이건의 *Pale Blue Dot*에서 따왔습니다.

공개 사이트는 프론트엔드만 상시로 떠 있습니다. 태양계·중력·블랙홀 화면은 바로 되지만, NASA 데이터를 쓰는
화면(외계행성 DB·광도곡선·BLS·사냥)은 백엔드가 필요합니다. 백엔드는 비용 때문에 평소엔 꺼 두고 있어서,
전부 보려면 아래 [시작하기](#시작하기)대로 로컬에서 실행해 주세요.

## 결과

TESS 섹터 102–106에서 행성 카탈로그(TOI)에 없는 작은 왜성 328개를 단일 트랜짓 방식으로 조사했습니다.
눈에 띄는 신호 55개가 나왔지만 모두 관측 장비 쪽 노이즈였고, 남은 후보는 0개입니다.

- 별마다 어느 크기의 행성까지 잡을 수 있었는지 같이 기록했습니다. 22개 별은 지구 크기까지,
  중앙값 별은 4.7 R⊕까지 볼 수 있었습니다.
- 행성 발생률, 궤도 기하, 관측 시간, 실측 감도로 계산한 기대 발견 수는 0.42개(하나도 못 찾을 확률 66%)였습니다.
  0개라는 결과 자체는 예상 범위 안입니다.
- 망원경이 없어서 이 도구가 할 수 있는 건 "후보"까지입니다. 확정은 추가 관측이 필요합니다.

자세한 방법과 수치, 재현 명령은 [최종 보고서](./docs/report/final-report.md)에 있습니다.

## 기능

**배우기**

| | |
|---|---|
| 태양계 3D | Three.js로 8개 행성의 공전 |
| N-body 중력 | RK4 적분. 에너지·각운동량이 보존되는지 같이 표시 |
| 블랙홀 | GLSL 셰이더로 중력 렌즈 |
| 외계행성 DB | NASA Exoplanet Archive의 확인된 외계행성 6,000여 개 |
| 광도곡선 · BLS | 케플러/TESS 데이터에서 트랜짓 검출. BLS는 직접 구현 |

**찾기**

| | |
|---|---|
| 반복 트랜짓 판별 | 홀짝·2차 식·모양·크기 검사 + 검출 유의성 (NASA 방식 재구현) |
| 미등록 별 목록 | KOI/TOI에 없는 별만 모아서, 최신 TESS 섹터로 2주마다 자동 갱신 |
| 단일 트랜짓 탐색 | 정합 필터 → 5σ → 노이즈를 걸러내는 검사 5개(edge·coherence·flare·symmetry·baseline) |

검사 기준값은 실제 TESS 광도곡선에 가짜 신호를 넣고 다시 찾는 실험으로 정했습니다.
처음 나온 "후보"는 원본 데이터를 확인해 보니 노이즈였고, 그걸 걸러내려고 다섯 번째 검사(baseline)를 추가했습니다.

## 시작하기

- Node.js 20.19+ (CI는 24)
- Python 3.12+

```bash
git clone https://github.com/2daKaizen-gun/pale-blue-code.git
cd pale-blue-code

# 백엔드
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000

# 프론트엔드 (다른 터미널, 저장소 루트에서)
cd frontend
npm ci
npm run dev                     # http://localhost:5173

# 테스트
cd backend  && pip install -r requirements-dev.txt && python -m pytest
cd frontend && npm run lint && npm run build && npx vitest run
```

`frontend/.env.example`을 참고해서 `.env`를 만들어 주세요.

```env
VITE_NASA_API_KEY=your_api_key_here    # https://api.nasa.gov 에서 무료 발급
# VITE_API_BASE_URL=                   # 로컬에서는 비워 두면 localhost:8000
```

배포할 때는 `VITE_API_BASE_URL`을 꼭 설정해야 합니다. 빌드할 때 값이 들어가기 때문에, 비어 있으면
배포된 사이트가 방문자의 `localhost:8000`을 호출해서 백엔드 기능이 전부 안 됩니다(실제로 한동안 그랬습니다).
끝에 `/`나 `/api`를 붙이지 않은 origin만 넣어 주세요. 자세한 내용은 [`docs/deploy.md`](./docs/deploy.md).

탐색 결과를 다시 계산하려면 광도곡선 캐시(약 1 GB)를 MAST에서 다시 받아야 합니다.
[`docs/maintenance.md`](./docs/maintenance.md) §2를 참고해 주세요.

## 문서

| 문서 | 내용 |
|---|---|
| [`docs/report/final-report.md`](./docs/report/final-report.md) | 최종 보고서 |
| [`docs/journey.md`](./docs/journey.md) | 개발 과정과 탐색 기록 |
| [`docs/architecture.md`](./docs/architecture.md) | 기술 스택과 폴더 구조 |
| [`docs/maintenance.md`](./docs/maintenance.md) | 자동 갱신, 새 섹터 탐색 절차 |
| [`docs/deploy.md`](./docs/deploy.md) | 배포와 비용 |
| [`docs/observations/instrument-log.md`](./docs/observations/instrument-log.md) | 별별 측정 기록 |

---

<a id="ja"></a>

## 日本語

NASA の公開データを使って、系外惑星について学んだり、実際に探したりできる Web アプリです。
子どもの頃は宇宙科学者になりたくて、大学ではコンピュータ工学を選びました。その二つを合わせてみたくて作りました。

**結果**：TESS セクター 102–106 で、TOI カタログに載っていない小さな矮星 328 個を単一トランジットで調べました。
目立つシグナルが 55 件出ましたが、すべて観測装置由来のノイズで、候補は 0 件でした。
22 個の星では地球サイズまで、中央値の星では 4.7 R⊕ まで検出できる感度があり、期待検出数は 0.42 件（何も見つからない確率 66%）でした。

**しくみ**：整合フィルタ → 5σ → ノイズを落とす 5 つのチェック（edge・coherence・flare・symmetry・baseline）。
しきい値は、実際の光度曲線に疑似シグナルを入れて回収する実験で決めました。

**学習用の画面**：太陽系 3D、N 体重力シミュレーション（RK4）、ブラックホールの重力レンズ（GLSL）、確認済み系外惑星 6,000 件以上のデータベース、光度曲線と BLS。

**技術**：React 19 · TypeScript · Three.js · GLSL · D3 · FastAPI · Python · NumPy · lightkurve · astroquery
テスト：pytest 244 / vitest 250（push ごとに CI で実行）

公開サイトはフロントエンドのみです。NASA データを使う画面は、ローカルでバックエンドを起動すると動きます。
最終報告書は韓国語です：[`docs/report/final-report.md`](./docs/report/final-report.md)

---

<a id="en"></a>

## English

A web app for learning about exoplanets with NASA's public data, and for searching for new ones.

**Result**: I ran a single-transit search on 328 small dwarf stars in TESS sectors 102–106 that are not in the TOI catalog.
55 signals stood out, all of them instrument noise, so there are 0 candidates.
22 stars were sensitive down to Earth size and the median star to 4.7 R⊕; the expected yield was 0.42 detections (a 66% chance of finding nothing).

**How it works**: matched filter → 5σ → five checks that reject instrument noise (edge, coherence, flare, symmetry, baseline).
Thresholds were set with injection–recovery tests on real light curves.

**Learning pages**: 3D solar system, N-body gravity (RK4), black-hole lensing (GLSL), a database of 6,000+ confirmed exoplanets, light curves and BLS.

**Stack**: React 19 · TypeScript · Three.js · GLSL · D3 · FastAPI · Python · NumPy · lightkurve · astroquery
Tests: pytest 244 / vitest 250, run in CI on every push.

The public site is frontend-only; the NASA-data pages need the backend running locally.
The final report is in Korean (with an English abstract): [`docs/report/final-report.md`](./docs/report/final-report.md)

---

## 데이터와 참고 자료

- [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/) — 확인된 외계행성 데이터
- [MAST](https://archive.stsci.edu/) — 케플러/TESS 원본 데이터
- [NASA APOD API](https://api.nasa.gov) — 오늘의 우주 사진
- [Lightkurve](https://docs.lightkurve.org/), [Astropy](https://www.astropy.org/)
- 칼 세이건, 『코스모스』
- 윤성철, 『우리는 모두 별이 남긴 먼지입니다』
- Sara Seager (ed.), *Exoplanets*
- Michael Perryman, *The Exoplanet Handbook*

## 라이선스

[GNU AGPL-3.0](./LICENSE). 수정·재배포할 때는 같은 라이선스로 소스를 공개해야 하고, 웹 서비스로 운영하는 경우도 마찬가지입니다.

## 개발자

권이건 (Kwon Leegun) · 한성대학교 컴퓨터공학과 · [@2daKaizen-gun](https://github.com/2daKaizen-gun) · hkys1223@gmail.com
