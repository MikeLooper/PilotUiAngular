const path = require('node:path');
const { spawnSync } = require('node:child_process');

const file = process.argv[2];
if (!file) {
  console.error('Expected an active editor file path.');
  process.exit(1);
}

const specFile = file.endsWith('.spec.ts')
  ? file
  : file.endsWith('.ts')
    ? file.replace(/\.ts$/, '.spec.ts')
    : file;
const ngCli = path.resolve(__dirname, '../node_modules/@angular/cli/bin/ng.js');
const result = spawnSync(
  process.execPath,
  [ngCli, 'test', '--watch=false', ...process.argv.slice(3), '--include', specFile],
  { stdio: 'inherit' },
);

process.exit(result.status ?? 1);
