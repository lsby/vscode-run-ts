import * as vscode from 'vscode'

var 插件名称 = 'playground-vscode-plugin'

export function activate(context: vscode.ExtensionContext): void {
  console.log(`${插件名称}: 插件开始运行`)

  context.subscriptions.push(
    vscode.commands.registerCommand(`${插件名称}.helloWorld`, async () => {
      await vscode.window.showInformationMessage(`Hello World!`)
    }),
  )
}

export function deactivate(): void {}
