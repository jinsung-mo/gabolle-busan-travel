#!/usr/bin/env bash
#
# install-status.sh — 가동 상태 페이지를 운영 서버에 한 번에 설치한다 (S15P21E201-701)
#
# ─────────────────────────────────────────────────────────────────────────────
# 이 스크립트는 무엇을 하나
#
#   1) 페이지를 놓을 폴더와 이력을 쌓을 폴더를 만든다
#   2) 페이지(uptime.html) 를 /srv/gabolle/www/status/index.html 로 놓는다
#   3) 수집기(collect-status.mjs) 를 /usr/local/lib/gabolle/ 로 놓는다
#   4) 수집기를 **한 번 돌려 본다** — 여기서 실패하면 cron 도 실패하므로 멈춘다
#   5) cron 에 1분마다 도는 줄을 넣는다 (이미 있으면 안 넣는다)
#
# 🔴 nginx 설정은 이 스크립트가 **안 건드린다.** 설정을 잘못 고치고 reload 하면
#    사이트 전체가 내려가기 때문에, 그 한 걸음은 사람이 눈으로 보고 한다.
#    방법은 nginx.status.conf 맨 위 주석과 README 6절에 있다.
#
# ─────────────────────────────────────────────────────────────────────────────
# 쓰는 법 (서버에서, ubuntu 계정으로)
#
#   git clone 한 저장소 안에서:
#     sudo bash ci/status/install-status.sh
#
#   토큰을 아직 안 만들었으면 GitLab 것은 "아직 안 잼" 으로 뜨고 나머지는 돈다.
#   토큰 넣는 법은 README 6절 2단계.
#
# 두 번 세 번 돌려도 안전하다 (같은 것을 덮어쓸 뿐 cron 줄이 늘지 않는다).

set -euo pipefail

# ── 어디에 무엇을 놓나 ───────────────────────────────────────────────────────
WWW=/srv/gabolle/www/status          # 페이지. nginx 가 여기를 그대로 내보낸다
LIB=/usr/local/lib/gabolle           # 수집기 프로그램
DATA=/srv/gabolle/status-data        # 이력. 🔴 www 밖이다 — 웹으로 안 보이게
LOG=/var/log/gabolle-status.log
TOKEN=/etc/gabolle/status-token
MASK=/etc/gabolle/status-mask.txt
RUN_USER="${SUDO_USER:-ubuntu}"      # 실제로 돌릴 계정. sudo 로 불렀으면 그 사람

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
die() { printf '\n🔴 %s\n\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "sudo 로 돌려야 합니다:  sudo bash ci/status/install-status.sh"

# ── 0. 있어야 하는 것부터 본다. 없으면 여기서 멈춘다 ─────────────────────────
say "0. 필요한 것이 있는지 봅니다"

command -v node >/dev/null || die "node 가 없습니다. 수집기는 Node.js 18 이상이 필요합니다 (fetch 를 씁니다).
   설치:  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs"

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 18 ] || die "Node.js 가 $NODE_MAJOR 버전입니다. 18 이상이 필요합니다 (그 아래에는 fetch 가 없습니다)."
echo "   node $(node -v) — 괜찮습니다"

for f in uptime.html collect-status.mjs; do
  [ -f "$HERE/$f" ] || die "$HERE/$f 가 없습니다. 저장소 안에서 돌리고 있는지 보세요."
done

# 글꼴은 없어도 페이지는 뜬다 — 시스템 글꼴로 떨어질 뿐이다. 그래서 멈추지 않고 알린다.
[ -d "$HERE/fonts" ] || echo "   ⚠ $HERE/fonts 가 없습니다 — 글꼴이 시스템 것으로 떨어집니다"

# docker 와 ps 는 없어도 설치는 된다 — 그 칸만 "아직 안 잼" 이 된다.
if ! command -v docker >/dev/null; then
  echo "   ⚠ docker 가 없습니다 — '최근 1시간 CPU 최다' 의 컨테이너 표가 빕니다"
elif ! sudo -u "$RUN_USER" docker ps >/dev/null 2>&1; then
  echo "   ⚠ $RUN_USER 계정이 docker 를 못 씁니다 — 컨테이너 표가 빕니다"
  echo "     고치려면:  sudo usermod -aG docker $RUN_USER   (그 뒤 로그아웃·로그인)"
else
  echo "   docker — 괜찮습니다 (컨테이너 $(sudo -u "$RUN_USER" docker ps -q | wc -l)개가 떠 있습니다)"
fi

# ── 1. 폴더 ──────────────────────────────────────────────────────────────────
say "1. 폴더를 만듭니다"
install -d -o "$RUN_USER" -g "$RUN_USER" -m 755 "$WWW" "$WWW/ci" "$DATA"
install -d -m 755 "$LIB"
install -d -m 755 /etc/gabolle
touch "$LOG"; chown "$RUN_USER":"$RUN_USER" "$LOG"; chmod 640 "$LOG"
echo "   $WWW · $DATA · $LIB"

