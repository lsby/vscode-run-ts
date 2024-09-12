import ts from 'typescript'
import * as vscode from 'vscode'
import { TypeScriptASTHelper } from './ast'

const 插件名称 = 'lsby-vscode-run-ts'
const 历史记录限制 = 10
const 注释前缀 = '// LSBY-VSCODE-RUN-TS-DEBUG-START'
const 注释后缀 = '// LSBY-VSCODE-RUN-TS-DEBUG-END'

export function activate(context: vscode.ExtensionContext): void {
  console.log(`${插件名称}: 插件开始运行`)
  const 类型脚本运行器 = new TypeScriptRunner(context)
  类型脚本运行器.注册命令()
}

export function deactivate(): void {}

class TypeScriptRunner {
  private 上下文: vscode.ExtensionContext
  private 历史记录: string[] = []

  constructor(上下文: vscode.ExtensionContext) {
    this.上下文 = 上下文
  }

  public 注册命令(): void {
    const 命令处理器 = vscode.commands.registerCommand(`${插件名称}.runInCurrentFile`, async () => {
      await this.在当前文件运行()
    })

    this.上下文.subscriptions.push(命令处理器)
  }

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

    const 光标位置 = 编辑器.selection.active
    const 表达式 = await this.生成或获取表达式(文档, 光标位置)
    if (!表达式) {
      return
    }

    this.添加到历史记录(表达式)
    await this.添加表达式并保存(文档, 表达式)
    await this.启动调试会话(文档.uri.fsPath)
    await this.删除添加的部分(文档)
  }

  private 是否是TypeScript文件(文档: vscode.TextDocument): boolean {
    return 文档.languageId === 'typescript' || 文档.languageId === 'typescriptreact'
  }

  private async 生成或获取表达式(文档: vscode.TextDocument, 光标位置: vscode.Position): Promise<string | undefined> {
    const 选择的表达式 = await vscode.window.showQuickPick(this.历史记录, {
      placeHolder: '选择一个历史记录, 或按ESC输入新的表达式',
      canPickMany: false,
      matchOnDescription: true,
    })

    if (选择的表达式) {
      return 选择的表达式
    }

    const 源代码 = 文档.getText()
    const 源文件 = ts.createSourceFile(文档.fileName, 源代码, ts.ScriptTarget.Latest, true)
    const ast处理器 = new TypeScriptASTHelper(源文件)

    const 顶级函数 = ast处理器.查找顶级函数()
    const 顶级类 = ast处理器.查找顶级类()
    const 类中的静态方法 = ast处理器.查找类中的静态方法(顶级类)
    const 类中的实例方法 = ast处理器.查找类中的实例方法(顶级类)

    const 光标偏移 = 文档.offsetAt(光标位置)
    const 节点 = ast处理器.查找光标位置的节点(光标偏移, 顶级函数, 类中的静态方法, 类中的实例方法)

    var 生成的表达式: string | undefined
    if (节点) {
      生成的表达式 = ast处理器.根据节点生成表达式(节点)
    }

    return await vscode.window.showInputBox({
      prompt: '请输入要添加并运行的表达式, 可使用当前文件的上下文',
      placeHolder: '例如 console.log("Hello World")',
      value: 生成的表达式 || '',
    })
  }

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
        const 结束监听器 = vscode.debug.onDidTerminateDebugSession(async () => {
          结束监听器.dispose()
          res()
        })
        this.上下文.subscriptions.push(结束监听器)
      }
    })
  }

  private 添加到历史记录(表达式: string): void {
    const index = this.历史记录.indexOf(表达式)
    if (index !== -1) {
      this.历史记录.splice(index, 1)
    }
    this.历史记录.unshift(表达式)
    if (this.历史记录.length > 历史记录限制) {
      this.历史记录.pop()
    }
  }

  private async 添加表达式并保存(文档: vscode.TextDocument, 表达式: string): Promise<void> {
    const 添加位置 = new vscode.Position(文档.lineCount, 0)
    const 表达式内容 = `${注释前缀}\n${表达式}\n${注释后缀}`
    const 新文本 = `\n${表达式内容}\n`
    const 编辑 = new vscode.WorkspaceEdit()
    编辑.replace(文档.uri, new vscode.Range(添加位置, 添加位置), 新文本)
    await vscode.workspace.applyEdit(编辑)
  }

  private async 删除添加的部分(文档: vscode.TextDocument): Promise<void> {
    const 文档文本 = 文档.getText()
    const startIndex = 文档文本.indexOf(注释前缀)
    const endIndex = 文档文本.indexOf(注释后缀, startIndex) + 注释后缀.length

    if (startIndex === -1 || endIndex === -1) {
      return
    }

    const 编辑 = new vscode.WorkspaceEdit()
    编辑.delete(文档.uri, new vscode.Range(文档.positionAt(startIndex), 文档.positionAt(endIndex)))
    await vscode.workspace.applyEdit(编辑)
    await vscode.commands.executeCommand('workbench.action.files.save')
  }
}
