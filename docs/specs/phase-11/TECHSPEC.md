# Phase 11 TechSpec — What the Machines Missed (기계가 놓친 것)

> *작성일: 2026-07-25*
> *상태: Draft → sub-11-1 진입 시 Confirmed*
> *PRD: `docs/specs/phase-11/PRD.md` · 이슈: #49 (sub-11-1)*

> 🌑 *어떻게*. PRD가 못 5(모양 ≠ 검출)와 아크(단일 트랜짓)를 세웠다면, 이 문서는
> sub-11-1 — 4관문 앞의 검출 유의성 전제조건 — 을 어떻게 짓는지 정한다. 단일 트랜짓
> 탐지 본체(sub-11-2+)는 아직 설계하지 않는다(북극성 §5, 함께 정한다).

---

## §1. 핵심 기술 결정 요약

1. **전제조건(precondition)이지 관문이 아니다.** 4관문 *앞에* 서서, 유의성 미달이면
   4관문을 아예 돌리지 않고 trust를 주장하지 않는 새 상태로 멈춘다. 관문은 "감식할 가치가
   있다"를 전제하지만, 전제조건은 "없다"를 말할 수 있다.
2. **재료는 이미 캐시에 있다.** BLS가 `bls_*.json`에 `powers`(전체 periodogram 배열)와
   `best.power`(피크)를 저장한다. SDE는 재fetch·재계산 없이 이 배열에서 나온다.
3. **임계는 측정에서 (Light 1).** SDE와 상관잡음 트랜짓 S/N 등 후보 지표를 앵커 3개 +
   `TIC 7318157`에 실측해, 잡음을 깨끗이 가르는 지표·임계를 데이터로 뽑는다. 하드코딩된
   추측 금지 — `_N_MIN_TRANSITS`가 5→8로 실측됐듯.
4. **잘못된 분모 금지.** sub-10-3 홀짝 수정의 교훈: 표본 수(√N)로 나누면 상관잡음 앞에서
   가짜 확신이 생긴다. 여기 쓰는 어떤 S/N도 이걸 반복하지 않는다 — 트랜짓을 하나로 접고
   *트랜짓 사이* 산포로 잰다.
5. **4관문 수학 불변.** 추가되는 코드는 전제조건 하나. 홀짝·2차·모양·크기는 한 줄도 안
   건드린다(sub-10-2~10-3 계승).

---

## §2. 유의성이란 무엇인가 — 후보 지표와 측정

"유의성"은 하나로 정해 들어가지 않는다. Light 1이 아래 후보들을 실측해 고른다.

### 후보 A — SDE (Signal Detection Efficiency): 피크가 자기 잡음 바닥 위로 솟은 정도

periodogram의 봉우리 하나를 그 주변 풀밭 전체에 견준다. 절대 power 값(0.0004 같은)은
스케일 의존이라 무의미하고, *상대적 돌출*이 검출의 언어다.

```
SDE = (peak_power − center(powers)) / scale(powers)
```

- `center`/`scale`의 **강건 변형도 함께 잰다**: periodogram은 알리아스·고조파 때문에
  위꼬리가 두꺼워 `mean`/`std`가 잡음 바닥을 부풀린다(→ SDE 과소). `median`/`MAD`
  변형이 더 정직할 수 있다 — 어느 쪽이 앵커와 잡음을 잘 가르는지 Light 1이 본다.
- 캐시된 `powers`만 읽는다. de-alias가 주기를 옮겨도 SDE는 "애초에 유의한 주기적 딥이
  있었나"를 raw 피크에서 묻는다.

### 후보 B — 상관잡음 대비 트랜짓 S/N (folded, 검증 주기에서)

관측된 각 트랜짓을 깊이 하나로 접고(`_transit_depths` 재사용 가능), 평균 트랜짓 깊이를
**트랜짓 사이 산포**에 견준다. `depth / (scatter / √n_samples)`가 **아니다** — 그건
#49가 명시적으로 경고한 백색잡음 함정. de-alias된 corrected 주기에서 잰다.

- SDE가 "periodogram 피크가 진짜냐"라면, 이건 "그 주기에 접힌 딥이 진짜냐"다. 둘은
  다른 질문이고 Light 1이 어느 쪽(또는 조합)이 필요한지 판단한다.

### 왜 astropy `depth_snr`를 그대로 안 믿나

`bls.compute_stats`는 `depth_snr`를 준다 — 하지만 백색잡음(포인트별 독립) 가정이다.
TESS 2분 트랜짓의 ~108 표본을 독립으로 세는 바로 그 오류(sub-10-3 L4e). 참고값으로
같이 찍되, 단독 임계로 쓰지 않는다.

### Light 1의 산출

