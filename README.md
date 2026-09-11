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
> 계획: `docs/specs/phase-11/`.
>
> **단일 트랜짓 사냥이 그 위에 지어졌습니다 (sub-11-2 ~ 11-9).** 접을 것이 없는 한 번의 딥을
> 정합필터로 재고(11-2), 개척지 풀 전체에 걸쳐 별마다 처분을 남기는 정직한 원장으로 사냥하며
> "뒤졌지만 아무도 살아남지 못함"을 일급 결과로 둡니다(11-3). 알려진 깊이의 트랜짓을 주입해
> 무엇이 회수되는지 재고(11-4 — 완전성은 보장이 아니라 바닥), 거성에서 뜬 깊은 딥은 세계가
> 아니라 별이므로 검출이 *행성일 수 있는* 곳으로 풀을 줄 세웁니다(11-5 — 밝은 새하늘 풀은
> 대부분 거성). 생존자마다 크기 판정(11-6)과 fetch할 가치가 있는 왜성 목록(11-7)을 답니다.
>
> **그리고 한 번의 통과에서 세계의 초상을 읽습니다.** 그 한 트랜짓의 모양이 궤도 주기의 **하한**을
> 못박고(11-8 — "적어도 N일", 기계가 눈먼 긴 주기 쪽으로), 그 최단 주기(가장 가까운 궤도)와 제로
> 알베도가 평형온도의 **상한**을 줍니다(11-9 — "많아야 T K"). 그 최소 주기가 두 번째 트랜짓이 나타날
> 수 있는 **가장 이른 날짜**를 정하고(11-10), 마지막으로 그 숫자들을 관측자의 프레임 — BJD_TDB 시각과
> 밀리매그니튜드 깊이 — 으로 옮겨 후속 확인에 그대로 넘길 수 있는 브리핑으로 만듭니다(11-11). 정직:
> 전부 경계값이지 측정이 아니며(모든 가정이 "적어도/많아야" 방향으로만 틀림), 검출이 행성이라는
> 증거는 아닙니다. 기록: `docs/checks/phase-11/sub-11-8.md`~`sub-11-11.md`.
>
> **그리고 처음으로, 진짜 별에 대봤습니다.** 오래 미뤄둔 네트워크 경계를 넘어 MAST에서 유력 왜성의
> 실제 광도곡선을 받아와(`python scripts/fetch_plausible.py`, backend/ 기준) 검출기를 돌렸습니다 —
> **대부분 조용했습니다(후보 0).** 그 조용함은 실패가 아니라 결과입니다: sub-11-1의 유의성 전제조건이
> 미미한 딥을 걷어냈고, 대칭 관문이 19시간짜리 딥을 걸러냈습니다. 도구가 실제 하늘에서 정직하게
> 작동한다는 첫 증거이자, 진짜 발견이 서 있을 조용한 바닥입니다. 기록:
> `docs/observations/instrument-log.md`.
>
> **그리고 그 결과를 누구나 읽을 수 있게 만들었습니다 (11-12).** 사냥 페이지를 다섯 갈래 미로("어느
> 하늘을 사냥할까요?" + 링크 5개)에서 **하나의 서술형 화면**으로 다시 짰습니다 — 별 하나에 정직한 한
> 문장, "조용함"이 주인공, 반복 신호 사냥은 "여기까지 온 길"로 강등. 그리고 사냥을 매 요청마다 풀
> 전체 재검색하던 것을 디스크 메모이제이션으로 바꿔 **즉시 뜨는** 화면으로(콜드 >120초 → 웜 0.21ms,
> 곡선 mtime+파이프라인 버전으로 무효화, 결과는 바이트 단위 동일). 기록:
> `docs/checks/phase-11/sub-11-12.md`, 방향: `docs/vision/making-the-tool-legible.md`.
>
> **그리고 판정 뒤의 빛을 보게 했습니다 (11-13).** 별을 펼치고 "광곡선 보기"를 누르면 검출기가
> *실제로 본* 곡선을 그려주고, 찾은 딥마다 세로선을 운명의 색으로 표시합니다(초록 후보·빨강 기각·
> 회색 잡음) — 조용한 별은 표식 없는 평평한 곡선. 이제 한 별의 서사가 **문장 → 숫자 → 빛**으로
> 끝까지 읽히며, `making-the-tool-legible.md`가 완결됐습니다. 기록: `sub-11-13.md`.
>
> **그리고 검색을 옳은 별로 겨눴습니다 (11-14).** 풀이 *밝기*로 뽑혀 대부분 거성이었던 게 근본
> 문제였습니다(50개 중 행성 크기 표적 16개뿐). 빌더를 hunt용으로 다시 선택하니(`select_for_hunt`,
> 작은 별 우선) 같은 섹터가 **50개 전부 행성 크기 표적**을 주고, 가장 작은 건 진짜 **M 왜성**(R
> ~0.15 R☉)이라 검출 바닥이 **지구 1~2배** 행성까지 닿습니다(밝은 풀 최고가 지구 7배였음). 첫
> 배치로 가장 작은 M 왜성 10개를 받아 검색 — **7 조용 · 2 잡음 · 1 기각 · 후보 0.** 그 기각(TIC
> 370142187, sig 13.6)을 또 edge+symmetry 관문이 계기 인공물로 걸러냈습니다. 지구 크기 감도로 실제
> M 왜성을 본 첫 기록이자, 여전히 정직한 빈손. 기록: `sub-11-14.md`,
> `docs/observations/instrument-log.md`.

> **그리고 실데이터가 우리 도구의 정직성 틈을 드러냈습니다 (11-15).** 두 번째 배치의 TIC 91636864
> 이벤트(sig 4.98)를 관측 일지에 "문턱 0.02 아래의 아까운 near-miss"라고 적었는데, 다시 읽어보니
> 틀렸습니다 — 그 딥은 세그먼트 경계에서 0.075일 거리라 **edge 관문에도 걸리는** 인공물이었습니다
> (유의성 미달 *이면서* 형태 기각, 두 이유). 드릴다운이 딥의 유의성과 색만 보였지 *어느 관문에
> 걸렸는지*는 안 보여서 생긴 오독이었습니다. 그래서 커브 이벤트에 `failed_checks`를 실어(모든
> 이벤트에, 유의성과 무관하게) 드릴다운이 딥마다 "4.98σ · 잡음 · **경계에 걸림**"을 말하게 했습니다.
> 인공물이 화면에서 인공물로 읽힙니다. 이어서 세 번째 배치 10개를 검색 — **5 조용 · 3 잡음 · 2 기각
> · 후보 0**, 두 기각(sig 18.5, 6.4) 다시 edge. **누적 30/50 검색, 유의성 있는 단일 이벤트 4개 전부
> edge 관문이 걸러냄, 후보 0.** 기록: `sub-11-15.md`, `docs/observations/instrument-log.md`.

> **그리고 왜성 풀 50개를 끝까지 걸었습니다 (11-16).** 남은 곡선을 두 번에 나눠(8 + 9) 전부
> MAST에서 받아 검색해, sub-11-14의 작은별 우선 왜성 풀 **50개가 완주됐습니다 — 21 조용 · 22 잡음
> · 7 기각 · 후보 0.** 유의성 있는 단일 이벤트 일곱 개(sig 6.02·6.41·11.85·13.59·18.52·20.64·61.99)는
> **전부 edge 관문이 걸러냈습니다** — 그중 백미는 풀 전체에서 가장 큰 sig **61.99** 딥이었지만 다운링크
> 경계에 올라탄 인공물이었습니다(edge + symmetry). 큰 것과 진짜인 것은 다릅니다. 이 관문 하나가
> 일곱 개의 계기 오검출을 발견으로 행세하지 못하게 막았습니다. 그리고 누적 계수를 손에서 뺐습니다:
> `scripts/tally_hunt.py` 가 캐시에서 직접 집계하며, 첫 실행에서 표류를 잡아냈습니다 — 번호 붙은
> 배치 합은 38이었지만 sub-11-12/13 때 미리 검색된 앵커 왜성 3개가 누락돼 실제는 41이었습니다. 이제
> 기록은 내 산술이 아니라 하늘을 읽습니다. **빈손은 정직한 결과입니다** — 진짜 단일 트랜짓 탐색이
> 조용한 왜성 50개에서 대부분 돌려주는 바로 그것. 기록: `sub-11-16.md`, `scripts/tally_hunt.py`,
> `docs/observations/instrument-log.md`.

> **그리고 풀을 넓혔습니다 — 50 → 100 (11-17).** 50개는 완주됐지만 하늘은 소진되지 않았습니다:
> 섹터 104에는 미기록 2분 표적이 약 12,700개 있고 빌더는 가장 작은 50개만 남겼을 뿐입니다. 새 TESS
> 섹터(105)가 아직 안 뜬 지금, 정직한 다음 하늘은 *같은 섹터의 다음으로 작은* 왜성들이었습니다.
> `--n 100`으로 재빌드해(여전히 100개 전부 행성 크기) 첫 확장 배치 8개를 검색 — **4 조용 · 3 잡음 ·
> 1 기각 · 후보 0**, 누적 **56 of 100 — 24 조용 · 24 잡음 · 8 기각 · 후보 0.** 백미는 새로운 결:
> **TIC 404030766, sig 41.26** — 풀 전체 2번째로 큰 이벤트이자 **edge 관문이 못 잡은 첫 유의 이벤트**
> 였습니다. 경계가 아니라 구간 한복판의 비대칭 램프라, 이번엔 **symmetry 관문**이 홀로 걸러냈습니다.
> 관문은 하나의 요령이 아니라 한 벌입니다 — 한 관문을 빠져나간 큰 인공물을 다른 관문이 잡습니다.
> 남은 44개는 배치로 계속 받아 검색합니다. 기록: `sub-11-17.md`, `docs/observations/instrument-log.md`.

> **그리고 사냥 사상 첫 "후보"가 떴습니다 — 그리고 스스로 지웠습니다 (11-18).** 확장 배치를
> 검색하다 **TIC 326691903**이 네 관문을 전부 통과하고 유의성 바닥까지 넘겼습니다(sig 10.86,
> `candidate = True`) — 사냥 최초. 믿기 전에 raw 광곡선을 읽었습니다. 관측이 baseline보다 ~6% 낮게
> *시작*해 ~0.15일에 걸쳐 1.0으로 기어오르는, 교과서적인 **구간 시작부 계기 회복 램프**였습니다.
> edge 관문이 시작부 깊은 스파이크는 잡았지만, 한 duration 뒤 이웃(경계에서 0.15일)은 문턱을 빠져나가
> 램프의 꼬리를 1.1% "딥"으로 오인했습니다. 후보는 행성이 아니라 계기 인공물이었습니다.
> 네 관문 누구도 이걸 못 본 이유 — edge는 경계까지 거리만, symmetry는 좁은 창 *안*만 봅니다.
> 그래서 **다섯 번째 판별자 `baseline`**을 더했습니다: 진짜 트랜짓은 평평한 baseline 위의 함몰이니,
> 이벤트 양옆 out-of-transit 밝기가 같아야 합니다. 임계는 지어내지 않고 **측정**했습니다 —
> 실곡선에 주입한 깨끗한 트랜짓은 깊이의 ≤0.32배로 어긋나고, 이 램프는 4.67배로 어긋납니다(갭 정중앙 1.0).
> 캐시를 `mono-v2`로 올려 풀 전체를 재검색하니 **TIC 326691903은 candidate → 기각**, 사냥은 다시 후보 0.
> 오늘 두 배치 20개 추가(누적 **76 of 100 — 33 조용 · 31 잡음 · 12 기각 · 후보 0**). 관문을 통과한 첫
> 물체는 인공물이었고, 파이프라인은 그로부터 새 관문을 배웠습니다 — 마땅히 그래야 하는 방식으로.
> 기록: `docs/checks/phase-11/sub-11-18.md`, `scripts/measure_baseline_step.py`.

> **그리고 풀을 완주했습니다 — 100 of 100 (11-19).** 남은 24개 왜성을 전부 fetch(실패 0)하고
> 검색해, 왜성 풀 100개를 **처음으로 완전히 훑었습니다: 42 조용 · 45 잡음 · 13 기각 · 후보 0.**
> 마지막 배치는 작은별 우선 선택의 *큰* 꼬리(반지름 0.72–1.02 R☉)라 검출 바닥이 ~5–7 R⊕(해왕성~준토성),
> 새 기각 하나(TIC 380865605, sig 21.25, edge·symmetry)뿐이었습니다. 열세 개의 유의한 단일 이벤트는
> 전부 계기 아니면 계통오차 — 잡은 관문 이름이 하나씩 붙어 있습니다(edge·symmetry가 주력, baseline이
> 네 관문을 속인 하나를 잡고, coherence가 두 번 거듭). 후보로 살아남은 건 없습니다. 이건 실패가 아니라
> **완전하게 진술된 null** 입니다. 그리고 null은 **실제 달성한 감도만큼만** 유효합니다 —
> 계획용 fiducial(0.4%)이 아니라 각 별의 *실측* 바닥으로 재니(`completeness_hunt.py`), 지구 크기(≤1.25 R⊕)를
> 보여줄 만큼 곡선이 깨끗했던 별은 **100개 중 6개**, 슈퍼지구는 14개, 중앙값 별은 해왕성(4.7 R⊕)까지,
> 7개는 행성 크기조차 못 닿았습니다. 즉 "여기 지구는 없다"가 아니라, 풀 대부분에서 준토성 이상만,
> 곡선이 닿은 ~1/7 별에서만 지구~슈퍼지구까지 배제한 것 — 데이터가 뒷받침하는 딱 그만큼입니다.
> 이 풀은 닫혔고, 다음 진짜 하늘은 *새 섹터*입니다.
> 기록: `docs/checks/phase-11/sub-11-19.md`, `scripts/tally_hunt.py`, `scripts/completeness_hunt.py`.

> **그리고 새 하늘이 열렸습니다 — 섹터 105 (11-20).** sub-11-19가 가리킨 "다음은 새 섹터"가
> 실제로 도착했습니다. 8월 15일까지 비어 있던 TESS 섹터 105를 MAST가 서비스하기 시작 —
> **10,985개 SPOC 표적, 그중 10,761개가 TOI 카탈로그에 없는** 진짜 미기록 하늘입니다. 풀을 같은
> 작은별 우선 선택으로 105에서 다시 지었습니다: 왜성 100개, 반지름 0.165–0.884 R☉(중앙값 0.623),
> 가장 작은 건 Grus의 R★ 0.165 M왜성(Teff 3008 K). 이건 더 큰 풀이 아니라 *처음 보는 다른 하늘*입니다.
> 그리고 이 새 하늘을 **끝까지 걸었습니다 — 섹터 105, 100 of 100.** 첫 배치의 유의 이벤트
> TIC 42071226(sig 25.0)이 섹터 104가 가르친 그 결(경계의 계기)을 edge·symmetry로 돌려세운 것을
> 시작으로, 여러 세션에 걸쳐 100개 왜성을 전부 fetch·검색했습니다: **42 조용 · 36 잡음 · 22 기각 ·
> 후보 0.** 큰 이벤트는 하나도 다섯 관문을 다 통과하지 못했습니다 — 전부 edge·symmetry(계기 인공물)
> 아니면 late-flare·baseline이 하나씩 이름표로 붙었습니다. 그리고 null은 실측 감도만큼만 유효합니다:
> 각 별의 *실측* 바닥으로 재니(`completeness_hunt.py`) best 0.6 R⊕ · median 4.1 R⊕, 지구 크기(≤1.25 R⊕)를
> 보여줄 만큼 깨끗했던 별은 100개 중 5개, 슈퍼지구 14개, 준해왕성(≤4 R⊕) 47개였습니다 — "여기 지구는 없다"가
> 아니라 곡선이 닿은 딱 그만큼을 배제한, 완전하게 진술된 null입니다.
> 기록: `docs/checks/phase-11/sub-11-20.md`, `docs/observations/instrument-log.md`.

> **그리고 옛 하늘도 훑었습니다 — 섹터 103 (11-21).** 새 섹터가 아직 안 뜬 사이, 단일 트랜짓의
> 사각지대는 *모든* 섹터에 있다는 사실을 따랐습니다. 먼저 도구에 `--pool` 인자를 붙여 **추적되는
> 최신 섹터 파일을 건드리지 않고** 아무 섹터나 별도 파일로 사냥할 수 있게 하고(2주 자동 갱신
> Action과의 충돌 회피), 섹터 103 왜성 풀 100개를 지어 **100 of 100 완주 — 38 조용 · 47 잡음 ·
> 15 기각 · 후보 0.** 세 섹터(104·105·103) 합쳐 **작은 왜성 약 300개, 살아남은 후보 0.** 그리고
> 완주가 가리킨 건 하늘이 아니라 **감도**였습니다: 실측 median 6.6 R⊕, 지구 크기에 닿은 곡선은
> 100개 중 6개뿐. 기록: `docs/checks/phase-11/sub-11-21.md`.

> **그래서 방향을 틀었습니다 — 넓게가 아니라 깊게 (11-22 ~ 11-25, 결정 A).** "더 많은 섹터"는
> 같은 크기의 행성만 더 많이 못 보는 일입니다. 그래서 *가장 조용한 별의 감도*를 지구 크기까지
> 끌어내리기로 하고, 무엇이 실제로 검출 바닥(depth floor)을 낮추는지 **레버 하나씩 실측**했습니다:
> ① flux 선택(SAP vs PDCSAP) → PDCSAP가 11/11 승(median Δ −1.09 R⊕), 가설이 실측에 반증 ②
> detrend 창 → floor 무영향(+0.000 R⊕), 30일 유지 ③ 다중섹터 스티칭 → **이미 켜져 있었다**
> (표적 11개 전부 다중섹터, baseline 중앙값 2551일) ④ binning → 무변(+0.001 R⊕, 방향 뒤죽박죽).
> **넷 다 null입니다.** 이건 실패 넷이 아니라 **경계의 발견** — 이미 조용하고 이미 이어붙인 이
> 왜성들에서 파이프라인의 어떤 손잡이도 floor를 못 내립니다. 우리 눈은 여기서 할 수 있는 만큼
> 이미 예리합니다. 기록: `sub-11-22.md` ~ `sub-11-25.md`, 방향: `docs/vision/finding-our-own-planet.md` §9-1·§9-2.

> **그리고 목표를 정직하게 다시 못박았습니다 (11-26, 결정 D).** 망원경이 없으니 "발견 확정"은
> 우리 천장 밖입니다. 그래서 도달 가능한 지점을 겨눕니다 — **기계가 눈먼 곳에서 지구크기 단일
> 트랜짓 후보를, 실측 감도와 함께, 후속확인 경로에 올릴 수 있는 상태로 정직하게 제시하기.**
> 사냥 front door에 **지구크기 dossier**가 인라인으로 뜹니다: 우리 검색이 실제로 지구 크기까지
> 닿은 조용한 별들과 각자의 실측 floor·판정, 그리고 "후보 0"을 실패가 아니라 **완전성 진술**로
> 말하는 문장, ExoFOP/TFOP 후속확인 경로. 반복신호 쪽에 남아 있던 마지막 "발견" 과장도 지웠습니다.
> 기록: `sub-11-26.md`.

> **그리고 감도 대신 표적을 넓히기 시작했습니다 (11-27).** floor를 못 낮춘다면 지렛대는 *더 깊이*가
> 아니라 **더 많은 깊은 별**입니다. fetch가 느린 단계라, 먼저 우리가 이미 검색한 별들에서
> `log(floor) = -9.58 + 0.366·Tmag`를 적합해 **아직 안 본 별 중 어디가 지구 크기에 닿을지** 예측하고,
> 그 실력을 held-out 절반에 **스스로 보고**하게 했습니다 — precision 1.00 / recall 0.25. 밝기는
> 약한 *한쪽* 예측기입니다(찍으면 맞지만 넷 중 셋을 놓침). 그리고 첫 새 하늘, **섹터 102** 왜성 풀
> 100개를 지어 첫 배치 8개를 검색 — 후보 0, 그러나 **새 지구크기 표적 하나**(TIC 107548305, 실측
> 0.87 R⊕). 백미는 그 별이 예측기의 **예측을 이겼다는 것**입니다(예측 1.60 R⊕ = 지구크기 아님).
> 야생에서 재현된 recall<1 — **양성 예측은 믿되, 비양성을 기각으로 읽지 마라.** 기록: `sub-11-27.md`.

> **그리고 넓히기를 이어가며, 예측기가 비켜선 자리를 기록했습니다 (11-28).** 다시 적합한 예측기는
> 섹터 102의 남은 90개 중 지구크기로 예측하는 별이 **0개**(recall 0.20)라, 근거 없는 순위를 따르는 대신
> fetch 계획의 작은 별 순서로 8개를 검색했습니다 — 조용 6 · 미달 2 · 기각 0 · 후보 0, 새 지구크기 표적 0.
> 계획이 R★ ~0.6 왜성으로 올라서면서, "조용함" 넷은 곡선이 거칠어 8~16 R⊕보다 작은 건 애초에 볼 수
> 없었습니다. 그 한계까지 적어 둡니다. 기록: `sub-11-28.md`, 트래커 #76.

> **여기까지 — 세 섹터(104 · 105 · 103)를 온전히 훑고 네 번째(102)를 열었습니다: 중복 제외 214개의
> 작은 왜성을 실제로 검색, 후보 0.** 기계가 눈먼 단일 트랜짓의 틈을, 측정된 관문 다섯 개로 걸러 얻은
> 정직한 빈손입니다. 그중 **12개 별에서는 지구 크기까지 볼 수 있었고**, 거기서도 아무것도 없었습니다 —
> 그게 우리가 말할 수 있는 전부이고, 딱 그만큼만 말합니다. 다음은 섹터 102의 남은 82개(또는 106이 뜨면 새 섹터의 작은 별부터), 그리고 사람
> 눈으로 보는 길(Planet Hunters)입니다. 그 사이, 프론트엔드는 만든 이조차 헷갈리던 정보구조를
> **두 갈래(배우기 · 사냥하기)로 재설계**하고 학습 화면을 우리말로 다듬어, 처음 온 사람도 3초에 길을
> 찾도록 했습니다.

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
│   └── predict_earth_reach.py       안 본 별의 지구크기 도달 예측 + held-out 실력 보고 (넓히기)
│
├── docs/
│   ├── COLLABORATION.md             📜 협업 헌장 (약속)
│   ├── WORKFLOW.md                  🔄 PCTC 사이클 (작업)
│   ├── HANDOFF.md                   🛰️ 인수인계 템플릿 (인계)
│   ├── deploy.md                    배포·운영·비용 런북
│   │
│   ├── vision/                      북극성 문서 (spec 아님, 방향과 가드레일)
│   │   ├── finding-our-own-planet.md   단일 트랜짓으로 진짜 발견 (Phase 11 방향)
│   │   └── making-the-tool-legible.md  도구를 읽히게 (하나의 어휘·하나의 이야기)
│   │
│   ├── observations/                실측 장부 — 진짜 별에 검출기를 댄 정직한 기록
│   │   └── instrument-log.md           별별 실측 결과 + 감도 레버 실측 (Phase 11)
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
    │   ├── pool_s0103.json          섹터 103 왜성 풀 (--pool, sub-11-21 · 100/100 완주)
    │   └── pool_s0102.json          섹터 102 왜성 풀 (--pool, sub-11-27 · 진행 중)
    └── cache/                       lc_*.json · bls_*.json · mono_*.json (gitignore)
                                     mono_*.json = 사냥 결과 디스크 메모 (sub-11-12, 즉시 로딩)
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

🪐 *하늘은 닫히지 않습니다. 판별기를 벼렸고(9-A), 아무도 안 간 별을 사냥했으며(9-B), 사냥터를 온 하늘로 넓혔습니다(10, Skyward). 기계가 눈먼 곳 — 단일 트랜짓 — 을 겨누는 도구를 지었고(11), 마침내 처음으로 진짜 별에 대봤습니다. 대부분 조용했고, 그 조용함을 정직하게 기록했습니다 — 그것이 진짜 발견이 서 있을 바닥입니다.*
