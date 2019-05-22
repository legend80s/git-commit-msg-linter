#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const util = require('util');

const readFile = util.promisify(fs.readFile);

// Any line of the commit message cannot be longer than 100 characters!
// This allows the message to be easier to read on github as well as in various git tools.
const MAX_LENGTH = 100;
/* eslint-disable no-useless-escape */
const PATTERN = /^(?:fixup!\s*)?(\w*)(\(([\w\$\.\*/-]*)\))?\: (.*)$/;
/* eslint-enable no-useless-escape */
const IGNORED = /(^WIP:)|(^\d+\.\d+\.\d+)/;
const YELLOW = '\x1b[1;33m';
const GRAY = '\x1b[0;37m';
const RED = '\x1b[0;31m';
const GREEN = '\x1b[0;32m';
/** End Of Style, removes all attributes (formatting and colors) */
const EOS = '\x1b[0m';

const STEREOTYPES = {
  feat: 'a new feature',
  fix: 'a bug fix',
  docs: 'documentation only changes',
  style: 'changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)',
  refactor: 'a code change that neither fixes a bug nor adds a feature',
  test: 'adding missing tests or correcting existing ones',
  chore: 'changes to the build process or auxiliary tools and libraries such as documentation generation',

  // added
  perf: 'a code change that improves performance',
  ci: 'changes to your CI configuration files and scripts',
  temp: 'temporary commit that won\'t be included in your CHANGELOG',
};

const commitMsg = process.argv[2];
const commitlinterrc = path.resolve(__dirname, '..', '..', 'commitlinterrc.json');

// console.log(commitlinterrc);

main(commitMsg, commitlinterrc);

/**
 * main function
 *
 * @param {string} commitMsgFile
 * @param {string} commitlinterrcFile
 *
 * @returns {void}
 */
