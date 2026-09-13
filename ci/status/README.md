# 상태 페이지 — `https://j15e201.p.ssafy.io/status`

**"지금 되나?" 에 3초 안에 답하는 한 장짜리 페이지다** (S15P21E201-701).

팀장이 요구한 것은 넷이고, 화면에는 그 넷만 있다.

| | 무엇 | 어디서 나오나 |
|---|---|---|
| ① | **프론트엔드** — MR 검사 속도 · 실제 배포 | GitLab · 서버 안에서 3000 포트를 두드림 |
| ② | **백엔드** — MR 검사 속도 · 실제 배포 | GitLab · 서버 안에서 8080 건강검진을 두드림 |
| ③ | **지금 CPU** | 서버의 `/proc/loadavg` ÷ 코어 수 |
| ④ | **최근 1시간 CPU 최다 작업** | 서버의 `docker stats` + `ps` |

> **MR**(Merge Request — *내가 고친 코드를 팀 코드에 합쳐 달라는 요청*).
> 이걸 열면 자동 검사가 돈다. **MR 검사 속도**는 검사 하나하나의 시간이 아니라
> **사람이 실제로 기다리는 시간 전부**다.

> 🟢 **2026-09-14 — 넷은 그대로이고, 보여 주는 방법이 하나 늘었다.**
> 가동 막대(칸 하나가 4시간) 위에 **추세 곡선**이 한 줄 붙었다. 막대는 색이 셋뿐이라
> *"아직 정상이지만 점점 느려지는 중"* 을 보여줄 방법이 없었다. 막대는 **그 4시간의
> 최악**(언제 부러졌나), 곡선은 **그 4시간의 평균**(얼마나 힘들었나)이다 —
> 서로를 대신하지 못해서 **지우지 않고 위에 얹었다.**
>
> 🟢 **2026-09-14(같은 날, 뒤이어) — 곡선이 두 층이 됐다.**
> 4시간 칸으로는 하루 안의 오르내림이 뭉개져서, **5분 칸 하루치**를 따로 쌓는다.
> 화면 오른쪽 위 **`곡선 기간` 단추**로 `하루`(288점)와 `7일`(42점)을 오간다.
> **막대는 언제나 7일이다** — 단추는 곡선만 바꾼다.
>
> 재는 주기는 **안 바꿨다.** 원래부터 1분마다 잰다. 바뀐 것은 **접는 크기**다.

> 같이 나온 것: **CPU 도 곡선이 생겼다.** 4시간마다의 평균·최고가 진작부터 서버
> 디스크에 쌓여 있었는데 내보내지 않아 화면은 "지금" 하나만 보여 줬다. 새로 모을
> 것은 없었고 **꺼내기만 하자 지난 기간이 통째로 따라왔다.**

> 🔴 **이 페이지는 숫자를 만들어내지 않는다.** 못 잰 것은 **"아직 안 잼"** 이라고
> 쓴다. 빈칸이 지어낸 숫자보다 낫다 — 지어낸 숫자는 사람이 그걸 믿고 엉뚱한 데를 판다.

---

## 1. 파일 여덟

| 파일 | 무엇 | 어디서 도나 |
|---|---|---|
| `uptime.html` | **가동 상태 페이지.** 위의 넷을 그린다 | 브라우저 |
| `collect-status.mjs` | **가동 상태 수집기.** `status.json` 을 만든다 | 🔴 **운영 서버 안의 cron** |
| `install-status.sh` | 위 둘을 서버에 설치한다 | 서버에서 한 번 |
| `index.html` | CI 파이프라인 대시보드 (브랜치별 잡 시간·러너) | 브라우저 |
| `collect.mjs` | 그 대시보드용 `ci-status.json` 을 만든다 | GitLab CI 예약 |
| `nginx.status.conf` | 위를 `/status` 로 내보내는 nginx 설정 조각 | 서버 |
| `check-uptime.mjs` | **가동 상태 페이지의 곡선이 약속을 지키는지 확인한다** | 어디서든 |
| `status-fine.json` | **고운 층 — 5분 칸 하루치.** 수집기가 만든다 (저장소에는 없다) | 서버 |

---

## 2. 🔴 페이지가 둘이다 — 헷갈리지 않게 먼저 가른다

