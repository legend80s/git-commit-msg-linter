# git-commit-msg-linter

> Watching your every git commit message. 👀

![git-commit-msg-linter-demo](https://raw.githubusercontent.com/legend80s/commit-msg-linter/master/assets/demo-2.png)

## Install

```shell
npm install git-commit-msg-linter --save-dev
```

## What's this

It's a git "commit-msg" hook for linting your git commit message against the [Google AngularJS Git Commit Message Conventions](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit#heading=h.uyo6cb12dt6w). As a hook it will run at every commiting to make sure your every commit message is valid against the conventions. If not your commit will be aborted.

*The repo is heavily influenced by [pre-commit](https://github.com/observing/pre-commit). Thanks.*

## Why yet a new linter

Firstly no simple git commit message hook ever exists right now. To Add, to overwrite or to remove `type`s is not so friendly supported. *Why not [conventional-changelog/commitlint](https://github.com/conventional-changelog/commitlint), read the [FAQs](https://github.com/legend80s/commit-msg-linter/blob/master/assets/docs.md)*.

Secondly it's very important to follow certain git commit message conventions and we recommend Angular's.

## Recommended commit message pattern

> \<type\>(\<scope\>): \<subject\>
>
> // scope optional

## Docs

[More documentations.](https://github.com/legend80s/commit-msg-linter/blob/master/assets/docs.md)
