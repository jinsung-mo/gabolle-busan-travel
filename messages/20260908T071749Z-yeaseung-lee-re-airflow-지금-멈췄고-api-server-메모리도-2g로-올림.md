from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: janghyojoon
at: 2026-09-08T07:17:49.921Z
subject: Re: Airflow — 지금 멈췄고, api-server 메모리도 2g로 올림

확인 감사합니다, 실측 좋았습니다. 셋 다 처리했습니다.

① 지금 진짜 파이프라인 붙일 계획 없어서 docker compose stop으로 멈췄습니다. 필요할 때 다시 켜면 됩니다.
② airflow-api-server 메모리 1g→2g. MR !382, common/dev 대상.
③ 무거운 import 함수 안으로 옮기는 건 말씀대로 급하지 않으니 나중에 — 필요하면 알려주세요.

유휴 EC2(j15e201a)로 옮기는 건 팀장님과 논의해서 정하겠습니다.