| | `/status/` | `/status/ci/` |
|---|---|---|
| 이름 | **가동 상태** | CI 파이프라인 대시보드 |
| 답하는 질문 | "지금 되나?" | "어느 잡이 왜 느린가?" |
| 저장소의 파일 | `uptime.html` | `index.html` |
| 서버의 파일 | `status/index.html` | `status/ci/index.html` |
| 읽는 데이터 | `status/status.json` (30초마다)<br>`status/status-fine.json` (**5분마다**) | `status/ci/ci-status.json` |
| 누가 만드나 | **서버 안의 cron**, 1분마다 | GitLab CI 예약, 1시간마다 |

> 🔴 **저장소에서는 `uptime.html` 인데 서버에서는 `index.html` 이 된다.**
> nginx 가 `/status/` 를 열 때 `index.html` 을 찾기 때문이다. 설치 스크립트가
> 이름을 바꿔 놓는다. 헷갈리면 위 표를 본다.

**둘은 서로의 파일을 안 건드린다.** 폴더도 파일 이름도 다르다. 한쪽 수집이
죽어도 다른 쪽은 계속 뜬다. 기존 GitLab 예약(`status:publish`)은 **그대로 두었다** —
지우지 않았고, 하는 일도 안 바뀌었다. 서버에서 받는 자리만 한 칸 내려갔다 (7절).

---

## 3. 🔴 왜 수집기가 서버 안에서 도나

**③④ 는 GitLab API 에 없다.** GitLab 은 파이프라인 이야기만 안다.
그 서버의 CPU 가 지금 몇인지는 **서버 안에서만 나온다.** `/proc/loadavg` 도
`docker stats` 도 바깥에서는 못 읽는다.

```
운영 서버 j15e201 안에서 cron 이 1분마다 collect-status.mjs 실행
   ├─ GitLab API   → ①② MR 검사 속도        (읽기 전용 토큰)
   ├─ 로컬 프로브   → ①② 실제 배포가 뜨나
   ├─ /proc        → ③ 지금 CPU
   └─ docker stats · ps → ④ 최근 1시간 CPU 최다
        ↓
  /srv/gabolle/www/status/status.json     ← 페이지가 읽는 것
  /srv/gabolle/status-data/*.json          ← 이력. 🔴 www 밖이라 웹으로 안 보인다
        ↓
  nginx /status → index.html 이 그 json 을 읽어 그린다
```

---

## 4. 무엇을 어떻게 재나 — 실측한 것만 적는다

### ①② 실제 배포 (서버 안에서 직접 두드린다)

| | 어떻게 | 왜 |
|---|---|---|
| 백엔드 | `http://localhost:8080/actuator/health` | 로그인 없이 열려 있다 (`SecurityConfig` 의 `permitAll`). 응답 시간과 `status` 항목을 본다 |
| 프론트 | `http://localhost:3000/` | 프론트 컨테이너. HTTP 상태와 응답 시간 |

**바깥(`https://j15e201.p.ssafy.io/...`)이 아니라 `localhost` 를 친다.** 바깥을
치면 nginx·인증서·네트워크까지 한 덩어리로 재게 되어, 느릴 때 어디가 느린지 모른다.

응답이 **1.5초**를 넘으면 "느림", 연결이 안 되거나 5초 안에 대답이 없으면 "멈춤".
이 둘은 **아직 실측이 없는 기본값**이다 (서버에 못 들어가 봤다). 일주일쯤 이력이
쌓이면 실제 분포를 보고 `--slow-ms` 로 고치는 것이 맞다.

### ①② MR 검사 속도 (GitLab API)

**벽시계 시간** — 파이프라인이 만들어진 시각부터 마지막 잡이 끝난 시각까지.
잡이 아무리 빨라도 러너를 기다리느라 늘어지면 사람에게는 느린 것이다.

보는 잡: `frontend:smoke` · `frontend:dependency-scan` ·
`backend:build` · `backend:dependency-scan` · `backend:migration-order`

**2026-09-08 에 최근 MR 파이프라인 25개를 실제로 재서 나온 값이다:**

| | 중앙값 | 열에 아홉은 | "느림" 선 |
|---|---|---|---|
| 프론트 | **100초** | 109초 안에 | 170초 |
| 백엔드 | **202초** | 245초 안에 | 380초 |

잡 하나하나로는 `backend:build` 가 중앙값 199초로 가장 무겁고,
`frontend:smoke` 98초 · `frontend:dependency-scan` 50초 · 나머지는 13~15초다.

