# vodavrozliv-apv-back
back-end для связи с АПВ в рамках проекта "Ключ здоровья"

# Порядок установки

* yum -y install epel-release
* yum -y update
* yum -y install docker
* yum -y install net-tools
* systemctl enable docker
* systemctl start docker
* yum -y install git
* adduser webmaster
* cd /home/webmaster/
* git clone https://github.com/AVShatokhin/vodavrozliv-apv-back.git
* curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
* source ~/.bash_profile
* nvm install 14.16.1
* cd /home/webmaster/vodavrozliv-apv-back
* npm install
* firewall-cmd --add-port=3000/tcp --permanent
* firewall-cmd --reload
* cd /home/webmaster/vodavrozliv-apv-back/dockers
* ./nodejs.linux

# Установка утилит СУБД, запуск и инициализация СУБД

* yum install -y mysql
* cd /home/webmaster/vodavrozliv-apv-back/dockers
* vi ./my.linux - **меняем пароль**
* ./my.linux
* cat /home/webmaster/vodavrozliv-apv-back/sql/apv.sql | mysql -h 127.0.0.1 -p3306 -u[**USER**] -p[**PASSWORD**]

# Настройка и запуск основного приложения

* git clone https://github.com/AVShatokhin/node-pattern.git /home/webmaster/vodavrozliv/
* cat /home/webmaster/vodavrozliv/sql/pattern_tables.sql | mysql -h 127.0.0.1 -p3306 -u[**USER**] -p[**PASSWORD**] -A apv
* cd /home/webmaster/vodavrozliv/
* npm install
* **по отдельной инструкции собираем приложение и копируем в /home/webmaster/vodavrozliv/public/**
* vi /home/webmaster/vodavrozliv/sql/grant.sql - **изменяем данные для доступа к СУБД**
* /home/webmaster/vodavrozliv/sql/grant.sql | mysql -h 127.0.0.1 -p3306 -u[**USER**] -p[**PASSWORD**]
* vi /home/webmaster/vodavrozliv/config.js - **вносим данные для доступа к СУБД**
* cd /home/webmaster/vodavrozliv/docker/
* ./nodejs.linux
