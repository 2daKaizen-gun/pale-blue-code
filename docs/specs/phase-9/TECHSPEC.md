# Phase 9 TechSpec — Vetting

> *작성일: 2026-07-05*
> *PRD: `docs/specs/phase-9/PRD.md`*

---

## §1. 핵심 기술 결정 요약

| 영역 | 결정 | 이유 |
|------|------|------|
| 판별 입력 | 캐시된 `bls_lc_{slug}.json`(전해상도 time+flux) + `bls_{slug}.json`의 `best`(period·t0·duration·depth) | 새 외부 API 없음. 판별은 이미 있는 데이터 위의 순수 계산. |
| detrend 재사용 | `bls_service._detrend` 그대로 적용 후 판별 | BLS가 본 것과 **동일한 곡선** 위에서 판별해야 일관됨. |
| 판별 위치 | 신규 `backend/services/vetting.py` (hunt.py에 섞지 않음) | 판별은 성격이 다른 순수 진단 계산 — 독립 모듈 + 독립 테스트. |
| 판별 지표 | odd/even · secondary · shape(U/V) · size(S/N+Rp/Rs) 4관문 | NASA Robovetter/DAVE가 쓰는 표준 진단의 광도곡선-only 부분집합. |
| 설명 문구 위치 | **프론트엔드** (`VettingReport.tsx`) | 백엔드는 숫자+통과여부만. 한국어 설명은 UI 책임 (KOIMatchCard 선례). |
| 신뢰도 종합 | 백엔드가 `trust: strong/weak/unlikely` 계산 | 종합 규칙을 한 곳(테스트 가능)에 둠. UI는 렌더만. |
| Rp/Rs 판정 | 항성 반지름 없이 `Rp/Rs = √depth`로 1차 판정 | 항성 반지름은 카탈로그 의존 — v1은 LC-only 유지. 깊이 자체가 과대하면 EB. |
| TDD | 지표 함수는 합성 광도곡선(모사 행성 vs 모사 쌍성)으로 실패 테스트 먼저 | 결정론적·검증 가능. PRD §6 진짜 양성/음성 앵커. |
| 엔드포인트 | `GET /api/hunt/vet/{kic_id}` | BLS 캐시 없으면 424 (koi-check/bls 선례). |

---

## §2. 백엔드 아키텍처

### 신규 파일

```
backend/
├── models/
│   └── vetting.py        # VettingCheck, VettingReport Pydantic 모델
├── services/
│   └── vetting.py        # 4관문 지표 + trust 종합
└── routers/
    └── hunt.py           # (수정) GET /hunt/vet/{kic_id} 추가
```

### `backend/models/vetting.py`

```python
from typing import Literal
from pydantic import BaseModel

CheckName = Literal["odd_even", "secondary", "shape", "size"]

class VettingCheck(BaseModel):
    name: CheckName
    passed: bool
    hard: bool                 # True면 EB 강신호(단독으로 신뢰도 붕괴)
    metrics: dict[str, float]  # 근거 숫자 (프론트가 문장으로 렌더)

class VettingReport(BaseModel):
    kic_id: int
    period: float
    checks: list[VettingCheck]
    passed_count: int
    total: int                 # = 4
    trust: Literal["strong", "weak", "unlikely"]
```

### `backend/services/vetting.py`

입력 로더 — BLS가 본 것과 동일한 곡선 재구성:

```python
def _load_vetting_input(kic_id: int) -> tuple[np.ndarray, np.ndarray, dict]:
    name = f"KIC {kic_id}"
    bls = bls_service.run_bls(name)          # 캐시 히트 (없으면 FileNotFoundError → 424)
    full_path = _CACHE_DIR / f"bls_lc_{_slug(name)}.json"
    if not full_path.exists():
        raise FileNotFoundError(...)
    raw = json.loads(full_path.read_text(encoding="utf-8"))
    time = np.array(raw["time"]); flux = np.array(raw["flux"])
    flux = bls_service._detrend(time, flux)  # 동일 곡선
    return time, flux, bls["best"]
```

#### 관문 1 — `check_odd_even(time, flux, best) → VettingCheck`

주기로 위상 접기 → 각 transit에 정수 번호 `n = round((t - t0)/P)` 부여 → in-transit(`|Δt| < duration/2`) 점을 홀수/짝수 그룹으로. 그룹별 평균 감광(1 - median flux).