> 🔴 **파이프라인이 빨간 것으로 이 줄의 상태를 내리지 않는다.** 검사가 빨간 것은
> 대개 올린 코드가 틀린 것이지 검사 장치가 고장 난 것이 아니다. 성공률은 옆에
> 따로 적는다.

### ③ 지금 CPU

`/proc/loadavg` 를 코어 수로 나눈 값을 크게 보여준다. **1.0 이 눈금이다** —
코어 수만큼 줄이 섰다는 뜻이고, 넘으면 기다리는 작업이 생긴다.
4코어에서 4.0 이 위험한지 아닌지는 **그 나눗셈이 있어야 안다.**

`/proc/stat` 을 두 번 읽어 그 차로 **실제 사용률(%)** 도 같이 낸다. 둘은 다른 것을
말한다 — 사용률이 100% 라도 줄이 안 길면 문제가 아니다.

### ④ 최근 1시간 CPU 최다

1분마다 `docker stats --no-stream` 을 찍어 **60개 표본**을 굴린다. 컨테이너별
평균·최대를 내고 상위 5개를 보여준다. **100% 는 코어 하나를 다 쓴 것**이라
여러 코어를 쓰면 100% 를 넘는다.

> 🔴 **컨테이너 밖 프로세스도 같이 잡는다.** 이 서버에는 **GitLab 러너가
> systemd 로**(도커 밖에서) 돌고 있어서, `docker stats` 만 보면 CI 가 서버를
> 갈아 마시는 동안에도 화면이 조용하다. `ps -eo pcpu,comm,cgroup` 을 같이 찍고
> **cgroup 이름의 컨테이너 번호**로 안팎을 가른다.
>
> 낱말 `docker` 만 보고 가르면 안 된다 — **도커 엔진 자신**(`dockerd`)의 cgroup 이
> `/system.slice/docker.service` 라서, 그러면 도커 엔진이 CPU 를 태우는 동안
> 표에서 사라진다. (이 버그는 `--self-test` 를 짜다가 실제로 잡았다.)

실측 참고: 이 서버는 **4코어 15GB**, 컨테이너 17개. CI 잡이 동시에 4개면
부하가 **28.7**(코어로 나누면 7.2배)까지 튄 기록이 있다.

---

## 5. 🔴 이 페이지는 로그인 없이 누구나 본다

팀장이 그렇게 정했다. 그래서 가동 상태 페이지에는 **사람 이름·커밋 번호·브랜치
이름·토큰이 안 들어간다.** 수집기가 컨테이너 이름까지 가리고 온다.

| 원래 이름 | 화면에 나오는 것 | 왜 |
|---|---|---|
| `bims-rleaderjoon`, `bims-…` 여섯 개 | **`bims 수집기`** 하나로 묶임 | 이름에 팀원 아이디가 있다 |
| `gabolle-backend` | `백엔드 (API 서버)` | 아는 이름이라 한국어로 |
| `airflow-worker-1` | `Airflow 일꾼 (실제 작업)` | 〃 |
| 모르는 이름 `foo-minsu-box` | `*-*-* (모르는 이름이라 가렸습니다)` | 🔴 **모르면 가린다** |

**모르는 이름을 가리는 쪽으로 틀린 것은 일부러다.** 덜 가려서 새는 것보다
더 가려서 답답한 편이 낫다. 새 컨테이너가 `*` 로 나오면 둘 중 하나를 한다:

- 이름이 안전하면 `collect-status.mjs` 위쪽 `LABELS` 에 한 줄 추가한다
- 급하면 `--show-unknown-names` 로 임시로 푼다 (🔴 사람 이름이 새는지 먼저 본다)

**사람 이름이 들어간 새 이름이 생기면** `/etc/gabolle/status-mask.txt` 에 한 줄
넣는다. 설치 스크립트가 빈 파일을 만들어 둔다.

> 🔴 **토큰은 `status.json` 에 절대 안 들어간다.** 수집기가 파일에서 읽어
> HTTP 헤더에만 쓰고 버린다. 오류 메시지에도 안 넣는다.
>
> 반면 **`/status/ci/` 의 CI 대시보드에는** 브랜치 이름·잡 이름·커밋 해시
> 앞자리·GitLab 아이디가 들어 있다. 그쪽만 잠그려면 `nginx.status.conf` 의
> "열람 제한" 주석을 켠다.

