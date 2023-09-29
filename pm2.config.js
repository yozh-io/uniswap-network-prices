module.exports = {
  apps: [
    {
      name: 'comparer',
      script: 'index.js',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/log/pm2/comparer.err.log',
      out_file: '/var/log/pm2/comparer.out.log',
      combine_logs: true,
      merge_logs: true,
    },
  ],
};
