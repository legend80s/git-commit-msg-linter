#!/usr/bin/env node

const fs = require('fs');

// Any line of the commit message cannot be longer 100 characters!
// This allows the message to be easier to read on github as well as in various git tools.
const MAX_LENGTH = 100;
/* eslint-disable no-useless-escape */
const PATTERN = /^(?:fixup!\s*)?(\w*)(\(([\w\$\.\*/-]*)\))?\: (.*)$/;
/* eslint-enable no-useless-escape */
const IGNORED = /(^WIP:)|(^\d+\.\d+\.\d+)/;
const COLOR = '\x1B[1;33m';
const GRAY = '\x1B[0;37m';
const RED = '\x1B[0;31m';
const GREEN = '\x1B[0;32m';

const TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'chore',
  'test',
  'temp',
];

/* eslint-disable no-console */
function displayError() {
  console.error(
    `
  ${RED}*************Invalid Git Commit Message**************

  ${GREEN}correct format: <type>(<scope>): <subject>

  ${COLOR}type:
    ${COLOR}feat     ${GRAY}Feature.
    ${COLOR}fix      ${GRAY}Bug fix.
    ${COLOR}docs     ${GRAY}Documentation.
    ${COLOR}style    ${GRAY}Formatting, missing semi colons, …
    ${COLOR}refactor ${GRAY}A code change that neither fixes a bug nor adds a feature.
    ${COLOR}perf     ${GRAY}A code change that improves performance.
    ${COLOR}chore    ${GRAY}Maintaining.
    ${COLOR}test     ${GRAY}When adding missing tests or correcting existing ones.
    ${COLOR}temp     ${GRAY}Temporary commit, will not be included in CHANGELOG.

  ${COLOR}scope:
    ${GRAY}Optional, can be anything specifying place of the commit change.
    For example $location, $browser, $compile, $rootScope, ngHref, ngClick, ngView, etc.
    In App Development, scope can be a page, a module or a component.

  ${COLOR}subject:
    ${GRAY}A very short description of the change in one line;
      - Don't capitalize first letter;
      - No dot (.) at the end.
      - Any line of the commit message cannot be longer 100 characters!

  ${COLOR}Example:
    ${GREEN}style($location): add couple of missing semi colons.
  `
  );
}

function validateMessage(message) {
  let isValid = true;

  if (IGNORED.test(message)) {
    console.log('Commit message validation ignored.');
    return true;
  }

  if (message.length > MAX_LENGTH) {
    console.error(`${COLOR}commit text is longer than ${MAX_LENGTH} characters`);
    isValid = false;
  }

  // if (/[\u3220-\uFA29]+/.test(message)) {
  //   console.error(`${COLOR}commit text can not contain chinese characters`);
  //   isValid = false;
  // }

  const match = PATTERN.exec(message);

  if (!match) {
    displayError();
    return false;
  }

  const type = match[1];
  const scope = match[3];
  const subject = match[4];

  console.log('type:', type);
  console.log('scope:', scope);
  console.log('subject:', subject);

  const invalideType = !TYPES.includes(type);

  // scope can be optional, but not empty string
  // "test: hello" OK
  // "test(): hello" FAILED
  const invalidScope = typeof scope === 'string' && scope.trim() === '';

  // Don't capitalize first letter; No dot (.) at the end
  const invalidSubject = isUpperCase(subject[0]) || subject.endsWith('.');

  if (invalideType || invalidScope || invalidSubject) {
    displayError();
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