---

## 6. 🔴 서버에 설치하기 — 그대로 복사해 붙이면 된다

**서버에서 하는 일이다.** 아래를 순서대로 한다. 두 번 돌려도 안전하다.

### 6.1. 한 줄로 설치

```bash
# 서버에 SSH 로 들어간 뒤, 이 저장소를 받아 둔 폴더에서
cd ~/S15P21E201 && git fetch origin && git checkout common/dev && git pull
sudo bash ci/status/install-status.sh
```

이것이 하는 일: 폴더를 만들고 · 페이지와 수집기를 놓고 · **한 번 돌려 보고**
(여기서 실패하면 멈춘다) · cron 에 1분마다 도는 줄을 넣고 · 로그를 돌려 깎게 한다.

### 6.2. GitLab 토큰 (안 넣어도 나머지는 돈다)

안 넣으면 **MR 검사 속도 두 줄만 "아직 안 잼"** 으로 뜨고 ③④와 실제 배포는 돈다.

```bash
# 1) GitLab → 아바타 → Preferences → Access Tokens
#    Add new token, scope 는 read_api 하나만 (읽기 전용이라 아무것도 안 망가뜨린다)
# 2) 서버에서 — 🔴 두 번째 줄에서 커서가 멈추면 토큰을 붙여 넣고 Enter, 그다음 Ctrl+D
#    이렇게 해야 토큰이 셸 기록(history)에 안 남는다
sudo install -m 600 -o ubuntu -g ubuntu /dev/null /etc/gabolle/status-token
sudo -u ubuntu tee /etc/gabolle/status-token >/dev/null
```

### 6.3. 🔴 nginx — 마지막 한 걸음은 사람이 눈으로 한다

설치 스크립트가 **일부러 안 건드린다.** 설정을 잘못 고치고 reload 하면
사이트 전체가 내려가기 때문이다.

```bash
# 1) 조각을 놓는다
sudo cp ci/status/nginx.status.conf /etc/nginx/snippets/status.conf

# 2) /etc/nginx/sites-available/default 를 연다. server 블록이 셋 있다.
#    🔴 반드시 `listen 443 ssl;` 과 `server_name j15e201.p.ssafy.io;` 를 가진
#       두 번째 블록 안에 이 한 줄을 넣는다:
#         include /etc/nginx/snippets/status.conf;
sudo nano /etc/nginx/sites-available/default

# 3) 🔴 검사 없이 reload 하지 않는다. 문법이 틀리면 nginx 가 안 뜨고 사이트가 통째로 내려간다
sudo nginx -t && sudo systemctl reload nginx

# 4) 열어 본다
curl -I https://j15e201.p.ssafy.io/status
curl -s https://j15e201.p.ssafy.io/status/status.json | head -c 300
```

### 6.4. 잘 도는지 보기

```bash
tail -20 /var/log/gabolle-status.log          # 수집기가 남긴 것
sudo -u ubuntu crontab -l | grep collect-status # 1분마다 도는 줄이 있나
head -40 /srv/gabolle/www/status/status.json   # 지금 값
du -sh /srv/gabolle/status-data                # 이력 크기 (수백 KB 를 안 넘는다)
```

### 6.5. 되돌리기

```bash
sudo -u ubuntu crontab -l | grep -v collect-status.mjs | sudo -u ubuntu crontab -
sudo rm -rf /usr/local/lib/gabolle/collect-status.mjs /srv/gabolle/status-data \
            /etc/logrotate.d/gabolle-status
```

---

## 7. CI 대시보드는 한 칸 내려갔다 (`/status/ci/`)

기존 GitLab 예약(`status:publish`)은 **그대로다.** 만드는 파일도 그대로다.
**서버에서 받는 자리만** `/status/` → `/status/ci/` 로 바뀐다. 안 그러면 두
페이지가 같은 `index.html` 을 놓고 서로 덮어쓴다.

이미 `pull-ci-status.sh` 를 만들어 두었다면 마지막 두 줄만 고친다:

