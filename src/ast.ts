import ts from 'typescript'

export class TypeScriptASTHelper {
  private sourceFile: ts.SourceFile

  constructor(sourceFile: ts.SourceFile) {
    this.sourceFile = sourceFile
  }

  public 查找顶级函数(): ts.FunctionDeclaration[] {
    const 顶级函数: ts.FunctionDeclaration[] = []
    const 查找器 = (node: ts.Node): void => {
      if (ts.isFunctionDeclaration(node)) {
        顶级函数.push(node)
      }
      ts.forEachChild(node, 查找器)
    }
    ts.forEachChild(this.sourceFile, 查找器)
    return 顶级函数
  }

  public 查找顶级类(): ts.ClassDeclaration[] {
    const 顶级类: ts.ClassDeclaration[] = []
    const 查找器 = (node: ts.Node): void => {
      if (ts.isClassDeclaration(node)) {
        顶级类.push(node)
      }
      ts.forEachChild(node, 查找器)
    }
    ts.forEachChild(this.sourceFile, 查找器)
    return 顶级类
  }

  public 查找类中的静态方法(顶级类: ts.ClassDeclaration[]): ts.MethodDeclaration[] {
    const 静态方法: ts.MethodDeclaration[] = []
    顶级类.forEach((类) => {
      ts.forEachChild(类, (node) => {
        if (ts.isMethodDeclaration(node) && node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.StaticKeyword)) {
          静态方法.push(node)
        }
      })
    })
    return 静态方法
  }

  public 查找类中的实例方法(顶级类: ts.ClassDeclaration[]): ts.MethodDeclaration[] {
    const 实例方法: ts.MethodDeclaration[] = []
    顶级类.forEach((类) => {
      ts.forEachChild(类, (node) => {
        if (ts.isMethodDeclaration(node) && !node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.StaticKeyword)) {
          实例方法.push(node)
        }
      })
    })
    return 实例方法
  }

  public 查找光标位置的节点(
    光标偏移: number,
    顶级函数: ts.FunctionDeclaration[],
    静态方法: ts.MethodDeclaration[],
    实例方法: ts.MethodDeclaration[],
  ): ts.Node | undefined {
    const 节点在范围内 = (节点: ts.Node): boolean => {
      const 开始位置 = 节点.getStart()
      const 结束位置 = 节点.getEnd()
      return 光标偏移 >= 开始位置 && 光标偏移 <= 结束位置
    }

    for (const 函数 of 顶级函数) {
      if (节点在范围内(函数)) return 函数
    }

    for (const 方法 of 静态方法) {
      if (节点在范围内(方法)) return 方法
    }

    for (const 方法 of 实例方法) {
      if (节点在范围内(方法)) return 方法
    }

    return undefined
  }

  public 根据节点生成表达式(节点: ts.Node): string | undefined {
    if (ts.isFunctionDeclaration(节点) && 节点.name) {
      return `${节点.name.getText()}()`
    } else if (ts.isMethodDeclaration(节点) && ts.isIdentifier(节点.name)) {
      const 类声明 = 节点.parent as ts.ClassDeclaration
      if (ts.isClassDeclaration(类声明) && 类声明.name) {
        const 类名 = 类声明.name.getText()
        if (节点.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.StaticKeyword)) {
          return `${类名}.${节点.name.getText()}()`
        } else {
          return `new ${类名}().${节点.name.getText()}()`
        }
      }
    }
    return undefined
  }
}
