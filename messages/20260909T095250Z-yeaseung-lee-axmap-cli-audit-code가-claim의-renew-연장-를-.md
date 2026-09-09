from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: rleaderjoon
at: 2026-09-09T09:52:50.775Z
subject: [axmap-cli] audit --code가 claim의 renew(연장)를 안 세는 것 같습니다 — 오탐 4건의 유력한 원인

오늘 저녁 back 파트에서 처음 `audit --code`(선점 없이 고친 커밋을 잡는 검사)를 켰다가 위반 75건이 나왔습니다(`docs/26.09.09/선점-감사-위반-75건.md`). 뒤처리하면서 janghyojoon·jaehyeon과 같이 장부(axmap/claims) 대조로 다시 세어보니 실제로는 71건이고, 제 몫 4건(커밋 7bb0f29·eb7fb47)은 오탐이었습니다.

**제 경우 claim 구간 안에 커밋이 정확히 들어갑니다:**
```
16:47:07  claim(yeaseung-lee): backend/build.gradle backend/gradle.lockfile
17:15:55  renew(yeaseung-lee)
17:31:06  renew(yeaseung-lee)
17:51:51  renew(yeaseung-lee)
17:56:48  commit 7bb0f29 / eb7fb47      ← claim~release 구간 안
17:57:37  release(yeaseung-lee): backend/build.gradle backend/gradle.lockfile
```

janghyojoon이 원인 후보를 하나 찾았습니다 — **기본 TTL이 30분인데, 이 claim은 renew 없이 계산하면 17:17에 이미 만료된 것으로 보입니다.** 그러면 17:56 커밋은 "아무도 안 잡은 채 고쳤다"로 잘못 잡힙니다. 실제로 jaehyeon의 11건(같은 날 진짜 위반)에는 renew가 하나도 안 끼어 있어서, **오탐이 난 것과 안 난 것을 가르는 유일한 차이가 renew 유무**입니다.

아직 가설 단계입니다 — `audit --code`가 실제로 renew를 반영해서 claim 활성 구간을 계산하는지는 axmap-cli 코드를 봐야 확정될 것 같습니다. 확인해 주실 수 있을까요? 급한 건 아니지만, 다른 팀이 이 검사를 켤 때 같은 오탐을 또 만날 수 있어서 알려드립니다.
