#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const util = require('util');

const readFile = util.promisify(fs.readFile);

// Any line of the commit message cannot be longer than 100 characters!
// This allows the message to be easier to read on github as well as in various git tools.
const MAX_LENGTH = 100;
const MIN_LENGTH = 10;
/* eslint-disable no-useless-escape */
const PATTERN = /^(?:fixup!\s*)?(\w*)(\(([\w\$\.\*/-]*)\))?\: (.*)$/;
/* eslint-enable no-useless-escape */
const IGNORED_PATTERNS = [
  /(^WIP:)|(^\d+\.\d+\.\d+)/,

  /^Publish$/,

  // ignore auto-generated commit msg
  /^((Merge pull request)|(Merge (.*?) into (.*?)|(Merge branch (.*?)))(?:\r?\n)*$)/m,
];
const YELLOW = '\x1b[1;33m';
const GRAY = '\x1b[0;37m';
const RED = '\x1b[0;31m';
const GREEN = '\x1b[0;32m';

/** End Of Style, removes all attributes (formatting and colors) */
const EOS = '\x1b[0m';
const BOLD = '\x1b[1m';

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

const DEFAULT_EXAMPLE = 'docs: update README';

const DEFAULT_SCOPE_DESCRIPTIONS = [
  'Optional, can be anything specifying the place of the commit change.',
  'For example $location, $browser, $compile, $rootScope, ngHref, ngClick, ngView, etc.',
  'In App Development, scope can be a page, a module or a component.',
];
const DEFAULT_INVALID_SCOPE_DESCRIPTIONS = [
  '`scope` can be optional, but its parenthesis if exists cannot be empty.',
];

const DEFAULT_SUBJECT_DESCRIPTIONS = [
  'A very short description of the change in one line.',
];
const DEFAULT_INVALID_SUBJECT_DESCRIPTIONS = [
  '- don\'t capitalize first letter',
  '- no dot "." at the end`',
];

const commitMsgFilePath = process.argv[2];
const commitlinterrc = path.resolve(__dirname, '..', '..', 'commitlinterrc.json');

// console.log(commitlinterrc);