```bash
sudo -u ubuntu tee /usr/local/bin/pull-ci-status.sh >/dev/null <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
TOKEN="$(cat /etc/gabolle/status-token)"
PROJECT=1444066
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
curl -fsSL --header "PRIVATE-TOKEN: $TOKEN" \
  "https://lab.ssafy.com/api/v4/projects/${PROJECT}/jobs/artifacts/common%2Fdev/download?job=status:publish" \
  -o "$TMP/a.zip"
unzip -q -o "$TMP/a.zip" -d "$TMP"
mkdir -p /srv/gabolle/www/status/ci
# 🔴 /status/ci/ 로 간다. /status/ 는 가동 상태 페이지의 자리다 — 덮으면 안 된다.
install -m 644 "$TMP/public/status/index.html"     /srv/gabolle/www/status/ci/index.html
install -m 644 "$TMP/public/status/ci-status.json" /srv/gabolle/www/status/ci/ci-status.json
EOF
sudo chmod +x /usr/local/bin/pull-ci-status.sh
sudo -u ubuntu /usr/local/bin/pull-ci-status.sh && echo OK

# 매시 10분에 받아 간다 (CI 예약이 매시 정각이라 10분 뒤면 결과가 나와 있다)
( sudo -u ubuntu crontab -l 2>/dev/null | grep -v pull-ci-status; \
  echo '10 * * * * /usr/local/bin/pull-ci-status.sh >/dev/null 2>&1' ) \
  | sudo -u ubuntu crontab -
```

`unzip` 이 없으면 `sudo apt install unzip -y`.

---

## 8. 이력은 어떻게 쌓이고, 왜 무한히 안 자라나

상태 페이지는 **과거가 없으면 아무것도 못 보여준다.** 그래서 세 파일에 쌓는다.
전부 `/srv/gabolle/status-data/` 에 있다 (🔴 `www` 밖이라 웹으로 안 보인다).

| 파일 | 무엇 | 얼마나 | 왜 안 자라나 |
|---|---|---|---|
| `samples.json` | 1분 표본 | **70개**(최근 1시간+여유) | 넘으면 앞에서 버린다 |
| `daily.json` | **4시간마다 한 칸**으로 접은 것 | **540칸 = 90일** | 넘으면 오래된 칸부터 버린다 |
| `incidents.json` | 장애 이력 | **60건 · 90일** | 둘 중 먼저 걸리는 쪽 |

> 🔴 파일 이름이 `daily.json`("하루")인데 안에 든 것은 **4시간 칸**이다. 처음에
> 하루 단위로 만들었다가 잘게 나눈 자국이다. 이름을 바꾸면 이미 서버에 있는
> 파일이 주인 없이 남아서 그대로 뒀다. **속을 믿고 이름을 믿지 마라.**

**접는다**는 것은 그 4시간의 240개 표본을 `{정상 몇, 느림 몇, 멈춤 몇,
응답시간 합계}` 몇 개의 숫자로 줄인다는 뜻이다. 그래서 540칸이 수십 KB 다.

화면의 **42칸 막대**는 **4시간에 한 칸**이다 — 하루 6칸(00·04·08·12·16·20시,
**한국 시간**), 7일이면 42칸. 그 4시간 안에 한 번이라도 멈췄으면 빨갛고, 느렸으면
노랗다. 🔴 **표본이 없는 칸은 회색으로 남긴다** — 초록으로 칠하면 "그때 잘 돌았다"
는 거짓말이 된다. **이 페이지를 켠 때부터 칸이 차기 시작한다.**

> 🔴 **왜 하루가 아니라 4시간인가.** 하루로 뭉치면 *점심에 2분 끊긴 것*과
> *온종일 죽어 있던 것*이 **똑같이 빨간 칸 하나**가 된다. 언제 죽었는지도
> 못 본다. 4시간이면 새벽·오전·오후·밤이 갈린다.

> 🔴 **칸 경계는 한국 시간으로 자른다.** 서버는 UTC 라서 그냥 자르면 칸이 한국
> 시간 09시·13시·17시에서 끊긴다 — 사람이 못 읽는 눈금이다. (이 팀은 알림
> 시각에서 같은 함정에 한 번 빠졌다: cron 은 20:00 인데 알림은 05:00 에 갔다.)

🔴 **셋이 서로 다른 숫자다 — 일부러 갈라 두었다.**

| | 얼마나 | 어디서 정하나 |
|---|---|---|
| 디스크에 **쌓는 것** | 540칸 (90일) | `collect-status.mjs` 의 `KEEP_SLOTS` |
| `status.json` 에 **싣는 것** | 42칸 (7일) | 같은 파일의 `PAGE_SLOTS` |
| 화면이 **그리는 것** | 받은 만큼 (최대 42칸) | `uptime.html` 의 `SHOW_SLOTS` |

