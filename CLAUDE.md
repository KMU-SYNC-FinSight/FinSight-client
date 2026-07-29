# FinSight Client

소상공인 매장 운영 분석 서비스 **FinSight** 의 프론트엔드.
매장 영상·매출 데이터를 업로드하면 운영 안정성 점수와 방문객·매출 지표를 보여주고,
금융기관이 참고할 수 있는 리포트를 제공한다.

모바일 웹앱 형태의 **PWA** 이며, 데스크톱에서 열어도 가운데 세로형 앱으로 보인다.

## 명령어

백엔드가 `localhost:8080` 에 떠 있어야 실데이터가 보인다. 개발 중 API 는 vite 프록시를 경유한다(아래 참고).

```bash
npm install
npm run dev         # http://localhost:5173
npm run typecheck   # tsc --noEmit
npm run lint
npm run build       # tsc -b && vite build
npm run preview     # 프로덕션 빌드 확인 (서비스워커 실제 동작)

node scripts/build-logo-assets.mjs   # 로고·PWA 아이콘 재생성 (macOS)
```

## 기술 스택

| 목적 | 선택 |
|---|---|
| 프레임워크 | React 19 + Vite + TypeScript |
| 라우팅 | react-router-dom v7 (`BrowserRouter` + 선언형 `Routes`) |
| 서버 상태 | @tanstack/react-query — 폴링을 `refetchInterval` 로 선언적으로 처리 |
| 클라이언트 상태 | zustand + persist — 인증 세션과 선택 매장만 |
| HTTP | axios — 인터셉터로 Bearer 자동 부착, 401 처리 |
| PWA | vite-plugin-pwa (`registerType: 'autoUpdate'`) |
| 스타일 | CSS Modules + CSS 변수 토큰 (Tailwind 없음) |
| 아이콘 | 자체 인라인 SVG (`src/components/icons`) |
| 차트 라이브러리 | 없음. 게이지는 직접 만든 SVG |

---

## 백엔드 연동

### openapi.json 이 유일한 계약 기준

루트의 `openapi.json` 이 API 계약의 단일 출처다.
스펙이 바뀌면 **`src/api/types.ts` 를 먼저 갱신**하고, 그다음 `src/api/endpoints.ts` → 각 API 함수 → 화면 순으로 반영한다.
`openapi.json` 은 백엔드가 생성하는 파일이므로 이 저장소에서 편집하지 않는다.

### 주소 — 개발 중에는 프록시 경유가 기본이다

**백엔드가 same-origin(`localhost:8080`) 만 CORS 허용한다.** `http://localhost:5173` 에서 직접 부르면
preflight 가 `403 Invalid CORS request` 로 막힌다 (5173 / 3000 / 127.0.0.1:5173 모두 403 확인).

그래서 현재 설정은:

- `.env` 의 `VITE_API_BASE_URL` 을 **빈 값**으로 둔다 → 요청이 same-origin `/api/...` 로 나간다.
- `vite.config.ts` 의 `server.proxy` 가 `/api` → `http://localhost:8080` 으로 넘긴다.
- 코드에 호스트를 하드코딩하지 않는다.

백엔드에서 `http://localhost:5173` 을 CORS 허용 목록에 추가하면,
`.env` 에 `http://localhost:8080` 을 채우고 프록시를 지워도 된다.

### 실측한 서버 동작 (openapi.json 에 안 적힌 것들)

라이브 백엔드(`localhost:8080`)에 직접 붙여 확인한 사실이다. 화면 로직이 여기에 의존한다.

**1. 에러 응답은 일관된 봉투를 쓴다**

```json
{ "code": "SCORE_NOT_READY", "message": "아직 운영 점수가 산출되지 않았습니다...", "errors": null, "timestamp": "..." }
```

`toApiError()` 가 `code` 와 `message` 를 뽑아 준다.
**화면 분기는 message 문자열이 아니라 `code` 로 한다** (`API_CODES`, `src/api/client.ts`).
확인된 코드: `SCORE_NOT_READY` · `STORE_NOT_FOUND` · `UPLOAD_NOT_FOUND` ·
`UNSUPPORTED_FILE_TYPE` · `INVALID_LOGIN_CREDENTIALS` · `INVALID_TOKEN` · `UNAUTHORIZED`.

**2. `GET /report` 는 점수 산출 전 404 `SCORE_NOT_READY` 를 준다 — 이건 오류가 아니다**

가장 중요한 함정이다. 매장을 만들고 데이터를 안 올린 상태에서 리포트를 부르면 404 다.
장애가 아니라 "데이터를 더 올려야 한다"는 정상 상태이므로, 빨간 오류 화면이 아니라
업로드를 유도하는 빈 상태로 보여준다. `ReportPage` 의 `ReportErrorState`,
`DashboardPage` 의 `ScoreExplanation` 이 이 분기를 담당한다.

반면 `GET /dashboard` 는 같은 상황에서 **200 + 전부 null** 을 준다. 두 엔드포인트가 다르게 동작한다.

**3. 값이 없는 선택 필드는 키 생략이 아니라 `null` 이다**

```json
{"storeId":4,"name":"이름만 매장","businessType":"ETC","address":null,"seatCount":null,"openedAt":null}
{"storeId":4,"storeName":"...","operationScore":null,"grade":null,"riskLevel":null,"visitorMetrics":null,"salesMetrics":null}
```

`visitorMetrics` / `salesMetrics` **블록 자체가 null** 일 수 있다. 항상 `v?.field` 로 접근한다.
타입에도 `| null` 을 붙여 두었다 — 지우지 말 것.
`salesPerTrackedObject` 는 영상 분석 전(분모 없음)에는 null 이다.

**4. 성공 응답이 201 인 엔드포인트가 있다**

`POST /api/auth/signup`, `POST /api/stores`, 두 업로드 모두 **201** 이다 (스펙에는 200).
axios 는 2xx 를 성공으로 보므로 문제없지만, 상태 코드를 직접 비교하는 코드를 쓰지 말 것.

