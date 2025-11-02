🧩 1. Обновляем систему
sudo apt update && sudo apt upgrade -y

⚙️ 2. Устанавливаем Node.js + npm

Удобнее через NodeSource (последняя LTS-версия):

curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs


Проверяем:

node -v
npm -v

🗄️ 3. Устанавливаем PostgreSQL
sudo apt install -y postgresql postgresql-contrib


Проверяем статус:

sudo systemctl status postgresql


(Чтобы выйти из статуса — q.)

4. Создаём базу данных и пользователя

Входим под postgres:

sudo -u postgres psql


В консоли PostgreSQL выполняем:

CREATE DATABASE myappdb;
CREATE USER myappuser WITH ENCRYPTED PASSWORD 'mypassword';
GRANT ALL PRIVILEGES ON DATABASE myappdb TO myappuser;
\q


(Замени myappdb, myappuser, mypassword на свои.)

📁 5. Клонируем и настраиваем проект

Если проект на GitHub:

git clone https://github.com/yourname/yourproject.git
cd yourproject


Создай файл .env (если используется dotenv):

nano .env


Пример .env:

DB_HOST=localhost
DB_PORT=5432
DB_NAME=myappdb
DB_USER=myappuser
DB_PASS=mypassword
PORT=3000

📦 6. Устанавливаем зависимости
npm install

🧠 7. Настройка Sequelize (если используется)

В файле config/config.js или src/db.js:

import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
  }
);

export default sequelize;


Проверка подключения:

node
> import sequelize from './src/db.js'
> await sequelize.authenticate()
> console.log('Connected!')

🚀 8. Запуск приложения

Обычно команда:

npm start


или

node server.js

