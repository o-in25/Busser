# runs a test build so we dont bork prod
set -euo pipefail

IMAGE="busser:local"
CONTAINER="busser-local"
PLATFORM="linux/amd64"
PORT="3000"

# docker desktop doesnt always add itself to path which is annoying
DOCKER="$(command -v docker || true)"
if [ -z "$DOCKER" ] && [ -x /Applications/Docker.app/Contents/Resources/bin/docker ]; then
  DOCKER=/Applications/Docker.app/Contents/Resources/bin/docker
fi
[ -z "$DOCKER" ] && { echo "docker not found — install/launch Docker Desktop"; exit 1; }
"$DOCKER" info >/dev/null 2>&1 || { echo "docker daemon not running — launch Docker Desktop"; exit 1; }

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

APP_VERSION="${APP_VERSION:-local-$(date +%Y%m%d%H%M%S)}"

build() {
  echo "==> building $IMAGE ($PLATFORM, no-cache) exactly as fly's builder would"
  "$DOCKER" build --no-cache --platform "$PLATFORM" \
    --build-arg APP_VERSION="$APP_VERSION" -t "$IMAGE" .
  echo "==> asserting no secret values baked into image layers"
  if "$DOCKER" history --no-trunc "$IMAGE" \
      | grep -iqE 'DB_PASSWORD|JWT_SIGNING_KEY|MAILGUN_KEY|OPENAI_API_KEY|GOOGLE_SERVICE_KEY|GOOGLE_OAUTH'; then
    echo "!! secret values found in image layers — aborting"; exit 1
  fi
  echo "==> build OK; no secrets in layers"
}

wait_up() {
  echo "==> waiting for http://localhost:$PORT ..."
  if curl -sf -o /dev/null --retry 40 --retry-all-errors --retry-delay 1 --max-time 5 \
      "http://localhost:$PORT/login"; then
    echo "==> up: http://localhost:$PORT (login served 200)"
  else
    echo "!! server did not respond; recent logs:"; "$DOCKER" logs "$CONTAINER" 2>&1 | tail -20; return 1
  fi
}

run() {
  [ -f .env ] || { echo ".env not found — create it (see README for required vars)"; exit 1; }
  stop
  if [ "${1:-}" = "--db" ]; then
    echo "==> running FULL stack (cloud-sql-proxy -> PROD DB). mutations write to prod."
    "$DOCKER" run -d --name "$CONTAINER" -p "$PORT:$PORT" --platform "$PLATFORM" \
      --env-file .env "$IMAGE" >/dev/null
  else
    echo "==> running BOOT-ONLY (no db proxy; db-backed pages will 500). never touches prod."
    "$DOCKER" run -d --name "$CONTAINER" -p "$PORT:$PORT" --platform "$PLATFORM" \
      --env-file .env --entrypoint node "$IMAGE" ./build/index.js >/dev/null
  fi
  wait_up
}

stop() { "$DOCKER" rm -f "$CONTAINER" >/dev/null 2>&1 || true; }

case "${1:-build}" in
  build) build ;;
  smoke) build; run; echo "==> smoke passed"; stop; echo "==> torn down" ;;
  run)   [ -n "$("$DOCKER" images -q "$IMAGE")" ] || build; run "${2:-}" ;;
  logs)  "$DOCKER" logs -f "$CONTAINER" ;;
  stop)  stop; echo "stopped $CONTAINER" ;;
  *) echo "usage: $0 {build|smoke|run [--db]|logs|stop}"; exit 1 ;;
esac