쌓는 것과 싣는 것을 가른 이유는 **파일 크기**다. 540칸을 서비스 넷마다 실으면
`status.json` 이 100KB 를 넘고, 그것을 **모두가 30초마다 다시 받는다.**
쌓는 것과 보여주는 것을 가른 이유는 **되돌릴 수 있느냐**다 — **적게 보여주는 것은
언제든 되돌릴 수 있지만, 안 모은 것은 나중에 만들 수 없다.** 더 길게 보고 싶으면
`PAGE_SLOTS` 와 `SHOW_SLOTS` 를 늘리면 이미 쌓아 둔 것에서 그날로 되돌아온다.

> 🔴 **하루 단위였던 옛 기록은 4시간 칸으로 나누지 않고 버렸다** (2026-09-08).
> 하루가 "정상" 이었다는 것이 여섯 칸이 다 정상이었다는 뜻은 아니다. 나눠서
> 채우면 **없는 정보를 지어내는 것**이고, 그렇게 만든 초록은 진짜 초록과 구별되지
> 않는다. 수집기는 `SCHEMA` 번호가 다르면 가동 이력을 버리고 처음부터 쌓으며,
> 그때 화면 아래 "수집기가 못 잰 것" 칸에 무엇을 버렸는지 적는다.

**장애는 표본 두 번 연속**으로 정상이 아닐 때만 연다. 한 번은 안 연다 —
재배포하느라 20초 끊긴 것까지 적으면 이력이 잡음으로 가득 찬다.

> 🔴 **멈췄다 다시 시작해도 이어진다.** 상태는 전부 디스크에 있고 수집기는
> 메모리에 아무것도 안 들고 있다. 파일이 깨져 있으면 경고를 남기고 그 파일만
> 새로 시작한다. 결과 파일은 **임시 파일에 쓴 뒤 이름을 바꾼다** — 그냥 덮어쓰면
> 페이지가 하필 그 순간에 읽었을 때 반쪽짜리 JSON 을 받아 화면이 통째로 깨진다.

---

## 8.5. 🔴 왜 파일이 둘인가 — 접는 크기가 둘이라서

| 층 | 칸 하나 | 기간 | 점 | 어디에 |
|---|---|---|---|---|
| 굵은 층 | 4시간 | 7일 (디스크엔 90일) | 42 | `status.json` |
| 고운 층 | **5분** | **하루** | **288** | `status-fine.json` |

**같은 표본을 다른 크기로 두 번 접을 뿐이다.** 두 번 재는 게 아니다.

### 왜 5분인가

**재는 주기가 1분**이라 1분 칸은 평균이 아니라 **날것 한 번**이다. 한 번 튄 값이
그대로 봉우리가 된다. 5분이면 다섯 번을 평균내 추세가 매끄럽다.
짧은 사고를 놓칠 걱정은 안 해도 된다 — **그건 막대와 장애 이력이 한다**
(장애는 나쁜 표본 **두 번 연속**이면 열린다). 곡선의 일은 탐지가 아니라 추세다.

### 왜 한 파일에 안 담나 — 실측

화면은 `status.json` 을 **30초마다** 다시 받는다. 그런데 **5분 칸은 5분에 한 번만
바뀐다.** 같은 파일에 담으면 열 번 중 아홉 번은 똑같은 것을 다시 받는 셈이다.

| | 그대로 | gzip | 받는 주기 | 한 사람이 한 시간 열어 둘 때 |
|---|---|---|---|---|
| `status.json` | 24 KB | 2.1 KB | 30초 | 252 KB |
| `status-fine.json` | 152 KB | **6.6 KB** | **5분** | **79 KB** |

합쳐 약 **330 KB/시간**. 나누지 않고 고운 층까지 30초마다 받으면 여기서
**1 MB/시간**이 된다. 점을 42개에서 288개로 늘리는 값을 거기서 다 쓴다.

> 🔴 **gzip 을 재고 적은 숫자다.** 처음엔 값이 거의 다 같은 표본으로 재서 25배가
> 나왔는데, 진짜처럼 흔들리는 값으로 다시 재니 11배였다. 두 배 넘게 틀린 숫자로
> 결정할 뻔했다. 이 표의 숫자는 실제 표본 파일을 눌러서 잰 것이다.

