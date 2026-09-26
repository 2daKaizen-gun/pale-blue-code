# 기계가 눈먼 곳에서: TESS 작은 왜성 312개의 단일 트랜짓 탐색과 그 정직한 빈손

**Pale Blue Code — 최종 보고서 (Phase 12, v1.0)**
권이건 · Claude (Anthropic) · 2026-09-27

---

## Abstract (English)

Automated transit searches fold a light curve at trial periods and need a dip to repeat, so a
long-period planet that transits once in a ~27-day TESS sector — a *monotransit* — is left behind.
We built an independent single-transit search and pointed it at the smallest planet-size dwarfs
that are **absent from the TOI catalog**, in TESS sectors 102–106. Every threshold in the pipeline
was set by measurement (injection–recovery and false-alarm runs on real TESS curves), not by taste:
a single-event significance floor of 5.0 σ, then five discriminators (segment edge, coherence,
flare, ingress/egress symmetry, baseline step). Across **328 unique stars** we found
**55 significant single events; every one was rejected as instrumental, and zero candidates
survived.** The null is stated with each star's *measured* sensitivity: 22 stars reached
Earth size (≤ 1.25 R⊕), the median star reached 4.7 R⊕. An expected-yield estimate from
M-dwarf occurrence rates, transit geometry, observed time and those measured floors predicts
**0.42 detections (P(zero) = 66%)** — zero was the most likely outcome before we began.
Without a telescope we cannot confirm a planet; the most a single transit can become here is a
candidate. The instrument keeps running.

---

## 1. 질문

반복 트랜짓을 접어서 찾는 자동 파이프라인(BLS, TESS SPOC)은 딥이 최소 두 번 찍혀야 행성을
본다. 그래서 27일짜리 섹터에 **한 번만** 지나간 긴 주기 행성 — 단일 트랜짓 — 은 체계적으로
버려진다. 거기가 "기계가 눈먼 곳"이다.

> 공개 데이터와 둘의 힘만으로, 그 눈먼 곳에서 진짜 행성을 찾을 수 있는가?

## 2. 방법

파이프라인은 `backend/services/monotransit.py` 하나에 있고, 모든 임계는 실측으로 정했다.

| 단계 | 무엇을 묻나 | 임계 | 어떻게 정했나 |
|---|---|---|---|
| 정합필터 | 곡선 어디에 트랜짓 모양의 딥이 있나 | 지속 0.1·0.2·0.4·0.8일 | 박스 템플릿, 3점 미만은 스파이크 |
| 유의성 전제조건 | 그 딥이 잡음보다 큰가 | **5.0 σ** | 실제 TESS 곡선 300 epoch: 잡음 최대 2.86, 회수 가능한 가장 얕은 트랜짓(0.4%) 6.52 — 그 빈 구간 (sub-11-2) |
| edge | 관측 구간 경계(다운링크·섹터 끝)에 붙어 있나 | 경계에서 1× 지속시간 이내면 기각 | 계기 회복 인공물 실측 (sub-11-14~16) |
| coherence | 딥이 한 점에 몰려 있나 | 최심 1점이 60% 초과면 기각 | |
| flare | 딥보다 큰 양의 튐이 붙어 있나 (플레어 뒤 기저) | 깊이 이상 & 5σ 초과 | |
| symmetry | 진입·이탈이 대칭인가 | 비대칭 > 0.5면 기각 | 램프형 인공물 (sub-11-17) |
| baseline | 양옆 기저선이 같은 높이인가 | 차이가 깊이의 1.0배 초과면 기각 | 주입 트랜짓 ≤0.32 vs 실제 램프 4.67 (sub-11-18) |

**감도(depth floor)** 는 별마다 따로 잰다: 그 곡선에서 유의성 5.0을 겨우 넘길 가장 얕은 0.4일
트랜짓의 깊이. 행성 크기로는 `R_p = √floor · R★`. 이것이 "여기에 없다"를 말할 수 있는 한계다.

감도를 더 끌어내리려 레버 넷을 실측했고 **전부 null** 이었다 — flux 선택(PDCSAP가 SAP를 11/11
이김), detrend 창(+0.000 R⊕), 다중섹터 스티칭(이미 켜져 있었음), binning(+0.001 R⊕). 이 데이터로
갈 수 있는 끝까지 갔다는 뜻이다 (sub-11-22~25).

## 3. 데이터

