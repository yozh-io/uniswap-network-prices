module.exports = {
  apps: [
    {
      name: 'hedge',
      script: 'createHedge.js',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/log/hedge/comparer.err.log',
      out_file: '/var/log/hedge/comparer.out.log',
      combine_logs: true,
      merge_logs: true,
    },
  ],
};
