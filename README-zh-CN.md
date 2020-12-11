# git-commit-msg-linter

<p align="center">
  <img src="https://raw.githubusercontent.com/legend80s/commit-msg-linter/master/assets/demo-6-zh-cn-compressed.png" alt="git-commit-msg-linter zh-CN demo" width="80%" />
</p>

> 👀 监督和规范开发者的每一行提交信息，为团队定制专属的 Git 提交信息规范

## 安装

```sh
npm install git-commit-msg-linter --save-dev
```

**只需安装无需配置**，提交信息已处于 lint 状态，现在去提交代码试试。

## 设置提示语言

默认使用系统设置语言（`$ node -p 'Intl.DateTimeFormat().resolvedOptions().locale'`），可通过以下两种方式自定义语言，仅支持中文（zh-CN）和英文（en-US），优先级从高到低：

### 通过 commitlinterrc.json 设置

```json
{
  "lang": "zh-CN"
}
```

### 通过环境变量设置

```sh
echo 'export COMMIT_MSG_LINTER_LANG=zh-CN' >> ~/.zshrc
```

profile 文件可以是 `.bash_profile`, `.zshrc` 等。

## 优点

1. 可视化，低学习成本
2. 零配置，易上手
3. 错误提交对症提示，对不熟悉提交信息规范习惯的开发者友好
4. i18，支持中文和英文
5. 可自定义团队规范
6. 使用模糊匹配自动纠正 type
