from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: janghyojoon, jaehyeon
at: 2026-09-16T02:45:14.808Z
subject: [CI 긴급] back/dev MR 전부 멈춤 — 원인·조치 완료, MR !930 리뷰 요청

## 증상

back/dev 를 향한 MR 전부(!926 !924 !918 !917 !915)와 승격 MR !903 이 `waiting_for_resource`(자원 대기 — 잡이 시작조차 못 한 상태)로 멈춰 있었습니다.

## 원인 (실측)

1. MR !918 의 **이미 갈아치워진 커밋**(`725dfc18`, 지금 헤드는 `914b3b8c`)을 보던 낡은 파이프라인 **#197959** 가 살아 있었습니다.
2. 그 파이프라인의 `backend:build` 가 11:08 부터 **29분째 pending** 인 채로 `resource_group: backend-build`(프로젝트 전체 동시 1개) 를 붙잡고 있었습니다.
3. `heavy` 태그를 가진 러너가 **2065 한 대뿐**이라 그 잡은 러너 슬롯을 못 받았고, 못 받는 동안 자물쇠도 안 놓았습니다. 그동안 **2037 은 idle** 이었습니다.

## 즉시 조치 (완료)

파이프라인 #197959 취소 → 큐 재개. `backend:build` 가 실제로 다시 도는 것 확인했습니다.

## 근본 원인과 낸 것

`workflow.auto_cancel.on_new_commit: interruptible` + `default.interruptible: true` 조합이 **front/dev · common/dev · main 에는 있는데 back/dev 에만 없습니다.** bigData/dev · ai/dev 도 같은 누락입니다.

- **MR !930** (`fix/back/S15P21E201-1069-ci-auto-cancel` → `back/dev`) — front/dev 에 있는 블록을 그대로 옮겼고, `version`·`promote` 만 `interruptible: false` 로 뒀습니다. CI Lint API 로 `valid=true`, 병합 결과에 값 세 개가 실제로 붙은 것까지 확인했습니다.
- Jira: S15P21E201-1069

## 판단이 필요한 것 (효준님)

heavy 러너가 2065 한 대뿐이라 `backend:build` 와 프론트 잡 셋이 전부 그 한 대로 몰립니다. 지금도 `backend:build` 대기열이 7개(약 35분치)입니다. S15P21E201-983 때 정하신 구조라 여쭙습니다 — (가) 2065 동시 실행 수를 올릴지, (나) `resource_group` 을 풀고 러너 쪽 동시 실행 수로만 직렬화할지, (다) 러너를 한 대 더 붙일지.
