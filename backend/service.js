const { Service } = require('node-windows');
const path = require('path');

const svc = new Service({
  name: 'SistematareasBackend',
  description: 'Backend Express de Sistematareas',
  script: path.join(__dirname, 'index.js'),
  workingDirectory: path.join(__dirname),
  nodeOptions: ['--max_old_space_size=256'],
  env: [{ name: 'PORT', value: '3000' }],
  logpath: path.join(__dirname, 'logs'),
});

svc.on('install', () => { svc.start(); });
svc.install();
