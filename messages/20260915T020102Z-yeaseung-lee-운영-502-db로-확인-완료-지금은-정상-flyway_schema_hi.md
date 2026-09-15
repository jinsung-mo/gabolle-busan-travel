from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: all
at: 2026-09-15T02:01:02.922Z
subject: 운영 502 — DB로 확인 완료, 지금은 정상. flyway_schema_history 근거

jaehyeon님·ahwlstjd57님 질문에 대한 답 — 서버에 직접 들어가 `gabolle.flyway_schema_history` 를 봤습니다 (경로: `app_db` DB 안 `gabolle` 스키마, `public` 아님 — DB 처음 보시는 분은 참고).

**결과: 지금 이 순간 충돌·실패 흔적이 없습니다.**

```
installed_rank | version        | description                           | installed_on              | success
52             | 20260915050000 | event outbox request id constraint   | 2026-09-15 01:41:27       | t
51             | 20260915040000 | recommendation job idempotency        | 2026-09-15 01:41:27       | t
50             | 20260915030000 | tourapi type1 photos                  | 2026-09-15 00:39:18       | t
49             | 20260915020000 | tourapi coastal walk sea beach        | 2026-09-15 00:39:18       | t
48             | 20260915010000 | sbiz cafe category split              | 2026-09-15 00:39:18       | t
47             | 20260914050000 | place facet view without trip         | 2026-09-14 05:11:53       | t
```

- `20260914060000`·`20260914070000` (원래 번호)는 이력에 **아예 없습니다** — !792 의 재명명이 그 두 파일을 20260915010000~050000 대역으로 옮겼고, 그 새 번호로 **전부 success=true 로 이미 적용돼 있습니다.**
- `applied migration not resolved locally` 류의 실패 레코드 없음, out-of-order 흔적 없음.
- 현재 배포 상태: `backend` 컨테이너 `GABOLLE_SERVICE_VERSION=02e94c31`(= back/dev HEAD, -966 재명명 포함), 컨테이너 시작 01:54:17Z, 로그 정상(AUTH_TOKEN_REJECTED 같은 평범한 트래픽만, 에러 반복 없음).

정리하면 jaehyeon님이 추론하신 "번호 역전 충돌" 시나리오는 **지금은 해소된 상태**로 보입니다 — 재명명된 번호로 이미 깔끔하게 적용이 끝났습니다. 10:45경의 두 번째 502는 (제가 그 시각에 Jenkins 배포 큐 정체를 풀면서 `backend-deploy` 를 수동 재트리거했었는데, 그 타이밍과 겹칩니다) 배포 도중 잠깐의 재기동 과정이었을 가능성이 있어 보이고, 지금은 안정 상태입니다.

**MR !799(재명명 되돌리기)가 지금도 필요한지는 판단이 필요합니다** — DB 가 이미 새 번호로 정리돼 있어서, !799 를 머지해 옛 번호로 되돌리면 오히려 지금 정리된 이력과 다시 어긋날 수 있습니다. 결정은 jaehyeon님·ahwlstjd57님 판단에 맡깁니다.

(참고: 저는 오늘 Jenkins 세 배포 파이프라인이 락 경합으로 줄줄이 실패한 것을 풀면서 backend-deploy 를 수동 재트리거했습니다 — 그 시점이 이 소동과 겹친 점 알려드립니다.)
