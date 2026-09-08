# CI 상태판 — 팀의 파이프라인이 지금 어떤지 한 장으로

`https://j15e201.p.ssafy.io/status/` 에 올릴 한 장짜리 페이지다 (S15P21E201-701).

브랜치마다 **파이프라인**(코드를 올릴 때마다 자동으로 도는 검사 묶음)이 초록인지
빨간지, 얼마나 걸렸는지, 그 안의 **잡**(job — 파이프라인이 돌리는 작업 하나)
하나하나가 몇 초 걸렸는지, 그리고 **러너**(CI 를 실제로 돌리는 기계)가 몇 대이고
지금 몇 개를 돌리고 있는지를 보여준다.

> 🔴 **이 페이지는 숫자를 만들어내지 않는다.** 못 받은 브랜치는 빈칸으로 남는다.
> 빈칸이 지어낸 숫자보다 낫다 — 지어낸 숫자는 사람이 그걸 믿고 엉뚱한 데를 판다.

---

## 1. 파일 넷

| 파일 | 무엇 |
|---|---|
| `index.html` | 페이지 자체. 라이브러리를 안 받는다 — 파일 하나로 끝난다 |
| `collect.mjs` | GitLab API 에서 데이터를 받아 `ci-status.json` 을 쓴다 |
| `nginx.status.conf` | 운영 nginx 에 붙일 설정 조각. `/status/` 를 정적 파일로 준다 |
| `README.md` | 이 문서 |

`index.html` 은 열리면 **같은 폴더의 `ci-status.json` 을 스스로 읽는다.**
그래서 둘을 한 폴더에 두기만 하면 된다. 파일이 없거나 브라우저가 로컬 파일 읽기를
막으면, 페이지에 `ci-status.json` 을 끌어다 놓아도 같은 그림이 나온다.

---

## 2. 데이터는 어떻게 갱신되나

`.gitlab-ci.yml` 의 **`status:publish`**(상태판을 만드는 잡)가 만든다.

**예약 파이프라인**(GitLab 이 정해진 시각에 스스로 돌리는 파이프라인)에서만 돌고,
그중에서도 `SCHEDULE_KIND` 라는 변수가 `status` 인 예약에서만 돈다.

```
0 * * * *      SCHEDULE_KIND = status      매시 정각 — 1시간마다
```

