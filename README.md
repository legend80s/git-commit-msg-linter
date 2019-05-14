# git-commit-msg-linter

> Watching your every git commit message. 👀

<img src="https://raw.githubusercontent.com/legend80s/commit-msg-linter/master/assets/demo-2.png" alt="git-commit-msg-linter-result" width="90%" />

## Install

```shell
npm install git-commit-msg-linter --save-dev
```

## What's this

It's a git "commit-msg" hook for linting your git commit message against the [Google AngularJS Git Commit Message Conventions](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit#heading=h.uyo6cb12dt6w). As a hook it will run at every commiting to make sure your every commit message is valid against the conventions. If not your commit will be aborted.

*The repo is heavily influenced by [pre-commit](https://github.com/observing/pre-commit). Thanks.*


## Why yet a new linter

1. No simpler git commit message hook ever exists right now.
2. It's very important to follow certain git commit message conventions and we recommend Google's.

## Recommended commit message pattern

```shell
<type>(<scope>): <subject>

# scope optional
```

## commitlinterrc.json

Default `type`s including **feat**, **fix**, **docs**, **style**, **refactor**, **test**, **chore**, **perf**, **ci** and **temp**. But we can add, overwrite or forbid certain types.

For example if you have the `commitlinterrc.json` below in your project root directory:

```json
{
  "types": {
    "feat": "new feature to the user",
    "build": "changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)",
    "deps": "upgrade dependency",
    "temp": false,
    "chore": false
  }
}
```

It means:

1. Modify existing type `feat`'s description to "new feature to the user".
2. Add two new types: `build` and `deps`.
3. `temp` are not allowed and `chore` are forbidden as `build` has the same meaning.

## TODO

- [x] Existing rule can be overwritten and new ones can be added through `commitlinterrc.json`.
- [ ] `is-english-only` should be configurable through `commitlinterrc.json`, default `false`.
- [ ] `max-length` should be configurable through `commitlinterrc.json`, default `100`.
- [x] First letter of `subject` must be a lowercase one.
- [x] `subject` must not end with dot.
- [x] Empty `scope` parenthesis not allowed.
- [x] `scope` parenthesis must be of English which means full-width ones are not allowed.
- [ ] Keep a space between Chinese and English character.

## Notice

git submodules not tested yet.
