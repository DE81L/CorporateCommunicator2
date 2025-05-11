import { Project, SyntaxKind } from 'ts-morph'

const project = new Project({ tsConfigFilePath: 'tsconfig.server.json' })

for (const file of project.getSourceFiles()) {
  for (const fn of [
    ...file.getFunctions(),
    ...file.getVariableDeclarations()
      .filter(v => v.getInitializerIfKind(SyntaxKind.ArrowFunction))
  ]) {
    if (fn.getDecorators().some(d => d.getName() === 'Log')) continue
    fn.addDecorator({ name: 'Log', arguments: [] })
  }
}
await project.save()
console.log('✓ instrumentation complete')
