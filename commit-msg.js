#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const util = require('util');
const Matcher = require('did-you-mean');
const LANG = require('./lang');

const readFile = util.promisify(fs.readFile);

// Any line of the commit message cannot be longer than 100 characters!
// This allows the message to be easier to read on github as well as in various git tools.
// https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit
const MAX_LENGTH = 100;
const MIN_LENGTH = 10;

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

async function main() {
  if (process.argv.length < 3) {
    console.error('Please inform the commit message file as an argument (e.g. "commit-msg").');
    process.exit(1);
  }

  const commitMsgFilePath = process.argv[2];
  const commitlinterrcFilePath = path.resolve(__dirname, '..', '..', 'commitlinterrc.json');

  // console.log(commitlinterrc);

  try {
    const [commitMsgContent, config] = await Promise.all([
      readFile(commitMsgFilePath),
      readConfig(commitlinterrcFilePath),
    ]);

    const lang = getLanguage(config.lang);

    lint(commitMsgContent, config, lang);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();

/**
 * Returns the given language's data if the language exists.
 * Otherwise, returns the data for the English language.
 *
 * @param {string} lang Language
 * @returns
 */
function langData(lang) {
  return LANG[lang] ? LANG[lang] : LANG['en-US'];
}

/**
 * @param {string} commitMsgContent
 * @param {string} config
 *
 * @returns {void}
 */
async function lint(commitMsgContent, config, lang) {
  const DESCRIPTIONS = langData(lang).descriptions;

  const {
    example,
    scope,
    invalidScope,
    subject,
    invalidSubject,
  } = DESCRIPTIONS;

  const {
    types,
    'max-len': maxLength,
    'min-len': minLength,
    debug: verbose = false,
    showInvalidHeader = true,

    scopeDescriptions = scope,
    invalidScopeDescriptions = invalidScope,

    subjectDescriptions = subject,
    invalidSubjectDescriptions = invalidSubject,

    postSubjectDescriptions = [],
  } = config;

  verbose && debug('config:', config);

  const msg = getFirstLine(commitMsgContent).replace(/\s{2,}/g, ' ');
  const STEREOTYPES = langData(lang).stereotypes;
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
    postSubjectDescriptions,

    lang,
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
  return compact({ ...stereotypes, ...configTypes }, { strictFalse: true });
}

/**
 * Create a new Object with all falsy values removed.
 * The values false, null, 0, "", undefined, and NaN are falsy when `strictFalse` is false,
 * Otherwise when `strictFalse` is true the only falsy value is false.
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
    postSubjectDescriptions,
    invalidSubjectDescriptions,
    lang,
  },
) {
  let isValid = true;
  let invalidLength = false;

  if (IGNORED_PATTERNS.some((pattern) => pattern.test(message))) {
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

  const matches = resolvePatterns(message);

  if (!matches) {
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
        postSubjectDescriptions,
        invalidSubjectDescriptions,
        lang,
      },
    );

    return false;
  }

  const { type, scope, subject } = matches;

  verbose && debug(`type: ${type}, scope: ${scope}, subject: ${subject}`);

  const types = Object.keys(mergedTypes);
  const typeInvalid = !types.includes(type);

  // scope can be optional, but not empty string
  // "test: hello" OK
  // "test(): hello" FAILED
  const invalidScope = typeof scope === 'string' && scope.trim() === '';

  // Don't capitalize first letter; No dot (.) at the end
  const invalidSubject = isUpperCase(subject[0]) || subject.endsWith('.');

  if (invalidLength || typeInvalid || invalidScope || invalidSubject) {
    displayError(
      {
        invalidLength, type, typeInvalid, invalidScope, invalidSubject,
      },
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
        postSubjectDescriptions,
        invalidSubjectDescriptions,
        lang,
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
    type,
    typeInvalid = false,
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
    postSubjectDescriptions,
    invalidSubjectDescriptions,
    lang,
  },
) {
  const decoratedType = decorate('type', typeInvalid);
  const scope = decorate('scope', invalidScope, true);
  const subject = decorate('subject', invalidSubject);

  const types = Object.keys(mergedTypes);
  const suggestedType = suggestType(type, types);
  const typeDescriptions = describeTypes(mergedTypes, suggestedType);

  const invalid = invalidLength || invalidFormat || typeInvalid || invalidScope || invalidSubject;
  const translated = langData(lang).i18n;
  const { invalidHeader } = translated;
  const header = !showInvalidHeader
    ? ''
    : `\n  ${invalidFormat ? RED : YELLOW}************* ${invalidHeader} **************${EOS}`;

  const scopeDescription = scopeDescriptions.join('\n    ');
  const invalidScopeDescription = invalidScopeDescriptions.join('\n    ');
  const defaultInvalidScopeDescription = `scope can be ${emphasis('optional')}${RED}, but its parenthesis if exists cannot be empty.`;

  const subjectDescription = subjectDescriptions.join('\n    ');
  let postSubjectDescription = postSubjectDescriptions.join('\n    ');
  postSubjectDescription = postSubjectDescription ? `\n\n    ${italic(postSubjectDescription)}` : '';

  const invalidSubjectDescription = invalidSubjectDescriptions.join('\n    ');

  const { example: labelExample, correctFormat, commitMessage } = translated;

  const correctedExample = typeInvalid
    ? didYouMean(message, { example, types })
    : example;

  console.info(
    `${header}${invalid ? `
  ${label(`${commitMessage}:`)} ${RED}${message}${EOS}` : ''}${generateInvalidLengthTips(message, invalidLength, maxLen, minLen, lang)}
  ${label(`${correctFormat}:`)} ${GREEN}${decoratedType}${scope}: ${subject}${EOS}
  ${label(`${labelExample}:`)} ${GREEN}${correctedExample}${EOS}

  ${typeInvalid ? RED : YELLOW}type:
    ${typeDescriptions}

  ${invalidScope ? RED : YELLOW}scope:
    ${GRAY}${scopeDescription}${invalidScope ? `${RED}
    ${invalidScopeDescription || defaultInvalidScopeDescription}` : ''}

  ${invalidSubject ? RED : YELLOW}subject:
    ${GRAY}${subjectDescription}${postSubjectDescription}${invalidSubject ? `${RED}
    ${invalidSubjectDescription}` : ''}
  `,
  );
}

/**
 *
 * @param {string} example
 * @param {boolean} typeInvalid
 * @param mergedTypes
 *
 * @example
 * didYouMean('refact: abc', { types: ['refactor'], example: 'docs: xyz' })
 * => 'refactor: abc'
 *
 * didYouMean('abc', { types: ['refactor'], example: 'docs: xyz' })
 * => 'docs: xyz'
 */
function didYouMean(message, { types, example }) {
  const patterns = resolvePatterns(message);

  if (!patterns && !patterns.type) {
    return example;
  }

  const { type } = patterns;

  // Get the closest match
  const suggestedType = suggestType(type, types);

  if (!suggestedType) {
    return example;
  }

  const TYPE_REGEXP = /^\w+(\(\w*\))?:/;

  return message.replace(TYPE_REGEXP, (_, p1) => (p1 && p1 !== '()' ? `${suggestedType}${p1}:` : `${suggestedType}:`));
}

function suggestType(type = '', types) {
  const matcher = new Matcher(types);
  const match = matcher.get(type);

  if (match) { return match; }

  const suggestedType = types.find((t) => type.includes(t) || t.includes(type));

  return suggestedType || '';
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
 * // => "[scope]"
 *
 * @param {string} text
 * @param {boolean} optional
 *
 * @returns {string}
 */
function addPeripherals(text, optional = false) {
  if (optional) {
    return `[${text}]`;
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
function italic(text) {
  const ITALIC = '\x1b[3m';

  return `${ITALIC}${text}${EOS}`;
}

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
function describe({
  index, type, suggestedType, description, maxTypeLength,
}) {
  const paddingBefore = index === 0 ? '' : nSpaces(4);
  const marginRight = nSpaces(maxTypeLength - type.length + 1);
  const typeColor = suggestedType === type ? GREEN + BOLD : YELLOW;

  return `${paddingBefore}${typeColor}${type}${marginRight}${GRAY}${description}`;
}

/**
 * generate type descriptions
 *
 * @param {Object} mergedTypes
 * @returns {string} type descriptions
 */
function describeTypes(mergedTypes, suggestedType = '') {
  const types = Object.keys(mergedTypes);
  const maxTypeLength = [...types].sort((t1, t2) => t2.length - t1.length)[0].length;

  return types
    .map((type, index) => {
      const description = mergedTypes[type];

      return describe({
        index, type, suggestedType, description, maxTypeLength,
      });
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
 * @param {string} lang
 * @returns {string}
 */
function generateInvalidLengthTips(message, invalid, maxLen, minLen, lang) {
  if (invalid) {
    const max = `${BOLD}${maxLen}${EOS}${RED}`;
    const min = `${BOLD}${minLen}${EOS}${RED}`;
    const { i18n } = langData(lang);
    const tips = `${RED}${i18n.length} ${BOLD}${message.length}${EOS}${RED}. ${format(i18n.invalidLengthTip, max, min)}${EOS}`;
    return `\n  ${BOLD}${i18n.invalidLength}${EOS}: ${tips}`;
  }

  return '';
}

/**
 * Output debugging information.
 * @param  {any[]} args
 * @returns {void}
 */
function debug(...args) {
  console.info(`${GREEN}[DEBUG]`, ...args, EOS);
}

/**
 * @returns {string}
 */
function getLanguage(configLang) {
  return configLang
    || process.env.COMMIT_MSG_LINTER_LANG
    || Intl.DateTimeFormat().resolvedOptions().locale;
}

/**
 * Replaces numeric arguments inside curly brackets with their corresponding values.
 *
 * @example
 *  format( 'Good {1}, Mr {2}', 'morning', 'Bob' ) returns 'Good morning, Mr Bob'
 *
 * @param {string} text A text with arguments between curly brackets
 * @param  {any[]} args Values to replace the arguments
 * @returns
 */
function format(text, ...args) {
  return text.replace(/\{(\d+)\}/g, (_, i) => args[i - 1]);
}

function resolvePatterns(message) {
  /* eslint-disable no-useless-escape */
  const PATTERN = /^(?:fixup!\s*)?(\w*)(\(([\w\$\.\*/-]*)\))?\: (.*)$/;
  const matches = PATTERN.exec(message);

  if (matches) {
    const type = matches[1];
    const scope = matches[3];
    const subject = matches[4];

    return {
      type,
      scope,
      subject,
    };
  }

  return null;
}
