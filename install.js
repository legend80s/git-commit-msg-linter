/**
 * On installing, it will copy the `{PROJECT}/.git/hooks/commit-msg` executable file if exists
 * to `{PROJECT}/.git/hooks/commit-msg.old`
 * then the `commit-msg` will be overwrote by injecting the linting rules.
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { bailOut } = require('./utils');

const root = path.resolve(__dirname, '..', '..');
const git = path.resolve(root, '.git');

const exists = fs.existsSync;

const { COMMIT_MSG_LABLE, PACKAGE_NAME_LABEL, COMMIT_MSG_HOOK_FILE, PACKAGE_NAME } = require('./constants');

// Bail out if we don't have an `.git` directory as the hooks will not get triggered.
if (!exists(git) || !fs.lstatSync(git).isDirectory()) {
  console.error(`${PACKAGE_NAME_LABEL}: ${chalk.red('.git folder Not found')}`);
  console.error(`${PACKAGE_NAME_LABEL}: ${chalk.red(`${PACKAGE_NAME} won't be installed`)}`);

  bailOut();
}

const hooks = path.resolve(git, 'hooks');
const commitMsgHookFile = path.resolve(hooks, COMMIT_MSG_HOOK_FILE);

// If we do have directory create a hooks folder if it doesn't exist.
if (!exists(hooks)) { fs.mkdirSync(hooks); }

// If there's an existing `commit-msg` hook we want to back it up instead of
// overriding it and losing it completely as it might contain something
// important.
if (exists(commitMsgHookFile) && !fs.lstatSync(commitMsgHookFile).isSymbolicLink()) {
  console.log(`${PACKAGE_NAME_LABEL}:`);
  console.log(`${PACKAGE_NAME_LABEL}: An existing git ${COMMIT_MSG_LABLE} hook detected`);

  fs.writeFileSync(`${commitMsgHookFile}.old`, fs.readFileSync(commitMsgHookFile));

  const old = chalk.bold(`${COMMIT_MSG_HOOK_FILE}.old`);
  console.log(`${PACKAGE_NAME_LABEL}: Old ${COMMIT_MSG_LABLE} hook backuped to ${old}`);
  console.log(`${PACKAGE_NAME_LABEL}:`);
}

const rules = fs.readFileSync('./commit-msg.js');

// It could be that we do not have rights to this folder which could cause the
// installation of this module to completely fail. We should just output the
// error instead destroying the whole npm install process.
try { fs.writeFileSync(commitMsgHookFile, rules); } catch (e) {
  console.error(`${PACKAGE_NAME_LABEL}: ${chalk.red('Failed to create the hook file in your .git/hooks folder because:')}`);
  console.error(`${PACKAGE_NAME_LABEL}: ${chalk.red(e.message)}`);
  console.error(`${PACKAGE_NAME_LABEL}: ${chalk.red('The hook was not installed.')}`);
}

try { fs.chmodSync(commitMsgHookFile, '777'); } catch (e) {
  const alert = chalk.red(`chmod 0777 the ${COMMIT_MSG_LABLE} file in your .git/hooks folder because:`);

  console.error(`${PACKAGE_NAME_LABEL}:`);
  console.error(`${PACKAGE_NAME_LABEL}: ${alert}`);
  console.error(`${PACKAGE_NAME_LABEL}: ${chalk.red(e.message)}`);
  console.error(`${PACKAGE_NAME_LABEL}:`);
}
