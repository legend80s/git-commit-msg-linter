# git-commit-msg-linter

> git commit-msg hook for watching your every git commit message 👀

<img src="https://raw.githubusercontent.com/legend80s/commit-msg-linter/master/assets/git-commit-msg-linter-result.png" alt="git-commit-msg-linter-result" width="80%" />

## What's this

It's a git "commit-msg" hook for linting your git commit message against the [Google AngularJS Git Commit Message Conventions](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit#heading=h.uyo6cb12dt6w). As a hook it will run at every commit to make sure your every commit message is valid against the conventions. If not your commit will be aborted.

*The repo is heavily influenced by [pre-commit](https://github.com/observing/pre-commit). Thanks.*

## Install

```shell
npm install git-commit-msg-linter --save-dev
```

## How it works

1. On installing, it will copy the `{PROJECT}/.git/hooks/commit-msg` executable file if it exists to `{PROJECT}/.git/hooks/commit-msg.old` then the `commit-msg` will be overwritten by injecting the linting rules contained in src file `commit-msg.js`.

2. On uninstalling, the `commit-msg` file will be restored and the `commit-msg.old` will be deleted.

## Why yet a new linter

1. No "Google AngularJS Git Commit Message Conventions" linter hook ever existed now.
2. It's very important to follow git commit message conventions and we recommend Google's.

## TODO

- [ ] Existing rule can be overwritten and new ones can be added through `commitlinterrc.json`.
- [ ] `is-english-only` should be configurable through `commitlinterrc.json`, default `false`.
- [x] First letter of `subject` must be a lowercase one.
- [x] `subject` must not end with dot.
- [x] Empty `scope` parenthesis not allowed.
- [x] `scope` parenthesis must be of English which means full-width ones are not allowed.
- [ ] Keep a space between Chinese and English character.

## Notice

1. git submodules not supported yet.

## FAQ
