import * as vscode from 'vscode'

const 插件名称 = 'lsby-vscode-run-ts'
const 历史记录限制 = 10 // 设置历史记录的最大数量

export function activate(context: vscode.ExtensionContext): void {
  console.log(`${插件名称}: 插件开始运行`)
  const 类型脚本运行器 = new TypeScriptRunner(context)
  类型脚本运行器.注册命令()
}

export function deactivate(): void {}

class TypeScriptRunner {
  private 上下文: vscode.ExtensionContext
  private 历史记录: string[] = []
  private 原始文本: string = ''

  constructor(上下文: vscode.ExtensionContext) {
    this.上下文 = 上下文
  }

  // 注册命令
  public 注册命令(): void {
    const 命令处理器 = vscode.commands.registerCommand(`${插件名称}.runInCurrentFile`, async () => {
      await this.在当前文件运行()
    })

    this.上下文.subscriptions.push(命令处理器)
  }

  // 运行当前文件
  private async 在当前文件运行(): Promise<void> {
    const 编辑器 = vscode.window.activeTextEditor
    if (!编辑器) {
      await vscode.window.showInformationMessage('没有打开的文件')
      return
    }

    const 文档 = 编辑器.document
    if (!this.是否是TypeScript文件(文档)) {
      await vscode.window.showInformationMessage('当前文件不是 TypeScript 文件')
      return
    }

    const 表达式 = await this.获取表达式()
    if (!表达式) {
      return
    }

    this.添加到历史记录(表达式)
    await this.添加并保存表达式(文档, 表达式)
    await this.启动调试会话(文档.uri.fsPath)
    await this.恢复文件内容并保存(文档)
  }

  // 检查是否为 TypeScript 文件
  private 是否是TypeScript文件(文档: vscode.TextDocument): boolean {
    return 文档.languageId === 'typescript' || 文档.languageId === 'typescriptreact'
  }

  // 获取用户输入的表达式
  private async 获取表达式(): Promise<string | undefined> {
    const 选择的表达式 = await vscode.window.showQuickPick(this.历史记录, {
      placeHolder: '选择一个历史记录, 或按ESC输入新的表达式',
      canPickMany: false,
      matchOnDescription: true,
    })

    if (选择的表达式) {
      return 选择的表达式
    }

    return await vscode.window.showInputBox({
      prompt: '请输入要添加并运行的表达式, 可使用当前文件的上下文',
      placeHolder: '例如 console.log("Hello World")',
    })
  }

  // 启动调试会话
  private async 启动调试会话(文件路径: string): Promise<void> {
    return new Promise(async (res, _rej) => {
      const 调试配置: vscode.DebugConfiguration = {
        type: 'node',
        request: 'launch',
        name: 'Debug TypeScript File',
        program: 文件路径,
        runtimeExecutable: 'npx',
        runtimeArgs: ['tsx'],
        console: 'integratedTerminal',
        internalConsoleOptions: 'neverOpen',
      }

      const 调试会话 = await vscode.debug.startDebugging(vscode.workspace.workspaceFolders![0], 调试配置)

      if (调试会话) {
        // 监听调试会话结束事件
        const 结束监听器 = vscode.debug.onDidTerminateDebugSession(async () => {
          结束监听器.dispose()
          res()
        })
        this.上下文.subscriptions.push(结束监听器)
      }
    })
  }

  // 将新的表达式添加到历史记录中
  private 添加到历史记录(表达式: string): void {
    // 如果历史记录中已存在该表达式，先移除
    const index = this.历史记录.indexOf(表达式)
    if (index !== -1) {
      this.历史记录.splice(index, 1) // 移除已有表达式
    }
    // 将新表达式插入到最前面
    this.历史记录.unshift(表达式)
    if (this.历史记录.length > 历史记录限制) {
      this.历史记录.pop() // 超过限制时移除最后一个
    }
  }

  // 将表达式添加到文件末尾并保存
  private async 添加并保存表达式(文档: vscode.TextDocument, 表达式: string): Promise<void> {
    this.原始文本 = 文档.getText()
    const 新文本 = `${this.原始文本}\n\n${表达式}\n`
    const 编辑 = new vscode.WorkspaceEdit()
    const 文件范围 = new vscode.Range(0, 0, 文档.lineCount, 文档.lineAt(文档.lineCount - 1).range.end.character)
    编辑.replace(文档.uri, 文件范围, 新文本)
    await vscode.workspace.applyEdit(编辑)
  }

  // 恢复文件内容并保存
  private async 恢复文件内容并保存(文档: vscode.TextDocument): Promise<void> {
    const 编辑 = new vscode.WorkspaceEdit()
    const 文件范围 = new vscode.Range(0, 0, 文档.lineCount, 文档.lineAt(文档.lineCount - 1).range.end.character)
    编辑.replace(文档.uri, 文件范围, this.原始文本)
    await vscode.workspace.applyEdit(编辑)
    await vscode.commands.executeCommand('workbench.action.files.save')
  }
}
