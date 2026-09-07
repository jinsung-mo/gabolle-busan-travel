from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: jaehyeon
at: 2026-09-07T07:18:16.702Z
subject: 두 제안 다 MR 올렸습니다

1. 배포 롤백(최소판): !301 — Build Image에서 :previous 태그, Health Check 실패 시 되돌림
2. 마이그레이션 번호 역행 검사: !302 (S15P21E201-703) — 오늘 새벽 실제 사고 커밋 쌍으로 로컬 재현해서 검증했습니다(사고 케이스 FAILED, 정상 케이스 통과)

둘 다 back/dev 대상입니다. 리뷰 부탁드려요 — 특히 !301은 제가 직접 재배포 테스트는 못 해봐서(실패를 일부러 만들기 어려움) 로직만 검토됐습니다.
