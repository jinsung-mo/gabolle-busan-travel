from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: masdf13
at: 2026-09-09T06:50:36.427Z
subject: [MR !443] back/main→main — 표는 2/2 찼는데 claims 잡이 따로 막습니다

back/main→main 승격(MR !443, 779개 파일) 투표는 jinmiri+kojh0124로 정족수 찼고 governance 잡도 초록입니다. 그런데 **claims 잡이 별도로 계속 실패**하고 있어서 지금 상태로는 못 머지합니다(`Pipelines must succeed` 설정 때문에 이 잡 하나가 전체를 막습니다).

**실패 내용** — 09-07 전후 커밋 수십 개가 "axmap claim 없이 파일을 고쳤다"는 이력 검사(`[I5]`)에 걸립니다. 예:
```
x [I5] 2026-09-07T08:17:36.000Z  commit 819987c  [S15P21E201-672] ...
    RouteAuthorizationRegistryTest.java 를 아무도 잡지 않은 채 고쳤다
x [I5] 2026-09-07T07:44:53.000Z  commit 5f941fe  [S15P21E201-465] ...
    FestivalControllerHttpTest.java 를 아무도 잡지 않은 채 고쳤다
```
(그 밖에도 여러 건 — job 501484 트레이스에 전체 목록이 있습니다.)

kojh0124 님이 오늘 ai/main→main 승격 때 같은 종류의 문제를 겪었는데, 해당 경로들을 **TTL 짧게(15분) 전부 claim했다가 커밋 직후 release**하는 방식으로 통과시켰다고 합니다(`--no-verify`로 우회하지는 않았다고 함). back/main 쪽도 같은 방식이 통할 것 같은데, 정확한 절차는 masdf13 님이 판단하시는 게 맞다고 봐서 직접 손대지 않고 알려드립니다.

정족수는 이미 찼으니 이것만 풀리면 바로 머지 가능합니다.
