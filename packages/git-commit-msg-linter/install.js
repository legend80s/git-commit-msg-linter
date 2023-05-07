/**
 * When installing, it will copy the executable file `{PROJECT}/.git/hooks/commit-msg` if it exists
 * to `{PROJECT}/.git/hooks/commit-msg.old`
 * then the `commit-msg` will be overwritten by our linting rules.
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const linter = require('commit-msg-linter');

const pkg = require('./package.json');

const silent = process.argv.slice(2).some((arg) => arg.includes('--silent'));

function log(...args) {
  if (silent) {
    return;
  }

  console.info(...args);
}

const { bailOut } = require('./utils');
const {
  COMMIT_MSG_LABEL,
  PACKAGE_NAME_LABEL,
  COMMIT_MSG_HOOK_FILE,
  PACKAGE_NAME,
  PROJECT_ROOT,
} = require('./constants');

log('[git-commit-msg-linter]: Install starting...');

const exists = fs.existsSync;

const projectRootList = [
  process.cwd(),
  PROJECT_ROOT,

  // for pnpm: not a elegant solution 😓
  path.resolve(__dirname, '../../..'),
  path.resolve(__dirname, '../../../..'),
  path.resolve(__dirname, '../../../../..'),
];

const git = guessGitDirectory(projectRootList);

// Bail out if we don't have an `.git` folder as the hooks will not get triggered.
if (!git) {
  console.error(`${PACKAGE_NAME_LABEL}: ${chalk.red('.git folder not found in')}`);
  console.error(projectRootList);
  console.error(`${PACKAGE_NAME_LABEL}: ${chalk.red(`${PACKAGE_NAME} won't be installed`)}`);

  bailOut();
}

const hooks = path.resolve(git, 'hooks');
const commitMsgHookFile = path.resolve(hooks, COMMIT_MSG_HOOK_FILE);
const backup = `${commitMsgHookFile}.old`;

// If we do have `.git` folder create a `hooks` folder under it if it doesn't exist.
if (!exists(hooks)) { fs.mkdirSync(hooks); }

// If there's an existing `commit-msg` hook file back it up instead of
// overwriting it and losing it completely as it might contain something important.
if (exists(commitMsgHookFile) && !fs.lstatSync(commitMsgHookFile).isSymbolicLink()) {
  log(`${PACKAGE_NAME_LABEL}:`);
  log(`${PACKAGE_NAME_LABEL}: An existing git ${COMMIT_MSG_LABEL} hook detected`);

  // Only backup when "commit-msg.old" not exists, otherwise the original content will be lost.
  if (exists(backup) || isFileWeCreated(commitMsgHookFile)) {
    // NO NEED TO BACKUP
  } else {
    fs.writeFileSync(backup, fs.readFileSync(commitMsgHookFile));

    const old = chalk.bold(`${COMMIT_MSG_HOOK_FILE}.old`);
    log(`${PACKAGE_NAME_LABEL}: Old ${COMMIT_MSG_LABEL} hook backed up to ${old}`);
    log(`${PACKAGE_NAME_LABEL}:`);
  }
}

function getTag() {
  const time = new Date().toLocaleString();

  return `${pkg.name}@${pkg.version} ${time}`;
}

const rules = `
#!/bin/bash
# ${getTag()}
# id=commit-msg-linter - THE id COMMENT SHOULD NOT BE DELETED OR MODIFIED!
# It's used to check whether this commit-msg hook file is created by us,
# if it is then we can remove it confidently on uninstallation.

cat ${linter.getLinterPath()} | node --input-type=commonjs
`.trimStart();

// It could be that we do not have rights to this folder which could cause the
// installation of this module to completely failure.
// We should just output the error instead breaking the whole npm install process.
try { fs.writeFileSync(commitMsgHookFile, rules); } catch (e) {
  console.error(`${PACKAGE_NAME_LABEL}: ${chalk.red('Failed to create the hook file in your .git/hooks folder because:')}`);
  console.error(`${PACKAGE_NAME_LABEL}: ${chalk.red(e.message)}`);
  console.error(`${PACKAGE_NAME_LABEL}: ${chalk.red('The hook was not installed.')}`);
}

try { fs.chmodSync(commitMsgHookFile, '777'); } catch (e) {
  const alert = chalk.red(`chmod 0777 the ${COMMIT_MSG_LABEL} file in your .git/hooks folder because:`);

  console.error(`${PACKAGE_NAME_LABEL}:`);
  console.error(`${PACKAGE_NAME_LABEL}: ${alert}`);
  console.error(`${PACKAGE_NAME_LABEL}: ${chalk.red(e.message)}`);
  console.error(`${PACKAGE_NAME_LABEL}:`);
}

log(chalk.green(`[${PACKAGE_NAME}]: Installed successfully.`));

/**
 * @param {string[]} projectDirectories
 * @returns {string}
 */
function guessGitDirectory(projectDirectories) {
  return projectDirectories
    .map((projectRoot) => path.resolve(projectRoot, '.git'))
    .find((gitDirectory) => exists(gitDirectory) && fs.lstatSync(gitDirectory).isDirectory());
}

function isFileWeCreated(fp) {
  const content = fs.readFileSync(fp, 'utf-8');
  const ID = 'commit-msg-linter';

  return content.includes(ID);
}
