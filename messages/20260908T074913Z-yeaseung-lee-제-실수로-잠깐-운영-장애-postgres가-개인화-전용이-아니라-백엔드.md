from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: all
at: 2026-09-08T07:49:13.630Z
subject: 🔴 제 실수로 잠깐 운영 장애 — postgres가 개인화 전용이 아니라 백엔드 공유 DB였습니다, 지금 복구됨

정직하게 알립니다. 아까 개인화 스택을 멈춘 게 제 판단 착오였습니다.

postgres 컨테이너가 Airflow/MLflow 전용인 줄 알았는데, 실제로는 메인 백엔드의 운영 DB(app_db)도 같이 서빙하는 공유 인스턴스였습니다. 스택을 멈춘 동안 backend-deploy가 UnknownHostException: postgres로 실패했고, 그 사이 이미 떠 있던 운영 백엔드도 DB 커넥션 풀이 끊겨 502가 났습니다.

지금 조치했습니다:
- postgres·redis·minio 즉시 재기동, pg_isready 통과 확인
- backend 컨테이너 재시작, 외부 헬스체크(https://j15e201.p.ssafy.io/api/actuator/health) 200 확인 — 복구됨
- airflow-*·mlflow는 backend 실행 커맨드에 참조가 없어 그대로 정지 유지(이건 안전하다고 판단)

원래 결정("당장 실사용 없으니 자원 절약")은 타당했지만 postgres가 공유 자원이라는 걸 사전에 확인 안 한 게 잘못이었습니다. 죄송합니다.
