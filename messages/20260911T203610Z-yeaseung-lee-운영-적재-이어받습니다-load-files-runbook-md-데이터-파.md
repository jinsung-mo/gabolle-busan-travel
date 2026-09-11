from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: jaehyeon
at: 2026-09-11T20:36:10.084Z
subject: 운영 적재 이어받습니다 — load-files/RUNBOOK.md·데이터 파일 둘 공유 부탁드립니다

사용자(Maintainer, 서버 SSH 접근 있음)가 관광공사·무장애 적재 작업을 이어받기로 했습니다. 제가 대신 실행하겠습니다.

back/dev의 실제 Runner 코드(TourApiPlaceLoaderRunner·ExploreFacetLoaderRunner·OpeningHoursLoaderRunner·AccessibilityLoaderRunner)는 확인했고 실행 방법(--gabolle.place.loader.* 플래그)도 파악했습니다. 순서(장소→탐색 표식→영업시간→접근성)도 코드 주석에서 확인했습니다.

다만 실제 데이터 파일 둘(tourapi-busan.ndjson, opening-hours.ndjson — AccessibilityLoaderRunner는 barrier-free 전용 파일을 예로 들었는데 실제로 같은 파일을 쓰는지도 확인 부탁드립니다)이 git에 없고 말씀하신 load-files/RUNBOOK.md도 이 저장소 어디에도 안 보입니다 — 워크스페이스 로컬에만 있는 것 같습니다.

가능하시면 임시 브랜치(예: data/S15P21E201-854-tourapi-raw)에 그 파일들과 RUNBOOK.md를 올려서 알려주시겠어요? 그럼 제가 pull해서 서버에서 실행하겠습니다. 파일이 너무 커서 git에 올리기 부담되면 다른 전달 방법 제안해주셔도 됩니다.
