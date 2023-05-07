<h1 align="center">git-commit-msg-linter 👋</h1>

<p>
  <a href="https://www.npmjs.com/package/git-commit-msg-linter">
    <img src="https://img.shields.io/npm/v/git-commit-msg-linter.svg" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/git-commit-msg-linter">
    <img src="https://img.shields.io/npm/dm/git-commit-msg-linter.svg" alt="npm downloads" />
  </a>
  <img src="https://img.shields.io/badge/node-%3E%3D%2014.0.0-blue.svg" alt="prerequisite node version" />
  <img src="https://visitor-badge.glitch.me/badge?page_id=legend80s/commit-msg-linter&left_color=blue&right_color=green" alt="visitor count" />
</p>

> A lightweight, independent, 0 configurations and joyful git commit message linter.
>
> 👀 Watching your every git commit message INSTANTLY 🚀.

![git-commit-msg-linter-demo](https://raw.githubusercontent.com/legend80s/commit-msg-linter/master/assets/demo-7-compressed.png)
<p align="center" style="font-style: italic;">`gcam` is just an alias to `git commit -a -m`</p>

A git "commit-msg" hook for linting your git commit message against the popular [Angular Commit Message Guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-format). As a hook it will run at every commiting to make sure that the message to commit is valid against the conventions. If not the commit will be aborted.

*Heavily inspired by [pre-commit](https://github.com/observing/pre-commit). Thanks.*

[简体中文](https://github.com/legend80s/commit-msg-linter/blob/master/README-zh-CN.md)

<details>
 <summary>Table of Contents</summary>

- [Install](#install)
- [Recommended Commit Message Format](#recommended-commit-message-format)
- [Zero Configurations](#zero-configurations)
  - [commitlinterrc.json](#commitlinterrcjson)
  - [Set Linting Prompter's Language](#set-linting-prompters-language)
    - [Set in commitlinterrc.json](#set-in-commitlinterrcjson)
    - [Set in bash profiles](#set-in-bash-profiles)
- [Features](#features)
- [Why yet a new linter](#why-yet-a-new-linter)
- [How it works](#how-it-works)
- [FAQs](#faqs)
  - [1. Why not conventional-changelog/commitlint?](#1-why-not-conventional-changelogcommitlint)
  - [2. Work With Husky 5](#2-work-with-husky-5)
  - [3. git-commit-msg-linter badge](#3-git-commit-msg-linter-badge)
- [TODO](#todo)
- [Development](#development)
  - [Publish](#publish)
- [References](#references)
- [🤝 Contributing](#-contributing)
- [Show your support](#show-your-support)
- [📝 License](#-license)
</details>

## Install

```shell
npm install git-commit-msg-linter --save-dev
```

**Just install NO CONFIGURATIONS REQUIRED!** and your commit message is under linting from now on 🎉. Now go to your codebase to commit a message.

> 💡 Tips: for husky 5 see [Work With Husky 5](#2-work-with-husky-5).

## Recommended Commit Message Format

```
<type>(<scope>): <short summary>
  │       │             │
  │       │             └─⫸ Summary in present tense. Not capitalized. No period at the end.
  │       │
  │       └─⫸ Commit Scope: Optional, can be anything specifying the scope of the commit change.
  |                          For example $location|$browser|$compile|$rootScope|ngHref|ngClick|ngView, etc.
  |                          In App Development, scope can be a page, a module or a component.
  │
  └─⫸ Commit Type: feat|fix|docs|style|refactor|test|chore|perf|ci|build|temp
```

The `<type>` and `<summary>` fields are mandatory, the `(<scope>)` field is optional.

Bad:

> Correct spelling of CHANGELOG.

Good:

> docs: correct spelling of CHANGELOG

Good (commit message with scope):

> docs(CHANGELOG): correct spelling

The default commit `type`s can be extended or modified by [commitlinterrc.json](https://github.com/legend80s/commit-msg-linter/blob/master/assets/docs.md#commitlinterrcjson).

## Zero Configurations

**Configurations Not Required!** If it has to be customized we have the guide below.

The default `type`s includes **feat**, **fix**, **docs**, **style**, **refactor**, **test**, **chore**, **perf**, **ci**, **build** and **temp**.

The default `max-len` is 100 which means the commit message cannot be longer than 100 characters. All the settings can be modified in commitlinterrc.json.

### commitlinterrc.json

<details>
 <summary>More advanced settings</summary>

Except for default types, you can add, overwrite or forbid certain types and so does the `max-len`.

For example if you have this `commitlinterrc.json` file below in the root directory of your project:

```json
{
  "types": {
    "feat": "ユーザーが知覚できる新機能",
    "build": "ビルドシステムまたは外部の依存関係に影響する変更（スコープの例：gulp、broccoli、npm）",
    "deps": "依存関係を追加、アップグレード、削除",
    "temp": false,
    "chore": false
  },
  "max-len": 80,
  "debug": true
}
```

Which means:

- Modify existing type `feat`'s description to "ユーザーが知覚できる新機能".
- Add two new types: `build` and `deps`.
- `temp` is not allowed.
- `chore` is forbidden as `build` covers the same scope.
- Maximum length of a commit message is adjusted to 80.
- Display verbose information about the commit message.

A more detailed `commitlinterrc.json`：

```jsonc
{
  "lang": "en-US", // or "zh-CN". Set linter prompt's language
  "types": {
    "feat": "ユーザーが知覚できる新機能",
    "build": "ビルドシステムまたは外部の依存関係に影響する変更（スコープの例：gulp、broccoli、npm）",
    "deps": "依存関係を追加、アップグレード、削除",
    "docs": "ドキュメントのみ変更",
    "fix": false,
    "style": false,
    "refactor": false,
    "test": false,
    "perf": false,
    "ci": false,
    "temp": false,
    "chore": false
  },
  "min-len": 10,
  "max-len": 80,
  "example": "feat: 新機能",
  "scopeDescriptions": [
    "オプションで、コミット変更の場所を指定するものであれば何でもかまいません。",
    "たとえば、$ location、$ browser、$ compile、$ rootScope、ngHref、ngClick、ngViewなど。",
    "アプリ開発では、スコープはページ、モジュール、またはコンポーネントです。"
  ],
  "validScopes": ["workspace", "package1", "package2", "package3", ...],
  "invalidScopeDescriptions": [
    "`scope`はオプションですが、括弧が存在する場合は空にすることはできません。"
  ],
  "subjectDescriptions": [
    "1行での変更の非常に短い説明。"
  ],
  "invalidSubjectDescriptions": [
    "最初の文字を大文字にしないでください",
    "最後にドット「。」なし"
  ],
  "showInvalidHeader": false,
  "debug": false
}
```

In this config, the one-line `example` and `scope`, `subject`'s description section are modified as what your write in the `commitlinterrc.json`. And the the invalid header is hidden by set `"showInvalidHeader": false`。

![detailed-config-demo](https://raw.githubusercontent.com/legend80s/commit-msg-linter/master/assets/detailed-config-wx-compressed.png)

### Set Linting Prompter's Language

It will use your system's language as the default language. But two ways are provided also. Priority from high to low.

#### Set in commitlinterrc.json

```json
{
  "lang": "zh-CN"
}
```

`lang` in ["**en-US**", "**zh-CN**", "**pt-BR**", "**es-ES**"].

#### Set in bash profiles

```sh
echo 'export COMMIT_MSG_LINTER_LANG=zh-CN' >> ~/.zshrc
```

profiles such as `.bash_profile`, `.zshrc` etc.
</details>

## Features

1. Visualization, low cost to Learn.
2. Independent, zero configurations.
3. Prompt error msg precisely, friendly to commit message format unfamiliar developers.
4. i18n: **en-US**, **pt-BR** (Brazilian Portuguese), **zh-CN** an **es-ES** supported and you can add more in [How to contribute new language support](#how-to-add-new-language-support).
5. The linter is customizable for your team.
6. It works with the husky flow.
7. pnpm supported.
8. ES6 modules or project with "type: module" in package.json supported.

## Why yet a new linter

<details>
 <summary>The answer</summary>

Firstly it's very important to follow certain git commit message conventions and we recommend Angular's.

Secondly no simple git commit message hook ever exists right now. To Add, to overwrite or to remove `type`s is not so friendly supported. *Why not conventional-changelog/commitlint or husky, read the [FAQs](https://github.com/legend80s/commit-msg-linter/blob/master/assets/docs.md#faqs)*.
</details>

## How it works
<details>
 <summary>The answer</summary>

> The `commit-msg` hook takes one parameter, which again is the path to a temporary file that contains the commit message written by the developer. If this script exits non-zero, Git aborts the commit process, so you can use it to validate your project state or commit message before allowing a commit to go through.
>
> https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks

After installed, it will copy the hook `{PROJECT_ROOT}/.git/hooks/commit-msg` if it exists to `{PROJECT_ROOT}/.git/hooks/commit-msg.old` then the `commit-msg` will be overwritten by our linting rules.

To uninstall run the `uninstall` script instead of removing it manually because only in this way, the old `commit-msg` hook can be restored, so that your next commit messages will be ignored by the linter.

```shell
npm uninstall git-commit-msg-linter --save-dev
```

Before uninstalling, the `commit-msg` file will be restored and the `commit-msg.old` will be removed.
</details>

## FAQs

<details>
 <summary>1. Why not commitlint</summary>

Why not [conventional-changelog/commitlint](https://github.com/conventional-changelog/commitlint)?

- Configurations are relatively complex.
- No description for type, unfriendly to commit newbies. Because every time your are wondering which type should I use, you must jump out of you commit context to seek documentation in the wild web.
- To modify type description is also not supported. Unfriendly to non-english speakers. For example, all my team members are Japanese, isn't it more productive to change all the descriptions to Japanese?
- To add more types is also impossible. This is unacceptable for project with different types already existed.
</details>

<details>
 <summary>2. Work With Husky 5</summary>

This linter can work by standalone. But if you have husky 5 installed, because husky 5 will ignore the `.git/hooks/commit-msg` so a `.husky/commit-msg` need to be added manually:

```sh
npx husky add .husky/commit-msg ".git/hooks/commit-msg \$1"
```

Show the file content of `.husky/commit-msg` to make sure it has been added successfully otherwise do it manually.

```sh
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

.git/hooks/commit-msg $1
```

More details at [issues 8](https://github.com/legend80s/commit-msg-linter/issues/8).
</details>

<details>
 <summary>3. git-commit-msg-linter badge</summary>

```html
<a href="https://www.npmjs.com/package/git-commit-msg-linter">
  <img src="https://badgen.net/badge/git-commit-msg-linter/3.0.0/yellow" alt="commit msg linted by git-commit-msg-linter" />
</a>
```
</details>

## TODO

- [x] Existing rule can be overwritten and new ones can be added through `commitlinterrc.json`.
- [x] `englishOnly` should be configurable through `commitlinterrc.json`, default `false`.
- [x] `max-len` should be configurable through `commitlinterrc.json`, default `100`.
- [x] First letter of `subject` must be a lowercase one.
- [x] `subject` must not end with dot.
- [x] Empty `scope` parenthesis not allowed.
- [x] `scope` parenthesis must be of English which means full-width ones are not allowed.
- [ ] Keep a space between Chinese and English character.
- [x] Fix git merge commit not valid.
- [x] Enable showing verbose information for debugging.
- [x] Suggest similar but valid `type` on invalid input using [did-you-mean](https://www.npmjs.com/package/did-you-mean).
- [x] No backup when `commit-msg.old` existed.
- [x] Display commit message on invalid error.
- [x] i18n.
- [x] Set lang in zshrc, or commitlinrrc.

## Development

Use pnpm.

### Publish

```sh
npm version patch / minor / major
```

## References

1. [Angular Commit Message Guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-format)
2. [Angular.js Git Commit Guidelines](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines)
3. [Google AngularJS Git Commit Message Conventions](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/legend80s/commit-msg-linter/issues).

### How to add new language support

1. Add the translation into commit-msg-linter.js.
2. Modify README.md to add the new language.

You can read this PR [feat: add support to spanish (es-ES) #18](https://github.com/legend80s/commit-msg-linter/pull/18/files) as an example.

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2019 [legend80s](https://github.com/legend80s).

This project is [MIT](https://github.com/legend80s/commit-msg-linter/blob/master/LICENSE) licensed.

------

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
2023-05-05 21:26:07
2023-05-05 21:26:56
