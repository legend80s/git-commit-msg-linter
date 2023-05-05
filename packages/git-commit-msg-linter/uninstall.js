/**
 * When uninstalling, the `commit-msg` file will be restored
 * and the `commit-msg.old` will be removed.
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const { bailOut } = require('./utils');
const {
  COMMIT_MSG_HOOK_FILE,
  PACKAGE_NAME_LABEL,
  COMMIT_MSG_LABEL,
  PROJECT_ROOT,
} = require('./constants');

const exists = fs.existsSync || path.existsSync;
const git = path.resolve(PROJECT_ROOT, '.git');

// Location of hook file, if it exists
const commitMsgFile = path.resolve(git, 'hooks', COMMIT_MSG_HOOK_FILE);

// Bail out if we don't have commit-msg file, it might be removed manually.
if (!exists(commitMsgFile)) {
  console.info(
    `${PACKAGE_NAME_LABEL}: Not found any ${COMMIT_MSG_LABEL} hook, no need to clean the battle field`,
  );

  bailOut();
}

// If we don't have an old commit-msg file, we should just remove the commit-msg hook.
if (!exists(`${commitMsgFile}.old`)) {
  // only remove what we created
  isFileWeCreated(commitMsgFile) && fs.unlinkSync(commitMsgFile);
} else {
  // But if we do have an old one it must restored. *DON'T BE EVIL*.
  fs.copyFileSync(`${commitMsgFile}.old`, commitMsgFile);

  fs.chmodSync(commitMsgFile, '755');
  fs.unlinkSync(`${commitMsgFile}.old`);
}

function isFileWeCreated(fp) {
  const commitMsgFileContent = fs.readFileSync(fp, 'utf-8');
  const ID = 'commit-msg-linter';

  return commitMsgFileContent.includes(ID);
}