**5. 액세스 토큰 수명은 1시간** (`exp - iat = 3600`). 만료 후 첫 요청이 401 `INVALID_TOKEN` 으로 떨어지고,
인터셉터가 세션을 비워 로그인 화면으로 보낸다. 리프레시 토큰은 없다.

**6. 남의 매장·없는 매장은 403 이 아니라 404 `STORE_NOT_FOUND`** 다. 존재 여부를 숨기는 설계다.

**7. 매출 CSV 컬럼은 `date,salesAmount,transactionCount`** 다 (스펙에 없어 실측).
같은 날짜 재업로드 시 `updatedRows` 로 집계되고, 형식이 깨진 행은 `skippedRows` 로 빠진다.

**8. 분석할 수 없는 영상은 `FAILED` 가 아니라 `UPLOADED` 에 머문다**

내용이 영상이 아닌 파일을 `.mp4` 로 올리면 접수는 201 `UPLOADED` 로 되지만
그 뒤 상태가 바뀌지 않는다 (16초 이상 관측). `FAILED` 로 떨어지지 않는다.
**그래서 폴링 5분 상한이 이론상의 안전장치가 아니라 실제로 타는 경로다.** 없애면 무한 폴링이 된다.
반면 확장자가 잘못되면 업로드 시점에 400 `UNSUPPORTED_FILE_TYPE` 로 즉시 거절된다.

정상 영상은 매우 빨리 `COMPLETED` 가 되어 `PROCESSING` 을 못 볼 수 있다.
`UploadStepper` 는 단계 건너뜀을 정상 처리한다 (지나간 단계를 done 으로 표시).

### 인증

- 로그인 `POST /api/auth/login` 성공 시 `accessToken` / `tokenType` / `userId` / `name` / `role` 을
  zustand persist 로 저장한다 (`src/store/authStore.ts`, localStorage 키 `finsight.auth`).
- 모든 요청에 `Authorization: <tokenType> Bearer 값` 을 인터셉터가 자동으로 붙인다
  (`src/api/client.ts`). 화면에서 헤더를 직접 만들지 않는다.
- **401/403 → 세션 폐기.** 인터셉터가 `clearSession()` 을 호출하고,
  `RequireAuth` 가 토큰 없음을 감지해 `/login` 으로 보낸다.
  인터셉터에서 직접 `location` 을 바꾸지 않는다 — 그러면 복귀 경로(`state.from`)가 사라진다.
- 단, `/api/auth/login` · `/api/auth/signup` 의 401 은 세션 만료가 아니라
  "비밀번호가 틀림"이므로 세션을 건드리지 않는다.
- 회원가입 응답(`SignupResponse`)에는 **토큰이 없다.** 자동 로그인이 불가능하므로
  가입 성공 후에는 로그인 화면으로 보내고 이메일만 프리필한다.

### 업로드 폴링 규약

두 업로드의 응답 모양이 **다르다.** 섞어 쓰지 않도록 주의한다.

| | 영상 `POST /api/stores/{id}/videos` | 매출 CSV `POST /api/stores/{id}/sales` |
|---|---|---|
| 응답 | `VideoUploadResponse` | `SalesUploadResponse` |
| `processingStatus` | 있음 | **없음** |
| 즉시 알 수 있는 것 | 접수 여부만 | `totalRows` / `insertedRows` / `updatedRows` / `skippedRows` |
| 화면 처리 | 폴링 단계 표시만 | 행 요약 카드를 먼저 띄우고 폴링도 병행 |

공통 규약 (`src/hooks/useUploadPolling.ts`):

- 상태 조회는 `GET /api/uploads/{uploadId}` 로 통일.
- 진행: `UPLOADED → PROCESSING → COMPLETED`, 실패는 `FAILED`.
- **폴링 주기 2초** (`POLL_INTERVAL_MS`).
- `COMPLETED` / `FAILED` 에 도달하면 **폴링을 멈춘다** (`refetchInterval` 이 `false` 를 반환).
- **상한 5분** (`POLL_TIMEOUT_MS`). 넘기면 멈추고 `isTimedOut` 을 세워 "처리가 지연되고 있습니다" 안내를 띄운다.
  백엔드가 처리 예상 시간을 주지 않으므로 클라이언트가 상한을 정한다.
- `COMPLETED` 가 되면 해당 매장의 `dashboard` / `report` 쿼리를 무효화해 새 값을 읽게 한다.
- `FAILED` 응답은 **어느 단계에서 실패했는지 알려주지 않는다.**
  `UploadStepper` 가 도달했던 마지막 단계를 기억해 그 자리에 실패를 표시한다.

영상은 보내기 전에 **로컬 미리보기**로 확인시킨다 (`VideoPreview`).
`URL.createObjectURL` 로 브라우저에서 바로 재생하고 파일이 바뀌면 이전 URL 을 반드시 `revoke` 한다
(수백 MB blob 이 탭에 쌓인다). 분석 불가 영상이 `FAILED` 없이 `UPLOADED` 에 머물러
5분을 버리는 경로가 실제로 있으므로, 여기서 한 번 걸러내는 값이 크다.
브라우저가 디코딩하지 못하면(HEVC 등) 재생만 실패하고 업로드는 막지 않는다 — 서버는 처리할 수도 있다.

멀티파트 업로드 시 `Content-Type` 을 **직접 지정하지 않는다.**
`FormData` 만 넘기면 axios 가 boundary 를 포함해 설정한다. 직접 쓰면 boundary 가 빠져 서버 파싱이 깨진다.

### 서비스워커는 `/api/**` 를 캐싱하지 않는다

`vite.config.ts` 의 workbox 설정에서 `/api/` 로 시작하는 요청은 `NetworkOnly` 다.
매출·방문객 데이터가 기기에 남으면 안 되고, 오래된 금융 지표를 보여주면 오해를 부른다.
앱 셸(JS/CSS/아이콘)만 precache 한다. 이 규칙은 바꾸지 않는다.

### 명세에 없어서 클라이언트가 메운 부분

