# Phase 10 → Phase 11 인수인계

**완료일**: 2026-07-24 (Phase 10 close) · Phase 11 개시 같은 날
**소요 기간**: 실제 ~7일 (2026-07-18 PRD → 07-24 sub-10-3 완결)
**총 커밋**: 36개 (`git log --since=2026-07-18 --until=2026-07-25`)
**채팅 링크**: (Phase 10 채팅 — compacted)

> ⚠️ **이 문서는 2026-09-08에 소급 작성됐다.** Phase 10이 닫힐 때 인계 문서를 쓰지 않고
> 바로 Phase 11로 이어갔고(헌장 §4 위반), 그 자리를 `docs/vision/finding-our-own-planet.md`가
> 대신 메워 왔다. 사실은 전부 그 시점의 Check 문서·커밋·GitHub 상태에서 뽑았고, *그때의 심경*이
> 아니라 *확인 가능한 것*만 적는다. 그 시절 감각이 필요하면 `docs/checks/phase-10/`로.

---

## 1. Phase 10에서 무엇을 만들었나

- 사냥터를 Kepler 한 구멍에서 **온 하늘(TESS)**로 넓혔다 — 미션 인지 hunt 백엔드, TOI 게이트,
  TIC 씨드 풀, 개척지 허브 UI.
- 넓은 눈이 **얕게** 본다는 것까지 정직하게 실었다 — 정직의 못 4(`provisional strong`)와,
  최신 섹터를 2주마다 자동 갱신하는 GitHub Actions(`frontier-refresh.yml`).
- 그리고 **도구를 진짜 하늘에 처음 대봤다** — 단일섹터 TESS 실측이 결함 네 개를 드러냈고
  (sub-10-3), 고친 뒤 도구는 어제보다 *더 적게* 말하게 됐다.

---

## 2. 확정된 기술 결정 (Phase 11이 따른 것)

| 영역 | 결정 | 비고 |
|------|------|------|
| detrend 창 | **30일** (cadence 유도 + clamp + 하한) | 실측 전엔 2.04일이었고 트랜짓 깊이 18%를 먹고 있었다 |
| 홀짝 관문 오차 | **트랜짓 단위 pooled t** (점 개수로 나누지 않음) | 백색잡음 가정이 진짜 행성을 25~83% 탈락시켰다 |
| `_N_MIN_TRANSITS` | **8** (5에서 실측 보정) | 주입-회수로 결정, 추측 아님 |
| 트랜짓 계수 | `observed_transits` — gap에 빠진 것은 세지 않음 | `transit_count`는 관측 안 한 것까지 셌다 |
| 섹터 계수 | TESS **섹터** 수 (SPOC 제품 수 아님) | 1섹터가 2로 보이던 버그 |
| 프론티어 분리 | `/hunt/frontier`는 **`phases.ts`에 넣지 않는다** | 넣으면 학습 로드맵 nav에 노출 — 9-B부터의 원칙 |
| 배포 | 프론트 Vercel · 백엔드 Railway, `VITE_API_BASE_URL`=**bare origin** | 런북: `docs/deploy.md` |

---

## 3. Phase 11이 재사용한 자산

- `backend/services/vetting.py` — 4관문 + de-alias. Phase 11은 그 *앞에* 전제조건 하나만 세웠고
  네 관문의 수학은 한 줄도 안 건드렸다.
- `backend/services/hunt.py` — `is_recorded`/`pick_frontier` + TESS 프론티어 풀.
- `scripts/build_frontier_seeds_tess.py` — 최신 섹터 자동 감지 빌더. Phase 11이 여기에
  `select_for_hunt`(작은 별 우선)를 더해 사냥용 풀로 바꿨다(sub-11-14).
- `.github/workflows/frontier-refresh.yml` — 2주 자동 갱신(1·15일 06:00 UTC).
- `frontend/src/pages/FrontierHubPage.tsx` · `FrontierHuntPage.tsx` — 사냥 입구.
  sub-11-12에서 이 허브가 단일 트랜짓 front door로 다시 짜였다.
- `frontend/src/lib/api/apiConfig.ts` + `BackendStatusBanner` — 배포 실패를 조용히 죽지 않고
  큰 소리로 말하게 하는 안전장치(`docs/checks/infra/live-revival.md`).

---

## 4. GitHub 진행 상태

### Milestone 현황
- **Phase 10 — Skyward**: closed ✅ — Issue #45 ~ #48 (4개, 전부 closed)
  - Milestone: `https://github.com/2daKaizen-gun/pale-blue-code/milestone/11`
- **Phase 11 — What the Machines Missed**: open — Milestone `/milestone/12`