- 표적: 각 섹터의 SPOC 2분 광도곡선이 있는 별 중 **TOI 카탈로그에 없는** 별을, 행성 크기
  검출이 가능한 **작은 별부터** 100개씩 (`select_for_hunt`). 반지름 약 0.15–1.07 R☉.
- 광도곡선: MAST(lightkurve), PDCSAP, 별의 모든 SPOC 섹터를 이어붙임 (지구크기 표적들 기준 중앙값
  6섹터, 기저선 ~2,500일 — sub-11-24).
- 섹터 풀은 전부 저장소에 고정돼 있다: `backend/data/pool_s0102.json` ~ `pool_s0106.json`.
  (104·105는 추적 파일이 굴러가며 사라졌던 것을 이력에서 복원 — 그 전까지 누적 수치가 104의
  100개를 빠뜨리고 있었다.)

## 4. 결과

| 섹터 | 검색 | 조용 | 유의성 미달 | 기각 | 후보 | 지구 크기 도달 | 감도 중앙값 |
|:---:|---:|---:|---:|---:|---:|---:|---:|
| 104 | 100 / 100 | 42 | 45 | 13 | 0 | 6 | 4.7 R⊕ |
| 105 | 100 / 100 | 42 | 36 | 22 | 0 | 5 | 4.1 R⊕ |
| 103 | 100 / 100 | 38 | 47 | 15 | 0 | 6 | 6.6 R⊕ |
| 102 | 26 / 100 | 12 | 11 | 3 | 0 | 1 | 4.5 R⊕ |
| 106 | 12 / 100 | 5 | 4 | 3 | 0 | 5 | 1.4 R⊕ |
| **합계 (중복 제외)** | **328** | 137 | 138 | 53 | **0** | **22** | 4.7 R⊕ |

표의 칸은 **별**의 수다(별마다 가장 유의한 이벤트로 판정 — 유의 이벤트 55개가 기각된 별 53개에 걸려 있다). 섹터 풀끼리 겹치는 별(같은 TIC)은 캐시를 공유하므로 합계에서 한 번만 센다. 섹터 102·106은 완주하지 않았다 (§7).

- **유의한 단일 이벤트 55개, 전부 기각.** 관문별(한 이벤트가 여럿에 걸릴 수 있음):
  edge 44 · symmetry 48 · coherence 6 · flare 3 · baseline 2. 가장 흔한 조합은 **edge+symmetry**(34건) — 구간 경계의 계기 인공물이 남기는 전형적인 서명.
- 가장 큰 이벤트는 sig 278.5(TIC 344128619, coherence·edge·symmetry), 그다음 85.3(TIC 65516102, 오늘
  섹터 106에서) · 65.0 · 62.0 · 60.6 — 크기와 진짜는 달랐다.
- 사냥 사상 첫 `candidate`(TIC 326691903, sig 10.86)는 raw 곡선을 읽고 구간 시작부 회복 램프의
  꼬리임을 확인해 스스로 기각했고, 그 실패가 다섯 번째 판별자 baseline을 낳았다 (sub-11-18).
- **살아남은 후보: 0.**

## 5. 감도 — 이 null이 배제하는 것

| 이 크기 이하 행성을 볼 수 있었던 별 | 수 | 비율 |
|---|---:|---:|
| 지구 (≤1.25 R⊕) | 22 | 7% |
| 슈퍼지구 (≤2 R⊕) | 53 | 16% |
| 준해왕성 (≤4 R⊕) | 133 | 41% |
| 해왕성 (≤6 R⊕) | 185 | 56% |
| 토성 (≤11.2 R⊕) | 258 | 79% |
| 목성 2배 (≤22.4 R⊕) | 308 | 94% |

가장 예리한 곡선 0.58 R⊕ · 중앙값 4.7 R⊕ · 가장 거친 곡선 44.0 R⊕ (별 328개, 실측 floor 기준).

지구 크기(≤ 1.25 R⊕)까지 볼 수 있었던 별은 **22개**뿐이고, 그 목록과 판정은
`python scripts/earth_size_dossier.py --pool backend/data/pool_s01*.json`이 재현한다. 가장 예리한
곡선은 TIC 42071226(R★ 0.169, 0.58 R⊕)이었다. 즉 이 결과는 "이 별들에 행성이 없다"가 아니라
**"이 별들에서, 각 곡선이 볼 수 있었던 크기 이상의, 이 관측 시간 안에 지나간 단일 트랜짓 행성은
없다"** 이다. 그 이상은 말하지 않는다.

