#!/bin/bash

cd ../commit-msg-linter-test
echo "test: here we are: $(pwd)."

# clean hooks before testing
# rm .git/hooks/commit-msg

# npm i ../git-commit-msg-linter --save-dev

# `install` not run when npm install a local directory,
# so we run it manually.
# node node_modules/git-commit-msg-linter/install.js

# echo $(date '+%F %T') >> README.md

# out=$(git commit -am "test" 2>&1)

# # echo out1=$out

# substr1='Invalid Git Commit Message'
# substr2='Invalid length: Length 4'

# if [[ "$out" == *"$substr1"* && "$out" == *"$substr2"* ]]; then
#   echo '✅ SUCESS'
#   exit 0
# else
#   echo '❌ FAILED'
#   exit 1
# fi