### 인계 시점 미해결 항목
- 없음. Phase 10의 마지막 부채였던 **#47(sub-10-3 tail — 단일섹터 detrend/`_N_MIN_TRANSITS`
  라이브 보정)** 이 2026-07-24에 실측으로 정리되며 닫혔다.

### 규칙 이탈 (정직하게 남긴다)
- **sub-11-13 ~ sub-11-27(15개)은 GitHub Issue 없이 진행됐다.** Check 문서는 전부 있으나
  트래커가 비었다 — 헌장 §4 "sub-phase = Issue" 위반. 2026-09-08에 확인했고, 소급 이슈를
  **하루 6개씩** 만들어 메우기로 했다(각 본문에 사후 생성임을 명시).
  - ✅ **메움 완료 (2026-09-11).** 09-09 #61~#66(11-13~18) · 09-10 #67~#72(11-19~24) ·
    09-11 #73~#75(11-25~27). 본문은 `scripts/issue-11-{13..27}-body.md`, 모두 첫머리에
    "Filed retroactively" 경고를 달고 close. 이제 마일스톤 #12 `closed=27` = 실제 sub-phase 27개,
    11-1부터 11-27까지 트래커와 Check 문서가 일대일로 맞는다.

---

## 5. Phase 11의 시작점 (그때)

1. Phase 11 PRD + TechSpec 작성 (`docs/specs/phase-11/`) — 2026-07-25.
2. Milestone `Phase 11 — What the Machines Missed` 생성.
3. **sub-11-1 = 검출 유의성 전제조건** (#49). Phase 11의 토대: 4관문은 "행성처럼 생겼나"만 묻고
   "애초에 진짜 검출인가"를 안 물어서, 잡음 피크(`TIC 7318157`, power 0.0004)가 `strong 4/4`로
   통과하고 있었다. 단일 트랜짓은 반복이 없어 *모든* 판단이 곧 유의성 판단이므로, 이건 광내기가
   아니라 **선결 과제**였다.

> **지금(2026-09-08) 어디까지 왔나**: sub-11-27까지. 세 섹터(104·105·103)를 각각 100/100 완주,
> 섹터 102 진행 중, **살아남은 후보 0**. 감도 레버 넷은 전부 null(경계의 발견)이고, 방향은
> A(표적 넓히기) + D(지구크기 후보를 실측 감도와 함께 정직 제시)로 재설정됐다.
> 정본: `docs/vision/finding-our-own-planet.md` §9~§9-3.

---

## 6. 누적 학습

🌌 **Phase 10에서 알게 된 우주의 조각**:
- **깊은 눈 vs 넓은 눈** — Kepler는 하늘의 0.25%를 4년간 응시했고, TESS는 ~85%를 구역당 27일씩
  훑는다. 넓힌 대가는 baseline이고, baseline이 짧으면 판별 자체가 무뎌진다.
- **잘못된 분모** — 오차를 *점 개수*로 나누면(√N) 상관잡음 앞에서 가짜 확신이 생긴다. Kepler의
  긴 baseline이 가려주던 이 실수를 TESS의 짧은 섹터가 노출시켰다.
- **관측하지 않은 것을 세지 마라** — `transit_count`가 gap에 빠진 트랜짓까지 세고 있었다.
  세는 법이 틀리면 정직한 문장도 거짓이 된다.

---

## 7. Claude에게 (다음 Phase의 너에게)

- 권이건은 **실측이 설계를 이기는 것**을 좋아한다. 임계를 지어내지 말고 재라 — 그리고 그 재는
  과정을 Check에 남겨라. sub-10-3이 이 프로젝트의 성격을 결정했다.
- **"모른다"를 말해도 된다. 추측을 사실처럼 말하면 바로 잡힌다.** Railway 상태처럼 내가 관찰할
  수 없는 것은 단정하지 말 것 — 관찰이 추론을 이긴다.
- 커밋 메시지는 영어 한 줄, Issue/Milestone도 영어. 대화는 한국어 반말, 천문학은 비유로.

---

## 8. 링크 모음

- Phase 10 회고: `docs/checks/phase-10/sub-10-{1..4}.md`
- 인프라 회고: `docs/checks/infra/live-revival.md`
- 배포·운영 런북: `docs/deploy.md`
- 북극성: `docs/vision/finding-our-own-planet.md` · `docs/vision/making-the-tool-legible.md`
- 관측 원장: `docs/observations/instrument-log.md`
- Milestone: `.../milestone/11` (Phase 10, closed) · `.../milestone/12` (Phase 11, open)
- Issues: #45, #46, #47, #48 (Phase 10) → #49~#60 (Phase 11 sub-11-1~12) · #61~#75 (sub-11-13~27, 소급)
