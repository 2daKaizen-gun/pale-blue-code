# [Check] sub-8-3: 발견 기록 + Phase 8 close

**날짜**: 2026-06-29
**Issue**: #38
**브랜치**: main
**결과**: ✅ Phase 8 PRD §4.5(발견 기록) 완성 + mobile 패스 + HANDOFF로 Phase 8 종료

---

## 범위

PRD §4.5(발견 기록 — 결과 JSON 내보내기 + 보고 링크)가 sub-8-2 범위에서 빠져 있었고,
이전 Phase들과 달리 Phase 8 close(mobile/perf + HANDOFF)가 없었다. 이 둘을 한 묶음으로 처리.

### 묶음 A — 발견 기록 (enhancement)
- `lib/discovery.ts` — `DiscoveryRecord` 타입 + `buildDiscoveryRecord()` + `downloadJSON()`
- `components/hunt/DiscoveryActions.tsx` — JSON 내보내기 버튼 + 보고 링크 통합
- `HuntPage.tsx` 배선 + `KOIMatchCard` 빈 상태 중복 링크 제거

### 묶음 B — Phase 8 close (documentation)
- `HuntPage.tsx` mobile 패스 (자유 탐색 입력/버튼 반응형)
- 본 Check 문서
- `docs/phase-handoffs/phase-8-to-9.md`

---

## Test

```
✅ npm run build — 6 Light 전부 통과
✅ tsc strict — 에러 0 (DiscoveryActions 미배선 상태에서도 모듈 빌드 OK → 배선 후 정상)
```

### 발견 기록 JSON 스키마 (`pale-blue-code/discovery@1`)

```json
{
  "schema": "pale-blue-code/discovery@1",
  "generated_at": "<ISO>",
  "target": { "kic_id": 9140402, "kic_name": "KIC 9140402" },
  "detection": { "method": "BLS", "period_days": ..., "duration_days": ...,
                 "depth": ..., "power": ..., "transit_time": ... },
  "koi_cross_check": { "in_catalog": true, "disposition": "CANDIDATE", "matches": [...] }
}
```

- `disposition`: 한 별에 KOI 여러 개면 CONFIRMED > CANDIDATE > FALSE POSITIVE 순위로 대표값 선택.
- 백엔드 신규 엔드포인트 없음 — 화면이 이미 보유한 BLS·KOI 데이터로 클라이언트 조립.

### mobile 패스

- 자유 탐색 행: 모바일 세로 스택(입력/버튼 full-width) → sm+ 가로(입력 w-56). 360px 오버플로 없음.
- 타깃 그리드(`sm:grid-cols-2`)·결과 카드(`flex-wrap`)는 이미 반응형 — 변경 0.

---

## 잘된 점

- 발견 기록을 **순수 프론트엔드 조립**으로 결정 — 백엔드 왕복/신규 계약 없이 보유 데이터만으로 export. YAGNI 준수.
- 보고 링크를 `KOIMatchCard` 빈 상태에서 `DiscoveryActions`로 **중앙화** — "카탈로그에 없음"뿐 아니라 후보/확인 결과도 보고 대상이라는 PRD 의도에 맞춤. 중복 제거 부수 효과.
- `DiscoveryRecord`에 `schema` 버전 태그 — 향후 포맷 변경 시 하위 호환 판별 가능.

---

## 막혔던 점

특이 결함 없음. sub-8-2의 BLS alias 수정으로 `koi_check`가 harmonic을 반환하므로, 발견 기록의 `matches`에도 alias 정보가 그대로 실린다(별도 작업 불필요).

---

## 리팩토링 후보

- `DiscoveryActions`·`KOIMatchCard`의 보고 링크 URL을 상수 모듈로 추출 가능 (현재 2곳 → 1곳으로 이미 줄였으나 URL 자체는 컴포넌트 내 하드코딩).
- 발견 기록에 주기도그램 PNG 첨부(이미지 export)는 향후 확장 여지로만.

---

## 🌌 이번에 알게 된 우주의 한 조각

**기록은 발견을 발견으로 만든다.**

티코 브라헤가 20년간 맨눈으로 화성의 위치를 적어둔 표가 없었다면, 케플러는 타원 궤도를 끝내 찾지 못했다. 관측은 휘발하지만 기록은 남아 다음 사람에게 건너간다. 우리 화면의 "결과 JSON 내보내기" 버튼 하나가 하는 일이 바로 그것이다 — BLS 피크와 KOI 대조 결과를 한 장의 파일로 굳혀, 같은 신호를 다시 들여다볼 누군가에게 넘긴다. 발견은 보는 순간이 아니라 적어두는 순간 시작된다.
