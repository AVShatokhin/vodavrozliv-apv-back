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
    getAPVsnList: `SELECT sn FROM apv`,
    getKrugConfig: `SELECT krug_id, brig_id, title from krug`,
    getBrigConfig: `SELECT brig_id, brigMembers, brigKey, brigPhone, brigCar, brigName from brig`,
    getEngConfig: `SELECT uid, extended, email FROM ${config.db_prefix}_users WHERE roles like CONCAT('%',?,'%') order by uid`,
    kvsReplace: `REPLACE INTO kvs SET link=?, value=?`,
    kvsGet: `SELECT value FROM kvs WHERE link=?;`,
    appendMain: `INSERT INTO main (sn, FLAG_start, version, w, k, r, m, m1, m2, m5, m10, FLAG_error_m1, FLAG_error_m2, FLAG_error_m5, FLAG_error_m10, tSOLD, tREMAIN, c, v1, v2, v3, v4, dv1, dv2, dv3, dv4, dv5, f, errorDevice, errorCode, messCode, FLAG_k_off, FLAG_r_off, FLAG_m_off, FLAG_c_off, FLAG_t_off, FLAG_f_off) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
    getAllMainLastDay: `SELECT sn, lts, v2 FROM main where  DATE(DATE_SUB(now(), INTERVAL 1 DAY)) = DATE(lts) AND errorDevice!=${config.sync_LinkDevice}`,
    replaceStats: `REPLACE INTO dayly_stats SET daylySellValue=?, sn=?, date=DATE(?)`,
    updateChargeInfo: `UPDATE apv SET chargeInfo=? WHERE sn=?`,
    insertErrorStats: `INSERT INTO error_stat SET sn=?, errorCode=?, errorDevice=?, enabled=?`,
    insertFreeWaterStats: `INSERT INTO free_stat SET sn=?, FLAG_f_off=?, f=?`,
    updateDelta: `UPDATE delta SET nal=nal+?, eq=eq+?, tSOLD=tSOLD+?, w=w+? WHERE date=? and sn=?`,
    insertDelta: `INSERT INTO delta SET nal=?, eq=?, tSOLD=?, w=?, date=?, sn=?`,
    updateInkasLts: `UPDATE apv SET inkassLts=now() WHERE sn=?`,
  };
};
