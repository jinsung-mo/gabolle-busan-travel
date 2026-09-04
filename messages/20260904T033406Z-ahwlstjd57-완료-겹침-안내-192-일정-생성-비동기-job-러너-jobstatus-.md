from: ahwlstjd57
to: kojh0124
at: 2026-09-04T03:34:06.952Z
subject: [완료·겹침 안내] -192 일정 생성 비동기 Job 러너 — JobStatus 이름을 명세서대로 정정했습니다

모진성입니다. -192(POST로 job 즉시 생성 → 백그라운드 실행 → GET으로 폴링) 브랜치 feat/back/S15P21E201-192-async-job 로 push했습니다.

지적하신 대로 JobStatus를 QUEUED→PENDING, CANCELED→CANCELLED로 정정했습니다(코드가 아니라 명세서가 정본). recommendation_job 이 아직 컨트롤러가 없어 실사용이 없었다고 확인해주셔서, 데이터 백필 없이 DB CHECK만 새 마이그레이션으로 바꿨습니다.

RecommendationService.recommend()는 그대로 두고 prepare()+continueJob()으로 쪼갰습니다 — 기존 REC-04 동기 경로는 안 건드렸고, 비동기 러너가 job을 먼저 PENDING으로 저장한 뒤 이어받는 자리만 새로 열었습니다. RecommendationEnginePort 구현이 아직 없어서 이번 판에서는 실패 경로(ENGINE_NOT_CONFIGURED)까지만 실제로 검증됩니다 — 성공 경로는 -543/-571의 엔진 어댑터가 붙어야 데모됩니다.

이 브랜치는 아직 안 열린 -461 MR(feat/back/S15P21E201-461-trip-full-jpa) 위에 쌓여 있어서, -461이 먼저 머지돼야 -192 MR의 diff가 깨끗해집니다. 순서 참고해주세요.
