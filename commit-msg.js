#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const util = require('util');
const Matcher = require('did-you-mean');

const readFile = util.promisify(fs.readFile);

const LANG = {
  EN_US: 'en-US',
  ZH_CN: 'zh-CN',
}

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
  const commitMsgFilePath = process.argv[2];
  const commitlinterrcFilePath = path.resolve(__dirname, '..', '..', 'commitlinterrc.json');

  // console.log(commitlinterrc);

  const [commitMsgContent, config] = await Promise.all([
    readFile(commitMsgFilePath),
    readConfig(commitlinterrcFilePath),
  ]);

  const lang = getLanguage(config.lang);

  lint(commitMsgContent, config, lang);
}

main();

/**
 * @param {string} commitMsgContent
 * @param {string} config
 *
 * @returns {void}
 */
async function lint(commitMsgContent, config, lang) {
  const {
    commitMsgExample,
    defaultScopeDescriptions,
    defaultInvalidScopeDescriptions,
    defaultSubjectDescriptions,
    defaultInvalidSubjectDescriptions,
  } = resolveDefaultDescriptions(lang);

  const {
    types,
    'max-len': maxLength,
    'min-len': minLength,
    debug: verbose = false,
    showInvalidHeader = true,
    example = commitMsgExample,

    scopeDescriptions = defaultScopeDescriptions,
    invalidScopeDescriptions = defaultInvalidScopeDescriptions,

    subjectDescriptions = defaultSubjectDescriptions,
    invalidSubjectDescriptions = defaultInvalidSubjectDescriptions,

    postSubjectDescriptions = [],
  } = config;

  verbose && debug('config:', config);

  const msg = getFirstLine(commitMsgContent).replace(/\s{2,}/g, ' ');
  const STEREOTYPES = resolveStereotypes(lang);
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
  return compact(Object.assign({}, stereotypes, configTypes), { strictFalse: true });
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
      { invalidLength, type, typeInvalid, invalidScope, invalidSubject },
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
  const invalidHeader = resolveHeader(lang);
  const header = !showInvalidHeader ?
    '' :
    `\n  ${invalidFormat ? RED : YELLOW}************* ${invalidHeader} **************${EOS}`;

  const scopeDescription = scopeDescriptions.join('\n    ');
  const invalidScopeDescription = invalidScopeDescriptions.join('\n    ');
  const defaultInvalidScopeDescription = `scope can be ${emphasis('optional')}${RED}, but its parenthesis if exists cannot be empty.`;

  const subjectDescription = subjectDescriptions.join('\n    ');
  let postSubjectDescription = postSubjectDescriptions.join('\n    ');
  postSubjectDescription = postSubjectDescription ? `\n\n    ${italic(postSubjectDescription)}` : '';

  const invalidSubjectDescription = invalidSubjectDescriptions.join('\n    ');
  const translated = i18n(lang);
  const { example: labelExample, correctFormat, commitMessage } = translated;

  const correctedExample = typeInvalid ?
    didYouMean(message, { example, types }) :
    example;

  console.info(
    `${header}${invalid ? `
  ${label(`${commitMessage}:`)} ${RED}${message}${EOS}` : ''}${generateInvalidLengthTips(message, invalidLength, maxLen, minLen, translated, lang)}
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

  return message.replace(TYPE_REGEXP, (_, p1) => {
    return p1 && p1 !== '()' ? `${suggestedType}${p1}:` : `${suggestedType}:`;
  })
}

function suggestType(type = '', types) {
  const matcher = new Matcher(types);
  const match = matcher.get(type);

  if (match) { return match; }

  const suggestedType = types.find(t => type.includes(t) || t.includes(type));

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
function describe({ index, type, suggestedType, description, maxTypeLength }) {
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

      return describe({ index, type, suggestedType, description, maxTypeLength });
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
function generateInvalidLengthTips(message, invalid, maxLen, minLen, translated, lang) {
  if (invalid) {
    const { length } = message;
    const maxStyle = length > maxLen ? BOLD : '';
    const minStyle = length < minLen ? BOLD : '';
    const isCHN = lang === LANG.ZH_CN;

    const tips =
      `${RED}${isCHN ? '长度' : 'Length'} ${BOLD}${length}${EOS}. ${RED}${isCHN ? '提交信息长度不能大于' : 'Commit message cannot be longer than'} ${maxStyle}${maxLen}${EOS} ${RED}${isCHN ? '或小于' : 'characters or shorter than'} ${minStyle}${minLen}${EOS}${RED}${isCHN ? '' : ' characters'}${EOS}`;

    return `\n  ${BOLD}${translated.invalidLength}${EOS}: ${tips}`;
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
 * @returns 'en-US' or 'zh-CN'
 */
function getLanguage(configLang) {
  // return LANG.ZH_CN;

  return configLang ||
    process.env.COMMIT_MSG_LINTER_LANG ||
    Intl.DateTimeFormat().resolvedOptions().locale
  ;
}

/**
 * @param {string} lang
 */
function resolveStereotypes(lang) {
  // todo: extract to config.js
  const STEREOTYPES_ZH_CN = {
    feat: '产品新功能：通常是能够让用户觉察到的变化，小到文案或样式修改',
    fix: '修复 bug',
    docs: '更新文档或注释',
    style: '代码格式调整，对逻辑无影响：比如为按照 eslint 或团队风格修改代码格式。注意不是 UI 变更',
    refactor: '重构：不影响现有功能或添加功能。比如文件、变量重命名，代码抽象为函数，消除魔法数字等',
    test: '单测相关变更',
    chore: '杂项：其他无法归类的变更，比如代码合并',

    // added
    perf: '性能提升变更',
    ci: '持续集成相关变更',
    build: '代码构建相关变更：比如修复部署时的构建问题、构建脚本 webpack 或 gulp 相关变更',
    temp: '临时代码：不计入 CHANGELOG，比如必须部署到某种环境才能测试的变更',
  }

  const STEREOTYPES_EN_US = {
    feat: 'A new feature.',
    fix: 'A bug fix.',
    docs: 'Documentation only changes.',
    style: 'Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc).',
    refactor: 'A code change that neither fixes a bug nor adds a feature.',
    test: 'Adding missing tests or correcting existing ones.',
    chore: 'Changes to the build process or auxiliary tools and libraries such as documentation generation.',

    // added
    perf: 'A code change that improves performance.',
    ci: 'Changes to your CI configuration files and scripts.',
    build: 'Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm).',
    temp: 'Temporary commit that won\'t be included in your CHANGELOG.',
  };

  /** @type {typeof STEREOTYPES_EN_US} */
  let stereotype;

  switch (lang) {
    case LANG.ZH_CN:
      stereotype = STEREOTYPES_ZH_CN;
      break;

    default:
      stereotype = STEREOTYPES_EN_US;
      break;
  }

  return stereotype;
}

/**
 * @param lang {string}
 */
function resolveDefaultDescriptions(lang) {
  const DEFAULT_EXAMPLE_EN_US = 'docs: update README to add developer tips';
  const DEFAULT_EXAMPLE_ZH_CN = 'docs: 更新 README 添加开发者部分';

  const DEFAULT_SCOPE_DESCRIPTIONS_EN_US = [
    'Optional, can be anything specifying the scope of the commit change.',
    'For example $location, $browser, $compile, $rootScope, ngHref, ngClick, ngView, etc.',
    'In App Development, scope can be a page, a module or a component.',
  ];
  const DEFAULT_SCOPE_DESCRIPTIONS_ZH_CN = [
    '可选。变更范围（细粒度要合适，并在一个项目中保持一致）：比如页面名、模块名、或组件名',
  ];

  const DEFAULT_INVALID_SCOPE_DESCRIPTIONS_EN_US = [
    '`scope` can be optional, but its parenthesis if exists cannot be empty.',
  ];
  const DEFAULT_INVALID_SCOPE_DESCRIPTIONS_ZH_CN = [
    '`scope` 可选，若有则必须加小括号',
  ];

  const DEFAULT_SUBJECT_DESCRIPTIONS_EN_US = [
    'Brief summary of the change in present tense. Not capitalized. No period at the end.',
  ];
  const DEFAULT_SUBJECT_DESCRIPTIONS_ZH_CN = [
    '此次变更的简短描述，必须采用现在时态，如果是英语则首字母不能大写，句尾不加句号',
  ];

  const DEFAULT_INVALID_SUBJECT_DESCRIPTIONS_EN_US = [
    '- don\'t capitalize first letter',
    '- no dot "." at the end`',
  ];
  const DEFAULT_INVALID_SUBJECT_DESCRIPTIONS_ZH_CN = [
    '首字母不能大写',
    '句尾不加句号',
  ];

  let descriptions = {
    commitMsgExample: DEFAULT_EXAMPLE_EN_US,

    defaultScopeDescriptions: DEFAULT_SCOPE_DESCRIPTIONS_EN_US,
    defaultInvalidScopeDescriptions: DEFAULT_INVALID_SCOPE_DESCRIPTIONS_EN_US,

    defaultSubjectDescriptions: DEFAULT_SUBJECT_DESCRIPTIONS_EN_US,
    defaultInvalidSubjectDescriptions: DEFAULT_INVALID_SUBJECT_DESCRIPTIONS_EN_US,
  };

  switch (lang) {
    case LANG.ZH_CN:
      descriptions.commitMsgExample = DEFAULT_EXAMPLE_ZH_CN;

      descriptions.defaultScopeDescriptions = DEFAULT_SCOPE_DESCRIPTIONS_ZH_CN;
      descriptions.defaultInvalidScopeDescriptions = DEFAULT_INVALID_SCOPE_DESCRIPTIONS_ZH_CN;

      descriptions.defaultSubjectDescriptions = DEFAULT_SUBJECT_DESCRIPTIONS_ZH_CN;
      descriptions.defaultInvalidSubjectDescriptions = DEFAULT_INVALID_SUBJECT_DESCRIPTIONS_ZH_CN;
      break;

    default:
      break;
  }

  return descriptions;
}

/**
 * @param {string} lang
 */
function resolveHeader(lang) {
  const EN = 'Invalid Git Commit Message';
  const ZH = 'Git 提交信息不规范';

  let header = '';

  switch (lang) {
    case LANG.ZH_CN:
      header = ZH;
      break;

    default:
      header = EN;
      break;
  }

  return header;
}

function i18n(lang) {
  const en = {
    example: 'example',
    commitMessage: 'commit message',
    correctFormat: 'correct format',
    invalidLength: 'Invalid length',
  }
  const zh = {
    example: '示例',
    commitMessage: '提交信息',
    correctFormat: '正确格式',
    invalidLength: '提交信息长度不合法',
  }

  let translated = en;

  switch (lang) {
    case LANG.ZH_CN:
      translated = zh;
      break;

    default:
      break;
  }

  return translated;
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
    }
  }

  return null;
}
