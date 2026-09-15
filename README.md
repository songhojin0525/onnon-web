# ONNON(오논) 배포 가이드 — 완전 무료 · 완전 처음이어도 따라할 수 있게

이 문서만 순서대로 따라 하면 실제로 회원가입이 되고, 매일 새벽 자동으로
문제 3개가 만들어져서 모든 사용자가 같은 문제를 푸는 사이트가 완성됩니다.
**아래 4개 서비스 모두 신용카드 등록 없이 무료로 시작할 수 있어요.**

준비물:
1. GitHub 계정 (github.com) — 코드 저장
2. Supabase 계정 (supabase.com) — 회원가입/로그인, 데이터 저장
3. Vercel 계정 (vercel.com) — 실제 사이트를 인터넷에 올려주는 곳
4. Google 계정 → Google AI Studio (aistudio.google.com)에서 발급받는
   **Gemini API 키** — 문제를 만들고 채점하는 AI 호출용.
   구글 계정만 있으면 카드 등록 없이 무료로 발급됩니다. 무료 사용량(하루
   수백 회 요청)이 하루 3문제 생성 + 채점 용도로 충분합니다.

전체 순서: GitHub에 코드 올리기 → Supabase 설정 → Gemini API 키 발급 →
Vercel에 배포 → 확인. 하나씩 천천히 따라가면 됩니다.

---

## 1단계. GitHub에 코드 올리기

1. github.com 에서 회원가입 후 로그인합니다.
2. 오른쪽 위 `+` 버튼 → `New repository` 클릭.
3. Repository name에 `onnon-web` 입력, Public/Private 아무거나 선택 (Private 추천) →
   `Create repository` 클릭.
4. 저장소 페이지에서 `Add file` → `Upload files` 클릭.
5. 이 zip 파일의 압축을 컴퓨터에 풀고, **폴더 안의 내용물 전체**
   (`api`, `public`, `sql`, `package.json`, `vercel.json`, `.env.example`, `README.md`)를
   선택해서 업로드 화면에 그대로 드래그 앤 드롭합니다.
   - ⚠️ `onnon-web` 폴더 자체가 아니라, **그 안의 파일/폴더들**을 드래그해야 합니다.
6. 아래 `Commit changes` 버튼을 눌러 업로드를 완료합니다.

---

## 2단계. Supabase 설정 (회원가입·데이터베이스)

1. supabase.com 접속 → 회원가입/로그인 → `New project` 클릭.
2. 프로젝트 이름(아무거나), 데이터베이스 비밀번호(따로 기억할 필요는 없지만
   메모해두세요), 리전은 `Northeast Asia (Seoul)`를 선택하고 생성합니다.
   1~2분 정도 초기화 시간이 걸립니다.
3. 왼쪽 메뉴에서 `SQL Editor` 클릭 → `New query` → 이 프로젝트의
   `sql/schema.sql` 파일 내용을 전체 복사해서 붙여넣고 → 오른쪽 아래
   `Run` 버튼 클릭. "Success" 메시지가 뜨면 완료.
4. 왼쪽 메뉴 `Authentication` → `Providers`(또는 `Sign In / Providers`) →
   `Email` 항목에서 **"Confirm email"(이메일 인증) 옵션을 꺼주세요.**
   (켜두면 가입 후 메일 인증을 해야 로그인이 되는데, 개인 프로젝트 단계에서는
   꺼두는 게 훨씬 편합니다. 나중에 서비스가 커지면 다시 켤 수 있습니다.)
5. 왼쪽 메뉴 `Project Settings`(톱니바퀴 아이콘) → `API` 클릭.
   여기서 아래 3개 값을 확인합니다 (나중에 계속 쓰이니 메모장에 복사해두세요):
   - `Project URL` → 예: `https://abcdefgh.supabase.co`
   - `anon` `public` 키 (긴 문자열)
   - `service_role` 키 (긴 문자열, **절대 남에게 공개하면 안 됨**)

---

## 3단계. Gemini API 키 발급받기 (무료, 카드 등록 불필요)

1. aistudio.google.com 접속 후 구글 계정으로 로그인합니다.
2. 왼쪽 메뉴 또는 상단의 `Get API key` 클릭.
3. `Create API key` 클릭 → 새 프로젝트를 만들거나 기존 프로젝트를 선택합니다.
4. 발급된 키(긴 문자열)를 메모장에 복사해둡니다. 이게 `GEMINI_API_KEY` 값입니다.
   - 결제 계정을 연결하라는 화면이 보이더라도 건너뛰어도 됩니다 — 무료 등급
     그대로 사용할 거예요.

---

## 4단계. config.js에 Supabase 값 채워넣기

1. GitHub 저장소 페이지에서 `public/config.js` 파일을 클릭 → 연필모양
   `Edit` 아이콘 클릭.
2. 아래 두 줄을 2단계에서 복사해둔 값으로 바꿉니다.
   ```js
   SUPABASE_URL: "https://abcdefgh.supabase.co",
   SUPABASE_ANON_KEY: "여기에 anon public 키 붙여넣기"
   ```
