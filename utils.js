/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const { COMMIT_MSG_LINTER } = require('./constants');

const exists = fs.existsSync;

/**
 * recursively finding .git folder
 *
 * @param  {string} currentPath
 * @return {string|null} return null when no .git folder found
 */
module.exports.getGitFolderPath = function getGitFolderPath(currentPath) {
  const folder = path.resolve(currentPath, '.git');

  if (!exists(folder) || !fs.lstatSync(folder).isDirectory()) {
    console.log(`${COMMIT_MSG_LINTER}:`);
    console.log(`${COMMIT_MSG_LINTER}: Not found .git folder in`, folder);

    const newPath = path.resolve(currentPath, '..');

    // Stop if we on top folder
    if (currentPath === newPath) {
      return null;
    }

    return getGitFolderPath(newPath);
  }

  console.log(`${COMMIT_MSG_LINTER}:`);
  console.log(`${COMMIT_MSG_LINTER}: Found .git folder in`, folder);

  return folder;
};

/**
 * exit current process with success code 0
 * instead destroying the whole npm install process.
 */
module.exports.bailOut = function bailOut() {
  process.exit(0);
};