## 6. 기대 수율 — 0은 예상된 답이었나

`scripts/expected_yield.py`가 별마다 다음을 적분한다: 행성 발생률 × 통과 확률(R★/a) × 관측 시간
안에 통과가 떨어질 확률(min(1, T_obs/P)), 단 그 별의 **실측 floor가 볼 수 있는 크기 범위만**.
주기 27–500일. 가정과 출처(Dressing & Charbonneau 2015 등)는 스크립트에 적혀 있다.

```
검색한 별 (실측 floor 있음)   : 328
기대 검출 수                 : 0.42
아무것도 못 찾을 확률 P(0)   : 66%
  행성이 절반만 흔하면       : 기대 0.21, P(0) 81%
  행성이 두 배 흔하면        : 기대 0.83, P(0) 43%
```

**아무것도 찾지 못할 확률이 가장 높았다.** 행성이 가정보다 두 배 흔해도 결론은 같다. 수율을 가른
건 실력이 아니라 곱셈이다 — 행성 존재 × 정렬(~1%) × 27일 창 × 감도. 이 규모에서 한 번의 발견을
기대하려면 별이 몇 배는 더 필요하거나, 곡선이 지구 크기까지 닿는 별이 훨씬 많아야 한다.

이 추정은 측정이 아니다. 긴 주기 발생률은 잘 모르고, 검출을 floor에서 계단으로 본 것은 약간
낙관적이다. 그래서 숫자 하나가 아니라 "절반/두 배" 범위를 함께 적는다.

## 7. 한계

- **확정 불가.** 망원경도 시선속도 관측도 없다. 단일 트랜짓이 이 파이프라인에서 될 수 있는 최고는
  "후보"이고, 그 다음은 ExoFOP-TESS / TFOP 후속 관측의 몫이다.
- **주기 미상.** 단일 트랜짓은 주기를 주지 않는다. 모양이 주는 건 하한뿐이다 (sub-11-8).
- **섹터 102·106 미완주.** 섹터 102는 26/100, 섹터 106은 12/100에서 멈췄다 — v1.0 시점의 정직한 정지점. 남은 별들은 유지 모드에서 같은 명령으로 이어 간다 (`docs/maintenance.md`). 멈춘 이유는 시간뿐이며, 남은 별에서 후보가 나올 기대값은 위 계산과 같은 규모로 작다.
- 판별자는 인공물을 잘 걸렀지만, 같은 관문이 진짜 트랜짓을 놓칠 확률은 주입-회수로 일부만
  쟀다 (sub-11-4). 완전성은 보장이 아니라 바닥이다.

## 8. 열어둔 문

도구는 멈추지 않는다. 2주마다 GitHub Actions가 최신 TESS 섹터로 표적 풀을 다시 짓고, 새 섹터는
명령 몇 줄로 사냥된다 — 절차는 [`docs/maintenance.md`](../maintenance.md). 언젠가 이벤트 하나가
다섯 관문과 유의성 바닥을 모두 넘으면: raw 곡선을 사람 눈으로 읽고 → 지구크기 dossier에 올리고 →
ExoFOP/TFOP 경로로 넘긴다.

발견은 결승선이 아니라 열린 문이다. 이 보고서는 거기까지 간 기록이다.

---

### 재현

```bash
# backend/cache 가 있는 체크아웃에서
python scripts/tally_hunt.py        --pool backend/data/pool_s0104.json    # 섹터별 판정
python scripts/completeness_hunt.py --pool backend/data/pool_s0104.json    # 섹터별 감도
python scripts/earth_size_dossier.py --pool backend/data/pool_s01*.json    # 지구크기 도달 별
python scripts/expected_yield.py     --pool backend/data/pool_s01*.json    # 기대 수율
```

광도곡선 캐시(`backend/cache`, ~1 GB)는 저장소에 없다. `scripts/fetch_plausible.py --pool …`가
MAST에서 다시 받는다.

### 기록

- 관측 원장: [`docs/observations/instrument-log.md`](../observations/instrument-log.md)
- sub-phase 회고: [`docs/checks/phase-11/`](../checks/phase-11/), [`docs/checks/phase-12/`](../checks/phase-12/)
- 방향과 천장: [`docs/vision/finding-our-own-planet.md`](../vision/finding-our-own-planet.md)
