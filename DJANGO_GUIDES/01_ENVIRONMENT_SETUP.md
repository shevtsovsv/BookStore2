# 🔧 Установка и настройка окружения Python/Django

## 📋 Содержание
1. [Установка Python](#установка-python)
2. [Виртуальное окружение](#виртуальное-окружение)
3. [Установка PostgreSQL](#установка-postgresql)
4. [Установка IDE/редактора](#установка-idередактора)
5. [Проверка установки](#проверка-установки)

## 🐍 Установка Python

### Windows

#### Вариант 1: Установщик с официального сайта

1. **Скачайте Python:**
   - Перейдите на https://www.python.org/downloads/
   - Скачайте последнюю версию Python 3.11 или 3.12
   - Рекомендуется: Python 3.11.x (стабильная версия)

2. **Запустите установщик:**
   - ✅ **ВАЖНО:** Поставьте галочку "Add Python to PATH"
   - Выберите "Install Now" для стандартной установки
   - Или "Customize installation" для настраиваемой

3. **Проверка установки:**
```bash
python --version
# Должно вывести: Python 3.11.x

pip --version
# Должно вывести версию pip
```

#### Вариант 2: Через Microsoft Store

```bash
# Откройте Microsoft Store
# Найдите "Python 3.11"
# Нажмите "Получить"
```

**Сравнение с Node.js:**
```bash
# Node.js
node --version
npm --version

# Python
python --version
pip --version
```

### macOS

#### Вариант 1: Через Homebrew (рекомендуется)

```bash
# Установите Homebrew если ещё не установлен
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Установите Python
brew install python@3.11

# Проверка
python3 --version
pip3 --version
```

#### Вариант 2: Официальный установщик

1. Скачайте с https://www.python.org/downloads/macos/
2. Установите .pkg файл
3. Проверьте установку

### Linux (Ubuntu/Debian)

```bash
# Обновите список пакетов
sudo apt update

# Установите Python 3.11
sudo apt install python3.11 python3.11-venv python3-pip

# Проверка
python3.11 --version
pip3 --version
```

### Linux (Fedora/RHEL)

```bash
sudo dnf install python3.11 python3-pip
```

## 📦 Виртуальное окружение

### Что это такое?

**В Node.js:**
- Зависимости устанавливаются в `node_modules` в папке проекта
- Изолированы автоматически для каждого проекта
- Управляются через `package.json`

**В Python:**
- Нужно создавать виртуальное окружение вручную
- Это папка, которая содержит копию Python и все зависимости
- Управляются через `requirements.txt`

### Почему это важно?

```
❌ Без виртуального окружения:
- Все пакеты устанавливаются глобально
- Конфликты версий между проектами
- Сложно воспроизвести окружение

✅ С виртуальным окружением:
- Изолированное окружение для каждого проекта
- Разные версии пакетов в разных проектах
- Легко делиться через requirements.txt
```

### Создание виртуального окружения

#### Вариант 1: venv (встроенный, рекомендуется)

```bash
# Windows
python -m venv venv

# macOS/Linux
python3 -m venv venv
```

**Что происходит:**
- Создается папка `venv/` в текущей директории
- В ней копия Python и pip
- Изолированное пространство для пакетов

#### Вариант 2: virtualenv (сторонний)

```bash
# Установка
pip install virtualenv

# Создание
virtualenv venv
```

### Активация виртуального окружения

```bash
# Windows (CMD)
venv\Scripts\activate.bat

# Windows (PowerShell)
venv\Scripts\Activate.ps1

# macOS/Linux
source venv/bin/activate
```

**После активации:**
```bash
# В начале строки появится (venv)
(venv) C:\Projects\bookstore>

# Все команды pip будут работать в этом окружении
(venv) pip install django
```

### Деактивация

```bash
# Просто выполните
deactivate
```

### Сравнение с Node.js

| Действие | Node.js | Python |
|----------|---------|--------|
| Инициализация | `npm init` | `python -m venv venv` |
| Активация | Не требуется | `source venv/bin/activate` |
| Установка пакета | `npm install express` | `pip install django` |
| Зависимости | `package.json` | `requirements.txt` |
| Список пакетов | `npm list` | `pip list` |
| Удаление пакета | `npm uninstall` | `pip uninstall` |

## 🗄️ Установка PostgreSQL

### Windows

#### Вариант 1: Официальный установщик

1. **Скачайте:**
   - https://www.postgresql.org/download/windows/
   - Выберите последнюю версию (14.x или 15.x)

2. **Установите:**
   - Запустите .exe файл
   - Запомните пароль для пользователя `postgres`
   - Порт по умолчанию: 5432
   - Locale: Russian, Russia или C (универсальный)

3. **Проверка:**
```bash
# Откройте SQL Shell (psql) из меню Пуск
# Или в командной строке:
psql -U postgres

# Должно запросить пароль и открыть консоль PostgreSQL
```

#### Вариант 2: Через Chocolatey

```bash
choco install postgresql
```

### macOS

#### Через Homebrew

```bash
# Установка
brew install postgresql@15

# Запуск сервиса
brew services start postgresql@15

# Проверка
psql postgres
```

#### Через Postgres.app

1. Скачайте с https://postgresapp.com/
2. Перетащите в Applications
3. Запустите приложение
4. PostgreSQL готов к работе!

### Linux (Ubuntu/Debian)

```bash
# Установка
sudo apt install postgresql postgresql-contrib

# Запуск
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Проверка
sudo -u postgres psql
```

### Создание базы данных для проекта

```sql
-- Войдите в psql
psql -U postgres

-- Создайте базу данных
CREATE DATABASE bookstore_django;

-- Создайте пользователя (опционально)
CREATE USER bookstore_user WITH PASSWORD 'your_password';

-- Дайте права
GRANT ALL PRIVILEGES ON DATABASE bookstore_django TO bookstore_user;

-- Выход
\q
```

**Сравнение с Node.js проектом:**
```sql
-- Node.js версия использует
CREATE DATABASE bookstore;

-- Django версия будет использовать
CREATE DATABASE bookstore_django;

-- Или можно использовать ту же БД!
-- Django может работать с существующими таблицами
```

## 💻 Установка IDE/Редактора

### VS Code (рекомендуется)

**Если у вас уже есть VS Code для Node.js:**

1. **Установите расширения:**
   - Python (Microsoft) - основное расширение
   - Pylance - IntelliSense для Python
   - Django - подсветка синтаксиса Django
   - Python Indent - автоматические отступы
   - autoDocstring - генерация docstrings

2. **Настройте `.vscode/settings.json`:**
```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.formatting.provider": "black",
  "editor.formatOnSave": true,
  "[python]": {
    "editor.tabSize": 4,
    "editor.insertSpaces": true
  }
}
```

### PyCharm (альтернатива)

**Преимущества:**
- Специализированная IDE для Python
- Мощная отладка
- Встроенная поддержка Django
- Автоматическое виртуальное окружение

**Недостатки:**
- Тяжелее VS Code
- Professional версия платная (но есть Community)

**Установка:**
1. Скачайте с https://www.jetbrains.com/pycharm/
2. Выберите Community Edition (бесплатная)
3. Установите

## ✅ Проверка установки

Создайте файл `check_setup.py`:

```python
#!/usr/bin/env python3
"""
Проверка установки окружения для Django проекта
"""
import sys
import subprocess

def check_python():
    """Проверка версии Python"""
    version = sys.version_info
    print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 9):
        print("⚠️  Рекомендуется Python 3.9 или выше")
    return True

def check_pip():
    """Проверка pip"""
    try:
        result = subprocess.run(
            ['pip', '--version'], 
            capture_output=True, 
            text=True
        )
        print(f"✅ {result.stdout.strip()}")
        return True
    except FileNotFoundError:
        print("❌ pip не установлен")
        return False

def check_venv():
    """Проверка виртуального окружения"""
    if hasattr(sys, 'real_prefix') or (
        hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix
    ):
        print(f"✅ Виртуальное окружение активно: {sys.prefix}")
        return True
    else:
        print("⚠️  Виртуальное окружение не активировано")
        print("   Запустите: source venv/bin/activate (Linux/Mac)")
        print("   Или: venv\\Scripts\\activate (Windows)")
        return False

def check_postgres():
    """Проверка PostgreSQL"""
    try:
        result = subprocess.run(
            ['psql', '--version'], 
            capture_output=True, 
            text=True
        )
        print(f"✅ {result.stdout.strip()}")
        return True
    except FileNotFoundError:
        print("❌ PostgreSQL не установлен или не в PATH")
        return False

def main():
    """Главная функция проверки"""
    print("=" * 50)
    print("Проверка окружения для Django BookStore")
    print("=" * 50)
    print()
    
    checks = [
        ("Python", check_python),
        ("pip", check_pip),
        ("Виртуальное окружение", check_venv),
        ("PostgreSQL", check_postgres),
    ]
    
    results = []
    for name, check_func in checks:
        print(f"\n{name}:")
        results.append(check_func())
    
    print("\n" + "=" * 50)
    if all(results):
        print("✅ Все проверки пройдены! Можно начинать.")
    else:
        print("⚠️  Некоторые проверки не прошли. Исправьте ошибки.")
    print("=" * 50)

if __name__ == '__main__':
    main()
```

**Запустите проверку:**
```bash
# Активируйте виртуальное окружение!
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate     # Windows

# Запустите скрипт
python check_setup.py
```

**Ожидаемый вывод:**
```
==================================================
Проверка окружения для Django BookStore
==================================================

Python:
✅ Python 3.11.5

pip:
✅ pip 23.2.1 from ...

Виртуальное окружение:
✅ Виртуальное окружение активно: /path/to/venv

PostgreSQL:
✅ psql (PostgreSQL) 15.4

==================================================
✅ Все проверки пройдены! Можно начинать.
==================================================
```

## 📝 Создание requirements.txt

Создайте файл `requirements.txt` с базовыми зависимостями:

```txt
# Core Django
Django==5.0.1

# Database
psycopg2-binary==2.9.9

# Django REST Framework
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.1

# CORS
django-cors-headers==4.3.1

# Environment variables
python-dotenv==1.0.0

# Development tools
django-debug-toolbar==4.2.0

# Testing
pytest==7.4.3
pytest-django==4.7.0
```

**Установка всех зависимостей:**
```bash
pip install -r requirements.txt
```

**Сравнение с Node.js:**

| Node.js | Python/Django |
|---------|---------------|
| `package.json` | `requirements.txt` |
| `npm install` | `pip install -r requirements.txt` |
| `npm install express` | `pip install django` |
| `node_modules/` | `venv/lib/python3.x/site-packages/` |
| `npm list` | `pip list` or `pip freeze` |
| `npm update` | `pip install --upgrade` |

## 🎯 Чек-лист готовности

Перед переходом к следующему шагу убедитесь:

- [ ] ✅ Python 3.9+ установлен
- [ ] ✅ pip работает
- [ ] ✅ Виртуальное окружение создано
- [ ] ✅ Виртуальное окружение активировано
- [ ] ✅ PostgreSQL установлен и запущен
- [ ] ✅ База данных создана
- [ ] ✅ VS Code настроен с Python расширениями
- [ ] ✅ Скрипт проверки выполнен успешно
- [ ] ✅ requirements.txt создан

## 🚀 Следующий шаг

Переходите к **[02_PROJECT_INITIALIZATION.md](02_PROJECT_INITIALIZATION.md)** для создания Django проекта!

## 💡 Полезные команды

### Виртуальное окружение
```bash
# Создание
python -m venv venv

# Активация (Windows)
venv\Scripts\activate

# Активация (Linux/Mac)
source venv/bin/activate

# Деактивация
deactivate

# Удаление (просто удалите папку)
rm -rf venv
```

### pip команды
```bash
# Установка пакета
pip install django

# Установка конкретной версии
pip install django==5.0.1

# Установка из requirements.txt
pip install -r requirements.txt

# Обновление пакета
pip install --upgrade django

# Удаление пакета
pip uninstall django

# Список установленных пакетов
pip list

# Экспорт зависимостей
pip freeze > requirements.txt

# Поиск пакета
pip search django

# Информация о пакете
pip show django
```

### PostgreSQL команды
```bash
# Подключение к БД
psql -U postgres -d bookstore_django

# Список баз данных
\l

# Подключение к базе
\c bookstore_django

# Список таблиц
\dt

# Описание таблицы
\d books

# Выполнение SQL файла
\i /path/to/file.sql

# Выход
\q
```

## 🐛 Решение проблем

### Python не найден

**Windows:**
```bash
# Добавьте Python в PATH вручную:
# 1. Найдите папку установки Python (обычно C:\Users\<user>\AppData\Local\Programs\Python\Python311)
# 2. Системные свойства -> Переменные среды
# 3. Добавьте путь в PATH
```

**Linux/Mac:**
```bash
# Используйте python3 вместо python
python3 --version
pip3 install django
```

### pip не работает

```bash
# Переустановите pip
python -m ensurepip --upgrade

# Или
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python get-pip.py
```

### PostgreSQL не запускается

**Windows:**
```bash
# Откройте Services (services.msc)
# Найдите postgresql-x64-15
# Нажмите Start
```

**Linux:**
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

**Mac:**
```bash
brew services restart postgresql@15
```

### Ошибки при установке psycopg2

```bash
# Windows: установите psycopg2-binary
pip install psycopg2-binary

# Linux: установите зависимости
sudo apt-get install python3-dev libpq-dev

# Mac:
brew install postgresql
```

---

**Автор:** Руководство по настройке окружения Django  
**Дата:** Ноябрь 2025  
**Версия:** 1.0
