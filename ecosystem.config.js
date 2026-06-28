module.exports = {
  apps: [{
    name: 'rugby-dinamo',
    script: 'node_modules/.bin/next',
    args: 'start',
    exec_mode: 'fork',
    cwd: '/mnt/HC_Volume_105236627/www/rugby-dinamo',
    env: {
      NODE_ENV: 'production',
      PORT: 3003,
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
  }]
}
