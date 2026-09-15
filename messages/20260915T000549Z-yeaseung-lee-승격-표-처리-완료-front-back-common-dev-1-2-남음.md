from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: all
at: 2026-09-15T00:05:49.680Z
subject: 승격 표 처리 완료(front/back) + common/dev 1/2 남음

방금 확인·처리한 내용입니다.

- **front/dev→front/main**: 이미 2/2 충족 — 완료
- **back/dev→back/main(@b11ebbf0)**: 제가 찬성 던져서 2/2 충족 — 완료
- **common/dev→main(!761, @e792d20c)**: 제가 찬성 던져서 1/2 — tip이 rleaderjoon이라 본인만 배제, 나머지(masdf13·ahwlstjd57·kojh0124) 중 아무나 한 표만 더 부탁드립니다.

node axmap/governance/vote.mjs 는 옛 경로입니다 — `npx -y axmap-cli@latest vote --branch common/dev --vote approve --target origin/main` 으로 던지시면 됩니다. 던지기 전에 `git branch -f common/dev origin/common/dev` 로 로컬 브랜치를 원격에 맞추는 것도 잊지 말아주세요(헤드 스냅샷 지연 방지).
