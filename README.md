# `vscode run ts`

这是一个 Visual Studio Code 插件，在当前 TypeScript 文件上下文中快速运行表达式。

## 注意

必须先全局或在项目中安装`tsx`：

```bash
npm i -g tsx
```

## 功能

- 快速调试：快速在当前文件上下文中，以调试模式执行给定 TypeScript 表达式。
- 自动恢复文件状态：在调试会话结束后自动将文件恢复到原始状态。
- 历史记录支持：保存最近的表达式，方便快速重用或选择。

## 使用

- 打开您要运行的 TypeScript 文件。
- 按 `F1` 或 `Ctrl+Shift+P` (Windows/Linux) / `Cmd+Shift+P` (Mac) 打开命令面板。
- 输入并选择 `在当前文件运行` 命令。
- 输入或选择您希望执行的表达式，可以使用当前文件的上下文。例如，`console.log("Hello World")`。
- 插件会将表达式添加到文件末尾，并启动调试会话。
- 调试会话结束后，文件内容会恢复到原始状态。
