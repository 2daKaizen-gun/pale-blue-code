# sub-phase 2-1 Check — R3F 셋업 + 첫 sphere 자전

**완료일**: 2026-05-10
**소요**: 약 하루
**총 Light**: 6개 (원래 7개 → OrbitControls 가 Scene.tsx 에 통합되어 6개로 압축)
**커밋 수**: 약 8개 (Light 별 + 문서 정정 별도)

---

## 잘된 점

- **R3F + drei + three 매트릭스 정확 페어링** — React 19 환경에 R3F v9 / drei v10 정렬. Phase 5/6 까지 살아남을 안정 토대.
- **데이터 모델 단일 소스 패턴** — `data/planets.ts` 가 Phase 1 의 `phases.ts` 와 같은 패턴. 2-2 에서 8개 확장 시 Scene 코드 변경 0 (이미 `.map()` 패턴 채택).
- **자전축 23.5° 반영** — *천문학적 진실* 한 줄을 첫 sub-phase 부터 박아넣음. 단순 sphere 회전이 *진짜 지구 자전* 이 됨.
- **CC-BY 라이선스 첫 attribution 파일** — `ATTRIBUTION.md` 패턴 정립. 이후 NASA APOD / 기타 자산도 같은 위치에 명시 가능.
- **TechSpec 의 폴더 구조가 코드와 정렬** — `SolarSystemPage` → `SolarPage` 정정으로 *문서 ↔ 코드* 일치.

---

## 막혔던 점 / 트러블슈팅

### 문제 1: `npm install @react-three/fiber@^8.15.0` 시 ERESOLVE 에러

**증상**:
```
npm error ERESOLVE unable to resolve dependency tree
npm error peer react@">=18 <19" from @react-three/fiber@8.18.0
npm error Found: react@19.2.6
```

**원인**: Phase 1 인수인계 §2 에 *"React 18.3"* 으로 적혀있었으나 실제로는 `npm create vite@latest` 가 React 19 latest 를 끌어옴. 인수인계 작성 시 `package.json` 직접 확인 안 하고 *추정*. R3F v8 은 React 18 까지만 지원.

**해결**: R3F 공식 매트릭스 확인 — v8→React 18, v9→React 19. R3F v9 + drei v10 으로 매트릭스 재구성.

```bash
npm install three@^0.170.0 @react-three/fiber@^9.6.0 @react-three/drei@^10.7.0
```

또한 Phase 1 인수인계 §2 + Phase 2 TechSpec §1 모두 *실제 설치본* 으로 정정.

**포트폴리오 Troubleshooting 어필 포인트**:
- LLM/AI 협업의 함정 (*Context Rot*) 직접 경험 + 정정
- 의존성 매트릭스를 *추측* 으로 가지 않고 공식 출처 확인
- `--legacy-peer-deps` 같은 우회 회피 (헌장 §10 *이해 우선*)

### 문제 2: `npm` 에러 메시지의 *Red Herring*

**증상**: ERESOLVE 에러에 `expo@55.0.23` 가 등장. 우리 프로젝트는 웹인데 *왜 expo?*

**원인**: R3F v8 이 *expo 환경에서도 동작* 하도록 expo 를 *peerOptional* 로 선언해둠. npm 이 *peerOptional* 도 에러 메시지에 나열함. `npm ls expo` 결과는 *empty* 였음 — 실제로는 안 깔려있음.

**해결**: 헛다리 무시. 진짜 충돌은 React 18 vs 19 한 가지뿐.

**교훈**: npm 에러 메시지의 모든 줄을 *동등하게 의심* 하지 말 것. *peer* / *peerOptional* / *Found* 등 키워드로 분류하면 진짜 원인 빠르게 잡힘.

### 문제 3: 폴더 이름 불일치 (`phase2/` vs `phase-2/`)

**증상**: TechSpec 을 `docs/specs/phase-2/` 에 만들기로 했는데 실제 commit 은 `docs/specs/phase2/` (하이픈 없이) 로 됨.

**원인**: 무심코 친 것. 헌장 §4 / `phase-handoffs/phase-1-to-2.md` 등 다른 모든 곳은 *하이픈 사용* 패턴.

**해결**: `git mv docs/specs/phase2 docs/specs/phase-2` 로 즉시 정정.

**교훈**: 의존성 매트릭스 사고 (문제 1) 와 *같은 종류*. 작은 표기 차이가 누적되면 큰 혼란. 헌장의 권위 즉시 따라가기.

### 문제 4: 채팅 길이로 인한 Claude의 *결정 재반복*

**증상**: 이미 commit 한 [Light 1] 이후, Claude가 *"갈래 A vs B 결정"* 같은 이미 끝난 토론을 다시 꺼냄. 권이건이 *"왜 한참 전으로 돌아가냐"* 로 알려줌.

**원인**: 채팅이 너무 길어져 Claude의 컨텍스트 처리에 *Context Rot* 발생. 헌장 §9 의 *"한 채팅이 너무 길어졌다고 느끼면 즉시 sub-phase 단위로 끊고 인수인계"* 규칙을 Claude 가 놓침.

**해결**: 권이건이 직접 *"사이클 어긋났다"* 알람. 다시 정확한 위치로 복귀.

**교훈**: Claude 가 Context Rot 의 *피해자* 만이 아니라 *유발자* 도 될 수 있음. 다음 sub-phase 부터 Claude 는 *"채팅 길어짐"* 의 신호 (예: 같은 결정 두 번 꺼낼 가능성, 한참 전 내용 회상 시 망설임) 를 더 민감하게 감지하고 *"새 채팅으로 끊자"* 먼저 제안.

