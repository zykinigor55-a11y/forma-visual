#!/usr/bin/env bash
# Install as /usr/local/sbin/forma-deploy; run through restricted sudo from GitHub Actions.
set -Eeuo pipefail
if [ "$#" -ne 1 ] || ! [[ "$1" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Usage: forma-deploy <40-character commit SHA>" >&2
  exit 2
fi
SHA="$1"
exec 9>/run/lock/forma-deploy.lock
flock -n 9 || { echo "Another deployment is running" >&2; exit 1; }
APP=/srv/forma-visual/app
test -d "$APP/.git" || { echo "Install the app before deploying" >&2; exit 1; }
cd "$APP"
PREVIOUS="$(git rev-parse HEAD)"
git fetch --depth=1 origin dom-render-nanobanana
TARGET="$(git rev-parse FETCH_HEAD)"
if [ "$TARGET" != "$SHA" ]; then
  echo "Ref changed while deploying; refusing stale or unexpected commit" >&2
  exit 1
fi
git reset --hard "$TARGET"
rollback() {
  echo "Deployment failed: restoring previous commit" >&2
  git reset --hard "$PREVIOUS"
  systemctl restart forma-visual || true
}
if ! /usr/bin/node --check server.mjs; then rollback; exit 1; fi
if ! systemctl restart forma-visual; then rollback; exit 1; fi
sleep 3
if ! curl --fail --silent --show-error --max-time 12 http://127.0.0.1:3000/api/status >/dev/null; then
  rollback
  exit 1
fi
echo "DOM.RENDER deployed at $TARGET"
