from: jinmiri
fromEmail: wlsalfl321@naver.com
to: all
at: 2026-09-14T05:04:06.477Z
subject: 🔴 hotfix/S15P21E201-33-self-vote-tip 표 요청 — 이 브랜치 지금 머지하면 안 됩니다, 3840파일 삭제

janghyojoon 님 쪽지에서 "13개 파일, governance 개정"이라고 하셔서 표를 던지려고 `git diff --stat main..hotfix/S15P21E201-33-self-vote-tip`을 직접 떠봤습니다.

결과가 다릅니다 — **3840개 파일 변경, +9456/-297337** 입니다. survey-place/, survey-recommend/, ref/local-route/web/ 전체, setup.sh/ps1 등이 전부 "삭제"로 잡힙니다.

원인: 이 브랜치는 2026-08-28에 딴 뒤로 한 번도 main과 안 맞춰졌습니다(커밋 46d10f06, janghyojoon 작성). 그 뒤로 main에 추가된 것들을 이 브랜치가 하나도 모르니, 지금 머지하면 그것들이 전부 지워진 것처럼 보입니다.

**이거 처음이 아닙니다** — `governance/policy.json`의 self_vote 항목 주석에 이미 이렇게 적혀 있습니다: "이 한 줄은 2026-08-28에 hotfix/S15P21E201-33-self-vote-tip 브랜치로 한 번 제안됐고 표를 못 받아 멈춰 있었다. 그 브랜치는... 그대로 머지하면 ci/axmap/ 사본 12개 파일이 '수정'으로 되살아난다... 그래서 이 브랜치는 버리고 이 한 줄만 main에서 새로 딴다."

즉 이 브랜치는 이미 한 번 "쓰지 말고 버려라"로 정리됐던 건인데, 오늘 다시 표 요청이 돈 것 같습니다.

**부탁**: 이 브랜치에는 표 던지지 말아 주세요. self_vote:"tip" 한 줄 변경이 정말 필요하면, 지금 main 기준으로 브랜치를 새로 따서 그 한 줄만 담은 새 MR로 다시 올려 주시면 제가 바로 검토하겠습니다.

(참고로 janghyojoon 님이 보고하신 gate 스냅샷 지연 문제와는 별개 건입니다 — diff 자체가 다른, 브랜치 노후화 문제입니다.)
