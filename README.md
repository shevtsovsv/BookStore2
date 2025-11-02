# 📚 BookStore2 - Интернет-магазин книг

Современный веб-магазин книг с полной системой аутентификации, корзиной покупок и адаптивным дизайном.

## � Особенности

- ✅ **Система аутентификации** - регистрация, вход, JWT токены
- ✅ **Корзина покупок** - добавление, удаление, изменение количества
- ✅ **Каталог книг** - фильтрация, пагинация, поиск
- ✅ **Адаптивный дизайн** - работает на всех устройствах
- ✅ **REST API** - полноценный backend на Node.js
- ✅ **База данных** - PostgreSQL с Sequelize ORM
- ✅ **Безопасность** - хеширование паролей, защищенные маршруты

## 🛠 Технологии

### Frontend

- **HTML5** - семантическая разметка
- **CSS3** - современные стили, Grid, Flexbox
- **JavaScript ES6+** - модульная архитектура
- **Адаптивный дизайн** - Mobile-first подход

### Backend

- **Node.js** - серверная платформа
- **Express.js** - веб-фреймворк
- **Sequelize ORM** - работа с базой данных
- **JWT** - аутентификация
- **bcrypt** - хеширование паролей
- **CORS** - поддержка кросс-доменных запросов

### База данных

- **PostgreSQL** - основная БД
- **Миграции** - структурированное управление схемой
- **Сидеры** - начальные данные

## 🚀 Установка и запуск

### Предварительные требования

- Node.js (версия 14 или выше)
- PostgreSQL (версия 12 или выше)
- npm или yarn

### 1. Клонирование репозитория

```bash
git clone https://github.com/ВАШ_USERNAME/BookStore2.git
cd BookStore2
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка базы данных

Создайте базу данных PostgreSQL:

```bash
# Через psql
createdb bookstore

# Или через SQL
psql -U postgres
CREATE DATABASE bookstore;
\q
```

### 4. Настройка переменных окружения

**Важно!** Создайте файл `.env` на основе шаблона:

```bash
# Windows PowerShell
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Откройте `.env` и настройте переменные:

```properties
NODE_ENV=development
PORT=3000
JWT_SECRET=your-unique-secret-key-change-this
JWT_EXPIRES_IN=7d

# База данных PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bookstore
DB_USER=postgres
DB_PASSWORD=your-password

BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000
```

📖 **Подробная документация**: [GUIDES/27_ENVIRONMENT_VARIABLES.md](GUIDES/27_ENVIRONMENT_VARIABLES.md)

### 5. Применение миграций и заполнение данными

```bash
# Выполните миграции
npx sequelize-cli db:migrate

# Или через npm скрипт
npm run db:migrate

# Загрузите начальные данные
npx sequelize-cli db:seed:all

# Или через npm скрипт
npm run db:seed
```

### 6. Запуск проекта

