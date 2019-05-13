#!/usr/bin/env node

const fs = require('fs');

// Any line of the commit message cannot be longer 100 characters!
// This allows the message to be easier to read on github as well as in various git tools.
const MAX_LENGTH = 100;
/* eslint-disable no-useless-escape */
const PATTERN = /^(?:fixup!\s*)?(\w*)(\(([\w\$\.\*/-]*)\))?\: (.*)$/;
/* eslint-enable no-useless-escape */
const IGNORED = /(^WIP:)|(^\d+\.\d+\.\d+)/;
const YELLOW = '\x1B[1;33m';
const GRAY = '\x1B[0;37m';
const RED = '\x1B[0;31m';
const GREEN = '\x1B[0;32m';

const TYPES = [
  ['feat', 'New feature.'],
  ['fix', 'Bug fix.'],
  ['docs', 'Documentation.'],
  ['style', 'Formatting, missing semi colons, …'],
  ['refactor', 'Neither fixing a bug nor adding a feature.'],
  ['perf', 'Improve performance.'],
  ['test', 'Add missing tests or correcting existing ones.'],
  ['chore', 'Maintain.'],
  ['deps', 'Upgrade dependency.'],
  ['temp', 'Temporary commit that won\'t be included in your CHANGELOG.'],
];

const types = TYPES.map(([type]) => type);
const maxTypeLength = [...types].sort((t1, t2) => t2.length - t1.length)[0].length;

const typeDescriptions = TYPES
  .map(([type, description], index) => generateTypeDescription({ index, type, description, maxTypeLength }))
  .join('\n');

/* eslint-disable no-console */
function displayError({
  invalidLength = false,
  invalideFormat = false,
  invalideType = false,
  invalidScope = false,
  invalidSubject = false,
} = {}) {
  const type = invalideType ? `${RED}<type>` : '<type>';
  const scope = invalidScope ? `${RED}(<scope>)` : `${invalideFormat ? RED : GREEN}(<scope>)`;
  const subject = invalidSubject ? `${RED}<subject>` : `${invalideFormat ? RED : GREEN}<subject>`;

  console.error(
    `
  ${invalideFormat ? RED : YELLOW}************* Invalid Git Commit Message **************${invalidLength ? `

  ${RED}Any line of the commit message cannot be longer ${MAX_LENGTH} characters!` : ''}

  ${invalideFormat ? RED : GREEN}correct format: ${type}${scope}: ${subject}

  ${invalideType ? RED : YELLOW}type:
    ${typeDescriptions}

  ${YELLOW}scope:
    ${GRAY}Optional, can be anything specifying place of the commit change.
    For example $location, $browser, $compile, $rootScope, ngHref, ngClick, ngView, etc.
    In App Development, scope can be a page, a module or a component.${invalidScope ? `${RED}
    \`scope\` can be *optional*, but its parenthesis if exists cannot be empty.` : ''}

  ${YELLOW}subject:
    ${GRAY}A very short description of the change in one line;${invalidSubject ? `${RED}
      - Don't capitalize first letter;
      - No dot (.) at the end.` : ''}

  ${YELLOW}Example:
    ${GREEN}style($location): add couple of missing semi colons.
  `
  );
}

function validateMessage(message) {
  let isValid = true;
  let invalidLength = false;

  if (IGNORED.test(message)) {
    console.log('Commit message validation ignored.');
    return true;
  }

  if (message.length > MAX_LENGTH) {
    invalidLength = true;
    isValid = false;
  }

  // if (/[\u3220-\uFA29]+/.test(message)) {
  //   console.error(`${COLOR}commit text can not contain chinese characters`);
  //   isValid = false;
  // }

  const match = PATTERN.exec(message);

  if (!match) {
    displayError({ invalidLength, invalideFormat: true });
    return false;
  }

  const type = match[1];
  const scope = match[3];
  const subject = match[4];

  // console.log('type:', type);
  // console.log('scope:', scope);
  // console.log('subject:', subject);

  const invalideType = !types.includes(type);

  // scope can be optional, but not empty string
  // "test: hello" OK
  // "test(): hello" FAILED
  const invalidScope = typeof scope === 'string' && scope.trim() === '';

  // Don't capitalize first letter; No dot (.) at the end
  const invalidSubject = isUpperCase(subject[0]) || subject.endsWith('.');

  if (invalideType || invalidScope || invalidSubject) {
    displayError({ invalideType, invalidScope, invalidSubject });
    return false;
  }

  return isValid;
}

/**
 * isUpperCase
 * @param {string} letter
 */
function isUpperCase(letter) {
  return letter === letter.toUpperCase();
}

function firstLineFromBuffer(buffer) {
  return buffer.toString().split('\n').shift();
}

const commitMsgFile = process.argv[2];

fs.readFile(commitMsgFile, (err, buffer) => {
  const msg = firstLineFromBuffer(buffer);

  if (!validateMessage(msg)) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});

/**
 * return n spaces
 *
 * @param  {number}
 * @return {string}
 */
function nSpaces(n) {
  const space = ' ';

  return space.repeat(n);
}

/**
 * generate type description
 *
 * @param {number} options.index
 * @param {string} options.type
 * @param {string} options.description
 */
function generateTypeDescription({ index, type, description, maxTypeLength }) {
  const paddingBefore = index === 0 ? '' : nSpaces(4);
  const marginRight = nSpaces(maxTypeLength - type.length + 1);

  return `${paddingBefore}${YELLOW}${type}${marginRight}${GRAY}${description}`;
}