> 🔴 **`SCHEDULE_KIND` 로 가르는 것이 핵심이다.** "예약이면 돈다" 로 두면
> `vote-recheck`·`promote` 예약이 돌 때마다 이 잡도 같이 깨어나서 CI 시간을
> 두 배로 쓴다. 2026-09-01 에 `promote` 잡이 정확히 그것으로 10분마다
> 빨개진 적이 있다 (#176479). 그래서 예약마다 이름표를 붙여 가른다.

주기를 1시간으로 잡은 이유는 지금 예약 파이프라인이 이미 CI 시간을 많이 쓰고
있어서다. 더 자주 보고 싶으면 아래 4절처럼 손으로 돌리면 된다.

---

## 3. 배포 — 🔴 마지막 한 걸음은 사람이 한 번 만들어야 한다

**`status:publish` 잡은 파일을 만들기까지만 하고, 운영 서버에는 올리지 않는다.**
못 올린다. 지어낸 것이 아니라 2026-09-08 에 실제로 확인한 결과다:

- 어느 브랜치의 `.gitlab-ci.yml` 에도 **배포 잡이 없다.** 단계는 `verify`·`release` 뿐이다
- GitLab 의 CI/CD 변수에 **SSH 키도, 서버 주소도, 배포용 자격증명도 없다**
- 운영 서버 배포는 GitLab CI 가 아니라 **서버 위에서 도는 Jenkins** 가 한다
  (`docs/SERVER-SETUP.md` 5절 · `backend/Jenkinsfile` · `frontend/Jenkinsfile`).
  GitLab 은 웹훅(**어떤 일이 생기면 다른 서버의 주소를 대신 눌러 주는 것**)으로
  Jenkins 를 깨우기만 한다

없는 길을 지어내면 잡은 초록인데 화면은 안 바뀐다. 그래서 잡은 결과물을
**아티팩트**(잡이 끝난 뒤에도 GitLab 이 보관해 주는 결과 파일)로 남기는 데까지만 한다.

최신 성공분은 **늘 같은 주소**에 있다 (프로젝트 번호 `1444066` 은 이 저장소의 것이다):

```
https://lab.ssafy.com/api/v4/projects/1444066/jobs/artifacts/common%2Fdev/download?job=status:publish
```

### 3.1. 한 번만 만들면 되는 다리 — 서버가 스스로 받아 가게 한다 (권장)

서버에 SSH 로 들어가 아래를 한 번 한다. 그 뒤로는 사람이 손댈 일이 없다.

```bash
# 1) 페이지를 놓을 자리
sudo mkdir -p /srv/gabolle/www/status
sudo chown -R ubuntu:ubuntu /srv/gabolle/www

# 2) 읽기 전용 토큰을 서버에만 둔다 (저장소에 커밋하지 않는다)
#    GitLab -> Settings -> Access Tokens, Role=Reporter, scope=read_api
#    🔴 -m 600 은 "주인만 읽고 쓴다" 는 뜻이다. 토큰 파일은 반드시 이렇게 둔다
sudo mkdir -p /etc/gabolle
sudo install -m 600 -o ubuntu -g ubuntu /dev/null /etc/gabolle/status-token
sudo -u ubuntu tee /etc/gabolle/status-token >/dev/null <<'EOF'
glpat-여기에붙여넣기
EOF

# 3) 받아 오는 스크립트
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
# 🔴 통째로 바꾸지 않고 파일만 덮는다. 받는 중에 페이지가 반쪽으로 보이지 않게.
install -m 644 "$TMP/public/status/index.html"     /srv/gabolle/www/status/index.html
install -m 644 "$TMP/public/status/ci-status.json" /srv/gabolle/www/status/ci-status.json
EOF
sudo chmod +x /usr/local/bin/pull-ci-status.sh

# 4) 손으로 한 번 돌려 본다. 여기서 실패하면 아래 cron 도 실패한다
sudo -u ubuntu /usr/local/bin/pull-ci-status.sh && echo OK

# 5) 매시 10분에 받아 간다 (CI 예약이 매시 정각이라 10분 뒤면 결과가 나와 있다)
( sudo -u ubuntu crontab -l 2>/dev/null; \
  echo '10 * * * * /usr/local/bin/pull-ci-status.sh >/dev/null 2>&1' ) \
  | sudo -u ubuntu crontab -
```

`unzip` 이 없으면 `sudo apt install unzip -y`.

### 3.2. 그냥 한 번 보고 싶을 때 — 손으로 올린다

```bash
# 내 PC 에서 만들고 서버로 밀어 넣는다 (PEM 키 경로는 각자 것)
node ci/status/collect.mjs --out=ci-status.json
scp -i <PEM키> ci/status/index.html ci-status.json ubuntu@j15e201.p.ssafy.io:/srv/gabolle/www/status/
```

### 3.3. nginx

`nginx.status.conf` 를 서버에 넣고 `include` 한다. **그 파일 맨 위 주석에 어디에
두고 어떻게 부르는지가 명령까지 적혀 있다.** 요약하면:

```bash
sudo cp nginx.status.conf /etc/nginx/snippets/status.conf
# /etc/nginx/sites-available/default 의 443 블록(server_name j15e201.p.ssafy.io)
# 안에 include /etc/nginx/snippets/status.conf; 를 한 줄 넣는다
sudo nginx -t && sudo systemctl reload nginx
```

> 🔴 **`nginx -t` 없이 reload 하지 않는다.** 문법이 틀린 채로 reload 하면 nginx 가
> 안 뜨고 사이트가 통째로 내려간다.

> 🔴 **이 페이지는 로그인 없이 누구나 볼 수 있게 된다.** 비밀번호나 토큰은 안
> 들어가지만 브랜치 이름·잡 이름·커밋 해시 앞자리·파이프라인을 돌린 사람의 GitLab
> 아이디는 들어간다. 가리려면 `nginx.status.conf` 의 "열람 제한" 주석을 켠다.

---

## 4. 손으로 갱신하려면

토큰만 있으면 어디서든 된다. 읽기만 하므로 아무것도 안 망가뜨린다.

```bash
# GitLab -> 아바타 -> Preferences -> Access Tokens, scope 는 read_api 하나면 된다
GITLAB_TOKEN=glpat-… node ci/status/collect.mjs
```

```powershell
# PowerShell (윈도우)
$env:GITLAB_TOKEN = "glpat-…"
node ci/status/collect.mjs
```

같은 폴더에 `ci-status.json` 이 생긴다. `index.html` 을 브라우저로 열면 그 파일을
스스로 읽는다.

자주 쓰는 옵션 (`--help` 로 전부 볼 수 있다):

| 옵션 | 무엇 |
|---|---|
| `--branches=back/dev,front/dev` | 이 브랜치들만 |
| `--discover` | 브랜치 목록을 저장소에서 직접 찾는다 |
| `--jobs=all` | 잡 단위 추세까지. 느리다 |
| `--job-window=250` | 러너에서 몇 개가 함께 돌았는지 세려고 최근 잡을 훑는 개수 |
| `--out=경로` | 기본은 `./ci-status.json` |

종료 코드가 0 이면 파일이 만들어진 것이고, 그 외는 전부 실패다. 실패했으면 파일을
아예 안 만든다 — 낡은 파일이 새 것인 척하지 않게.

---

## 5. GitLab API 가 안 주는 것 — 지어내지 않는다

러너의 **코어 수**, **동시 실행 슬롯 수**(한 러너가 잡을 몇 개까지 같이 돌리나),
**load average**(기계가 얼마나 바쁜가) 셋은 **API 에 없다.** 러너 서버에 직접
들어가야 나온다.

```bash
nproc; cat /proc/loadavg; grep -i '^concurrent' /etc/gitlab-runner/config.toml
```

잰 값을 파일로 만들어 주면 그대로 실어 준다.

```json
{ "j15e201a backup EC2 runner": { "cores": 4, "slots": 1, "load1": 2.2,
                                  "measuredAt": "2026-09-08T10:00:00Z" } }
```

```bash
node ci/status/collect.mjs --runner-facts=runner-facts.json
```

열쇠는 **GitLab 에 적힌 러너 이름(description)** 이나 러너 번호다. 안 맞으면
경고에 적어 준다.
