DELETE FROM main WHERE UNIX_TIMESTAMP(now()) - UNIX_TIMESTAMP(lts) > 2*90*24*3600;
DELETE FROM inkas WHERE UNIX_TIMESTAMP(now()) - UNIX_TIMESTAMP(lts) > 2*90*24*3600;
DELETE FROM cmds WHERE UNIX_TIMESTAMP(now()) - UNIX_TIMESTAMP(lts) > 2*90*24*3600;
DELETE FROM cashier_inkass WHERE UNIX_TIMESTAMP(now()) - UNIX_TIMESTAMP(lts) > 2*90*24*3600;
DELETE FROM dayly_stats WHERE UNIX_TIMESTAMP(now()) - UNIX_TIMESTAMP(lts) > 2*90*24*3600;
