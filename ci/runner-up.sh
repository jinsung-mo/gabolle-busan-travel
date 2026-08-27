#!/usr/bin/env bash
# CI 러너를 이 컴퓨터에 띄운다. 여러 번 돌려도 안전하다.
#
# 왜 이 파일이 있나 — 2026-08-26 에 팀 CI 가 멈췄다. 원인 셋 중 하나가
# "러너가 한 사람의 PC 에 있고 그 PC 가 꺼져 있었다" 였다. 그래서 러너를
# **여러 대에 띄울 수 있게** 만든다. 온라인인 아무 러너나 잡을 가져간다.
#
#   AXMAP_RUNNER_TOKEN=glrt-xxxx bash ci/runner-up.sh
#
# 토큰은 Maintainer 가 만든다 (GitLab → Settings → CI/CD → Runners → New project runner).
# 같은 토큰을 여러 대가 함께 써도 된다 — GitLab 16+ 는 한 러너에 여러 대(runner manager)를 허용한다.
set -euo pipefail

NAME="${AXMAP_RUNNER_NAME:-axmap-runner-$(hostname)}"
URL="${AXMAP_RUNNER_URL:-https://lab.ssafy.com}"
IMAGE="${AXMAP_RUNNER_IMAGE:-node:20-alpine}"

command -v docker >/dev/null || { echo "docker 가 없습니다. Docker Desktop 을 설치·실행하세요."; exit 1; }
docker info >/dev/null 2>&1 || { echo "Docker 데몬이 꺼져 있습니다. Docker Desktop 을 실행하세요."; exit 1; }

if [ -z "${AXMAP_RUNNER_TOKEN:-}" ]; then
  cat <<'MSG'
AXMAP_RUNNER_TOKEN 이 없습니다.

  Maintainer 에게 러너 토큰을 받으세요 (glrt- 로 시작합니다).
  GitLab → 프로젝트 → Settings → CI/CD → Runners → New project runner
    · Run untagged jobs 체크
    · 만들면 나오는 토큰을 그대로 씁니다

  받은 뒤:  AXMAP_RUNNER_TOKEN=glrt-xxxx bash ci/runner-up.sh
MSG
  exit 2
fi

# 이미 떠 있으면 그대로 둔다. 지우고 다시 만들면 진행 중인 잡이 끊긴다.
if docker ps --format '{{.Names}}' | grep -qx gitlab-runner; then
  echo "이미 떠 있습니다: $(docker ps --filter name=gitlab-runner --format '{{.Status}}')"
  exit 0
fi

docker rm -f gitlab-runner >/dev/null 2>&1 || true
docker run -d --name gitlab-runner --restart always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v gitlab-runner-config:/etc/gitlab-runner \
  gitlab/gitlab-runner:latest >/dev/null

docker exec gitlab-runner gitlab-runner register \
  --non-interactive --url "$URL" --token "$AXMAP_RUNNER_TOKEN" \
  --executor docker --docker-image "$IMAGE" \
  --docker-privileged=false --docker-pull-policy "if-not-present" \
  --description "$NAME"

echo
echo "떴습니다. Docker Desktop 이 켜져 있는 동안 잡을 가져갑니다."
echo "  확인:  docker ps --filter name=gitlab-runner"
echo "  내리기: docker rm -f gitlab-runner"
echo
echo "🔴 Docker Desktop 을 '로그인 시 시작' 으로 켜 두세요. 안 그러면 재부팅마다 CI 가 멈춥니다."
