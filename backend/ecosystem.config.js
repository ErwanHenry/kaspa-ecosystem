module.exports = {
  apps: [{
    name: "kaspa-ecosystem-backend",
    script: "./kaspa-backend.js",
    instances: 1,
    exec_mode: "fork",
    watch: false,
    max_memory_restart: "500M",
    env: {
      NODE_ENV: "production"
    },
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    log_file: "./logs/combined.log",
    time: true,
    cron_restart: "0 6 * * *"
  }]
};