### 고운 파일이 없으면

**아무 일도 안 난다.** 서버에 새 수집기가 아직 안 올라갔거나, 올라간 직후
몇 분 동안은 파일이 없다. 그때는 **단추가 안 보이고 7일 곡선만** 나오며,
글씨도 *"최근 7일"* 이라고 적힌다 — **고른 것이 아니라 실제로 그린 것**을 적는다.

---

## 9. 손으로 돌려 보기 · 고장 찾기

```bash
node ci/status/collect-status.mjs --help        # 옵션 전부
node ci/status/collect-status.mjs --self-test   # 계산이 맞나. 0 이면 통과
node ci/status/collect-status.mjs --dry-run     # 파일을 안 쓰고 화면에 찍는다
node ci/status/collect-status.mjs --gitlab=off  # GitLab 은 건너뛰고 서버 것만

node ci/status/check-uptime.mjs               # 화면의 곡선이 약속을 지키나. 0 이면 통과
```

> 🔴 **곡선은 눈으로만 보면 안 된다.** 만들면서 실제로 두 번 속았다. 한 번은 튄 칸
> 하나가 나머지를 바닥에 눌러 평평하게 만든 것을 **기계가 통과시켰고**(눈이 잡았다),
> 한 번은 좌표 두 개가 붙어 버려(…,56 + 131.0 → 56131.0) 면이 화면 밖으로 나간 것을
> **눈이 "색이 안 나오네" 로만 읽었다**(기계가 잡았다). 어느 쪽에서도 오류는 안 났다.
> `check-uptime.mjs` 는 **사본이 아니라 `uptime.html` 에서 코드를 꺼내** 돌린다 —
> 사본을 검사하면 페이지만 고친 날 검사가 계속 초록으로 거짓말한다.

**`--self-test` 는 어디서든 돈다.** 리눅스가 주는 글자(`/proc/loadavg`,
`docker stats`, `ps` 의 출력)를 그대로 붙여 넣고 계산이 맞는지 본다. 서버에
안 올려도, 윈도우에서도 검사할 수 있다. 종료 코드가 0 이면 통과다.

| 증상 | 십중팔구 | 확인 |
|---|---|---|
| 페이지가 "status.json 을 못 읽었습니다" | 아직 설치 전이거나 nginx include 를 안 했다 | `ls /srv/gabolle/www/status/` |
| 맨 위에 빨간 "N분 전의 것입니다" | **cron 이 멈췄다** | `systemctl status cron` · `tail /var/log/gabolle-status.log` |
| 컨테이너 표만 비어 있다 | cron 의 PATH 에 docker 가 없거나 계정이 docker 그룹에 없다 | `sudo -u ubuntu docker ps` |
| MR 두 줄만 "아직 안 잼" | 토큰이 없거나 만료됐다 | `sudo -u ubuntu node …/collect-status.mjs --dry-run` 의 경고 |
| 손으로는 되는데 cron 만 안 된다 | **거의 항상 PATH 다** | cron 줄에 PATH 가 박혀 있는지 (설치 스크립트가 박아 둔다) |
| 컨테이너가 `*` 로 나온다 | 모르는 이름이라 가린 것 | 5절 |

> 🔴 **모든 경고는 화면 아래 "수집기가 못 잰 것" 에 그대로 나온다.** 숨기지 않는다.

---

## 10. CI 대시보드 쪽(`collect.mjs`) 은 안 바뀌었다

브랜치별 파이프라인·잡 시간·러너를 파고드는 페이지다. 쓰는 법은 그대로다.

```bash
GITLAB_TOKEN=glpat-… node ci/status/collect.mjs      # ci-status.json 을 만든다
```

| 옵션 | 무엇 |
|---|---|
| `--branches=back/dev,front/dev` | 이 브랜치들만 |
| `--discover` | 브랜치 목록을 저장소에서 직접 찾는다 |
| `--jobs=all` | 잡 단위 추세까지. 느리다 |
| `--runner-facts=파일` | API 에 없는 러너의 코어·슬롯·load 를 실어 준다 |

러너의 **코어 수·동시 실행 슬롯·load average** 셋은 GitLab API 에 없다.
러너 서버에서 재야 나온다.

```bash
nproc; cat /proc/loadavg; grep -i '^concurrent' /etc/gitlab-runner/config.toml
```
