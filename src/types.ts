import z from 'zod'

export const 配置文件模式 = z.object({ env: z.record(z.string()) })
export type 配置文件类型 = z.infer<typeof 配置文件模式>
