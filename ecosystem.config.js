module.exports = {
  apps: [
    {
      name: "bookstore",
      script: "server.js",
      instances: "max", // Использовать все CPU ядра
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "/var/log/bookstore/error.log",
      out_file: "/var/log/bookstore/access.log",
      log_file: "/var/log/bookstore/combined.log",
      time: true,
      max_memory_restart: "1G",
      node_args: "--max-old-space-size=1024",
      watch: false,
      ignore_watch: ["node_modules", "logs", ".git"],
      restart_delay: 4000,
      min_uptime: "10s",
      max_restarts: 10,
    },
  ],
};
