const path = require('path')

function getLinterPath() {
  // fix https://github.com/legend80s/git-commit-msg-linter/issues/38
  return path.resolve(__dirname, 'commit-msg-linter.js').replace(/\\/g, '/');
}

exports.getLinterPath = getLinterPath