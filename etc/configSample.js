const config = {
  local_port: "3000",
  db_host: "",
  db_user: "apvuser",
  db_password: "",
  db_name: "apv",
  db_prefix: "pattern",
  configTTL: 120,
  botToken: "5478135924:AAEIN8IIsdhaauOubTcdUMD2SUVT_wc3Ly0",
  sync_TTL: 3600,
  sync_CheckPeriod: 60,
  sync_LinkDevice: 1000,
  sync_offlineCode: 1001,
  sync_onlineCode: 1002,
  offlineReminderSheduler: "0 8 * * *",
  daylyStatisticSheduler: "0 1 * * *",
};

module.exports = config;
