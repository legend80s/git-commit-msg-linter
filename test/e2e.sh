#!/bin/bash

cd ../commit-msg-linter-test

rm .git/hooks/commit-msg

if [[ -d ../commit-msg-linter ]]; then
  npm i ../commit-msg-linter --save-dev
else
  npm i ../git-commit-msg-linter --save-dev
fi

echo $(date '+%F %T') >> README.md

out=$(git commit -am "test" 2>&1)

# echo out1=$out

substr1='Invalid Git Commit Message'
substr2='Invalid length: Length 4'

if [[ "$out" == *"$substr1"* && "$out" == *"$substr2"* ]]; then
  echo '✅ SUCESS'
  exit 0
else
  echo '❌ FAILED'
  exit 1
fi