```bash
# Запуск сервера
npm start

# Или для разработки с автоперезагрузкой
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

## 📚 Пошаговая документация

Проект содержит подробные руководства:

- **[00_PROJECT_CREATION_GUIDE.md](GUIDES/00_PROJECT_CREATION_GUIDE.md)** - Полное пошаговое руководство по созданию проекта с нуля
- **[27_ENVIRONMENT_VARIABLES.md](GUIDES/27_ENVIRONMENT_VARIABLES.md)** - Настройка переменных окружения (.env файл)
- **[Шаг 1: Инициализация проекта](step1.md)** - Настройка Node.js, установка зависимостей, создание миграций и моделей
- **[Шаг 2: Создание и заполнение БД](step2.md)** - Создание базы данных, применение миграций, заполнение тестовыми данными
- **[Шаг 3: Разработка API endpoints](step3.md)** _(в разработке)_ - Создание API маршрутов для аутентификации, книг и корзины

## 📁 Структура проекта

```
lab_2_sequelize 1-3-1/
├── config/
│   └── config.json           # Конфигурация БД для Sequelize
├── migrations/               # Миграции базы данных
│   ├── XXXXXX-create-users.js
│   ├── XXXXXX-create-categories.js
│   ├── XXXXXX-create-authors.js
│   ├── XXXXXX-create-books.js
│   ├── XXXXXX-create-book-authors.js
│   └── XXXXXX-create-cart.js
├── models/                   # Sequelize модели
│   ├── index.js
│   ├── User.js
│   ├── Category.js
│   ├── Author.js
│   ├── Book.js
│   ├── BookAuthor.js
│   └── Cart.js
├── seeders/                  # Начальные данные для БД
│   ├── XXXXXX-demo-categories.js
│   ├── XXXXXX-demo-authors.js
│   ├── XXXXXX-demo-books.js
│   └── XXXXXX-demo-book-authors.js
├── src/
│   ├── controllers/          # Контроллеры (бизнес-логика)
│   ├── routes/              # Маршруты API
│   ├── middleware/          # Middleware (аутентификация, валидация)
│   ├── validators/          # Схемы валидации
│   └── config/              # Конфигурация приложения
├── public/                   # Статические файлы frontend
│   ├── html/
│   │   ├── book.html        # Каталог книг
│   │   ├── book-detail.html # 🆕 Детальная страница книги
│   │   └── test-api-response.html # 🆕 Тестовая страница API
│   ├── style/
│   │   └── style.css        # 🔄 Обновлены стили для деталей книг
│   ├── scripts/
│   │   ├── catalog.js       # 🔄 Обновлена навигация к деталям
│   │   └── book-details.js  # 🆕 Логика страницы деталей книги
│   ├── img/
│   ├── data/
│   └── index.html
├── .env                      # Переменные окружения (не в git)
├── .gitignore               # Игнорируемые файлы
├── server.js               # Точка входа приложения
├── test-db.js              # Тестирование подключения к БД
├── package.json            # Зависимости и скрипты
├── step1.md                # Документация шага 1
├── step2.md                # Документация шага 2
└── README.md               # Этот файл
```

## 🗄️ Структура базы данных

### Таблицы

1. **users** - Пользователи системы

   - id, username, email, password, firstName, lastName

2. **categories** - Категории/жанры книг

   - id, name, slug, description

3. **authors** - Авторы книг

   - id, name, bio, authorType (russian/foreign)

4. **books** - Книги

   - id, title, categoryId, price, priceCategory, image, shortDescription, fullDescription, stock, popularity

5. **book_authors** - Связь книг и авторов (many-to-many)

   - id, bookId, authorId

6. **cart** - Корзина покупок
   - id, userId, bookId, quantity

### Связи между таблицами

```
users (1) ←→ (M) cart (M) ←→ (1) books
                              ↓
                          categoryId
                              ↓
                          categories (1)

books (M) ←→ (M) book_authors (M) ←→ (M) authors
```

## 📝 Доступные скрипты

```bash
# Запуск сервера
npm start              # Production режим
npm run dev           # Development режим с автоперезагрузкой

# Работа с базой данных
npm run db:create     # Создание БД
npm run db:migrate    # Применение миграций
npm run db:seed       # Заполнение БД данными
npm run db:migrate:undo  # Откат последней миграции
npm run db:reset      # Полный сброс и пересоздание БД

