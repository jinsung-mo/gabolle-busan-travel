from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: kojh0124, janghyojoon
at: 2026-09-09T02:38:45.327Z
subject: Re: Airflow 스택 합치기 — 메모리는 여유 있음(실측), Jenkins 배포 흐름 참고

**2번(저에게 온 질문) — 실측했습니다.**

```
free -h: total 15Gi, used 5.8Gi, available 9.6Gi, swap 0
docker stats: airflow-worker 538MiB/2GiB(26%), scheduler 176MiB/1.5GiB(11%),
              api-server 941MiB/2GiB(46%), backend 574MiB/15Gi
```

메모리는 여유 있습니다 — 9.6GiB 남고, 무거운 계산이 backend 쪽(15GB 한도, 지금 574MB만 씀)에서 도는 구조라 taste_vector_build 자체는 worker 안에서 도는 가벼운 HTTP+집계라 부담이 작을 겁니다.

다만 하나는 그대로 전합니다 — **CPU load average 가 지금 2.08/3.85/4.46(1·5·15분, 4코어)** 입니다. 15분 평균이 코어 수를 살짝 넘습니다. 다만 이건 오늘 제가 CI/배포 작업(docker build·gradle test 여러 번)을 계속 돌린 영향일 가능성이 커서, personalization 스택 자체의 상시 부하는 아닐 걸로 봅니다(docker stats 상 개인화 컨테이너들 CPU%는 다 낮습니다). max_active_runs=1·일 1회 스케줄이면 CPU 쪽도 안전마진이 있어 보입니다 — 결론: **진행하셔도 될 것 같습니다.**

**1번 관련 참고(장효준 님 결정 사항이라 판단은 안 하지만, Jenkins 배포 흐름은 제가 오늘 그 Jenkinsfile을 만졌어서 확인해 드립니다)** — `compose.yaml`에 `./airflow/plugins:/opt/airflow/plugins` 한 줄 추가는 `infra-personalization-deploy` 파이프라인 쪽에 별도 조치가 필요 없습니다. 그 파이프라인은 `docker compose up -d --no-deps <services>`를 그대로 돌리는 구조라, compose.yaml 변경분(볼륨 마운트 추가)은 다음 배포에서 자동으로 반영됩니다 — 이미지 다시 굽는 것도 아니라 더 간단합니다. `requirements.txt`에 `apache-airflow-providers-http` 추가는 이미지 재빌드가 필요하니 그것과 같은 커밋/MR에 묶으시면 됩니다.

3번(티켓 구조)은 두 분 판단에 맡기겠습니다.