| 공백 | 현재 대응 |
|---|---|
| 업로드 이력 목록 API 없음 | 진행 상태를 화면 로컬 state 로만 유지. 새로고침하면 표시가 사라진다는 캡션을 노출 |
| 로그아웃 API 없음 | 클라이언트에서 토큰 폐기 + react-query 캐시 `clear()` |
| 에러 응답 스키마 없음 | 실제 봉투는 `{code, message, errors, timestamp}`. `toApiError()` 가 `code` + `message` 를 뽑고, 없으면 상태 코드별 기본 문구로 폴백. 분기는 `API_CODES` 로 |
| `GET /report` 가 점수 산출 전 404 | `SCORE_NOT_READY` 코드로 구분해 오류가 아닌 빈 상태로 표시 |
| CSV 컬럼 형식 미기재 | 실측 `date,salesAmount,transactionCount` |
| 분석 불가 영상이 `FAILED` 로 안 감 | `UPLOADED` 에 머무름 → 5분 폴링 상한이 실제 종료 경로 |
| `grade`·`riskLevel` 이 enum 이 아닌 자유 string | `src/lib/grade.ts` 의 매핑 테이블 + 회색 폴백. 모르는 값은 원문을 그대로 표시 |
| 토큰 만료 시각 정보 없음 | 401 응답만이 세션 만료 신호 |
| 기본 매장 개념 없음 | `selectedStoreId` 를 클라이언트가 기억. 대시보드 탭은 이 값 → 매장이 1곳이면 자동 선택 → 없으면 선택 안내 |
| `FINANCIAL_ANALYST` 가 매장을 탐색할 경로 없음 (`GET /api/stores` 는 "내 매장"뿐) | 리포트는 내 매장 대시보드/상세에서 진입하는 화면으로만 구현 |

---

## 디자인 방향

국내 금융 앱(KB국민은행 계열)의 **신뢰감 있고 정돈된 UI**.
실험적이지 않고 보수적·단정하게. (참고했던 스크린샷들은 타사 저작물이라 저장소에서 제외했다.)

레이아웃 리듬은 토스처럼 **여백을 넉넉히, 제목을 크게**, 색은 KB 계열로 간다.

### 컬러 — 로고에서 실측한 값을 쓴다

브랜드 주색은 **옐로우**, 기본 액션 버튼은 **차콜**.
두 값 모두 `public/logo.png` 에서 픽셀을 직접 뽑은 것이다. 임의로 바꾸면 안 된다 —
스플래시와 옐로우 헤더는 로고 배경색이 화면 배경색과 **정확히 같아야** 경계가 보이지 않는다.

| 토큰 | 값 | 용도 | 흰 배경 대비 |
|---|---|---|---|
| `--brand` | `#FDBC03` | 헤더, 히어로 카드, 게이지 아크, 선택된 칩 | — |
| `--brand-wash` / `--brand-dim` | `#FFF8E6` / `#FFE9AE` | 아이콘 타일 / 뱃지 배경 | — |
| `--brand-ink` | `#7A5600` | 옐로우 계열 배경 위 텍스트 | — |
| `--ink` | `#191F28` | 제목, 기본 버튼 배경 | 16.6:1 AAA |
| `--ink-2` | `#4E5968` | 본문 보조 | 7.1:1 AAA |
| `--ink-3` | `#6B7684` | 캡션 | 4.6:1 AA |
| `--ink-4` | `#8B95A1` | 보조·비활성 | 3.0:1 (큰 글씨 전용) |
| `--ink-5` | `#B0B8C1` | 플레이스홀더 (장식용, **본문 금지**) | 2.0:1 |
| `--bg` / `--bg-sunken` | `#FFFFFF` / `#F2F4F6` | 카드 / 섹션 구분·입력 필드 | — |
| `--line` / `--line-strong` | `#E5E8EB` / `#D1D6DB` | 구분선 / 강한 테두리 | — |

잉크 램프는 **toss.im 에서 실측한 뉴트럴 계단**을 채택한 것이다
(추출 도구로 뽑은 뒤 검수해 고른 값. 원본 덤프는 타사 디자인 자산이라 저장소에 두지 않았다).
`--ink-3` 는 예전 `#8B919C`(3.17:1, AA 미달)를 대체한 값이므로 되돌리지 말 것.

CSS 에 색을 하드코딩하지 않는다. 전부 `tokens.css` 의 변수를 쓴다
(반투명 잉크·트랙 색까지 토큰으로 있다).

### 컬러 버튼 위 텍스트는 흰색이 아니라 다크다

토스도, 참고한 국내 금융 앱들도 컬러 버튼에 흰 글씨를 쓴다. 우리는 쓰지 않는다.
노란색은 명도가 높아서 흰 글씨가 읽히지 않는다.

| 조합 | 대비 |
|---|---|
| 흰 글씨 on `#FDBC03` | **1.70:1** 실패 |
| `--on-brand` (`#191F28`) on `#FDBC03` | **8.92:1** AAA |

참고로 추출 리포트는 토스 자신의 버튼(`#F9FAFB` on `#3182F6`)도 3.55:1 FAIL 로 잡았다.

### 스케일 규율 — 이게 무너지면 다시 아마추어처럼 보인다

한때 `font-size` 하드코딩 값이 **20종**(11 / 11.5 / 12 / 12.5 / 13 / 13.5 / 14 / 14.5 / 15 / 15.5 / 16 / 16.5 / 17 …)
까지 늘어난 적이 있다. 0.5px 차이는 아무도 못 알아보지만 화면마다 값이 다르면
줄이 안 맞고 리듬이 깨져 **"디자이너 없는 앱"** 처럼 보인다. 특정 화면이 못생긴 게 아니라
아무것도 격자에 붙어 있지 않은 게 원인이다.

지금은 이렇게 강제한다.

| 규칙 | 내용 |
|---|---|
| 글자 크기 | `--fs-*` **7단계 + 숫자 3단계**가 전부. CSS 에 px 을 직접 쓰지 않는다 |
| 줄 높이 | `--lh-*` 6단계. 예외는 게이지 숫자의 `line-height: 1` 하나뿐 |
| 간격 | `--sp-1`~`--sp-9` (**4px 그리드**). 3px 이하만 선·미세조정용으로 허용 |
| 높이 | `--control-*`, `--row-h`, `--topbar-h` 등 전부 4의 배수 |
| 색 | 전부 토큰. 반투명 잉크·트랙까지 토큰이 있다 |

