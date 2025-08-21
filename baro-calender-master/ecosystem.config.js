module.exports = {
  apps: [
    {
      name: 'baro-calendar-backend',
      script: 'src/server.js',
      cwd: './',
      watch: ['src'],
      ignore_watch: ['node_modules', 'logs', '*.log'],
      env: {
        NODE_ENV: 'development',
        PORT: 8000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8000
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '1G',
      log_file: './logs/backend.log',
      out_file: './logs/backend-out.log',
      error_file: './logs/backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true
    },
    {
      name: 'baro-calendar-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './client',
      watch: ['src', 'public'],
      ignore_watch: ['node_modules', '.next', '*.log'],
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '1G',
      log_file: '../logs/frontend.log',
      out_file: '../logs/frontend-out.log',
      error_file: '../logs/frontend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true
    }
  ]
};