# Тестирование
node test-db.js       # Тест подключения и вывод данных из БД
```

## 🔐 Безопасность

- **bcrypt** - Хеширование паролей с солью
- **JWT** - Токены для аутентификации без хранения сессий
- **helmet** - Защитные HTTP заголовки
- **express-rate-limit** - Ограничение частоты запросов
- **joi** - Валидация входящих данных
- **Sequelize** - Защита от SQL-инъекций

## 📊 Тестовые данные

После выполнения `npm run db:seed` в БД будут добавлены:

- **4 категории:** Романтика, Драма, Биография, Фантастика
- **6 авторов:** 3 российских, 3 зарубежных
- **6 книг** с различной ценой и популярностью:
  1. Маленький принц (популярность: 312)
  2. Человек-амфибия (популярность: 203)
  3. Великий Гэтсби (популярность: 178)
  4. Унесённые ветром (популярность: 156)
  5. Гроза (популярность: 87)
  6. Море и звезды (популярность: 45)

## 🧪 Тестирование

Проверка подключения к БД и вывод статистики:

```bash
node test-db.js
```

Вы увидите:

- Список всех книг с авторами и категориями
- Статистику по категориям
- Статистику по авторам
- Книги с низким запасом на складе

## 🎓 Обучающие материалы

Проект содержит подробную пошаговую документацию для начинающих разработчиков:

- Подробное объяснение каждой команды
- Описание назначения всех зависимостей
- Примеры SQL запросов
- Объяснение структуры БД и связей между таблицами
- Примеры работы с Sequelize ORM

## 📖 API Endpoints _(в разработке)_

### Аутентификация

```
POST /api/auth/register   # Регистрация нового пользователя
POST /api/auth/login      # Вход в систему
GET  /api/auth/me         # Получение профиля текущего пользователя
```

### Книги

```
GET    /api/books              # Получить все книги (с фильтрацией)
GET    /api/books/:id          # Получить книгу по ID
GET    /api/books/popular      # Топ-10 популярных книг
GET    /api/books/category/:id # Книги по категории
```

### Категории

```
GET    /api/categories         # Получить все категории
GET    /api/categories/:id     # Получить категорию по ID
```

### Авторы

```
GET    /api/authors            # Получить всех авторов
GET    /api/authors/:id        # Получить автора по ID
```

### Корзина

```
GET    /api/cart              # Получить корзину текущего пользователя
POST   /api/cart              # Добавить книгу в корзину
PUT    /api/cart/:id          # Обновить количество в корзине
DELETE /api/cart/:id          # Удалить из корзины
```

## 🆕 Новая функциональность: Детальные страницы книг

### Особенности

- **📖 Полная информация о книге**: название, авторы, категория, цена, описание
- **🏢 Модальные окна издательств**: подробная информация об издательстве при клике
- **🛒 Добавление в корзину**: прямо со страницы деталей книги
- **📱 Адаптивный дизайн**: оптимизирован для всех устройств
- **🔄 API интеграция**: данные загружаются из API с fallback на JSON

### Как использовать

1. **Переход к деталям**: Кликните на любую карточку книги в каталоге
2. **Просмотр издательства**: Кликните на название издательства для открытия модального окна
3. **Добавление в корзину**: Используйте кнопку "Добавить в корзину"
4. **Навигация**: Используйте breadcrumb для возврата к каталогу

### Технические детали

- **URL формат**: `/html/book-detail.html?id={book_id}`
- **API endpoint**: `GET /api/books/{id}`
- **Fallback данные**: `public/data/books.json`
- **Файлы**:
  - `public/html/book-detail.html`
  - `public/scripts/book-details.js`
  - Обновленные стили в `public/style/style.css`

### Тестирование

Используйте тестовую страницу для отладки API:

- URL: `/html/test-api-response.html`
- Проверка различных форматов данных
- Отладка API ответов

## 🐛 Возможные проблемы

### Ошибка подключения к PostgreSQL

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Решение:**

1. Убедитесь, что PostgreSQL запущен: `pg_ctl status`
2. Проверьте пароль в `.env` и `config/config.json`
3. Проверьте порт (по умолчанию 5432)

### Ошибка при миграции

```
ERROR: relation "categories" already exists
```

**Решение:**

```bash
npm run db:migrate:undo:all
npm run db:migrate
```

### Ошибка "Module not found"

**Решение:**

```bash
rm -rf node_modules package-lock.json
npm install
```

## 📞 Поддержка

Если у вас возникли вопросы:

1. Изучите документацию в файлах `step1.md` и `step2.md`
2. Проверьте логи сервера на наличие ошибок
3. Убедитесь, что все зависимости установлены
4. Проверьте настройки в `.env` файле

## 📄 Лицензия

Этот проект создан в образовательных целях для выполнения лабораторных работ.

## 🙏 Благодарности

- Проект основан на материалах lab_1_3
- Учитывает замечания преподавателя из lab_2.md
- Создан для пошагового обучения начинающих разработчиков

---

**Дата создания:** 17 октября 2025  
**Версия:** 1.0.0  
**Статус:** ✅ Step 1 и Step 2 завершены