---

## 리팩토링 후보 (지금은 안 함)

- `Planet.tsx` 의 `SECONDS_PER_REVOLUTION = 25` 상수 → sub-phase 2-3 에서 Zustand 의 `timeSpeed` 와 연동 시 props 또는 store 로 이동
- `AXIAL_TILT_RAD` 상수 → 행성마다 다름 (예: 천왕성 98°). `PlanetData` 에 `axialTilt_deg` 필드 추가는 sub-phase 2-2 에서
- `ATTRIBUTION.md` 의 텍스처 목록을 sub-phase 2-2 에서 8개 행성 + 태양 + 달 모두 채울 때 한꺼번에 갱신
- `App.tsx` (Vite 기본 템플릿) 가 사용 안 되고 남아있음 → sub-phase 2-7 마무리 시 정리
- **번들 크기 1.15 MB (gzip 321 KB)** — Vite 의 500 KB 경고 발생. Three.js + R3F + drei 가 대부분. PRD §5 *"첫 인터랙티브 < 3s"* 는 만족.
  명시적 결정: **sub-phase 2-7 의 성능 측정 단계에서 일괄 처리**.
  대응 옵션 (2-7 에서 선택):
  - `React.lazy` 로 `SolarPage` 동적 import (route-based code splitting)
  - drei 의 named import 명시화 (현재도 named import 사용 중이지만 tree-shake 검증 필요)
  - `three` 의 tree-shake 검토 (전체 vs 모듈별 import)
  - Lighthouse / Bundle Analyzer 로 정확한 비중 측정 후 결정
  - 빠른 우회: `vite.config.ts` 에 `chunkSizeWarningLimit` 상향 (근본 해결 X, 경고만 침묵)

---

## 다음 sub-phase 에 적용할 교훈

- **인수인계 작성 시 의존성 버전은 `package.json` 직접 확인 후 적기** — 추정 금지
- **새 폴더/파일 만들 때 헌장의 명명 패턴 즉시 확인** — `phase-N` 같은 표기 일관성
- **채팅이 길어지면 Claude 가 먼저 *"새 채팅으로 끊자"* 제안** — 권이건 알람 기다리지 말고
- **Plan 의 작업 분할이 실제 코드 응집도와 어긋나면 즉시 통합/분리** — [Light 4] 에 OrbitControls 자연스럽게 합쳐진 사례
- **NASA / 표준 출처 데이터를 박을 때 단위 (km vs AU) 명시 주석 필수**
- **빌드 경고를 *"무시"* 하지 말고 *"명시적으로 미룸"* 으로 처리** — 회고에 기록하면 sub-phase 2-7 의 작업 항목으로 자동 이어짐

---

## 🌌 이번에 알게 된 우주의 한 조각

**자전축 23.5° 의 사연**

지구 자전축은 *우연한 사고*의 흔적이다. 약 45억 년 전, 화성만한 천체 (테이아) 가 원시 지구와 비스듬히 충돌했다. 그 충격으로:

1. **지축이 23.5° 기울어짐** → 사계절의 원인
2. **떨어져 나간 파편이 모여 달이 됨** → 우리의 유일한 위성

만약 그 충돌이 없었다면 지구는 자전축이 거의 수직 → 사계절 없음 → 식생 분포 균일 → 진화 압력 다름 → 우리 같은 지능 생명체가 탄생할 가능성 낮음.

코드의 단 한 줄 — `const AXIAL_TILT_RAD = (23.5 * Math.PI) / 180` — 에 *우리가 여기 있는 이유* 가 박혀있는 셈. sub-phase 2-6 에서 달 추가할 때 이 사연이 자연스럽게 이어짐.

**부수적으로 배운 것**:
- **R3F 의 useFrame + delta 패턴** — 모니터 주사율 무관한 일관된 애니메이션의 정수
- **PBR 머티리얼** (`meshStandardMaterial`) vs **basic 머티리얼** — 우주에선 directional light 에 반응하는 PBR 필수 (낮 면/밤 면 대비)
- **CC-BY 4.0 라이선스 의무** — 출처 명시 + 라이선스 링크 + 변경 사항 표시
- **npm peer / peerOptional** 의 차이 — 에러 메시지 분석법
- **gzip 압축의 정수**: Three.js 의 1.15 MB → 321 KB (72% 압축) 는 *반복 패턴* 덕분. JavaScript 키워드와 유사 클래스 (vector3, matrix4) 의 빈번한 반복이 압축률을 끌어올림.

---

## 다음 sub-phase

**sub-phase 2-2 — 8개 행성 + 태양 데이터 + 정적 배치**

- 핵심 작업: `data/planets.ts` 를 8개로 확장, 행성별 `visualRadius` / `visualDistance` 손튜닝
- 새 컴포넌트: `Sun.tsx`
- 새 라이브러리: `leva` (선택, 행성 위치 실시간 조정용)
- 텍스처 8개 다운로드 + ATTRIBUTION 갱신
- 첫 PCTC Plan 핵심 질문: *"행성 크기 비율을 정확히 할까, 시각적으로 깎을까?"* (TechSpec §3 의 trade-off 가 처음으로 코드에 박힘)

---

*"검은 우주에 첫 행성이 떴다. 이제 그 행성에 가족들을 더해줄 차례다."*
