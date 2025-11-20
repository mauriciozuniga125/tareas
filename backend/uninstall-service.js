const { Service } = require('node-windows');
const path = require('path');

const svc = new Service({
  name: 'SistematareasBackend',
  script: path.join(__dirname, 'index.js'),
});

svc.on('uninstall', () => { process.exit(0); });
svc.uninstall();
