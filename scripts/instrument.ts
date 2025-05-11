import { Project } from 'ts-morph';
const project = new Project({ tsConfigFilePath: 'server/tsconfig.server.json' });

project.getSourceFiles('server/src/**/*.ts').forEach(sf => {
  if (sf.getFilePath().includes('node_modules')) return;
  const funcs = [...sf.getFunctions(), ...sf.getClasses().flatMap(c => c.getMethods())];
  funcs.forEach(fn => {
    if (fn.getDecorator('Trace')) return;
    fn.addDecorator({ name: 'Trace', arguments: [] });
  });
  if (!sf.getImportDeclaration(d => d.getModuleSpecifierValue() === '../util/trace')) {
    sf.addImportDeclaration({ namedImports: ['Trace'], moduleSpecifier: '../util/trace' });
  }
});
project.saveSync();
