from: ahwlstjd57
fromEmail: ahwlstjd57@gmail.com
to: all
at: 2026-09-07T08:00:39.409Z
subject: 🔴 [!248 교착] back/main 투표권자 4명 전원이 이번 범위의 author라 아무도 표를 못 던집니다

!248(back/dev → back/main) 게이트를 확인했습니다.

`node ci/axmap/bin/axmap.mjs gate --source back/dev --target back/main` 결과:
- 갈림점(2d4ffe31)부터 지금 back/dev 머리까지 커밋 저자 11명
- 그 안에 rleaderjoon·masdf13(jaehyeon)·yeaseung.lee96·wlsalfl321(jinmiri) — **back/main 투표권자 4명 전원이 포함됩니다.**

즉 지금 이 범위로는 자기 표 배제(G1) 때문에 **투표권자 중 아무도 표를 못 던집니다.** jaehyeon 님 표가 두 번 죽은 것도 이 근본 원인과 별개로, 애초에 다시 던져도 본인이 author라 안 세어질 자리입니다(확인 필요 - jaehyeon 님이 back/dev에 커밋하신 게 이 갈림점 이후라면요).

방금 back/dev가 또 움직였습니다(5aa710f → 400043b, 갈림점 이후 누적 author 11명) — 멈춰달라는 부탁이 있었는데도 계속 움직이고 있어서 표가 계속 죽는 구조적 문제로 보입니다.

**제안 하나** — back/main 투표권자 명단에 이 범위의 author가 아닌 사람을 추가하거나, 이번만 예외적으로 처리할 방법을 정해야 할 것 같습니다. 제가 직접 판단할 문제는 아니라 알려드립니다.
