## Plan

Phase 8 PRD §4.5 (발견 기록 — 결과 JSON 내보내기 + 보고 링크)를 완성하고, mobile/perf 패스와 HANDOFF로 Phase 8을 공식 종료한다.

sub-8-1(백엔드)·sub-8-2(프론트엔드 흐름)는 이미 완료·배포됨. 남은 PRD 범위는 §4.5 발견 기록 한 덩어리이며, 이전 Phase들과 달리 Phase 8 close(mobile/perf + HANDOFF)가 아직 없다.

## Bundle A — 발견 기록 (enhancement)

- `lib/discovery.ts` — `DiscoveryRecord` 타입 + `buildDiscoveryRecord(kic, bls, matches)` + `downloadJSON()` 유틸
- `components/hunt/DiscoveryActions.tsx` — 결과 JSON 내보내기 버튼 + 보고 링크(Planet Hunters / NASA Exoplanet Archive)를 한 곳에 통합, 모든 결과 상태에서 노출
- `HuntPage.tsx` 결과 영역에 배선 + `KOIMatchCard` 빈 상태의 중복 보고 링크 제거(중앙화)

## Bundle B — Phase 8 close (documentation)

- mobile/perf 패스 — HuntPage 반응형(헤더/타깃 그리드/자유 탐색 입력) 점검·교정
- Check 문서 `docs/checks/phase-8/sub-8-3.md`
- HANDOFF `docs/phase-handoffs/phase-8-to-9.md` — Phase 8 종료 인계

## Lights

1. `lib/discovery.ts` — DiscoveryRecord 타입 + build/download 유틸
2. `DiscoveryActions.tsx` — JSON export 버튼 + 보고 링크 통합
3. HuntPage 배선 + KOIMatchCard 중복 링크 제거
4. mobile/perf 패스
5. Check 문서 sub-8-3 + phases/README 갱신
6. HANDOFF phase-8-to-9 (Closes #38)

## Success criteria

- 결과 화면에서 발견 기록 JSON 다운로드 동작 (kic / period / disposition / harmonic / matches / timestamp 포함)
- 보고 링크(Planet Hunters / NASA Exoplanet Archive) 모든 결과 상태에서 정상
- `npm run build` 매 커밋 통과
- 모바일 폭(360px)에서 HuntPage 레이아웃 깨짐 없음
- HANDOFF 문서로 Phase 8 종료 가시화 + 다음 Phase 진입점 명시

## Key decisions

- 발견 기록은 **프론트엔드 조립** — 이미 보유한 BLS·KOI 데이터로 클라이언트에서 JSON 생성. 백엔드 신규 엔드포인트 없음 (YAGNI).
- 보고 링크는 결과 유무와 무관하게 항상 노출 — "카탈로그에 없음"뿐 아니라 후보/확인 결과도 보고 대상.

## References

- PRD: `docs/specs/phase-8/PRD.md` §4.5, §5
- 직전 Check: `docs/checks/phase-8/sub-8-2.md` (리팩토링 후보에 발견 기록 누락 명시)
- HANDOFF 템플릿: `docs/HANDOFF.md`
