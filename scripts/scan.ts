import ts from 'typescript';

const program = ts.createProgram(['client/tsconfig.json', 'server/tsconfig.server.json'], {});
for (const diag of ts.getPreEmitDiagnostics(program)) {
  console.error(ts.flattenDiagnosticMessageText(diag.messageText, '\n'));
  console.error('  at', diag.file?.fileName, 'line', diag.start && diag.file?.getLineAndCharacterOfPosition(diag.start).line + 1);
}
process.exit(program.getSemanticDiagnostics().length ? 1 : 0);