`scripts/measure_detection_significance.py`(가칭) — 앵커 3개 + `TIC 7318157`의 캐시된
BLS/LC를 읽어 위 지표를 전부 계산해 표로 출력. **성공 조건: 앵커 3개는 높게, TIC
7318157은 낮게, 그 사이에 임계를 그을 틈이 있는가.** 없으면 지표를 바꾸거나 조합한다.
구현이 아니라 측정이다(sub-10-3 calibrate 스크립트와 같은 성격).

---

## §3. 전제조건 구현 — build_report 흐름

### 어디에 서나

`services/vetting.py`의 `build_report` 안, **de-alias 다음 · 4관문 앞**:

```python
corrected, factor = _dealias(time, flux, best)

sig = detection_significance(time, flux, corrected, periodogram)   # 신규
if sig.value < _SIG_MIN:                                            # 임계 = Light 1
    return VettingReport(
        trust="insignificant", checks=[], passed_count=0, total=4,
        significance=sig.value, significant=False,
        period=corrected["period"], bls_period=best["period"], alias_factor=factor,
        mission=mission, baseline_days=..., transit_count=..., sector_count=sector_count,
        provisional=False,
    )

checks = [check_odd_even(...), check_secondary(...), check_shape(...), check_size(...)]
# ... 이하 기존 그대로
```

- de-alias *다음*에 두는 이유: 유의성을 4관문과 **같은 주기**에서 재야 일관된다.
- 미달이면 `checks=[]` — 감식하지 않았음을 데이터로 드러낸다(빈 리스트 = 판정 안 함).

### 새 trust 상태 — `"insignificant"`

trust Literal을 3→4개로 확장: `strong | weak | unlikely | insignificant`.

- **왜 4번째 값인가**: "insignificant"는 "unlikely"보다 *더 낮은 행성 확률*이 아니다 —
  **다른 축**이다. unlikely = "감식했더니 EB/FP 같다", insignificant = "감식할 신호가
  애초에 없었다". 이슈 #49가 못 박은 구분("게이트 vs 전제조건")을 타입으로 표현한다.
