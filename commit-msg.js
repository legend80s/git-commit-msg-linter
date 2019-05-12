#!/usr/bin/env node

const fs = require('fs');

const MAX_LENGTH = 300;
/* eslint-disable no-useless-escape */
const PATTERN = /^(?:fixup!\s*)?(\w*)(\(([\w\$\.\*/-]*)\))?\: (.*)$/;
/* eslint-enable no-useless-escape */
const IGNORED = /(^WIP:)|(^\d+\.\d+\.\d+)/;
const COLOR = '\x1B[1;33m';
const GRAY = '\x1B[0;37m';
const RED = '\x1B[0;31m';
const GREEN = '\x1B[0;32m';

const TYPES = [
  'feat', // 新功能
  'fix', // 修复问题
  'docs', // 修改文档
  'style', // 修改代码格式，不影响代码逻辑
  'refactor', // 重构代码，理论上不影响现有功能
  'perf', // 提升性能
  'test', // 增加修改测试用例
  'chore', // 修改工具相关（包括但不限于文档、代码生成等）
  'revert',
  'break', // 破坏性变更(api删除,scss变量删除,api变更等不兼容变更)
  'temp', // 无意义commit,该类commit不会汇总到history中
];

/* eslint-disable no-console */
function displayError() {
  console.error(
    `
  ${RED}*************Invalid Git Commit Message**************

  ${GREEN}correct format: <type>(<scope>): <subject>

  ${COLOR}type:
    ${COLOR}feat      ${GRAY}----     feature
    ${COLOR}fix       ${GRAY}----     bug fix
    ${COLOR}docs      ${GRAY}----     documentation
    ${COLOR}style     ${GRAY}----     formatting, missing semi colons, …
    ${COLOR}refactor  ${GRAY}----     a code change that neither fixes a bug nor adds a feature
    ${COLOR}perf      ${GRAY}----     a code change that improves performance
    ${COLOR}chore     ${GRAY}----     maintaining
    ${COLOR}test      ${GRAY}----     when adding missing tests or correcting existing ones
    ${COLOR}temp      ${GRAY}----     temporary commit, will not be included in git history

  ${COLOR}scope:
    ${GRAY}Optional, usually the files you have changed, or the API methods.

  ${COLOR}subject:
    ${GRAY}Please describe your changes in one line

  ${COLOR}Example:
    ${GREEN}style($location): add couple of missing semi colons
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

  if (!TYPES.includes(type)) {
    displayError();
    return false;
  }

  return isValid;
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
