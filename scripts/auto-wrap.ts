import type { API, FileInfo, Identifier, VariableDeclarator } from 'jscodeshift';

module.exports = function transformer(file: FileInfo, api: API) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // обрабатываем только серверные файлы .ts/.tsx
  if (!file.path.includes('/server/src/')) return null;

  const withLoggingImport = j.importDeclaration(
    [j.importSpecifier(j.identifier('withLogging'))],
    j.literal('../util/withLogging')
  );

  root.find(j.ExportNamedDeclaration).forEach(path => {
    const decl = path.value.declaration;
    if (decl && (decl.type === 'FunctionDeclaration' || decl.type === 'VariableDeclaration')) {
      const name =
        decl.type === 'FunctionDeclaration'
          ? decl.id!.name
          : ((decl.declarations[0] as VariableDeclarator).id as Identifier).name;

      const wrapCall = j.callExpression(j.identifier('withLogging'), [j.identifier(name)]);
      const newDecl =
        decl.type === 'FunctionDeclaration'
          ? j.variableDeclaration('const', [
              j.variableDeclarator(j.identifier(name), wrapCall)
            ])
          : j.variableDeclaration('const', [
              j.variableDeclarator(j.identifier(name), wrapCall)
            ]);

      path.replace(j.exportNamedDeclaration(newDecl, [j.exportSpecifier(j.identifier(name), j.identifier(name))]));
    }
  });

  // добавляем импорт, если его нет
  if (!root.find(j.ImportDeclaration, { source: { value: '../util/withLogging' } }).size()) {
    root.get().node.program.body.unshift(withLoggingImport);
  }

  return root.toSource({ quote: 'single' });
};