검사 방법:

```bash
# 하드코딩 font-size / line-height 가 남아 있는지
find src -name '*.css' ! -name tokens.css -print0 | xargs -0 grep -n 'font-size: [0-9]'

# 간격 속성의 4px 그리드 이탈
find src -name '*.css' ! -name tokens.css -print0 | xargs -0 grep -hE '^\s*(padding|margin|gap)[^:]*:' \
  | grep -oE '\b[0-9]+px' | grep -oE '^[0-9]+' | sort -nu | awk '$1 % 4 != 0 && $1 > 3'
```

### 아이콘은 lucide-react 를 쓴다

예전에는 SVG path 를 직접 그렸는데 좌표를 손으로 찍다 보니 아이콘마다 획 굵기와
시각 무게가 어긋났다. `src/components/icons/index.tsx` 는 **얇은 어댑터**다 —
호출부는 `<StoreIcon size={20} />` 그대로 쓰고, 아이콘을 바꾸려면 그 파일의 매핑만 고친다.
기본값은 크기 24 / 굵기 1.8 (lucide 기본 2는 작은 크기에서 무겁다).
트리셰이킹되어 17개 써도 gzip +1.5KB 다.

### 화면 전환

`ScreenTransition` 이 `pathname` 을 key 로 받아 진입 애니메이션만 건다 (240ms 페이드+슬라이드).
나가는 화면까지 애니메이션하려면 두 화면을 동시에 마운트해야 해서 그만한 값어치가 없다.

**전환 래퍼는 탭바 바깥에 있어야 한다.** `TabLayout` 안에서 `<Outlet>` 만 감싸므로
탭을 옮겨도 탭바는 고정된 채 남는다. 스택 화면은 `StackLayout` 이 같은 역할을 한다.

### 로딩은 스켈레톤으로

스피너 하나만 돌리면 화면이 비어 보이고 로딩이 끝나는 순간 레이아웃이 튄다.
`src/components/ui/Skeletons.tsx` 가 **실제 내용과 같은 골격**을 그린다
(`StoreListSkeleton` / `DashboardSkeleton` / `ReportSkeleton`).
`LoadingState` 스피너는 짧은 대기(대시보드 진입 리졸버 등)에만 남겨둔다.

### 타이포 가중치

**제목은 700 까지만 쓴다.** toss.im 실측 결과 가중치 분포가 400(856회) → 600(59) → 700(47) 이고
800 이상은 등장하지 않는다. 한글은 800 에서 획이 뭉갠다.
예외는 게이지 점수 숫자와 아바타 이니셜 두 곳뿐(숫자·단문자는 굵어도 버틴다).

### 간격 토큰

| 토큰 | 값 | 의미 |
|---|---|---|
| `--gutter` | `20px` | 화면 좌우 기본 여백 |
| `--page-top` | `24px` | **TopBar 아래 본문이 시작하는 여백.** 좁으면 헤더에 붙어 보인다 |
| `--section-y` | `28px` | 섹션 위아래 여백 |
| `--topbar-h` / `--tabbar-h` | `56px` / `60px` | 상·하단 바 높이 |

`PageBody` 가 `--page-top` 을 자동으로 적용한다.
자체 헤더를 가진 화면(매장 목록의 옐로우 영역)만 `flush` 를 줘서 위 여백을 없앤다.

### 메인 화면(`StoreListPage`) 구성

KB스타뱅킹 메인 화면을 기준으로 짠 구조다. 위에서부터:

1. **이름 + chevron** — 누르면 `/my` 로. 로고·워드마크·인사말 문장을 두지 않는다.
   레퍼런스도 상단에 이름 한 줄만 있다. 브랜드는 스플래시에서 이미 보여줬다.
2. **프로모션 카러셀** (`PromoCarousel`) — 3장이 **자동으로** 넘어간다.
3. **전체 요약 한 줄** — 매장 수 / 평균 점수 / 분석 대기 수.
4. **매장 가로 슬라이드** + `‹ 1 / 3 ›` 페이저 (**자동으로 넘어가지 않는다**).
5. **지금 할 일** — 점수가 없는 매장을 모아 업로드로 보낸다. 없으면 섹션 자체를 감춘다.
6. **바로가기 2×2** — 대시보드 / 리포트 / 업로드 / 사용 방법.
7. 매장 등록 버튼.

**자동 넘김은 프로모션 카러셀에만 있다.** 매장 카드는 사용자가 직접 넘긴다 —
안내 문구는 순서대로 흘려보내도 되지만, 데이터를 읽는 중에 카드가 바뀌면 방해가 된다.

`PromoCarousel` 규약 (5초 주기):

| 상황 | 동작 |
|---|---|
| 스와이프·도트 클릭 | 9초 멈췄다가 다시 시작 |
| 일시정지 버튼 | 다시 누를 때까지 정지 |
| `prefers-reduced-motion` | 자동으로 넘기지 않고 정지 버튼도 감춤 |
| 백그라운드 탭 | 건너뜀 |

**정지 버튼을 빼지 말 것** (WCAG 2.2.2). × 로 닫으면
`localStorage['finsight.promoDismissed']` 에 기억해 다시 띄우지 않는다.

슬라이드의 닫기 버튼을 본체 버튼 **안에** 넣지 않는다 — 버튼 안의 버튼이 되어 클릭이 꼬인다.
본체 `<button>` 과 닫기 `<button>` 을 형제로 두고 바깥을 `<div>` 로 감쌌다.

#### 매장별 점수는 `useStoreDashboards` 로 한 번에 읽는다

목록 API 에 점수가 없어서 매장 수만큼 `GET /api/stores/{id}/dashboard` 를 부른다.
카드가 각자 부르면 요약(평균 점수·분석 대기 수)을 계산할 수 없어서
**페이지에서 `useQueries` 로 모아 읽고 카드에 내려준다.**
쿼리 키가 `useDashboard` 와 같아 대시보드 화면과 캐시를 공유한다.

