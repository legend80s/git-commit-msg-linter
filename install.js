/**
 * When installing, it will copy the executable file `{PROJECT}/.git/hooks/commit-msg` if it exists
 * to `{PROJECT}/.git/hooks/commit-msg.old`
 * then the `commit-msg` will be overwritten by our linting rules.
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const { bailOut } = require('./utils');
const {
  COMMIT_MSG_LABLE,
  PACKAGE_NAME_LABEL,
  COMMIT_MSG_HOOK_FILE,
  PACKAGE_NAME,
} = require('./constants');

const exists = fs.existsSync;

const projectRootList = [
  path.resolve(__dirname, '..', '..'),

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

// The `install` script in package.json wont be run by pnpm 😓 What a pity!
// so we had to use `postinstall` to do the install work
// https://github.com/legend80s/commit-msg-linter/issues/13
if (installedByInstallScriptInPackageJSON(commitMsgHookFile)) {
  console.info(`${PACKAGE_NAME_LABEL}: ${chalk.yellow('Skip install: installed by `install` script.')}`);
  bailOut();
}

// If we do have `.git` folder create a `hooks` folder under it if it doesn't exist.
if (!exists(hooks)) { fs.mkdirSync(hooks); }

// If there's an existing `commit-msg` hook file back it up instead of
// overwriting it and losing it completely as it might contain something important.
if (exists(commitMsgHookFile) && !fs.lstatSync(commitMsgHookFile).isSymbolicLink()) {
  console.log(`${PACKAGE_NAME_LABEL}:`);
  console.log(`${PACKAGE_NAME_LABEL}: An existing git ${COMMIT_MSG_LABLE} hook detected`);

  // Only backup when "commit-msg.old" not exists, otherwise the original content will be lost
  !exists(backup) && fs.writeFileSync(backup, fs.readFileSync(commitMsgHookFile));

  const old = chalk.bold(`${COMMIT_MSG_HOOK_FILE}.old`);
  console.log(`${PACKAGE_NAME_LABEL}: Old ${COMMIT_MSG_LABLE} hook backed up to ${old}`);
  console.log(`${PACKAGE_NAME_LABEL}:`);
}

const rules = fs.readFileSync(path.resolve(__dirname, './commit-msg.js'));

// It could be that we do not have rights to this folder which could cause the
// installation of this module to completely failure.
// We should just output the error instead breaking the whole npm install process.
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

console.info(chalk.green(`${PACKAGE_NAME_LABEL}: Installed successfully.`));

function installedByInstallScriptInPackageJSON(commitMsgFilepath) {
  // if it's been touched within 10s,
  // then it must be installed by `install` script in package.json
  // GAP is the time between `install` and `postinstall`.
  const GAP = 10 * 1000;

  try {
    return Date.now() - fs.lstatSync(commitMsgFilepath).mtimeMs <= GAP;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // DO NOTHING
      // Because it is normal when `.git/hooks/commit-msg` not exists.
    } else {
      console.error(`[${PACKAGE_NAME_LABEL}]:`, error);
    }

    return false;
  }
}

/**
 *
 * @param {string[]} projectDirectories
 * @returns {string}
 */
function guessGitDirectory(projectDirectories) {
  return projectDirectories
    .map((projectRoot) => path.resolve(projectRoot, '.git'))
    .find((gitDirectory) => exists(gitDirectory) && fs.lstatSync(gitDirectory).isDirectory());
}
