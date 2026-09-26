# 유지 모드 — v1.0 이후

> 2026-09-27, v1.0. 프로젝트는 "진술된 결과 + 계속 도는 도구"로 끝났다
> ([`report/final-report.md`](./report/final-report.md)). 이 문서는 그 도구를 계속 돌리는 법이다.
> 발견은 결승선이 아니라 열린 문이다.

---

## 1. 저절로 도는 것

| 무엇 | 언제 | 어디 |
|---|---|---|
| 개척지 풀 갱신 — 최신 TESS 섹터의 TOI 미기록 작은 왜성 100개 | 매월 1·15일 06:00 UTC (MAST 끊김 시 3회 재시도) | `.github/workflows/frontier-refresh.yml` → `backend/data/frontier_seeds_tess.json` |
| CI — pytest · eslint · vitest · 프로덕션 빌드 | push·PR마다 | `.github/workflows/ci.yml` |

갱신 Action은 풀 *내용*이 바뀔 때만 커밋한다(타임스탬프만 바뀌면 버림). 새 섹터가 떴는지는
`git log -- backend/data/frontier_seeds_tess.json`로 본다.

> ⚠️ Action이 `main`에 커밋하면 Railway가 GitHub 자동배포에 연결돼 있는 경우 백엔드가 다시
> 켜진다. 연결을 끊어두지 않았다면 대시보드에서 확인 ([`deploy.md`](./deploy.md)).

---

## 2. 새 섹터를 사냥하는 법

광도곡선 캐시(`backend/cache`)가 있는 체크아웃에서, `backend/` 기준으로.

```bash
# 0) 추적 파일은 다음 갱신 때 굴러간다 — 먼저 섹터 파일로 고정
cp data/frontier_seeds_tess.json data/pool_s0107.json      # 섹터 번호는 파일의 latest_sector
git add data/pool_s0107.json && git commit -m "chore(hunt): freeze sector 107 into its own pool file"

# 1) 배치 단위로: 받기 → 검색 → 세기  (받기와 검색을 병렬로 돌리지 말 것 — MAST 연결 포화)
python ../scripts/fetch_plausible.py --pool data/pool_s0107.json --limit 8
python ../scripts/search_pending.py  --pool data/pool_s0107.json --limit 8
python ../scripts/tally_hunt.py      --pool data/pool_s0107.json

# 2) 풀을 다 돌면 감도와 전체 그림
python ../scripts/completeness_hunt.py --pool data/pool_s0107.json
python ../scripts/earth_size_dossier.py --pool data/pool_s01*.json
python ../scripts/expected_yield.py     --pool data/pool_s01*.json
```

- fetch 실패(MAST 끊김)는 **판정이 아니다** — `not fetched`로 남고 다음 실행이 다시 시도한다.
- 검색 한 별에 수십 초~2분. 긴 검색·재검색은 중간에 죽이지 말 것(진행 중인 별이 처음부터 다시 돈다).
- 숫자는 손으로 세지 않는다 — 전부 캐시에서 스크립트로 (`tally_hunt.py`가 생긴 이유, sub-11-16).
- 옛 섹터도 같은 방법으로 사냥할 수 있다 (sub-11-21):
  `python ../scripts/build_frontier_seeds_tess.py --sectors 101 --n 100 --out data/pool_s0101.json`

---

## 3. 후보가 나오면

`tally_hunt.py`가 `candidates: 1`을 말하는 날의 순서. 서두르지 않는다 — 첫 후보는 인공물이었다
(TIC 326691903, sub-11-18).

1. **raw 곡선을 사람 눈으로 읽는다.** 사냥 화면에서 그 별을 펼쳐 "광도곡선 보기"
   (`/api/monotransit/{name}/curve`). 구간 경계, 램프, 플레어, 한 점짜리 딥인지 본다.
2. **다섯 판별자가 왜 통과시켰는지 값을 본다** — 그 별의 `backend/cache/mono_tic-<TIC>.json`에서
   이벤트의 `checks`(판별자별 `value`와 `passed`). 기각된 이벤트 목록은 `tally_hunt.py --rejected`.
   인공물이면: 무엇이 놓쳤는지 측정하고, 새 관문이 필요하면 임계를 **실측으로** 정한다.
3. 여전히 서 있으면: `earth_size_dossier.py`로 크기·감도·섹터·기저선을 정리하고, 단일 트랜짓이
   주는 **주기 하한·최대 평형온도·다음 통과 가장 이른 날짜** (사냥 화면의 브리핑)를 붙인다.
4. **ExoFOP-TESS / TFOP** 커뮤니티 후속 관측 경로로 넘긴다. 우리는 광도곡선만으로 확정할 수 없다.
   이름은 "후보"이지 "행성"이 아니다.

---

## 4. 로컬 실행

```bash
cd backend  && python -m uvicorn main:app --reload --port 8000
cd frontend && npm run dev          # http://localhost:5173 (자동으로 localhost:8000을 부름)
```

공개 사이트(Vercel)는 백엔드 없이 뜨고, 배너로 그 사실을 알린다. 데모 때만 Railway를 켠다 —
비용과 절차는 [`deploy.md`](./deploy.md).

## 5. 검사

```bash
cd backend  && python -m pytest -q
cd frontend && npm run lint && npm run build && npx vitest run
```

의존성 lock을 다시 만들 땐 CI와 같은 npm으로: `npx npm@11.19.0 install --package-lock-only`
(이전 npm이 선택 의존성을 빠뜨려 `npm ci`가 깨진 적이 있다).
