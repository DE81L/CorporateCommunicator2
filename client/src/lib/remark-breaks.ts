// Локальное определение типа плагина, чтобы не тянуть зависимость unified
type Plugin = () => (tree: Node) => void

type Node = {
  type: string
  value?: string
  children?: Node[]
}

function transform(node: Node): Node {
  if (!node.children) return node

  const result: Node[] = []
  for (const child of node.children) {
    if (child.type === 'text' && child.value && child.value.includes('\n')) {
      const parts = child.value.split(/\r?\n/)
      parts.forEach((part, index) => {
        if (index > 0) result.push({ type: 'break' })
        if (part) result.push({ type: 'text', value: part })
      })
    } else {
      result.push(transform(child))
    }
  }
  node.children = result
  return node
}

const remarkBreaks: Plugin = () => (tree: Node) => {
  transform(tree)
}

export default remarkBreaks