```python
depth_odd, err_odd = _group_depth(n odd)
depth_even, err_even = _group_depth(n even)
sigma = abs(depth_odd - depth_even) / hypot(err_odd, err_even)
passed = sigma < 3.0        # 3σ 이상 차이 → 실제 주기의 절반에 락온한 쌍성
hard = not passed           # odd/even 불일치는 강한 EB 신호
metrics = {depth_odd, depth_even, sigma}
```

#### 관문 2 — `check_secondary(time, flux, best) → VettingCheck`

위상 0.5 부근(±duration)에서 1차 식과 같은 폭의 감광 탐색. secondary depth와 그 S/N.

```python
sec_depth, sec_err = _box_depth(phase ≈ 0.5, width=duration)
sec_snr = sec_depth / sec_err
# 2차 식이 유의미하고 1차 대비 무시 못 할 깊이 → 발광 동반체(별)
passed = not (sec_snr > 3.0 and sec_depth > 0.25 * primary_depth)
hard = not passed
metrics = {sec_depth, sec_snr, primary_depth}
```

#### 관문 3 — `check_shape(time, flux, best) → VettingCheck`

in-transit 근처를 위상 정렬·비닝 → 사다리꼴(trapezoid) 적합 → 평바닥 비율 `flat_frac = t_flat / t_total ∈ [0,1]`. 1=상자(U, 행성적), 0=삼각형(V, 스치는 쌍성적).

```python
flat_frac = _fit_trapezoid_flat_fraction(folded_bin)
passed = flat_frac >= 0.2   # 너무 뾰족하면(V) 스치는 식 의심
hard = False                # 모양은 soft 지표 (저S/N에서 불안정)
metrics = {flat_frac}
```

#### 관문 4 — `check_size(time, flux, best) → VettingCheck`

S/N = depth / (per-point scatter / √N_in) 와 `Rp/Rs = √depth`.

```python
snr = depth / (mad_std(out_of_transit) / sqrt(n_in_transit))
rp_rs = sqrt(depth)
# 깊이 자체가 과대(√depth 큼)면 행성이라기엔 너무 큼 → EB
passed = snr >= 7.0 and rp_rs <= 0.25
hard = rp_rs > 0.25         # 과대 깊이는 강한 EB 신호, 저S/N은 soft
metrics = {snr, rp_rs, depth}
```

> 임계값(3σ / 0.25 / 0.2 / 7.0)은 sub-9-1 합성 테스트로 보정한다. 앵커: 확정
> 행성 KIC 11446443은 4/4 통과, 쌍성/위양성 앵커는 최소 1 hard 실패여야 한다.

#### 신뢰도 종합 — `synthesize(checks) → trust`

```python
hard_fail = any(c.hard and not c.passed for c in checks)
n_pass = sum(c.passed for c in checks)
if hard_fail or n_pass <= 2:  trust = "unlikely"
elif n_pass == 4:             trust = "strong"
else:                          trust = "weak"   # 3/4, soft 실패만
```

### `backend/routers/hunt.py` (추가)

```python
@router.get("/hunt/vet/{kic_id}", response_model=VettingReport)
async def get_hunt_vet(kic_id: int):
    try:
        report = await run_in_threadpool(vetting_service.vet, kic_id)
    except FileNotFoundError:
        raise HTTPException(status_code=424, detail={
            "message": f"BLS not cached for KIC {kic_id}. "
                       f"Run GET /api/hunt/bls/{kic_id} first.",
            "kic_id": kic_id})
    return report
```

---

## §3. 프론트엔드 아키텍처

### 신규/수정 파일

```
frontend/src/
├── components/hunt/
│   └── VettingReport.tsx        # 4관문 순차 공개 + 신뢰도 요약 (신규)
├── pages/
│   └── HuntPage.tsx             # (수정) BLS 후 vet 호출 + 리포트 삽입
├── lib/
│   ├── api/hunt.ts              # (수정) fetchVetting 추가 + 타입
│   └── discovery.ts             # (수정) discovery@2 — 판별 근거 포함
└── components/hunt/
    └── DiscoveryActions.tsx     # (수정) v2 레코드 전달
```

### `VettingReport.tsx`