main(commitMsgFilePath, commitlinterrc);

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
  const {
    types,
    'max-len': maxLength,
    'min-len': minLength,
    debug: verbose = false,
    showInvalidHeader = true,
    example = DEFAULT_EXAMPLE,

    scopeDescriptions = DEFAULT_SCOPE_DESCRIPTIONS,
    invalidScopeDescriptions = DEFAULT_INVALID_SCOPE_DESCRIPTIONS,

    subjectDescriptions = DEFAULT_SUBJECT_DESCRIPTIONS,
    invalidSubjectDescriptions = DEFAULT_INVALID_SUBJECT_DESCRIPTIONS,
  } = config;

  verbose && debug('config:', config);

  const msg = getFirstLine(commitMsgContent).replace(/\s{2,}/g, ' ');
  const mergedTypes = merge(STEREOTYPES, types);
  const maxLen = typeof maxLength === 'number' ? maxLength : MAX_LENGTH;
  const minLen = typeof minLength === 'number' ? minLength : MIN_LENGTH;

  if (!validateMessage(msg, {
    mergedTypes,
    maxLen,
    minLen,
    verbose,
    example,
    showInvalidHeader,
    scopeDescriptions,
    invalidScopeDescriptions,
    subjectDescriptions,
    invalidSubjectDescriptions,
  })) {
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
function validateMessage(
  message,
  {
    mergedTypes,
    maxLen,
    minLen,
    verbose,
    example,
    showInvalidHeader,
    scopeDescriptions,
    invalidScopeDescriptions,
    subjectDescriptions,
    invalidSubjectDescriptions,
  },
) {
  let isValid = true;
  let invalidLength = false;

  if (IGNORED_PATTERNS.some(pattern => pattern.test(message))) {
    console.log('Commit message validation ignored.');
    return true;
  }

  verbose && debug(`commit message: |${message}|`);

  if (message.length > maxLen || message.length < minLen) {
    invalidLength = true;
    isValid = false;
  }

  // if (/[\u3220-\uFA29]+/.test(message)) {
  //   console.error(`${COLOR}commit text can not contain chinese characters`);
  //   isValid = false;
  // }

  const match = PATTERN.exec(message);

  if (!match) {
    displayError(
      { invalidLength, invalidFormat: true },
      {
        mergedTypes,
        maxLen,
        minLen,
        message,
        example,
        showInvalidHeader,
        scopeDescriptions,
        invalidScopeDescriptions,
        subjectDescriptions,
        invalidSubjectDescriptions,
      },
    );

    return false;
  }

  const type = match[1];
  const scope = match[3];
  const subject = match[4];

  verbose && debug(`type: ${type}, scope: ${scope}, subject: ${subject}`);

  const types = Object.keys(mergedTypes);
  const invalidType = !types.includes(type);

  // scope can be optional, but not empty string
  // "test: hello" OK
  // "test(): hello" FAILED
  const invalidScope = typeof scope === 'string' && scope.trim() === '';

  // Don't capitalize first letter; No dot (.) at the end
  const invalidSubject = isUpperCase(subject[0]) || subject.endsWith('.');

  if (invalidLength || invalidType || invalidScope || invalidSubject) {
    displayError(
      { invalidLength, invalidType, invalidScope, invalidSubject },
      {
        mergedTypes,
        maxLen,
        minLen,
        message,
        example,
        showInvalidHeader,
        scopeDescriptions,
        invalidScopeDescriptions,
        subjectDescriptions,
        invalidSubjectDescriptions,
      },
    );

    return false;
  }

  return isValid;
}

function displayError(
  {
    invalidLength = false,
    invalidFormat = false,
    invalidType = false,
    invalidScope = false,
    invalidSubject = false,
  } = {},
  {
    mergedTypes,
    maxLen,
    minLen,
    message,
    example,
    showInvalidHeader,
    scopeDescriptions,
    invalidScopeDescriptions,
    subjectDescriptions,
    invalidSubjectDescriptions,
  },
) {
  const type = decorate('type', invalidType);
  const scope = decorate('scope', invalidScope, true);
  const subject = decorate('subject', invalidSubject);
  const typeDescriptions = describeTypes(mergedTypes);

  const invalid = invalidLength || invalidFormat || invalidType || invalidScope || invalidSubject;

  const header = !showInvalidHeader ?
    '' :
    `\n  ${invalidFormat ? RED : YELLOW}************* Invalid Git Commit Message **************${EOS}`;

  const scopeDescription = scopeDescriptions.join('\n    ');
  const invalidScopeDescription = invalidScopeDescriptions.join('\n    ');
  const defaultInvalidScopeDescription = `scope can be ${emphasis('optional')}${RED}, but its parenthesis if exists cannot be empty.`;

  const subjectDescription = subjectDescriptions.join('\n    ');
  const invalidSubjectDescription = invalidSubjectDescriptions.join('\n    ');

  console.info(
    `${header}${invalid ? `
  ${label('commit message:')} ${RED}${message}${EOS}` : ''}${generateInvalidLengthTips(message, invalidLength, maxLen, minLen)}
  ${label('correct format:')} ${GREEN}${type}${scope}: ${subject}${EOS}
  ${label('example:')}        ${GREEN}${example}${EOS}

  ${invalidType ? RED : YELLOW}type:
    ${typeDescriptions}

  ${invalidScope ? RED : YELLOW}scope:
    ${GRAY}${scopeDescription}${invalidScope ? `${RED}

    ${invalidScopeDescription || defaultInvalidScopeDescription}` : ''}

  ${invalidSubject ? RED : YELLOW}subject:
    ${GRAY}${subjectDescription}${invalidSubject ? `${RED}
    \n    ${invalidSubjectDescription}` : ''}
  `,
  );
}

/**
 * Decorate the part of pattern.
 *
 * @param {string} text Text to decorate
 * @param {boolean} invalid Whether the part is invalid
 * @param {boolean} optional For example `scope` is optional
 *
 * @returns {string}
 */
function decorate(text, invalid, optional = false) {
  if (invalid) {
    return `${RED}${addPeripherals(underline(text) + RED, optional)}`;
  }

  return `${GREEN}${addPeripherals(text, optional)}`;
}

/**
 * Add peripherals.
 *
 * @example
 * addPeripherals('type')
 * // => "<type>"
 * addPeripherals('scope', true)
 * // => "(<scope>)"
 *
 * @param {string} text
 * @param {boolean} optional
 *
 * @returns {string}
 */
function addPeripherals(text, optional = false) {
  if (optional) {
    return `(<${text}>)`;
  }

  return `<${text}>`;
}

/**
 * Put emphasis on text.
 * @param {string} text
 * @returns {string}
 */
function emphasis(text) {
  const ITALIC = '\x1b[3m';
  const UNDERLINED = '\x1b[4m';

  return `${ITALIC}${UNDERLINED}${text}${EOS}`;
}

/**
 * Make text italic.
 * @param {string} text
 * @returns {string}
 */
// function italic(text) {
//   const ITALIC = '\x1b[3m';

//   return `${ITALIC}${text}${EOS}`;
// }

/**
 * Make text underlined.
 * @param {string} text
 * @returns {string}
 */
function underline(text) {
  const UNDERLINED = '\x1b[4m';

  return `${UNDERLINED}${text}${EOS}`;
}

/**
 * Make text displayed with error style.
 * @param {string} text
 * @returns {string}
 */
// function red(text) {
//   return `${RED}${text}${EOS}`;
// }

/**
 * isUpperCase
 * @param {string} letter
 * @returns {boolean}
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

/**
 * Style text like a label.
 * @param {string} text
 * @returns {string}
 */
function label(text) {
  return `${BOLD}${text}${EOS}`;
}

/**
 * Generate invalid length tips.
 *
 * @param {string} message commit message
 * @param {boolean} invalid
 * @param {number} maxLen
 * @param {number} minLen
 * @returns {string}
 */
function generateInvalidLengthTips(message, invalid, maxLen, minLen) {
  if (invalid) {
    const { length } = message;
    const maxStyle = length > maxLen ? BOLD : '';
    const minStyle = length < minLen ? BOLD : '';

    const tips =
      `${RED}${BOLD}${length}${EOS}. ${RED}Commit message cannot be longer ${maxStyle}${maxLen}${EOS} ${RED}characters or shorter than ${minStyle}${minLen}${EOS} ${RED}characters!${EOS}`;

    return `\n  ${BOLD}Invalid length${EOS}: ${tips}`;
  }

  return '';
}

/**
 * Output debugging information.
 * @param  {...any} args
 * @returns {void}
 */
function debug(...args) {
  console.info(`${GREEN}[DEBUG]`, ...args, EOS);
}
