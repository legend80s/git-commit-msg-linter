#!/bin/bash
#
# Solve the problem of [Wishlist: support for ES6 modules. #14].
# https://github.com/legend80s/commit-msg-linter/issues/14

# This shell script template is from: https://google.github.io/styleguide/shellguide.html

# $0: .git/hooks/commit-msg, $1: .git/COMMIT_EDITMSG, $2: , $3:
# node '.git/hooks/commit-msg-linter.js' $1

# id=commit-msg-linter - The comment SHOULD NOT BE DELETED.

# https://nodejs.org/api/packages.html#--input-type-flag
cat .git/hooks/commit-msg-linter.js | node --input-type=commonjs
