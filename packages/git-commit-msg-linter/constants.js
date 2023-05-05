const chalk = require('chalk');
const path = require('path');
const json = require('./package.json');

const PACKAGE_NAME = json.name;
const COMMIT_MSG_HOOK_FILE = 'commit-msg';

exports.PACKAGE_NAME = PACKAGE_NAME;
exports.COMMIT_MSG_HOOK_FILE = COMMIT_MSG_HOOK_FILE;

exports.PACKAGE_NAME_LABEL = `[${chalk.yellow(PACKAGE_NAME)}]`;
exports.COMMIT_MSG_LABEL = chalk.bold(COMMIT_MSG_HOOK_FILE);

exports.PROJECT_ROOT = path.resolve(__dirname, '..', '..');