**배경은 전부 흰색이다.** 예전에 섹션마다 흰색/회색을 섞었더니 블록 사이에 회색 띠가 남아
"색이 안 맞는 빈 공간"처럼 보였다. 카드는 배경색이 아니라 **테두리 + 옅은 그림자**로 구분한다.
이 화면에서 `--bg-sunken` 은 눌림 상태와 보조 버튼 채움에만 쓴다.

**매장 카드는 점수를 함께 보여준다.** 목록 API(`GET /api/stores`)에는 점수가 없어서
카드마다 `GET /api/stores/{id}/dashboard` 를 한 건씩 더 부른다. 매장 수가 적어 문제되지 않고
react-query 가 캐시한다. 점수가 아직 없으면 숫자 대신 "데이터를 올리면 점수가 계산돼요" 한 줄만
보여준다 — 숫자 자리와 등급 pill 을 둘 다 비워두면 "측정 전" 옆에 "측정 중" 이 붙어 겹쳐 읽힌다.

#### 매장 슬라이드 — 양쪽 peek + 자동 회전

`ScoreCarousel`(옆 카드를 완전히 감춤)과 달리 여기는 **양옆으로 12px 씩 보이게** 한다.

폭 계산 (컨테이너 `W`, padding `P`, gap `G`):

- `flex-basis: 100%` 는 content box 기준이므로 카드 폭 `C = W − 2P`
- `scroll-snap-align: center` 로 스냅하면 카드가 `[P, W−P]` 를 차지하고
  **양옆 카드가 각각 `P − G` 만큼** 보인다
- 현재 `P = 20px(--gutter)`, `G = 8px` → 양쪽 12px. 448px 프레임에서 카드 폭 408px

`P` 를 `--gutter` 로 둔 이유는 카드 좌우 끝이 섹션 제목·버튼과 같은 선에 맞기 때문이다.
`G` 를 키우면 보이는 폭이 줄고, `G ≥ P` 면 옆 카드가 아예 사라진다.

`scrollTo` 는 center 정렬이라 `left = 카드위치 − (clientWidth − cardWidth) / 2` 로 계산한다
(start 정렬 기준으로 두면 카드가 한쪽으로 치우친다).

#### 무한 순환 — 자동으로 넘어가지는 않는다

**자동 회전은 없다.** 사용자가 스와이프하거나 화살표를 눌렀을 때만 움직이고,
대신 끝에서 막히지 않고 `1 → 2 → 3 → 1` 로 이어진다.

네이티브 scroll-snap 은 끝에서 멈추므로 **앞뒤에 복제 카드를 하나씩 붙여서** 순환을 만든다.

```
DOM:  [3']  [1]  [2]  [3]  [1']      ' 는 복제
idx:   0     1    2    3    4
```

3 에서 오른쪽으로 넘기면 복제 `1'` 로 부드럽게 이동하고, **스크롤이 멈춘 순간
애니메이션 없이 진짜 `1` 로 순간이동**시킨다 (`behavior: 'instant'`). 두 카드가 같아서 보이지 않는다.

- 스크롤 정착 판정은 `scroll` 이벤트 뒤 120ms 디바운스 (`scrollend` 는 브라우저 지원이 고르지 않다)
- DOM 인덱스 `i` 의 스크롤 위치는 정확히 `i × step` (step = 카드 폭 + gap).
  center 스냅이라 `P + i(C+G) − (W−C)/2 = i(C+G)` 로 정리된다
- 복제와 원본이 같은 매장이라 React key 에 DOM 인덱스를 함께 넣는다
- 복제 카드도 `useDashboard` 를 부르지만 쿼리 키가 같아 react-query 가 중복 요청을 막는다
- 매장이 1곳이면 복제도 페이저도 만들지 않는다

### 사용 방법 화면 (`/guide`, `src/pages/guide/GuidePage.tsx`)

틴트 히어로(큰 제목 + 기관 타일 슬라이드) →
흰 본문 설명(사장님 관점 / 금융기관 관점 / 3단계) → 하단 고정 CTA.

**실제 은행 로고를 쓰지 않는다.** 특정 은행 로고를 "이 점수를 참고합니다" 옆에 붙이면
존재하지 않는 제휴를 사실처럼 보여주게 되고 상표 문제도 생긴다.
대신 기관 **유형** 타일(은행 · 저축은행 · 캐피탈 · 카드사 · 보증재단)을 쓰고,
화면 하단에 "표시된 기관 유형은 활용 예시로 실제 제휴를 뜻하지 않습니다" 고지를 둔다.
로고 이미지를 받게 되면 `INSTITUTIONS` 배열의 `icon` 만 교체하면 된다.

#### 기관 타일은 끝없이 흐른다 (마퀴)

같은 목록을 **두 벌** 이어 붙이고 `translateX(-50%)` 로 밀면 한 바퀴 끝이 처음과 같아 이음매가 안 보인다.

두 가지를 지켜야 한다.

1. **타일이 컨테이너보다 넓어야 한다.** 7개 × 84px = 588px > 408px.
   개수를 5개로 줄이면 정확히 408px 이 되어 흐를 게 없어진다.
2. **`gap` 대신 타일마다 `margin-right` 를 준다.**
   flex `gap` 은 마지막 타일 뒤에 안 붙어서 한 벌(588px)과 전체의 절반(582px)이
   **6px 어긋나 한 바퀴마다 튄다.** margin 을 쓰면 모든 타일이 똑같이 84px 를 차지해 정확히 맞는다.
   같은 이유로 **애니메이션되는 `.tileRow` 에 padding 을 주면 안 된다** (`-50%` 기준 폭이 달라진다).

손을 올리면(`:hover`/`:active`) 멈춰서 읽을 수 있고,
`prefers-reduced-motion` 이면 흐르지 않고 직접 스크롤하게 둔다.

#### 아래 섹션은 스크롤 진입 시 떠오른다

