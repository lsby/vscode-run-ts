# vscode run ts

这是一个 Visual Studio Code 插件，在当前 TypeScript 文件上下文中快速运行表达式。

## 链接

- [github仓库](https://github.com/lsby/vscode-run-ts)
- [vscode商店](https://marketplace.visualstudio.com/items?itemName=hbybyyang.lsby-vscode-run-ts)

## 注意

必须先全局或在项目中安装`tsx`：

```bash
npm i -g tsx
```

## 功能

- 快速调试：快速在当前文件上下文中，添加给定表达式，并以调试模式执行该文件。
- 自动填写表达式: 当光标在静态方法，实例方法，函数中时，会自动填写表达式(但不包含参数)。
- 自动恢复文件状态：在调试会话结束后自动删除添加的表达式。
- 历史记录支持：保存最近的表达式，方便快速重用。
- 环境变量支持: 支持对项目配置启动的环境变量。

## 使用

- 打开您要运行的 TypeScript 文件。
- 按 `F1` 打开命令面板。
- 输入并选择 `在当前文件运行` 命令。
- 选择或输入或选择您希望执行的表达式，可以使用当前文件的上下文。例如，`console.log("Hello World")`。
- 插件会将表达式添加到文件末尾，并启动调试会话。
- 调试会话结束后，插件会自动删除添加的表达式。

## 配置

在项目的`.vscode`文件夹中，新建`lsby-vscode-run-ts-config.json`文件，可以配置启动时的环境变量。

例子:

```json
{
  "env": {
    "DEBUG": "*",
    "ENV_FILE_PATH": "./.env/.env.test"
  }
}
```
