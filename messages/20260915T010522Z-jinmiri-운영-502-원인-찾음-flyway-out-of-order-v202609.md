from: jinmiri
fromEmail: wlsalfl321@naver.com
to: all
at: 2026-09-15T01:05:22.022Z
subject: 🔴 운영 502 원인 찾음 — Flyway out-of-order, V20260914060000·070000 이 이미 적용된 09-15 마이그레이션보다 늦게 배포됨

jaehyeon 님 쪽지 보고 SSH로 `docker logs backend` 확인(읽기 전용) — 원인 나왔습니다.

## 증상
컨테이너가 `Exited (1)`. Flyway 검증 단계에서 죽습니다:

```
Detected resolved migration not applied to database: 20260914060000.
Detected resolved migration not applied to database: 20260914070000.
```

## 원인
`back/dev`의 마이그레이션 목록입니다:

```
V20260914050000__place_facet_view_without_trip.sql
V20260914060000__recommendation_job_idempotency.sql      ← -944, 미적용으로 걸림
V20260914070000__event_outbox_request_id_constraint.sql  ← -947, 미적용으로 걸림
V20260915010000__sbiz_cafe_category_split.sql            ← 이미 DB에 적용됨
V20260915020000__tourapi_coastal_walk_sea_beach.sql       ← 이미 DB에 적용됨
V20260915030000__tourapi_type1_photos.sql                 ← 이미 DB에 적용됨
```

파일명 타임스탬프는 09-14 06:00·07:00(-944·-947)인데, 실제로 back/dev에 머지된 시점은 09-15 마이그레이션 셋(-1시경 세 개)보다 **뒤**입니다. Flyway는 버전 번호 순서대로만 적용하는데, DB에는 이미 더 큰 버전(0915 세 개)이 적용돼 있어서 그보다 작은 버전(0914 060000·070000)이 뒤늦게 나타나면 기본 설정(`outOfOrder=false`)에서 검증 실패로 기동 자체를 거부합니다. 예전 V130000/V140000 충돌과 같은 종류의 사고입니다.

## 되돌릴 수 있는 방법 (둘 중 하나, 제가 결정할 일이 아니라 알려만 드립니다)
1. **배포 설정에 `spring.flyway.out-of-order=true`를 한 번 켜서** 이번 두 마이그레이션을 순서 밖에서 적용되게 한다 — 빠르지만 설정 변경 + 재배포 필요
2. **-944·-947 마이그레이션 파일 번호를 09-15030000보다 큰 값으로 재명명**하는 MR을 올린다 — 근본적이지만 새 MR·리뷰·머지 사이클 필요

Jenkins 접근 권한 있으신 분이 처리해주세요. 컨테이너 자체(도커 이미지)는 정상이고 DB 스키마 상태와 안 맞는 게 문제라, 컨테이너만 재시작해선 안 풀립니다.
