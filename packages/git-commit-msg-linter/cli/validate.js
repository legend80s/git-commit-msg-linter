#!/usr/bin/env node
/* eslint-disable no-console */

// https://github.com/legend80s/commit-msg-linter/issues/21
/* eslint-disable no-undef */

// expected output of `commit-msg-linter sha1..sha2`? Just exit with code 1 and print the invalid msg list?
const { execSync } = require('child_process');
const { readFileSync } = require('fs');
const path = require('path');
const { validateMessage, YELLOW, RED } = require('../core/validate');

const args = process.argv.slice(2);
const config = readConfig();

main(args);

/**
 *
 * @param {string[]} ids
 */
function main(ids) {
  // sha1..sha2 [sha1, sha2]
  // sha1: sha1
  // sha1 sha2: sha1 and sha2

  console.log('ids:', ids);

  /** @type {Array<string>} */
  const invalidMsgList = [];

  ids.forEach((sha) => {
    // contains double `.`
    const parts = prune(sha.split('..'));

    // lint range
    if (parts.length > 1) {
      const [start, end] = parts;

      invalidMsgList.push(...lintBetween(start, end));
    }

    // lint single sha
    const invalidMsg = lint(sha);
    invalidMsg !== true && invalidMsgList.push(invalidMsg);
  });

  /** @type {Set<string>} */
  const invalidMsgs = new Set(invalidMsgList);

  if (invalidMsgs.size) {
    // eslint-disable-next-line no-console
    console.error(invalidMsgs.size, 'invalid commit msg(s) found:', invalidMsgs);

    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

/**
 *
 * @param {string[]} arr
 */
function prune(arr) {
  return arr.map((x) => x.trim()).filter(Boolean);
}

/**
 *
 * @param {ISha} sha
 * @returns {true | string} return `true` when msg is valid
 */
function lint(sha) {
  // git log $sha --pretty=format:%s -n1
  const msg = execSync(`git log ${sha} --pretty=format:%s -n1`).toString();

  return validate(msg) ? true : msg;
}

/**
 * @param {ISha} start
 * @param {ISha} end
 * @returns {string[]}
 */
function lintBetween(start, end) {
  // git log sha1..sha2 --pretty=format:%s
  // temp: temp
  // fix(i18n): issues#27 lang config on file commitlinterrc.json not working

  // git log sha1 --pretty=format:%s -n1
  // chore: upgrade to 4
  const rangeCmd = `git log ${start}..${end} --pretty=format:%s`;

  const msgs = execSync(rangeCmd).toString().split('\n');
  const invalidMsgs = msgs.filter((msg) => !validate(msg));

  const startMsg = lint(start);

  if (startMsg === true) {
    return invalidMsgs;
  }

  return [startMsg, ...invalidMsgs];
}

/**
 *
 * @param {string} msg
 * @returns {boolean}
 */
function validate(msg) {
  // const { descriptions: DESCRIPTIONS, stereotypes: STEREOTYPES } = getLangData(lang);

  // const {
  //   example,
  //   scope,
  //   invalidScope,
  //   subject,
  //   invalidSubject,
  // } = DESCRIPTIONS;

  const {
    types,
    'max-len': maxLength,
    'min-len': minLength,
    debug: verbose = process.env.COMMIT_MSG_LINTER_ENV === 'debug',
    showInvalidHeader = true,

    scopeDescriptions = scope,
    invalidScopeDescriptions = invalidScope,

    subjectDescriptions = subject,
    invalidSubjectDescriptions = invalidSubject,

    postSubjectDescriptions = [],
    englishOnly = false,
    scopeRequired = false,
    ...rest
  } = config;

  verbose && debug('config:', config);

  // const msg = getFirstLine(commitMsgContent).replace(/\s{2,}/g, ' ');
  const mergedTypes = merge(STEREOTYPES, types);
  const maxLen = typeof maxLength === 'number' ? maxLength : MAX_LENGTH;
  const minLen = typeof minLength === 'number' ? minLength : MIN_LENGTH;

  if (!validateMessage(msg, {
    ...rest,

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
    englishOnly,
    scopeRequired,
  })) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

function readConfig() {
  const filename = path.resolve(process.cwd(), 'commitlinterrc.json');

  const packageName = `${YELLOW}git-commit-msg-linter`;
  let content = '{}';

  try {
    content = readFileSync(filename);
  } catch (error) {
    if (error.code === 'ENOENT') {
      /** pass, as commitlinterrc are optional */
    } else {
      /** pass, commitlinterrc ignored when invalid */
      /** It must be a bug so output the error to the user */
      console.error(`${packageName}: ${RED}read commitlinterrc.json failed`, error);
    }
  }

  // console.log('filename:', filename);
  // console.log('content:', content);

  let configObject = {};

  try {
    configObject = JSON.parse(content);
  } catch (error) {
    /** pass, commitlinterrc ignored when invalid json */
    /** output the error to the user for self-checking */
    console.error(`${packageName}: ${RED}commitlinterrc.json ignored because of invalid json`);
  }

  return configObject;
}

function merge(stereotypes, configTypes) {
  return compact({ ...stereotypes, ...configTypes }, { strictFalse: true });
}

/**
 * @typedef {string} ISha
 */
