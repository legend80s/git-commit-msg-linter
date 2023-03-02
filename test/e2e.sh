#!/bin/bash

cd ../commit-msg-linter-test

if [[ -d ../commit-msg-linter ]]; then
  npm i ../commit-msg-linter --save-dev
else
  npm i ../git-commit-msg-linter --save-dev
fi

echo 1 >> README.md

out=$(git commit -am "test" 2>&1)

# echo out1=$out

substr1='Invalid Git Commit Message'
substr2='Invalid length: Length 4'

if [[ "$out" == *"$substr1"* && "$out" == *"$substr2"* ]]; then
  echo sucess
  exit 0
else
  echo failed
  exit 1
fi