3. 오른쪽 위 `Commit changes` 클릭해서 저장합니다.

(service_role 키와 Gemini API 키는 여기에 넣지 않습니다! 그 값들은 5단계에서
Vercel의 서버 환경변수에만 들어갑니다)

---

## 5단계. Vercel에 배포하기

1. vercel.com 접속 → `Continue with GitHub`로 가입/로그인합니다.
2. 대시보드에서 `Add New` → `Project` 클릭.
3. 방금 만든 `onnon-web` 저장소를 찾아서 `Import` 클릭.
4. Framework Preset은 `Other`로 두면 됩니다(자동으로 감지될 수도 있어요).
   Build Command / Output Directory는 비워둔 채로 두세요.
5. `Environment Variables` 섹션을 펼쳐서, 아래 5개를 하나씩 입력합니다
   (Name / Value 입력 후 `Add` 반복):

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | 2단계에서 복사한 Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | 2단계에서 복사한 service_role 키 |
   | `GEMINI_API_KEY` | 3단계에서 발급받은 Gemini API 키 |
   | `ADMIN_PASSWORD` | 관리자 페이지 로그인용, 직접 정한 비밀번호 |
   | `CRON_SECRET` | 아무 임의의 긴 문자열 (예: 키보드로 대충 30자 입력) |

6. `Deploy` 버튼 클릭. 1~2분 기다리면 배포가 끝나고 `https://onnon-web-xxxx.vercel.app`
   같은 주소가 생성됩니다. 이 주소가 실제 서비스 URL입니다.

---

## 6단계. 동작 확인하기

1. 배포된 주소로 접속하면 로그인 화면이 나옵니다. `회원가입` 탭에서 이메일/비밀번호로
   가입해보세요. (2단계에서 이메일 인증을 꺼뒀다면 가입 즉시 로그인됩니다.)
2. 아직 오늘 문제가 없다는 안내가 보일 거예요 — 정상입니다. 새벽 자동 생성
   전까지는 비어있습니다. 지금 바로 만들어보려면:
3. 주소창에 `/admin.html`을 붙여서 접속합니다
   (예: `https://onnon-web-xxxx.vercel.app/admin.html`).
4. 5단계에서 정한 `ADMIN_PASSWORD`를 입력하고 `오늘 문제 다시 만들기` 클릭.
   30초~1분 정도 후 "완료!" 메시지가 뜨면 성공입니다.
5. 다시 메인 화면(`/index.html`)으로 가면 오늘의 문제 3개가 보입니다.
   하나 눌러서 실제로 풀고 제출 → 채점까지 확인해보세요.

---

## 7단계. 매일 자동 생성이 잘 되는지 확인

`vercel.json`에 등록된 크론 작업이 매일 한국시간 새벽 6시에
`/api/generate-daily`를 자동으로 호출해서 그날의 문제 3개를 만듭니다.
확인 방법: Vercel 프로젝트 페이지 → 상단 `Cron Jobs` 탭에서 실행 이력과
성공/실패 여부를 볼 수 있습니다. 만약 실패한다면 `Logs` 탭에서
에러 메시지를 확인하세요(대부분 환경변수 오타가 원인입니다).

---

## 문제가 생겼을 때 체크리스트

- **로그인이 안 돼요** → `public/config.js`의 URL/anon 키가 정확한지,
  Supabase에서 "Confirm email"을 껐는지 확인하세요.
- **"오늘 문제가 준비되지 않았다"고 계속 나와요** → `/admin.html`에서 수동으로
  한 번 만들어보고, Vercel `Logs`에서 `/api/admin-regenerate` 호출 결과를 확인하세요.
  `GEMINI_API_KEY`가 정확한지 확인하세요.
- **"Gemini API 오류 (429)"가 떠요** → 무료 등급의 분당/일일 요청 한도를
  일시적으로 넘긴 것입니다. 잠시 후 다시 시도하면 대부분 해결됩니다.
- **채점이 안 돼요** → Vercel `Logs`에서 `/api/grade` 에러 메시지를 확인하세요.
  대부분 `SUPABASE_SERVICE_ROLE_KEY` 오타입니다.
- **코드를 수정하고 싶어요** → GitHub 저장소에서 파일을 수정하고 Commit하면,
  Vercel이 자동으로 몇 초~1분 안에 다시 배포해줍니다(별도 작업 불필요).
- **도메인을 연결하고 싶어요** → Vercel 프로젝트 → `Settings` → `Domains`에서
  갖고 있는 도메인을 연결할 수 있습니다.

---

## 비용 관련 참고

- Supabase, Vercel, Gemini API 모두 이 규모(개인/소규모 서비스)에서는
  무료 등급으로 충분하며, 카드 등록도 필요 없습니다.
- 다만 Gemini 무료 등급은 "분당/일일 요청 횟수" 한도가 있습니다. 사용자가
  아주 많아져서(동시에 수십 명이 매일 채점을 돌리는 수준) 한도에 자주
  걸린다면, 그때는 Google Cloud 결제 계정을 연결해 유료 등급으로 올리면
  되는데, Gemini Flash 모델은 토큰당 단가가 매우 저렴한 편입니다.
