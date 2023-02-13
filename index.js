const cp = require('child_process');
const path = require('path');

const INSTALL_SCRIPT = path.join(__dirname, 'install.js');
const UNINSTALL_SCRIPT = path.join(__dirname, 'uninstall.js');

function install(options = {}) {
  const result = cp.spawnSync(
    'node',
    [
      INSTALL_SCRIPT,
      ...(options.silent ? ['--silent'] : []),
    ],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) {
    throw new Error('Install git-commit-msg-linter failed!');
  }
}

function uninstall() {
  const result = cp.spawnSync('node', [UNINSTALL_SCRIPT], { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error('Uninstall git-commit-msg-linter failed!');
  }
}

exports.install = install;
exports.uninstall = uninstall;