async function main(commitMsgFile, commitlinterrcFile) {
  const [commitMsgContent, config] = await Promise.all([
    readFile(commitMsgFile),
    readConfig(commitlinterrcFile),
  ]);
  const { types, 'max-len': maxLength, debug: verbose = false } = config;

  const msg = getFirstLine(commitMsgContent);
  const mergedTypes = merge(STEREOTYPES, types);
  const maxLen = typeof maxLength === 'number' ? maxLength : MAX_LENGTH;

  if (!validateMessage(msg, { mergedTypes, maxLen, verbose })) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

/**
 * @param {string} filename
 * @returns {Promise<Object>} return empty object when read file error or content invalid json
 */
async function readConfig(filename) {
  const packageName = `${YELLOW}git-commit-msg-linter`;
  let content = '{}';

  try {
    content = await readFile(filename);
  } catch (error) {
    if (error.code === 'ENOENT') {
      /** pass, as commitlinterrc are optional */
    } else {
      /** pass, commitlinterrc ignored when invalid */
      /** It must be a bug so output the error to the user */
      console.error(`${packageName}: ${RED}read commitlinterrc.json failed`, error);
    }
  }

  let config = {};

  try {
    config = JSON.parse(content);
  } catch (error) {
    /** pass, commitlinterrc ignored when invalid json */
    /** output the error to the user for self-checking */
    console.error(`${packageName}: ${RED}commitlinterrc.json ignored because of invalid json`);
  }

  return config;
}

function merge(stereotypes, configTypes) {
  return compact(Object.assign({}, stereotypes, configTypes), { strictFalse: true });
}

/**
 * Create a new Object with all falsey values removed.
 * The values false, null, 0, "", undefined, and NaN are falsey when `strictFalse` is false,
 * Otherwise when `strictFalse` is true the only falsey value is fasle.
 * @param {Object} obj
 * @param {boolean} options.strictFalse
 * @returns {Object}
 */
function compact(target, { strictFalse = false } = {}) {
  return Object.keys(target).reduce((acc, key) => {
    const shouldBeRemoved = strictFalse ? target[key] === false : !target[key];

    return shouldBeRemoved ? acc : { ...acc, [key]: target[key] };
  }, {});
}

function getFirstLine(buffer) {
  return buffer.toString().split('\n').shift();
}

/**
 * validate git message
 *
 * @param {string} message
 * @param {Object} options.mergedTypes 和 commitlinterrc merge 过的 types
 * @param {number} options.maxLen 提交信息最大长度
 * @param {boolean} options.verbose 是否打印 debug 信息
 * @returns {boolean}
 */
function validateMessage(message, { mergedTypes, maxLen, verbose }) {
  let isValid = true;
  let invalidLength = false;

  if (IGNORED.test(message)) {
    console.log('Commit message validation ignored.');
    return true;
  }

  verbose && debug(`commit message: |${message}|`);

  if (message.length > maxLen) {
    invalidLength = true;
    isValid = false;
  }

  // if (/[\u3220-\uFA29]+/.test(message)) {
  //   console.error(`${COLOR}commit text can not contain chinese characters`);
  //   isValid = false;
  // }

  const match = PATTERN.exec(message);

  if (!match) {
    displayError({ invalidLength, invalideFormat: true }, { mergedTypes, maxLen });
    return false;
  }

  const type = match[1];
  const scope = match[3];
  const subject = match[4];

  verbose && debug(`type: ${type}, scope: ${scope}, subject: ${subject}`);

  const types = Object.keys(mergedTypes);
  const invalideType = !types.includes(type);

  // scope can be optional, but not empty string
  // "test: hello" OK
  // "test(): hello" FAILED
  const invalidScope = typeof scope === 'string' && scope.trim() === '';

  // Don't capitalize first letter; No dot (.) at the end
  const invalidSubject = isUpperCase(subject[0]) || subject.endsWith('.');

  if (invalideType || invalidScope || invalidSubject) {
    displayError({ invalidLength, invalideType, invalidScope, invalidSubject }, { mergedTypes, maxLen });
    return false;
  }

  return isValid;
}

function displayError({
  invalidLength = false,
  invalideFormat = false,
  invalideType = false,
  invalidScope = false,
  invalidSubject = false,
} = {}, { mergedTypes, maxLen }) {
  const type = invalideType ? `${RED}<type>` : '<type>';
  const scope = invalidScope ? `${RED}(<scope>)` : `${invalideFormat ? RED : GREEN}(<scope>)`;
  const subject = invalidSubject ? `${RED}<subject>` : `${invalideFormat ? RED : GREEN}<subject>`;
  const typeDescriptions = describeTypes(mergedTypes);

  console.error(
    `
  ${invalideFormat ? RED : YELLOW}************* Invalid Git Commit Message **************${invalidLength ? `

  ${RED}Any line of the commit message cannot be longer ${maxLen} characters!` : ''}

  ${invalideFormat ? RED : GREEN}correct format: ${type}${scope}: ${subject}

  ${invalideType ? RED : YELLOW}type:
    ${typeDescriptions}

  ${YELLOW}scope:
    ${GRAY}Optional, can be anything specifying place of the commit change.
    For example $location, $browser, $compile, $rootScope, ngHref, ngClick, ngView, etc.
    In App Development, scope can be a page, a module or a component.${invalidScope ? `${RED}
    \`scope\` can be ${emphasis('optional')}${RED}, but its parenthesis if exists cannot be empty.` : ''}

  ${YELLOW}subject:
    ${GRAY}A very short description of the change in one line.${invalidSubject ? `${RED}
      - don't capitalize first letter
      - no dot (.) at the end` : ''}

  ${YELLOW}Example:
    ${GREEN}style($location): add couple of missing semi colons
  `
  );
}

/**
 * Put emphasis on an text
 * @param {string} text
 */
function emphasis(text) {
  const ITALIC = '\x1b[3m';
  const UNDERLINED = '\x1b[4m';

  return `${ITALIC}${UNDERLINED}${text}${EOS}`;
}

/**
 * isUpperCase
 * @param {string} letter
 */
function isUpperCase(letter) {
  return /^[A-Z]$/.test(letter);
}

/**
 * return a string of n spaces
 *
 * @param  {number}
 * @return {string}
 */
function nSpaces(n) {
  const space = ' ';

  return space.repeat(n);
}

/**
 * generate a type description
 *
 * @param {number} options.index type index
 * @param {string} options.type type name
 * @param {string} options.description type description
 * @param {number} options.maxTypeLength max type length
 *
 * @returns {string}
 */
function describe({ index, type, description, maxTypeLength }) {
  const paddingBefore = index === 0 ? '' : nSpaces(4);
  const marginRight = nSpaces(maxTypeLength - type.length + 1);

  return `${paddingBefore}${YELLOW}${type}${marginRight}${GRAY}${description}`;
}

/**
 * generate type descriptions
 *
 * @param {Object} mergedTypes
 * @returns {string} type descriptions
 */
function describeTypes(mergedTypes) {
  const types = Object.keys(mergedTypes);
  const maxTypeLength = [...types].sort((t1, t2) => t2.length - t1.length)[0].length;

  return types
    .map((type, index) => {
      const description = mergedTypes[type];

      return describe({ index, type, description, maxTypeLength });
    })
    .join('\n');
}

function debug(...args) {
  console.info(`${GREEN}[DEBUG]`, ...args, EOS);
}
