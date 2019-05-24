# git-commit-msg-linter

## defaults

The default `type`s includes **feat**, **fix**, **docs**, **style**, **refactor**, **test**, **chore**, **perf**, **ci** and **temp**.

The default `max-len` is 100 which means the commit message cannot be longer than 100 characters.

## commitlinterrc.json

Except for default types, you can add, overwrite or forbid certain types and so does the `max-len`.

For example if you have the `commitlinterrc.json` below in the root directory of your project:

```json
{
  "types": {
    "feat": "new feature to the user",
    "build": "changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)",
    "deps": "upgrade dependency",
    "temp": false,
    "chore": false
  },
  "max-len": 80,
  "debug": true
}
```

which means:

- Modify existing type `feat`'s description to "new feature to the user".
- Add two new types: `build` and `deps`.
- `temp` is not allowed and `chore` is forbidden as `build` means the same thing.
- Maximum length of a commit message is adjusted to 80.
- Display verbose information about the commit message.

## FAQs

1. Why not [conventional-changelog/commitlint](https://github.com/conventional-changelog/commitlint)?

   > - Configuration is relatively complex.
   >
   > - No description for type, unfriendly to commit newbies. Because every time your are wondering which type should I use, you must jump out of you commit context to seek documentation in the wild web.
   >
   > - To modify type description is also not supported. Unfriendly to non-english speakers. For example, all my team members are Japanese, isn't it more productive to change all the descriptions to Japanese?
   >
   > - To add more types is also impossible. This is unacceptable for project with different types already existed.

## TODO

- [x] Existing rule can be overwritten and new ones can be added through `commitlinterrc.json`.
- [ ] `is-english-only` should be configurable through `commitlinterrc.json`, default `false`.
- [x] `max-len` should be configurable through `commitlinterrc.json`, default `100`.
- [x] First letter of `subject` must be a lowercase one.
- [x] `subject` must not end with dot.
- [x] Empty `scope` parenthesis not allowed.
- [x] `scope` parenthesis must be of English which means full-width ones are not allowed.
- [ ] Keep a space between Chinese and English character.
- [ ] Fix git pull commit not valid.
- [x] Enable showing verbose information for debugging.

## Reference guidelines

1. [Angular Commit Message Guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-guidelines)
2. [Angular.js Git Commit Guidelines](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines)
3. [Google AngularJS Git Commit Message Conventions](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit#heading=h.uyo6cb12dt6w)
