module.exports = (config) => {
  let setOfflineApvs = (offlines) => {
    return `UPDATE apv set online=false WHERE ${sqlFromArray(
      "sn",
      offlines,
      0
    )}`;
  };

  let sqlFromArray = (column, array, defaultValue) => {
    let __processingArray = [];
    if (array?.length > 0) {
      array.forEach((value) => {
        __processingArray.push(` ${column}="${value}" `);
      });

      return "(" + __processingArray.join("or") + ")";
    } else {
      return defaultValue;
    }
  };

  let getKVSbySN = (SNs) => {
    return `SELECT link as sn, value as data FROM kvs where ${sqlFromArray(
      "link",
      SNs,
      0
    )}`;
  };

  return {
    getAPVconfig: `SELECT sn, address, tgLink, snEQ, activeKrug, online FROM apv`,
    getKrugConfig: `SELECT krug_id, brig_id, title from krug`,
    getBrigConfig: `SELECT brig_id, brigMembers, brigKey, brigPhone, brigCar, brigName from brig`,
    getEngConfig: `SELECT uid, extended, email FROM ${config.db_prefix}_users WHERE roles like CONCAT('%',?,'%') order by uid`,
    kvsReplace: `REPLACE INTO kvs SET link=?, value=?`,
    kvsGet: `SELECT value FROM kvs WHERE link=?;`,
    appendMain: `INSERT INTO main (sn, FLAG_start, version, w, k, r, m, m1, m2, m5, m10, FLAG_error_m1, FLAG_error_m2, FLAG_error_m5, FLAG_error_m10, tSOLD, tREMAIN, c, v1, v2, v3, v4, dv1, dv2, dv3, dv4, dv5, errorDevice, errorCode, messCode, FLAG_k_off, FLAG_r_off, FLAG_m_off, FLAG_c_off, FLAG_t_off) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    appendMainOnlineOffline: `INSERT INTO main (sn, errorDevice, errorCode) VALUES (?, ?, ?)`,
    updateApv: `UPDATE apv SET version=?, cost=?, phone=?, linkState=?, oper=?, lts=now(), a=?, online=true WHERE sn=?`,
    appendInkas: `INSERT INTO inkas (dateUnique, sn, inkas_number, date, krug_name, address, version, inkas, kup, box, rd, op, op_extended, op_state) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    getMessages: `SELECT messCode, isActive, messText FROM message`,
    getDevices: `SELECT errorDevice, deviceName FROM device`,
    getErrors: `SELECT errorCode, isActive, errorText FROM error`,
    getCmdProfile: `SELECT cmdProfile from apv where sn=?`,
    appendCmds: `INSERT INTO cmds (sn, userData, cmd) VALUES (?,?,?)`,
    dropCmdProfile: `UPDATE apv SET cmdProfile=? WHERE sn=?`,
    getOnlineApvs: `SELECT sn, online FROM apv`,
    getOfflineApvs: `SELECT sn, tgLink FROM apv WHERE TIME_TO_SEC(TIMEDIFF(now(), lts)) > ? and online=true`,
    setOfflineApvs,
    getReminder: `SELECT value FROM kvs WHERE link=?`,
    getKVSbySN,
    //appendInkas: `INSERT INTO inkas (sn, inkas_number, date, version, inkas, kup, box, op, op_extended, FLAG_op_failed) VALUES (?,?,?,?,?,?,?,?,?, true)`,
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
