#!/usr/bin/env bash
#
# Regression test for installing the hook from inside a git worktree.
#
# `guessGitDirectory` only accepts a `.git` *directory*, so running the install
# script from a worktree used to bail out with ".git folder not found" and leave
# the repository without a commit-msg hook. The hook belongs in the common git
# directory, which every worktree of the repository shares.
#
# Skipped when chalk cannot be resolved, because install.js requires it and this
# repository's dependencies are installed by pnpm rather than by the test.

set -uo pipefail

TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(cd "$TEST_DIR/.." && pwd)"
NESTED_PACKAGE_DIR="$(cd "$TEST_DIR/../../commit-msg-linter" && pwd)"

CHALK_DIR="$(cd "$PACKAGE_DIR" && node -e \
  'try { console.log(require("path").dirname(require.resolve("chalk/package.json"))) } catch (error) { }' \
  2>/dev/null)"

if [[ -z "$CHALK_DIR" ]]; then
  echo "⏭️  SKIPPED: chalk not resolvable, run the workspace install first"
  exit 0
fi

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

echo "test: installing the hook from inside a git worktree"

git init -q -b master "$MAIN_CHECKOUT"
cd "$MAIN_CHECKOUT" || exit 1
git config user.name "commit-msg-linter test"
git config user.email "commit-msg-linter@example.com"
git config commit.gpgsign false

echo "seed" > seed.txt
git add seed.txt
git -c core.hooksPath=/dev/null commit -qm "test: seed the fixture repository"

git worktree add -q "$WORKTREE" -b worktree-branch
cd "$WORKTREE" || exit 1

# Dependencies live in the worktree, the way `npm ci` inside one would leave them.
# Copied rather than symlinked: node resolves a symlinked module to its real
# path, which would send `require('commit-msg-linter')` looking for the sibling
# package next to the source tree instead of inside this fixture. chalk stays a
# symlink on purpose so it keeps finding its own dependencies.
mkdir -p node_modules
cp -R "$PACKAGE_DIR" node_modules/git-commit-msg-linter
cp -R "$NESTED_PACKAGE_DIR" node_modules/commit-msg-linter
rm -rf node_modules/git-commit-msg-linter/test
ln -s "$CHALK_DIR" node_modules/chalk

# The hook must not exist yet, otherwise the assertion below proves nothing.
rm -f "$MAIN_CHECKOUT/.git/hooks/commit-msg"

install_output="$(node node_modules/git-commit-msg-linter/install.js 2>&1)"

if [[ "$install_output" == *".git folder not found"* ]]; then
  fail "install from a worktree does not bail out -- output:
$install_output"
else
  echo "✅ install from a worktree does not bail out"
fi

hook_path="$MAIN_CHECKOUT/.git/hooks/commit-msg"
if [[ -f "$hook_path" ]]; then
  echo "✅ hook written to the shared git directory"
else
  fail "hook written to the shared git directory -- $hook_path missing, output:
$install_output"
fi

if [[ -f "$hook_path" ]] && grep -q "commit-msg-linter" "$hook_path"; then
  echo "✅ installed hook invokes the linter"
else
  fail "installed hook invokes the linter"
fi

if [[ "$failures" -gt 0 ]]; then
  echo "❌ FAILED: $failures assertion(s)"
  exit 1
fi

echo "✅ SUCCESS"
