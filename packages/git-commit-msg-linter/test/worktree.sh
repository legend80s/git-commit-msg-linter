#!/usr/bin/env bash
#
# Regression test for reading the commit message inside a git worktree.
#
# In a worktree `.git` is a file pointing at the real git directory, so a
# hardcoded `.git/COMMIT_EDITMSG` raises ENOTDIR and every commit fails before
# the message is ever linted. The assertions below therefore check *why* a
# commit was rejected, not merely that it was: a test that only asserted a
# non-zero exit code would have passed against the broken linter, because the
# path error also aborts the commit.

set -uo pipefail

TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LINTER="$(cd "$TEST_DIR/../../commit-msg-linter" && pwd)/commit-msg-linter.js"

# Keep the developer's own git configuration out of the fixtures: a global
# core.hooksPath or commit template would otherwise decide the outcome.
export GIT_CONFIG_GLOBAL=/dev/null
export GIT_CONFIG_SYSTEM=/dev/null

TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

MAIN_CHECKOUT="$TMP_ROOT/main"
WORKTREE="$TMP_ROOT/worktree"

failures=0

fail() {
  echo "❌ $1"
  failures=$((failures + 1))
}

pass() {
  echo "✅ $1"
}

assert_contains() {
  local haystack="$1" needle="$2" what="$3"
  if [[ "$haystack" == *"$needle"* ]]; then
    pass "$what"
  else
    fail "$what -- expected to find '$needle' in:
$haystack"
  fi
}

assert_not_contains() {
  local haystack="$1" needle="$2" what="$3"
  if [[ "$haystack" == *"$needle"* ]]; then
    fail "$what -- did not expect '$needle' in:
$haystack"
  else
    pass "$what"
  fi
}

assert_status() {
  local actual="$1" expected="$2" what="$3"
  if [[ "$actual" == "$expected" ]]; then
    pass "$what"
  else
    fail "$what -- expected exit status $expected, got $actual"
  fi
}

install_hook() {
  # Mirrors the hook install.js writes: the script is piped in over stdin, so it
  # never receives git's commit message path as an argument.
  local hooks_dir="$1"
  printf '#!/usr/bin/env bash\ncat "%s" | node --input-type=commonjs\n' "$LINTER" > "$hooks_dir/commit-msg"
  chmod +x "$hooks_dir/commit-msg"
}

echo "test: linting inside a git worktree, linter=$LINTER"

git init -q -b master "$MAIN_CHECKOUT"
cd "$MAIN_CHECKOUT" || exit 1
git config user.name "commit-msg-linter test"
git config user.email "commit-msg-linter@example.com"
git config commit.gpgsign false

# Pin the language so the assertions do not depend on the host locale.
echo '{ "lang": "en-US" }' > commitlinterrc.json

install_hook "$MAIN_CHECKOUT/.git/hooks"

git add commitlinterrc.json
git commit -qm "test: seed the fixture repository"

git worktree add -q "$WORKTREE" -b worktree-branch
cd "$WORKTREE" || exit 1

# --- a bad message must be rejected by the linter, not by a path error --------
echo "worktree" > worktree.txt
git add worktree.txt

bad_output="$(git commit -m "bad" 2>&1)"
bad_status=$?

assert_status "$bad_status" 1 "worktree: bad message is rejected"
assert_not_contains "$bad_output" "ENOTDIR" "worktree: bad message fails no path error"
assert_contains "$bad_output" "Invalid Git Commit Message" "worktree: bad message reaches the linter"
assert_contains "$bad_output" "Invalid length" "worktree: linter read the message being committed"

# --- a good message must go through --------------------------------------------
good_output="$(git commit -m "test: commit from inside a worktree" 2>&1)"
good_status=$?

assert_status "$good_status" 0 "worktree: good message is accepted"
assert_not_contains "$good_output" "ENOTDIR" "worktree: good message hits no path error"
assert_contains "$(git log -1 --pretty=format:%s)" \
  "test: commit from inside a worktree" "worktree: commit was recorded"

# --- the main checkout must keep working --------------------------------------
cd "$MAIN_CHECKOUT" || exit 1
echo "main" > main.txt
git add main.txt

main_bad_output="$(git commit -m "bad" 2>&1)"
main_bad_status=$?

assert_status "$main_bad_status" 1 "main checkout: bad message is rejected"
assert_contains "$main_bad_output" "Invalid Git Commit Message" \
  "main checkout: bad message reaches the linter"

main_good_output="$(git commit -m "test: commit from the main checkout" 2>&1)"
main_good_status=$?

assert_status "$main_good_status" 0 "main checkout: good message is accepted"
assert_not_contains "$main_good_output" "ENOTDIR" "main checkout: no path error"

if [[ "$failures" -gt 0 ]]; then
  echo "❌ FAILED: $failures assertion(s)"
  exit 1
fi

echo "✅ SUCCESS"