`src/components/ui/Reveal.tsx` (IntersectionObserver). 3단계는 `delay` 를 90ms 씩 줘서 순서대로 올라온다.

**화면 밖으로 나갈 때 다시 숨기지 않는다** — 읽고 있는 글이 가장자리에서 흐려지면 방해가 된다.
한 번 나타나면 observer 를 끊는다.

`Reveal` 은 `div` 를 그리므로 **`<ol>` 의 직계 자식으로 쓰면 안 된다** (`li` 만 허용).
`li` 안쪽에 두고 스타일을 그 아래 요소로 내린다.

진입 경로는 두 곳이다 — 메인의 소개 카드, 그리고 **내 정보 > 사용 방법**.
소개 카드를 닫아도 다시 볼 수 있어야 하므로 내 정보 쪽 링크를 지우지 말 것.

### 로고 자산

원본은 `scripts/icons/logo-source.png` (1254px, 1.1MB) 에 마스터로 둔다.
웹용 파일은 `node scripts/build-logo-assets.mjs` 로 생성한다 →
`public/logo.png`(512) · `public/favicon.png`(64) · `public/icons/*`.

원본에 미세한 노이즈가 섞여 있어 그대로 리사이즈하면 512px 이 240KB 가 된다.
이 스크립트가 색을 브랜드 2색으로 정리한 뒤 다시 인코딩해 **9.8KB** 로 줄인다
(PWA 가 precache 하므로 용량이 중요하다). 외부 의존성 없이 macOS `sips` + Node `zlib` 만 쓴다.

### 등급색은 브랜드 옐로우와 겹치지 않게 분리한다

옐로우가 주색이므로 `CAUTION` 에 옐로우를 쓰면 "브랜드색"인지 "주의 등급"인지 구분이 안 된다.
그래서 주의는 **오렌지**(`#EF6C1F`)를 쓴다.

| grade | 색 | 라벨 |
|---|---|---|
| `VERY_STABLE` | `#0B8A5B` 딥그린 | 매우 안정 |
| `STABLE` | `#1B64DA` 블루 | 안정 |
| `CAUTION` | `#F26B21` 오렌지 | 주의 |
| `RISK` | `#D93025` 레드 | 위험 |
| 그 외 / 없음 | `#8B9096` 그레이 | 원문 그대로 (라벨 없으면 "측정 중") |

### 금지 사항

AI 생성물 특유의 인상을 피한다.

- 그라데이션 배경
- 보라 / 네온 계열
- **이모지** (플랫폼마다 모양이 달라 톤이 깨진다. 아이콘은 `src/components/icons` 의 인라인 SVG)
- 과한 그림자, 떠 있는 카드 — 그림자는 `--shadow-card` 수준으로만
- 8px 초과 blur
- 한글 본문에 400 미만 font-weight

### 모바일 프레임 · 홈 화면 실행(PWA)

**폰에서는 화면을 꽉 채우고, 480px 이상에서만 가운데 세로형 앱으로 묶는다.**

`max-width` 를 항상 걸면 뷰포트가 **449~479px** 인 기기(일부 안드로이드·폴더블)에서
좌우에 몇 px 짜리 회색 띠만 남고 그림자는 없어서 렌더링 오류처럼 보인다.
그래서 `max-width` · `margin-inline: auto` · 그림자를 **전부 `@media (min-width: 480px)` 안에** 둔다.

| 항목 | 설정 | 이유 |
|---|---|---|
| `html`, `body` 배경 | 폰에서 **흰색**, 480px 이상에서만 회색 | 회색이면 iOS 고무줄 스크롤에서 위아래로 회색이 번쩍인다 |
| `overscroll-behavior` | `html`·`body` 모두 `none` | 스크롤 체이닝이 올라가면 화면 전체가 딸려 움직인다 |
| `theme_color` | `#FFFFFF` (기본) + 화면마다 갱신 | 홈 화면 실행 시 **상태바 색**. 아래 참고 |
| `background_color` | `#FDBC03` | 실행 직후 **스플래시 배경**. `SplashPage` 가 노란 화면이라 로고 실측색 그대로 |
| 높이 | `100dvh` | 모바일 브라우저 주소창 때문에 `100vh` 는 쓰지 않는다 |
| 안전 영역 | 프레임 `padding-top: env(safe-area-inset-top)`, 탭바·고정 CTA 는 `env(safe-area-inset-bottom)` | 노치·홈 인디케이터 회피 |
| 입력 필드 `font-size` | **16px 이상** (`--fs-input`) | 미만이면 iOS 에서 포커스 시 화면이 확대된다 |

버튼·링크·탭·아이콘에는 `-webkit-touch-callout: none` + `user-select: none` 을 준다.
길게 눌렀을 때 iOS 확대경이나 "복사/공유" 메뉴가 뜨면 웹페이지처럼 보인다.
**본문 글자는 제외한다** — 사용자가 복사할 수 있어야 한다.

#### 상태바 영역까지 화면 색으로 채운다 (iOS / 안드로이드가 방식이 다르다)

목표는 "시계 있는 자리에도 화면 색이 이어지는 것" — 특히 **노란 스플래시가 꽉 차 보여야 한다.**
두 OS 가 서로 다른 것을 본다.

| | 무엇을 보나 | 우리 처리 |
|---|---|---|
| **iOS** standalone | `apple-mobile-web-app-status-bar-style` **만**. `theme-color` 는 **무시** | `black-translucent` → 콘텐츠가 상태바 아래까지 올라감 |
| **안드로이드** standalone | `theme-color` | `useStatusBarColor` 가 라우트마다 갱신 (`/` → `--brand`, 그 외 → `--bg`) |

**안전 영역은 프레임이 아니라 각 화면의 최상단 요소가 채운다.**
`AppFrame` 에서 `padding-top` 을 한 번에 주면 그 배경색(흰색)만 띠로 남아,
노란 스플래시 위에 흰 줄이 생긴다. 그래서 아래 네 곳이 각자 `--safe-top` 을 처리한다.

