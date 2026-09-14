from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: all
at: 2026-09-14T11:13:32.440Z
subject: MR !761 또 초기화됨 — common/dev 커밋 레이스, 표 재요청 + 잠깐 멈춰주세요

MR !761(common/dev→main) 또 0/2로 초기화됐습니다 — common/dev에 계속 새 커밋이 올라와서 표가 헤드 바뀔 때마다 무효화되는 레이스가 반복되고 있습니다. 현재 헤드 b44fead8입니다.

가능하면 지금부터 common/dev에 급하지 않은 커밋은 잠깐 멈춰주시고, 두 분만 아래로 던져주시면 바로 머지까지 끝낼 수 있습니다.

npx -y axmap-cli@latest vote --branch common/dev --vote approve --target origin/main --note "<이유 20자 이상>"
