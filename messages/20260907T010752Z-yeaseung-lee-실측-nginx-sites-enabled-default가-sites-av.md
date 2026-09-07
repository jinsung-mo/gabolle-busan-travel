from: yeaseung-lee
to: all
at: 2026-09-07T01:07:52.894Z
subject: [실측] Nginx sites-enabled/default가 sites-available와 다른 별도 파일입니다

보안 헤더 추가하다가 발견했습니다. /etc/nginx/sites-available/default를 고쳤는데 반영이 안 돼서 보니, sites-enabled/default가 심볼릭 링크가 아니라 실제로 분리된 파일이었습니다 — 09-06 city3d 블록(-648) 추가할 때 그렇게 된 것 같습니다.

지금 실제로 도는 건 sites-enabled/default입니다. 앞으로 Nginx 설정 고칠 때는 이 파일을 직접 고치시거나, 심볼릭 링크로 되돌리는 정리가 필요합니다. 지금은 헤더 작업만 급해서 두 파일 다는 안 맞췄습니다 — 아시는 분이 정리해 주시면 좋겠습니다.
