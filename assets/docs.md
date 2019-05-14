# git-commit-msg-linter

## defaults

Default `type`s including **feat**, **fix**, **docs**, **style**, **refactor**, **test**, **chore**, **perf**, **ci** and **temp**.

Default `max-len` is 100 which means the commit message cannot be longer 100 characters!.

## commitlinterrc.json

Except for default types, you can add, overwrite or forbid certain types and so does the `max-len`.

For example if you have the `commitlinterrc.json` below in your project root directory:

```json
{
  "types": {
    "feat": "new feature to the user",
    "build": "changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)",
    "deps": "upgrade dependency",
    "temp": false,
    "chore": false
  },
  "max-len": 80
}
```

which means:

1. Modify existing type `feat`'s description to "new feature to the user".
2. Add two new types: `build` and `deps`.
3. `temp` are not allowed and `chore` are forbidden as `build` has the same meaning.
4. Maximum length of a commit message is adjusted to 80.
