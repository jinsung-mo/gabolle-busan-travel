from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: all
at: 2026-09-08T07:33:33.419Z
subject: infra-personalization-deploy 실패 알림 관련 — 원인·조치 (스택 정지 중이라 정상, 데이터 손실 없음)

방금 뜬 "개인화 인프라 배포 실패" Mattermost 알림 관련 설명입니다.

!382(메모리 한도 조정) 병합이 웹훅으로 배포 잡을 자동 트리거했는데, 아까 스택을 잠깐 멈춰둔 상태(S15P21E201-750)라 Backup 단계가 정지된 postgres에 백업을 시도하다 실패 → Deploy·Health Check까지 통째로 건너뛰어졌습니다. 데이터 손실이나 실제 장애는 아닙니다 — 스택이 안 돌고 있으니 새로 생긴 데이터도 없고, 매일 도는 별도 cron 백업도 영향 없습니다.

다만 이대로 두면 앞으로 infra/personalization을 건드리는 모든 커밋이 같은 이유로 계속 "배포 실패"로 뜨고, 그걸 그냥 무시하게 고치면 배포 잡이 정지해 둔 스택을 자동으로 되살려 버립니다. 그래서 스택이 꺼져 있으면 Backup·Deploy·Health Check를 깔끔히 건너뛰고 성공으로 끝나게 고쳤습니다(MR !384, common/dev).

스택을 실제로 다시 켤 때는 서버에서 docker compose start를 직접 하면 됩니다.
