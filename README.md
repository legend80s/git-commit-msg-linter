<h1 align="center">Welcome to git-commit-msg-linter 👋</h1>

<p>
  <a href="https://www.npmjs.com/package/git-commit-msg-linter">
    <img src="https://img.shields.io/npm/v/git-commit-msg-linter.svg" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/git-commit-msg-linter">
    <img src="https://img.shields.io/npm/dm/git-commit-msg-linter.svg" alt="npm downloads" />
  </a>
  <img src="https://img.shields.io/badge/node-%3E%3D%208.0.0-blue.svg" alt="prerequisite node version" />
  <a href="https://packagephobia.now.sh/result?p=commander" rel="nofollow">
    <img src="https://packagephobia.now.sh/badge?p=git-commit-msg-linter" alt="Install Size">
  </a>
</p>

> Watching your every git commit message. 👀

![git-commit-msg-linter-demo](https://raw.githubusercontent.com/legend80s/commit-msg-linter/master/assets/demo-4-compressed.png)

A git "commit-msg" hook for linting your git commit message against the [Angular Commit Message Guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-guidelines). As a hook it will run at every commiting to make sure that the message to commit is valid against the conventions. If not the commit will be aborted.

*The repo is heavily influenced by [pre-commit](https://github.com/observing/pre-commit). Thanks.*

## Install

```shell
npm install git-commit-msg-linter --save-dev
```

*To uninstall run the `uninstall` script instead of removing it manually* because only in this way, the old `commit-msg` hook can be restored, so that your next commit messages will be ignored by the linter.

```shell
npm uninstall git-commit-msg-linter --save-dev
```

## Why yet a new linter

Firstly it's very important to follow certain git commit message conventions and we recommend Angular's.

Secondly no simple git commit message hook ever exists right now. To Add, to overwrite or to remove `type`s is not so friendly supported. *Why not conventional-changelog/commitlint or husky, read the [FAQs](https://github.com/legend80s/commit-msg-linter/blob/master/assets/docs.md#faqs)*.

## Recommended commit message pattern

> \<type\>(\<scope\>): \<subject\>
>
> // *scope optional*

The default `type`s includes **feat**, **fix**, **docs**, **style**, **refactor**, **test**, **chore**, **perf**, **ci** and **temp**. And They can be extended or modified by [commitlinterrc.json](https://github.com/legend80s/commit-msg-linter/blob/master/assets/docs.md#commitlinterrcjson).

## Documentations

[Configuration and FAQs.](https://github.com/legend80s/commit-msg-linter/blob/master/assets/docs.md)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/legend80s/commit-msg-linter/issues).

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2019 [legend80s](https://github.com/legend80s).

This project is [MIT](https://github.com/legend80s/commit-msg-linter/blob/master/LICENSE) licensed.

------

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
