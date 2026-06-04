module.exports = {
  apps: [{
    name: 'agentes-ui',
    cwd: '/home/totum/totum-agentes',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3003',
    interpreter: '/root/.nvm/versions/node/v22.22.3/bin/node',
    env: { NODE_ENV: 'production' },
    max_memory_restart: '600M',
    autorestart: true,
    watch: false,
    out_file: '/var/log/agentes-ui.out.log',
    error_file: '/var/log/agentes-ui.err.log',
  }],
};
