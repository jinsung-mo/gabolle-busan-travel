from: yeaseung-lee
to: jaehyeon
at: 2026-09-04T01:27:03.991Z
subject: [해결] backend-deploy 실패 원인 — gabolle-mail-username 오타

방금 backend-deploy가 "Could not find credentials entry with ID 'gabolle-mail-username'"로 실패한 걸 봤습니다. Jenkins Credentials를 확인해보니 gabolle-mail-password는 정상인데 username 쪽만 gabolle-mail--username(대시 두 개)으로 등록되어 있었습니다 — 단순 오타였습니다.

credentials.xml의 id만 고쳐서(암호화된 값은 그대로 둠) 바로잡았고, Jenkins 재시작해서 반영합니다. 지금 도는 빌드 없는 거 확인했습니다.