백엔드 `VettingCheck`(숫자+통과여부)를 받아 **한국어 설명 문장**으로 렌더. 관문명 → 카피 매핑을 컴포넌트 내 상수로:

```tsx
const COPY: Record<CheckName, (c: VettingCheck) => { pass: string; fail: string }> = {
  odd_even: () => ({
    pass: '홀수번째와 짝수번째 어두워짐의 깊이가 같습니다. 매번 같은 것이 지나갔다는 뜻 — 행성다움.',
    fail: '홀·짝 깊이가 다릅니다. 서로 다른 두 별이 번갈아 가린 흔적일 수 있어요 — 쌍성 의심.',
  }),
  secondary: () => ({
    pass: '행성 반대편에서 추가 어두워짐이 없습니다. 동반체가 스스로 빛나지 않는다는 뜻 — 행성다움.',
    fail: '반대편에서도 어두워집니다. 스스로 빛나는 동반성 — 행성이 아니라 별일 수 있어요.',
  }),
  shape: () => ({
    pass: '어두워짐의 바닥이 평평합니다(U자). 온전한 원반이 별 앞을 가로질렀어요 — 행성다움.',
    fail: '바닥이 뾰족합니다(V자). 스치듯 지나간 쌍성일 수 있어요.',
  }),
  size: () => ({
    pass: '신호가 선명하고 추정 크기가 행성 범위 안입니다.',
    fail: '추정 크기가 항성급이거나 신호가 약합니다 — 행성이라기엔 무리.',
  }),
}
```

렌더 흐름: 관문 4개를 **순차 공개**(각 300~500ms 지연 페이드인) → pass는 초록 ✓, fail은 amber ✗ 배지 → 하단 **신뢰도 요약 카드**:

- `strong` → 초록 *"4개 검사 모두 통과 — 행성 후보로서 신뢰할 만합니다."*
- `weak` → amber *"일부 검사에서 애매함 — 후보이나 추가 검토 필요."*
- `unlikely` → 회색 *"쌍성/위양성 가능성이 높습니다 — 후보로 보고하지 않는 것을 권합니다."*

> **정직성 UI 규칙(PRD §7)**: "확인된 행성" 단정 금지. 항상 "행성다움 / 신뢰할 만함 / ~일 가능성" 어법.

### HuntPage 상태 흐름 (수정)

```
LC fetch → BLS fetch → ┬→ KOI check   (기존)
                       └→ Vetting     (신규, KOI와 병렬)
```

`vetLoading / vetReport / vetError` 상태 추가. BLS 완료 후 KOI와 Vetting 동시 발화. VettingReport는 BLSResultCard 아래, KOIMatchCard 위/아래 배치(디자인은 9-2에서).

---

## §4. API 클라이언트 (`hunt.ts` 추가)

```typescript
export type CheckName = 'odd_even' | 'secondary' | 'shape' | 'size'

export interface VettingCheck {
  name: CheckName
  passed: boolean
  hard: boolean
  metrics: Record<string, number>
}

export interface VettingReport {
  kic_id: number
  period: number
  checks: VettingCheck[]
  passed_count: number
  total: number
  trust: 'strong' | 'weak' | 'unlikely'
}

export async function fetchVetting(kicId: number): Promise<VettingReport>
```

`base.ts` + `getJSON` 헬퍼 재사용 (Phase 8 패턴).

---

## §5. sub-phase 분할

### sub-9-1: 판별 엔진 (백엔드) — TDD

**Goal**: `GET /api/hunt/vet/{kic_id}` 가 4관문 + trust 반환. 합성 데이터로 진짜 양성/음성 검증.

**Lights (예상 커밋 순서)**:
1. `backend/models/vetting.py` — VettingCheck, VettingReport
2. `tests/test_vetting.py` — 합성 광도곡선(모사 행성 / 모사 쌍성: odd-even 불일치·2차 식 주입) **실패 테스트 먼저**
3. `services/vetting.py` — `check_odd_even` + `check_secondary` (hard 지표)
4. `services/vetting.py` — `check_shape` + `check_size` (soft 지표) + `synthesize`
5. 임계값 보정 — 앵커(확정 11446443 = 4/4, 쌍성 앵커 = hard 실패)로 조정
6. `routers/hunt.py` — `/hunt/vet/{kic_id}` (424 계약) + `main.py` 확인