- **왜 별도 bool이 아니라 trust 값인가**: 코드베이스의 모든 UI 분기(FrontierVerdict
  FRAME, HuntLog, DiscoveryActions)가 `trust` 하나에 key한다. 4번째 값이 그 스위치들에
  자연스럽게 실린다. `trust`를 nullable로 만들고 `significant` bool을 따로 두는 대안은
  모든 소비자가 strong/weak/unlikely를 가정하고 있어 더 지저분하다.
  (정확한 문자열은 sub-11-1 Plan이 확정 — 설계 약속은 "검출 축의 구분된 4번째 상태 +
  checks=[]"이다.)

### 모델 변경 (`models/vetting.py`)

```python
trust: Literal["strong", "weak", "unlikely", "insignificant"]
significance: float | None = None   # 측정된 유의성 수치 (판별의 창)
significant: bool = True            # 전제조건 통과 여부 (레거시 캐시 기본 통과)
```

- `significant` 기본 `True` + `significance` 기본 `None` → 레거시 `vet_*.json` 캐시가
  스키마 검증을 통과한다(sub-10-2의 하위호환 패턴 계승). 단, 유의성은 새로 계산해야
  의미가 있으므로 **파생 캐시(vet_*.json) 퍼지 후 재검증**이 Check 절차에 들어간다.

### periodogram 배선

`build_report`는 지금 `powers`를 못 받는다. `vet()`는 이미 `run_bls(name)`로 전체 dict
(`powers` 포함)를 얻으므로, `_load_vetting_input`이 `bls["powers"]`도 반환하도록 확장해
`build_report(..., periodogram=...)`로 넘긴다. (대안: SDE를 `run_bls`에서 계산해
`best["sde"]`로 캐시 — periodogram이 있는 곳에서 한 번만. Light가 어느 배선이 깔끔한지
측정 결과 보고 정한다.)

---

## §4. 프론트엔드 — 새 상태 렌더

### 타입 (`lib/api/hunt.ts`)

`VettingReport.trust`에 `'insignificant'` 추가, `significance: number | null`,
`significant: boolean` 미러.

### FrontierVerdict (`components/hunt/FrontierVerdict.tsx`)

`FRAME` 맵에 `insignificant` 키 추가 — "검출 아님 — 판정할 신호가 없어요"(에러 아님,
9-B "빈손도 결과"의 중립 cosmos 팔레트). **4관문 카드는 렌더하지 않는다**(checks=[]).
대신 유의성 수치를 판별의 창으로 보여준다: *"봉우리가 풀밭보다 겨우 N만큼 높았어요 —
감식대에 올릴 신호가 아니에요."*

### HuntLog (`components/hunt/HuntLog.tsx` + `lib/huntLog.ts`)

`HuntOutcome`에 `insignificant` 추가. 이건 **사냥이긴 하다**(lc→bls→전제조건이 돌았다) —
recorded/no_lc 같은 게이트 거절과 다르다. unlikely처럼 "빈손"으로 집계하되, 후보는 아니다.
DiscoveryActions는 strong일 때만 뜨므로 insignificant는 자동으로 발견기록 밖(정직).

### 유의성 노출 (판별의 창)

통과한 경우에도 `significance`를 4관문 위/아래에 표시 — *왜* 이 신호가 감식대에 오를
자격이 있었는지 보여준다. 블랙박스 방지(sub-9-2 계승).

---

## §5. 재사용 vs 신규 경계

| 그대로 재사용 | 신규 (전제조건 하나) |
|---|---|
| `check_odd_even/secondary/shape/size` — 4관문 수학 불변 | `detection_significance()` + `_SIG_MIN` |
| `_dealias`, `_transit_depths`, `_mad_std`, `observed_transits` | trust 4번째 값 `insignificant` |
| `synthesize`(통과 시 그대로 호출) | report 필드 `significance`·`significant` |
| `FrontierVerdict`/`HuntLog`/`VettingReportCard` 구조 | 각 컴포넌트에 `insignificant` 분기 추가 |
| BLS `powers`/`best.power` 캐시 | periodogram 배선(`_load_vetting_input`→`build_report`) |

**신규 판별 로직은 전제조건 하나뿐.** Phase 11은 감식 *앞에* 검문소 하나를 세울 뿐,
감식대 자체는 손대지 않는다.

---

## §6. 테스트 전략

- **pytest**: `detection_significance`의 순수 계산 유닛(강건/비강건 center·scale, 빈
  periodogram·상수 배열 degrade), 전제조건 분기(미달→checks=[]·trust insignificant,
  통과→기존 경로), 레거시 캐시 하위호환(`significant` 기본 True).
- **회귀 앵커**: 앵커 3개가 판정 유지, `TIC 7318157`이 `strong`→`insignificant`.
  파생 캐시 퍼지 후 재계산.
- **vitest**: `insignificant` 렌더 분기, HuntLog 집계에 insignificant가 후보 아닌
  빈손으로 잡히는지.
- **Check 문서**: `docs/checks/phase-11/sub-11-1.md` — Light 1 측정표(임계를 어디에
  왜 그었나)와 앵커 재검증. 임계가 측정에서 나왔다는 근거가 핵심.

---

## §7. 리스크 & 완화

- **R1 — 임계가 앵커를 죽인다.** 유의성 임계가 너무 높으면 진짜 앵커(특히 얕은 것)까지
  탈락. → Light 1이 앵커를 *바닥*, TIC 7318157을 *천장*으로 두고 그 사이에 긋는다.
  틈이 없으면 지표가 틀린 것 → 지표를 바꾼다(측정이 설계를 이긴다).
- **R2 — periodogram 위꼬리가 SDE를 왜곡.** 알리아스/고조파가 잡음 바닥을 부풀림.
  → 강건 center/scale(median/MAD) 변형을 함께 측정.
- **R3 — 이 임계는 반복 트랜짓용이다.** sub-11-1은 Kepler/TESS 반복 트랜짓에 보정된다.
  **단일 트랜짓(sub-11-2+)은 반복이 없어 SDE 자체가 정의되지 않으므로**, 단일 이벤트
  유의성(단일 딥 S/N)은 그때 다시 설계한다. sub-11-1의 임계를 단일 트랜짓에 그대로
  들이대지 않는다 — Check에 이 경계를 명시한다.
- **R4 — 레거시 vet 캐시.** 유의성 없이 저장된 리포트. → 필드 기본값으로 스키마는 통과,
  단 Check는 파생 캐시 퍼지 후 재계산으로 검증(sub-10-3 앵커 재검증 패턴).

---

## §8. Sub-phase 분할

| Sub-phase | 범위 | 산출 |
|---|---|---|
| **sub-11-1** | 검출 유의성 전제조건 — 지표·임계 실측(Light 1), `detection_significance`+전제조건 배선(4관문 앞), 모델/API 필드, 프론트 `insignificant` 렌더, 앵커 재검증 | backend + frontend + pytest + vitest + Check |
| **sub-11-2+** | 단일 트랜짓 탐지 (북극성 §5) — *아직 설계 안 함, 함께 정한다.* 방법론 조사 → PRD 보강/신규 → 단일 이벤트 유의성·U자 단일 딥·다중 섹터 stitch·시각 검증 UI | (미정) |

> sub-11-1의 상세 Light 분해는 sub-phase Plan에 위임한다(WORKFLOW: TechSpec §8은
> sub-phase만 나열, 상세는 PCTC Plan). 대략의 결: L1 측정 → L2 엔진(전제조건+모델) →
> L3 API 노출 → L4 프론트 → L5 Check.

---

*"네 관문은 지문의 모양을 감식한다. 하지만 감식대에 오른 것이 지문인지 얼룩인지는 —
그건 감식 전에 물어야 할 질문이었다. 순서가 곧 정직이다."*
