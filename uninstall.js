/**
 * On uninstalling, the `commit-msg` file will be restored and the `commit-msg.old` will be deleted.
 */

/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const { COMMIT_MSG, COMMIT_MSG_LINTER } = require('./constants');
const { bailOut } = require('./utils');

const exists = fs.existsSync || path.existsSync;
const root = path.resolve(__dirname, '..', '..');
const git = path.resolve(root, '.git');

// Location of hook file, if it exists
const commitMsgFile = path.resolve(git, 'hooks', COMMIT_MSG);

console.log('root:', root);
console.log('git:', git);
console.log('commitMsgFile:', commitMsgFile);
console.log('COMMIT_MSG:', COMMIT_MSG, 'COMMIT_MSG_LINTER:', COMMIT_MSG_LINTER);

// Bail out if we don't have pre-commit file, it might be removed manually.
if (!exists(commitMsgFile)) {
  console.error(`${COMMIT_MSG_LINTER}: Not found any ${COMMIT_MSG} hook`);
  bailOut();
}

// If we don't have an old file, we should just remove the pre-commit hook. But
if (!exists(`${commitMsgFile}.old`)) {
  fs.unlinkSync(commitMsgFile);
} else {
  // if we do have an old precommit file we want to restore that.
  fs.writeFileSync(commitMsgFile, fs.readFileSync(`${commitMsgFile}.old`));
  fs.chmodSync(commitMsgFile, '755');
  fs.unlinkSync(`${commitMsgFile}.old`);
}