| 요소 | 쓰는 화면 |
|---|---|
| `TopBar` | 대부분 (상세·대시보드·리포트·가이드·내 정보 등 9개) |
| `StoreListPage .topRow` | 메인 |
| `AuthForm .brandBar` | 로그인 |
| `SplashPage .page` | 스플래시 |

높이는 `calc(var(--topbar-h) + var(--safe-top))` 로 잡아야 노치 아래로 실제 56px 이 남는다.
**TopBar 없는 화면을 새로 만들면 여기에 추가할 것.** 안 하면 콘텐츠가 노치에 가린다.

`black-translucent` 일 때 상태바 자리에는 **body 배경**이 비친다(그 위에 그려진 요소가 있으면 그것이).
그래서 `global.css` 의 `@media (display-mode: standalone)` 에서 body 기본을 브랜드색으로 두고
(앱은 항상 스플래시에서 시작한다), 화면이 바뀌면 `useStatusBarColor` 가 갈아 끼운다.

**대가:** `black-translucent` 는 상태바 글자를 **흰색으로 고정**한다. 예외가 없다.
스플래시(노란색) 위에서는 1.70:1 로 흐릿하게 보이고,
**흰 화면에서는 1.00:1 로 사실상 안 보인다.** 스플래시를 꽉 채우기 위해 감수한 것이다.
되돌리려면 `index.html` 의 값을 `default` 로 바꾸면 된다 (대신 상태바에 색이 안 들어간다).

안드로이드 `display: fullscreen` 은 쓰지 않는다 — 상태바가 통째로 사라진다.

#### iOS 에서 변경이 반영 안 될 때

**iOS 는 상태바 설정을 출처 단위로 강하게 캐싱한다.** 코드를 고쳐도 그대로인 경우가 많다.
게다가 서비스워커가 `index.html` 을 precache 하므로 meta 변경이 두 겹으로 갇힌다.

순서대로 지울 것:

1. 홈 화면 아이콘 **삭제**
2. 설정 → Safari → 고급 → 웹사이트 데이터 → 해당 사이트 **삭제**
3. Safari 로 다시 접속 (`npm run preview` 또는 배포 주소)
4. 홈 화면에 다시 추가

**반영됐는지 확인하는 법:** 상단바가 눈에 띄게 **두꺼워진다**
(`--topbar-h` 56px + 노치 높이 약 47px). 두께가 그대로면 meta 가 아직 안 먹은 것이다.

### 스플래시 (`src/pages/SplashPage.tsx`)

`/` 진입 시 브랜드를 보여준 뒤 세션 유무에 따라 `/login` 또는 `/stores` 로 넘긴다.

배경을 `--brand` 로 두면 **로고의 노란 배경이 화면과 이어져 마크만 떠 보인다.**
그래서 `--brand` 가 로고 실측색과 정확히 같아야 한다.
`mix-blend-mode: multiply` 를 쓰면 안 된다 — 노란색끼리 곱해져 `#FA8B00` 주황으로 어두워진다.
같은 이유로 옐로우 헤더 위의 `Wordmark` 는 `variant="bare"` 를 쓴다.

**타이밍은 TSX 의 상수 두 개가 유일한 기준**이고, CSS 는 `--splash-hold` / `--splash-fade`
변수로 그 값을 받는다. 시간을 바꿀 때 CSS 를 따로 고치지 않는다.

| 상수 | 값 | 의미 |
|---|---|---|
| `SPLASH_MS` | `2400ms` | 전체 노출 시간. 이 시점에 라우터 이동 |
| `FADE_OUT_MS` | `520ms` | 마지막 페이드 아웃 |
| `HOLD_MS` | 파생 (`1880ms`) | 로고가 온전히 보이는 구간. 진행 바가 이 시간에 맞춰 찬다 |

페이드 아웃이 **끝나는** 시점에 이동하므로, 노란 화면이 프레임의 흰 배경으로 녹은 뒤
같은 흰 배경의 로그인 화면이 이어져 끊김이 보이지 않는다.

**상태바도 같이 녹여야 한다.** 홈 화면 실행에서 상태바 색은 `body` 배경을 따라가는데,
`useStatusBarColor` 는 라우터가 이동하는 `SPLASH_MS` 에 그걸 한 번에 바꾼다.
그대로 두면 아래(콘텐츠)는 `HOLD_MS`~`SPLASH_MS` 에 걸쳐 서서히 사라지고
위(상태바)는 끝에서 툭 바뀌어 **520ms 어긋나 깨져 보인다.**
그래서 `SplashPage` 가 페이드 시작(`exiting`) 시점에 body 배경도 같은 길이·같은 곡선으로 전환시킨다.

body 배경을 직접 만지는 코드는 **반드시 `isStandalone()` 으로 감쌀 것.**
브라우저에서 인라인 스타일로 덮으면 480px 이상에서 프레임 바깥 회색(`--bg-outside`)이 사라진다.

페이드 아웃에서 **`.page` 를 `scale` 하면 안 된다.** 노란 배경이 448px 앱 프레임 밖으로
삐져나온다 (프레임은 내용을 잘라내지 않는다). 배경은 투명도만 바꾸고,
확대는 안쪽 `.stack` 에만 주어 `.page` 의 `overflow: hidden` 이 가두게 한다.

`prefers-reduced-motion` 이면 기다리지 않고 즉시 넘어간다.

### 운영 점수 게이지 (`src/components/score/ScoreGauge.tsx`)

**반원 계기판.** 채워지는 아크로 값을 표현한다.

- 220° 스윕(위쪽 기준 −110° ~ +110°), viewBox `240 × 158`, 중심 `(120, 112)`, 반경 `92`, stroke `18`.
- 각도 공식: `x = cx + r·sin θ`, `y = cy − r·cos θ` (θ 는 12시 방향 0, 시계방향 양수).
- **바늘은 두지 않는다.** 중심에서 뻗는 선이 가운데 점수 숫자를 관통해 화살표처럼 보였다.
  다시 넣지 말 것.
