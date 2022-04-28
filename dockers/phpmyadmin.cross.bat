docker stop apv-phpmyadmin
docker rm apv-phpmyadmin
docker run -it -d -e MYSQL_ROOT_PASSWORD=apvMysqlPassword -e PMA_HOST=apv-db --link apv-db -p 8080:80 --name apv-phpmyadmin phpmyadmin
