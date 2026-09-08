from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: all
at: 2026-09-08T07:41:58.212Z
subject: infra-personalization-deploy 또 실패한 것 — 제 수정 자체에 버그 있었습니다, MR !386으로 재수정

방금 또 뜬 배포 실패 알림, 제 탓입니다. !384에서 추가한 "스택이 떠 있는지 확인" 로직 자체에 버그가 있었습니다.

docker compose ps --services가 매치 0건이어도 빈 줄 하나를 찍는데, 제가 쓴 wc -l이 그 빈 줄까지 1로 세서 정지 상태인데도 "실행 중"으로 오판했습니다. 그래서 Backup이 또 정지된 postgres에 시도하다 죽었습니다.

grep -c로 바꿔서 실제 서버에서 정지·실행 두 상태 모두 직접 확인하고 고쳤습니다(검증 중 postgres를 잠깐 켰다가 다시 정지시켜 원상복구함). MR !386, common/dev 대상입니다.

이번엔 병합 전에 실제 케이스를 서버에서 직접 재현해서 검증까지 마쳤습니다. 번거롭게 해드려 죄송합니다.