# ── 2. 페이지와 수집기 ───────────────────────────────────────────────────────
say "2. 페이지와 수집기를 놓습니다"
# 🔴 저장소에서는 uptime.html 이지만 서버에서는 index.html 이다. nginx 가
#    /status/ 를 열 때 index.html 을 찾기 때문이다. 옆의 index.html 은 다른
#    페이지(CI 대시보드)라 /status/ci/ 로 따로 간다 — README 7절.
install -o "$RUN_USER" -g "$RUN_USER" -m 644 "$HERE/uptime.html" "$WWW/index.html"
install -m 755 "$HERE/collect-status.mjs" "$LIB/collect-status.mjs"
echo "   $WWW/index.html   ← uptime.html"
echo "   $LIB/collect-status.mjs"

# 🔴 글꼴은 CDN 에서 안 받는다. 이 페이지는 인터넷이 죽은 날에도 떠야 해서,
#    글꼴 파일도 같은 서버에 놓고 상대경로(fonts/…)로 부른다.
if [ -d "$HERE/fonts" ]; then
  install -d -o "$RUN_USER" -g "$RUN_USER" -m 755 "$WWW/fonts"
  install -o "$RUN_USER" -g "$RUN_USER" -m 644 "$HERE"/fonts/* "$WWW/fonts/"
  echo "   $WWW/fonts/       ← $(ls "$HERE/fonts"/*.woff2 2>/dev/null | wc -l)개 글꼴 + 라이선스"
fi

# ── 데이터 흐름도 ────────────────────────────────────────────────────────────
#
# 그릴 내용은 파트마다 흩어진 `dataflow.json` 에 있다. 브라우저는 그것들을 직접
# 못 읽으므로(서버에 저장소가 통째로 있지 않다) **여기서 한 번 모아** 페이지 옆에
# `flow/graph.json` 으로 떨어뜨린다.
#
# 🔴 모으는 김에 **확인도 한다.** 조각이 "이 파일이 증거다" 라고 적어 둔 경로가
#    실제로 없으면 그 길은 끊긴 것으로 그려진다. 조각 자체가 잘못됐으면
#    (없는 칸을 가리키거나, 모르는 단계를 쓰거나) 종료 코드 1 로 멈춘다.
#
# 🔴 흐름도가 없어도 설치는 계속된다. 이 페이지의 본래 일은 "지금 되나" 에 답하는
#    것이고, 그림 하나 때문에 그 일을 못 하게 되면 안 된다.
say "2-1. 데이터 흐름도를 모읍니다"
if [ -f "$HERE/flow/build-flow.mjs" ]; then
  install -d -o "$RUN_USER" -g "$RUN_USER" -m 755 "$WWW/flow"
  if node "$HERE/flow/build-flow.mjs" --out="$WWW/flow/graph.json"; then
    chown "$RUN_USER":"$RUN_USER" "$WWW/flow/graph.json"
    chmod 644 "$WWW/flow/graph.json"
    install -o "$RUN_USER" -g "$RUN_USER" -m 644 "$HERE/flow/flow.js" "$WWW/flow/flow.js"
    echo "   $WWW/flow/"
  else
    echo "   ⚠ 흐름 조각에 문제가 있어 그림은 건너뜁니다. 페이지의 나머지는 그대로 뜹니다."
    echo "     고치려면:  node ci/status/flow/build-flow.mjs --check"
  fi
else
  echo "   ⚠ $HERE/flow/ 가 없습니다 — 흐름도 칸만 안내문으로 뜹니다"
fi

# 가릴 이름 목록 — 없으면 빈 것을 만들어 둔다. 나중에 여기 한 줄씩 넣는다.
if [ ! -f "$MASK" ]; then
  cat > "$MASK" <<'EOF'
# 화면에서 가릴 이름을 한 줄에 하나씩 적는다. 대소문자를 안 가리고, 이름 안에
# 이 글자가 들어 있으면 "가려진 작업" 으로 바꾼다.
#
# 🔴 이 페이지는 로그인 없이 누구나 본다. 컨테이너나 프로그램 이름에 팀원 아이디가
#    들어가면 여기 한 줄 넣는다. (bims-* 는 수집기가 이미 묶어서 처리한다)
#
# 예:
# minsu
EOF
  chmod 644 "$MASK"
  echo "   $MASK (빈 목록을 만들었습니다)"
fi

# ── 3. 토큰 ──────────────────────────────────────────────────────────────────
say "3. GitLab 토큰"
if [ -f "$TOKEN" ] && [ -s "$TOKEN" ]; then
  chmod 600 "$TOKEN"; chown "$RUN_USER":"$RUN_USER" "$TOKEN"
  echo "   이미 있습니다 ($TOKEN). 권한을 600 으로 맞췄습니다"
else
  cat <<EOF
   ⚠ 아직 없습니다. **MR 검사 속도 두 줄만 "아직 안 잼" 으로 뜨고 나머지는 돕니다.**

   넣으려면 (읽기만 하는 토큰이라 아무것도 안 망가뜨립니다):
     1) https://lab.ssafy.com → 아바타 → Preferences → Access Tokens
        → Add new token, scope 는 read_api 하나만 켭니다
     2) 서버에서 아래를 그대로 붙여 넣습니다.
        🔴 두 번째 줄에서 커서가 멈추면 토큰을 붙여 넣고 Enter, 그다음 Ctrl+D 를
           누릅니다. 이렇게 하면 토큰이 셸 기록(history)에 안 남습니다
sudo install -m 600 -o $RUN_USER -g $RUN_USER /dev/null $TOKEN
sudo -u $RUN_USER tee $TOKEN >/dev/null
     3) 다시 이 스크립트를 돌리거나, 1분 기다리면 cron 이 알아서 씁니다

   🔴 토큰은 결과 파일(status.json)에 안 들어갑니다. 수집기가 읽어서 헤더에만 씁니다.
EOF
fi

# ── 4. 한 번 돌려 본다 ───────────────────────────────────────────────────────
say "4. 수집기를 한 번 돌려 봅니다 (여기서 실패하면 cron 도 실패합니다)"
if sudo -u "$RUN_USER" node "$LIB/collect-status.mjs" \
      --out="$WWW/status.json" --data-dir="$DATA" --mask-file="$MASK" \
      --gitlab-token-file="$TOKEN"; then
  echo "   됐습니다"
else
  die "수집기가 실패했습니다. 위 메시지를 보세요. cron 은 등록하지 않았습니다."
fi

# ── 5. cron ──────────────────────────────────────────────────────────────────
say "5. cron 에 1분마다 도는 줄을 넣습니다"
# 🔴 cron 의 PATH 는 아주 짧다 (/usr/bin:/bin). docker 도 node 도 못 찾는 일이
#    흔해서 PATH 를 줄 안에 직접 박는다. 이걸 안 하면 "손으로는 되는데 cron 만
#    안 되는" 상태가 되고, 그 원인을 찾는 데 반나절이 간다.
CRON_LINE="* * * * * PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin node $LIB/collect-status.mjs --out=$WWW/status.json --data-dir=$DATA --mask-file=$MASK --gitlab-token-file=$TOKEN --quiet >> $LOG 2>&1"

CUR="$(crontab -u "$RUN_USER" -l 2>/dev/null || true)"
if printf '%s\n' "$CUR" | grep -qF 'collect-status.mjs'; then
  echo "   이미 있습니다. 새 줄로 바꿉니다"
  CUR="$(printf '%s\n' "$CUR" | grep -vF 'collect-status.mjs')"
fi
printf '%s\n%s\n' "$CUR" "$CRON_LINE" | sed '/^$/d' | crontab -u "$RUN_USER" -
echo "   넣었습니다:"
echo "     $CRON_LINE"

# 로그가 무한히 자라지 않게 돌려 깎는다 (logrotate — 리눅스가 로그 파일을
# 일정 크기마다 잘라 오래된 것을 지우는 표준 장치).
cat > /etc/logrotate.d/gabolle-status <<EOF
$LOG {
    weekly
    rotate 4
    size 5M
    missingok
    notifempty
    compress
    copytruncate
    su $RUN_USER $RUN_USER
}
EOF
echo "   로그는 5MB 마다 잘라 4주치만 남깁니다 (/etc/logrotate.d/gabolle-status)"

# ── 끝 ───────────────────────────────────────────────────────────────────────
cat <<EOF

────────────────────────────────────────────────────────────────────────────
설치가 끝났습니다. **남은 한 걸음은 nginx 이고 사람이 합니다.**

  1) 조각을 놓는다
       sudo cp $HERE/nginx.status.conf /etc/nginx/snippets/status.conf

  2) /etc/nginx/sites-available/default 를 열어, **443 포트에
     server_name j15e201.p.ssafy.io 인 블록 안**에 한 줄 넣는다
       include /etc/nginx/snippets/status.conf;

  3) 🔴 검사 없이 reload 하지 않는다. 문법이 틀리면 사이트 전체가 내려간다
       sudo nginx -t && sudo systemctl reload nginx

  4) 열어 본다
       https://j15e201.p.ssafy.io/status

지금 상태를 눈으로 보려면:
    cat $WWW/status.json | head -40
    tail -20 $LOG
    sudo -u $RUN_USER crontab -l | grep collect-status

되돌리려면:
    sudo -u $RUN_USER crontab -l | grep -v collect-status.mjs | sudo -u $RUN_USER crontab -
    sudo rm -rf $LIB/collect-status.mjs $DATA /etc/logrotate.d/gabolle-status
────────────────────────────────────────────────────────────────────────────
EOF
