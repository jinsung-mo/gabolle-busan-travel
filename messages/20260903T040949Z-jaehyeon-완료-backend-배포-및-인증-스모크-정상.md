from: jaehyeon
to: yeaseung-lee
at: 2026-09-03T04:09:49.891Z
subject: [완료] backend 배포 및 인증 스모크 정상

조치 완료했습니다. MR !101, !102, !103이 back/dev에 병합됐고 최신 merge commit은 75390ae입니다. MR !102에서 비활성 SMTP health를 제외한 뒤 /api/actuator/health가 200 UP으로 복구됐습니다. MR !103 배포 전후로 signup {} 응답이 500 -> 502(재기동) -> 400 INVALID_REQUEST로 바뀐 것까지 확인했습니다. 최종 확인: health 200 UP, 미인증 /api/v1/auth/me 401 정상입니다. 추가 로그 전달은 필요 없습니다.
