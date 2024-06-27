mysqldump --host=127.0.0.1 -papvMysqlPassword --no-data -R apv >> /home/webmaster/mysqlDumps/structure.sql
mysqldump --host=127.0.0.1 -papvMysqlPassword --no-create-info apv >> /home/webmaster/mysqlDumps/data.sql
