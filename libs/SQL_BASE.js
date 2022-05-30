module.exports = (config) => {
  return {
    getAPVconfig: `SELECT sn, address FROM apv`,
    kvsReplace: `REPLACE INTO kvs SET link=?, value=?`,
    kvsGet: `SELECT value FROM kvs WHERE link=?;`,
    appendMain: `INSERT INTO main (sn, FLAG_start, w, k, r, m, m1, m2, m5, m10, c, errorDevice, errorCode, messCode, FLAG_k_off, FLAG_r_off, FLAG_m_off, FLAG_c_off) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    // Login: `SELECT uid, email, roles, blocked, confirmed, extended from ${config.db_prefix}_users where email=? and pass_hash=md5(?)`,
    // Register: `INSERT into ${config.db_prefix}_users set roles='["${config.default_user_role}"]', email=?, pass_hash=md5(?), extended=?`,
    // Confirm: `UPDATE ${config.db_prefix}_users, ${config.db_prefix}_tokens set confirmed=true where ${config.db_prefix}_users.uid=${config.db_prefix}_tokens.uid and token=?`,
    // Recover: `SELECT uid from ${config.db_prefix}_users where email=?`,
    // setPassword: `UPDATE ${config.db_prefix}_users set pass_hash=md5(?) where uid=?`,
    // changePassword: `UPDATE ${config.db_prefix}_users set pass_hash=md5(?) where pass_hash=md5(?) and uid=?`,
    // AddToken: `INSERT into ${config.db_prefix}_tokens set uid=?, token=?`,
    // deleteToken: `DELETE from ${config.db_prefix}_tokens where token=?`,
    // sessionGetUserByToken: `SELECT ${config.db_prefix}_users.uid, email, roles, blocked, confirmed, extended, token from ${config.db_prefix}_users, ${config.db_prefix}_tokens where token=? and ${config.db_prefix}_users.uid=${config.db_prefix}_tokens.uid`,
    // saveProfile: `UPDATE ${config.db_prefix}_users, ${config.db_prefix}_tokens set extended=? where ${config.db_prefix}_users.uid=${config.db_prefix}_tokens.uid and token=?`,
  };
};
