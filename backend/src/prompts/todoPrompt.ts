// 待办感知系统提示词（只读，对应 FR-013 与 US4）
export interface TodoItemSnapshot {
  id: string
  text: string
  done: boolean
}

export function buildTodoSystemContent(items: TodoItemSnapshot[]): string {
  if (items.length === 0) {
    return [
      '以下是用户当前待办列表（只读）：',
      '当前没有待办事项。',
      '若用户询问待办情况，请如实告知当前没有待办，不得虚构。',
    ].join('\n')
  }
  const lines = items.map((t, i) => `${i + 1}. ${t.done ? '[已完成] ' : '[未完成] '}${t.text}`)
  return [
    '以下是用户当前待办列表（只读，仅供你参考；你不得新增、修改或完成任何待办）：',
    ...lines,
    '请结合待办内容回答：可主动总结进度、给出优先级建议、提醒未完成事项。',
    '引用待办时须与实际内容完全一致，不得虚构或推断不存在的待办。',
  ].join('\n')
}