**성공 기준**:
- 합성 행성 → trust `strong` / 합성 쌍성(2차 식·홀짝) → trust `unlikely`
- 확정 행성 KIC 11446443 실데이터 → 4/4 통과
- 위양성 앵커 실데이터 → ≥1 hard 실패
- `pytest` 통과, 판별 계산 < 1s

### sub-9-2: 판별 리포트 (프론트)

**Goal**: VettingReport 컴포넌트 + HuntPage 통합. 4관문 순차 공개 + 신뢰도 요약.

**Lights**:
1. `lib/api/hunt.ts` — `fetchVetting` + 타입
2. `components/hunt/VettingReport.tsx` — 관문 카피 + 배지 + 요약 카드
3. `HuntPage.tsx` — vet 상태 + BLS 후 KOI와 병렬 호출 + 리포트 삽입
4. 순차 공개 애니메이션 + 모바일 레이아웃
5. `npm run build` 통과

**성공 기준**:
- 확정 타깃 선택 → 4관문 모두 ✓ + "신뢰할 만합니다" 요약
- 위양성 타깃 → 최소 1관문 ✗ + "가능성이 높습니다" 요약
- 비전공자가 읽어 "왜 아닌지" 설명 가능한 문장
- `npm run build` 통과

### sub-9-3: 신뢰도 종합 + 발견 기록 v2

**Goal**: 발견 기록에 판별 근거 embed. "발견"이 증거를 동반한 기록이 됨.

**Lights**:
1. `lib/discovery.ts` — `discovery@1` → `@2`: `vetting` 필드(checks + trust) 추가, 하위호환 유지
2. `DiscoveryActions.tsx` — v2 레코드 조립 + JSON 내보내기
3. 보고 링크 문구 — trust에 따라 조건부(unlikely면 "보고 전 재검토" 경고)
4. Check 문서 + 모바일 최종 점검
5. `npm run build` 통과

**성공 기준**:
- 내보낸 JSON에 4관문 근거 + trust 포함, 스키마 `pale-blue-code/discovery@2`
- `discovery@1` 레코드도 여전히 읽힘(버전 태그 분기)
- `npm run build` 통과

---

## §6. 위험 요소

| 위험 | 가능성 | 대응 |
|------|--------|------|
| 임계값이 앵커에서 안 맞음(확정 행성이 실패) | 중 | sub-9-1 보정 단계에서 앵커 기준으로 조정. 합성 테스트로 방향 고정 후 실데이터 미세조정. |
| 저S/N 타깃에서 shape/secondary 불안정 | 중 | soft 지표로 격리(hard=False). 단독으로 trust 붕괴 안 시킴. |
| 항성 반지름 없이 Rp/Rs만으론 부정확 | 낮 | v1은 √depth 과대만 판정(깊이 자체가 물리적으로 EB). 절대 반지름은 다음 악장 확장. |
| `bls_lc_*.json` 미존재(BLS 미실행) | 낮 | 424 반환 — 프론트가 BLS 먼저 유도(기존 계약 재사용). |
| in-transit 점 부족(장주기·소수 transit) | 중 | 관문별 최소 점수 미달 시 `passed=True, hard=False`로 "판정 보류" 처리 + metric에 표식. |

---

## §7. 불변 규칙 (Phase 8 계승)

- **manualChunks**: `@react-three` → `/three/` 경로보다 먼저 매칭 — 절대 변경 금지
- **커밋 게이트**: `npm run build`(+백엔드 `pytest`) 통과 → `git add` → 메시지 제시 → 권이건 OK → `git commit`
- **push 게이트**: sub-phase 완료 후 권이건이 직접 push
- **이슈 본문**: 영어만 (한글 U+AC00~U+D7A3 금지)
- **Tailwind 토큰**: `tokens.css` 실물만 (cosmos-bg/surface/elevated) — 빌드 통과 ≠ 클래스 유효
- **정직성 UI 규칙**: 판별 결과에 "확정/확인된 행성" 단정 금지 (PRD §7)
- **PCTC**: Plan 없이 Code 금지, Check 생략 금지

---

*"TechSpec은 결정의 근거다. 실물이 정본이고, TechSpec은 왜 그렇게 만들었나를 기록한다."*
*"Phase 8이 신호를 찾았다면, Phase 9는 그 신호를 심문한다 — 그리고 그 심문법을 모두에게 가르친다."*