- **아크 색은 등급색이 아니라 `--brand` 로 통일한다.**
  대신 **등급 pill 을 게이지 안, 점수 바로 아래**에 둔다. 아크가 브랜드색이면
  화면에서 가장 큰 시각 요소가 아무 정보도 나르지 않게 되는데, 등급을 점수와
  같은 시선 안에 넣어 한 번에 읽히게 하는 것으로 보완한 것이다. 밖으로 빼지 말 것.
- 게이지 안 텍스트 블록(캡션+점수+pill)은 링 안쪽에 **캡션 위 여유가 5px 밖에 없다.**
  캡션 크기나 위 여백을 키우면 링을 침범한다. `top: 56%` 를 포함해 이 값들을 바꿀 땐 다시 계산할 것.
- 아크와 가운데 숫자가 **하나의 애니메이션 값**(`useAnimatedNumber`)을 공유한다.
  CSS transition 을 각각 걸면 미세한 타이밍 차이로 어긋난다.
- 0/100 눈금 라벨은 밴드 바깥(반경 112)에 둔다.
- `prefers-reduced-motion: reduce` 면 애니메이션 없이 최종 상태를 바로 그린다.
- 점수는 `clampScore()` 로 0~100 으로 자른다. 값이 없으면 숫자 자리에 `—`, 아크는 그리지 않는다.

기하값(`VIEW_H`, `R`, `STROKE`, `LABEL_R`)을 바꿀 때는 아크 밴드와 라벨이 viewBox 안에
들어오는지 다시 계산할 것 (stroke 절반과 글자 높이까지 포함해서).

### 점수 설명 캐러셀 (`src/components/score/ScoreCarousel.tsx`)

리포트의 `summary` 를 첫 장, `evidence[]` 를 이어지는 장으로 만들어 넘겨본다.

- 캐러셀 라이브러리를 쓰지 않는다. **CSS `scroll-snap`** 으로 구현했다 —
  터치 스와이프가 브라우저 네이티브라 관성이 자연스럽고 번들이 늘지 않는다.
- **한 장이 화면 폭을 꽉 채우고 이웃 카드는 완전히 화면 밖에 있다.**
  컨테이너 폭 `W`, 좌우 padding `G` 에 대해 카드 폭 `W − 2G`, `gap: G` 로 맞춘 결과다.
  스냅된 카드가 `[G, W−G]` 를 차지하고 다음 카드의 왼쪽 끝이 정확히 `W`(오른쪽 경계)에 온다.
  **`gap` 을 `G` 보다 줄이면 옆 카드가 삐져나온다.**
- 도트 인디케이터는 `IntersectionObserver`(root = 스크롤 컨테이너, threshold 0.6)로 동기화한다.
- 슬라이드 변환은 `src/lib/slides.ts` 의 `buildSlides()`.

---

## 구조

```
src/
├─ api/          openapi.json 대응 계층 (types / endpoints / client / 도메인별 함수)
├─ store/        zustand — authStore (세션, selectedStoreId)
├─ hooks/        queries · useUploadPolling · useAnimatedNumber
├─ routes/       paths · RequireAuth · layouts
├─ components/
│  ├─ layout/    AppFrame · TopBar · BottomTabBar · PageBody
│  ├─ ui/        Button · TextField · ChipSelect · Surface(Card/Section/ListRow) · Badge · States · Toast
│  ├─ score/     ScoreGauge · ScoreCarousel
│  ├─ upload/    FilePickField · VideoPreview · UploadStepper · CsvResultCard · Video/SalesUploadSection
│  ├─ dashboard/ MetricGrid
│  ├─ icons/     인라인 SVG 아이콘
│  └─ brand/     Wordmark
├─ pages/        auth · stores · dashboard · report · my
├─ lib/          format · grade · validation · slides
└─ styles/       tokens.css · global.css
```

### 라우트

접두사 매칭으로 탭 활성 판정이 자연스럽게 되도록 트리를 짰다.

| 경로 | 화면 | 탭바 |
|---|---|---|
| `/` | 스플래시 → 세션에 따라 분기 | 없음 |
| `/login`, `/signup` | 로그인 / 회원가입 | 없음 |
| `/stores` | 매장 목록 | **내 매장** |
| `/stores/new` | 매장 등록 | 없음 |
| `/stores/:storeId` | 매장 상세 (업로드) | 없음 |
| `/dashboard` | 매장 선택 리졸버 | **대시보드** |
| `/dashboard/:storeId` | 운영 대시보드 | **대시보드** |
| `/report/:storeId` | 금융기관용 리포트 | 없음 (문서 성격) |
| `/guide` | 사용 방법 안내 | 없음 |
| `/my` | 내 정보 | **내 정보** |

경로 문자열은 `src/routes/paths.ts` 의 `PATHS` 로만 참조한다.

### 새 화면·API 추가 절차

1. `openapi.json` 에 있는지 확인 → 없으면 백엔드와 먼저 합의
2. `src/api/types.ts` 에 타입 추가
3. `src/api/endpoints.ts` 에 경로 상수 추가
4. `src/api/<domain>.ts` 에 함수 추가
5. `src/hooks/queries.ts` 에 `queryKeys` 항목과 훅 추가
6. `src/pages/` 에 화면, `src/routes/paths.ts` 에 경로, `src/App.tsx` 에 라우트 추가

## 알려진 사항

- `npm audit` 의 high 경고는 전부 개발 툴체인 전이 의존성(eslint → minimatch, workbox-build → ejs)과
  react-router 의 RSC 모드 advisory다. 이 앱은 SPA 이고 RSC·서버 액션을 쓰지 않아 해당되지 않는다.
- `react-refresh/only-export-components` 경고 2건(`TextField`, `Toast`)은
  컴포넌트와 훅을 같은 파일에 둔 결과다. HMR 시 해당 파일만 전체 갱신되며 동작에는 영향이 없다.
- 로고·PWA 아이콘은 `scripts/build-logo-assets.mjs` 가 `scripts/icons/logo-source.png` 에서 생성한다.
  macOS 기본 도구(`sips`)와 Node `zlib` 만 쓰므로 다른 OS 에서는 별도 변환이 필요하다.
