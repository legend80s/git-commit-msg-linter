/**
 * On installing, it will copy the `{PROJECT}/.git/hooks/commit-msg` executable file if exists
 * to `{PROJECT}/.git/hooks/commit-msg.old`
 * then the `commit-msg` will be overwrote by injecting the linting rules.
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { bailOut } = require('./utils');

console.log('__dirname:', __dirname);

bailOut();

const root = path.resolve(__dirname, '..', '..');
const git = path.resolve(root, '.git');

const exists = fs.existsSync;

const { COMMIT_MSG, COMMIT_MSG_LINTER } = require('./constants');

// Gather the location of the possible hidden .git directory,
// the hooks directory which contains all git hooks and the absolute location of the
// `commit-msg` file. The path needs to be absolute in order for the symlinking to work correctly.
// const git = getGitFolderPath(root);

console.log('root:', root);
console.log('git:', git);
console.log('COMMIT_MSG:', COMMIT_MSG, 'COMMIT_MSG_LINTER:', COMMIT_MSG_LINTER);

// Bail out if we don't have an `.git` directory as the hooks will not get triggered.
if (!git) {
  console.error(`${COMMIT_MSG_LINTER}: Not found any .git folder for installing ${COMMIT_MSG} hook`);
  console.error(`${COMMIT_MSG_LINTER}: Not installed successfully`);

  bailOut();
}

const hooks = path.resolve(git, 'hooks');
const commitMsgHookFile = path.resolve(hooks, COMMIT_MSG);

console.log('hooks:', hooks);
console.log('commitMsgHookFile:', commitMsgHookFile);

// If we do have directory create a hooks folder if it doesn't exist.
if (!exists(hooks)) { fs.mkdirSync(hooks); }

// If there's an existing `commit-msg` hook we want to back it up instead of
// overriding it and losing it completely as it might contain something
// important.
if (exists(commitMsgHookFile) && !fs.lstatSync(commitMsgHookFile).isSymbolicLink()) {
  console.log(`${COMMIT_MSG_LINTER}:`);
  console.log(`${COMMIT_MSG_LINTER}: Detected an existing git ${COMMIT_MSG} hook`);

  fs.writeFileSync(`${commitMsgHookFile}.old`, fs.readFileSync(commitMsgHookFile));

  console.log(`${COMMIT_MSG_LINTER}: Old ${COMMIT_MSG} hook backuped to ${COMMIT_MSG}.old`);
  console.log(`${COMMIT_MSG_LINTER}:`);
}

// We cannot create a symlink over an existing file so make sure it's gone and
// finish the installation process.
try {
  fs.unlinkSync(commitMsgHookFile);
} catch (error) {
  console.error(`unlinkSync ${commitMsgHookFile} error:`, error);
}

const rules = fs.readFileSync('./commit-msg');

console.log('rules:', rules);

// It could be that we do not have rights to this folder which could cause the
// installation of this module to completely fail. We should just output the
// error instead destroying the whole npm install process.
try { fs.writeFileSync(commitMsgHookFile, rules); } catch (e) {
  console.error(`${COMMIT_MSG_LINTER}:`);
  console.error(`${COMMIT_MSG_LINTER}: Failed to create the hook file in your .git/hooks folder because:`);
  console.error(`${COMMIT_MSG_LINTER}: ${e.message}`);
  console.error(`${COMMIT_MSG_LINTER}: The hook was not installed.`);
  console.error(`${COMMIT_MSG_LINTER}:`);
}

try { fs.chmodSync(commitMsgHookFile, '777'); } catch (e) {
  console.error(`${COMMIT_MSG_LINTER}:`);
  console.error(`${COMMIT_MSG_LINTER}: chmod 0777 the ${COMMIT_MSG} file in your .git/hooks folder because:`);
  console.error(`${COMMIT_MSG_LINTER}: ${e.message}`);
  console.error(`${COMMIT_MSG_LINTER}:`);
}
