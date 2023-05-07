/* eslint-disable no-undef */
/* eslint-disable no-console */
const colorSupported = false;

exports.YELLOW = colorSupported ? '\x1b[1;33m' : '';
exports.GRAY = colorSupported ? '\x1b[0;37m' : '';
exports.RED = colorSupported ? '\x1b[0;31m' : '';
exports.GREEN = colorSupported ? '\x1b[0;32m' : '';

/** End Of Style, removes all attributes (formatting and colors) */
exports.EOS = colorSupported ? '\x1b[0m' : '';
exports.BOLD = colorSupported ? '\x1b[1m' : '';

/**
* validate git message
*
* @param {string} message
* @param {Object} options.mergedTypes 和 commitlinterrc merge 过的 types
* @param {number} options.maxLen 提交信息最大长度
* @param {boolean} options.verbose 是否打印 debug 信息
* @returns {boolean}
*/
exports.validateMessage = function validateMessage(
  message,
  {
    shouldDisplayError = true,
    mergedTypes,
    maxLen,
    minLen,
    verbose,
    example,
    showInvalidHeader,
    scopeDescriptions,
    subjectDescriptions,
    postSubjectDescriptions,
    invalidSubjectDescriptions,
    lang,
    englishOnly,

    scopeRequired,
    validScopes,
    invalidScopeDescriptions,
    scopeNotInRangeDescription = Array.isArray(validScopes) && validScopes.length
      ? `scope must be one of [${validScopes.map((s) => `"${s}"`).join(', ')}].`
      : 'scope not in range. SHOULD NOT SEE THIS MESSAGE. PLEASE REPORT AN ISSUE.',
  },
) {
  let isValid = true;
  let invalidLength = false;

  /* eslint-enable no-useless-escape */
  const IGNORED_PATTERNS = [
    /(^WIP:)|(^\d+\.\d+\.\d+)/,

    /^Publish$/,

    // ignore auto-generated commit msg
    /^((Merge pull request)|(Merge (.*?) into (.*?)|(Merge branch (.*?)))(?:\r?\n)*$)/m,
  ];

  if (IGNORED_PATTERNS.some((pattern) => pattern.test(message))) {
    shouldDisplayError && console.log('Commit message validation ignored.');
    return true;
  }

  // verbose && debug(`commit message: |${message}|`);

  if (message.length > maxLen || message.length < minLen) {
    invalidLength = true;
    isValid = false;
  }

  // eslint-disable-next-line no-useless-escape
  if (englishOnly && !/^[a-zA-Z\s\.!@#$%^&*\(\)-_+=\\\|\[\]\{\};:'"?/.>,<]+$/.test(message)) {
    shouldDisplayError && console.log('');
    // eslint-disable-next-line no-undef
    shouldDisplayError && console.warn(`${YELLOW}[git-commit-msg-linter] Commit message can not contain ${RED}non-English${EOS}${YELLOW} characters due to ${red('`englishOnly`')} ${yellow('in "commitlinterrc.json" is true.')}`);

    return false;
  }

  const matches = resolvePatterns(message);

  if (!matches) {
    // eslint-disable-next-line no-undef
    shouldDisplayError && displayError(
      { invalidLength, invalidFormat: true },
      {
        mergedTypes,
        maxLen,
        minLen,
        message,
        example,
        showInvalidHeader,
        scopeDescriptions,

        subjectDescriptions,
        postSubjectDescriptions,
        invalidSubjectDescriptions,
        lang,

        scopeRequired,
        validScopes,
        invalidScopeDescriptions,
      },
    );

    return false;
  }

  const { type, scope, subject } = matches;

  verbose && debug(`type: ${type}, scope: ${scope}, subject: ${subject}`);

  const types = Object.keys(mergedTypes);
  const typeInvalid = !types.includes(type);

  const [invalidScope, reason] = isScopeInvalid(scope, { scopeRequired, validScopes });

  // Don't capitalize first letter; No dot (.) at the end
  const invalidSubject = isUpperCase(subject[0]) || subject.endsWith('.');

  if (invalidLength || typeInvalid || invalidScope || invalidSubject) {
    shouldDisplayError && displayError(
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
        invalidScopeDescriptions: reason === 'NOT_IN_RANGE' ? castArry(scopeNotInRangeDescription) : invalidScopeDescriptions,
        subjectDescriptions,
        postSubjectDescriptions,
        invalidSubjectDescriptions,
        lang,
        scopeRequired,
      },
    );

    return false;
  }

  return isValid;
};

function resolvePatterns(message) {
  // eslint-disable-next-line no-useless-escape
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

function isScopeInvalid(scope, { validScopes, scopeRequired }) {
  const trimedScope = scope && scope.trim();

  const notInRange = () => Array.isArray(validScopes)
    && validScopes.length > 0
    && !validScopes.includes(scope);

  if (scopeRequired) {
    if (!trimedScope) return [true, 'SCOPE_REQUIRED'];

    if (notInRange()) {
      return [true, 'NOT_IN_RANGE'];
    }
  }

  if (typeof scope === 'string') {
    // scope can be optional, but not empty string
    // @example
    // "test: hello" OK
    // "test(): hello" FAILED
    if (trimedScope === '') { return [true, 'SCOPE_EMPTY_STRING']; }

    if (notInRange()) {
      return [true, 'NOT_IN_RANGE'];
    }
  }

  return [false];
}

function isUpperCase(letter) {
  return /^[A-Z]$/.test(letter);
}
