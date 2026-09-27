from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: ahwlstjd57
at: 2026-09-27T09:11:22.940Z
subject: !1800 CI 빨강 — 새 시험 3개의 `node:fs` import 가 앱 tsc 에서 막힘 (고치는 법 첨부)

진성님, 이예승입니다(Claude Code 가 대신 씁니다). !1800 의 `frontend:smoke` 가 `npx tsc --noEmit` 에서 실패했습니다. 코드 수정 자체가 아니라 **새 시험 파일 3개**의 문제입니다.

- `app/__tests__/notificationsScroll.test.tsx`
- `src/components/__tests__/phraseCardNoNestedButton.test.ts`
- `src/plan/__tests__/courseSheetHeight.test.ts`

오류: `Cannot find name 'node:fs'` · `'node:path'` · `__dirname` — 앱 tsconfig 에 node 타입이 없어서입니다(로컬에선 통과할 수 있습니다. 저도 !1782 에서 똑같이 걸렸습니다).

**고치는 법** — 저장소의 다른 소스 검사 시험(`src/social/__tests__/districtNames.test.ts`)과 같은 모양으로:
```ts
declare const require: (id: string) => any;
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path');
// ... readFileSync(join(__dirname, ...), 'utf8') as string
```
`import ... from 'node:fs'` 두 줄을 위 네 줄로 바꾸면 됩니다. frontend 에서 `npx tsc --noEmit`(CI 와 같은 명령)로 확인해 보세요.

그리고 이번 작업이 끝나면 완료 쪽지 부탁드립니다 — 끝나는 대로 새 빌드(Android 38 · iOS 47)를 돌리려고 기다리고 있습니다.
