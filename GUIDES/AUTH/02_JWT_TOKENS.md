# 🎫 Урок 2: JWT токены подробно

## 🎯 Что такое JWT?

**JSON Web Token (JWT)** - это компактный и самодостаточный способ безопасной передачи информации между сторонами в виде JSON объекта.

### Особенности JWT:

- ✅ **Самодостаточный** - содержит всю необходимую информацию
- ✅ **Компактный** - может передаваться в URL, POST параметрах или HTTP заголовках
- ✅ **Безопасный** - цифровая подпись защищает от изменений
- ✅ **Stateless** - сервер не хранит состояние сессии

## 🏗 Структура JWT токена

### Анатомия токена:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiaWF0IjoxNjM1NzI0ODAwLCJleHAiOjE2MzU4MTEyMDB9.8vKs-VqAQFNQsWLF5vXqBGPKpjqaR_BsOX4Yhn_E8Ac

│                    Header                    │.│                                     Payload                                     │.│        Signature        │
```

### 1. **Header (Заголовок)**

```json
{
  "alg": "HS256", // Алгоритм подписи (HMAC SHA256)
  "typ": "JWT" // Тип токена
}
```

**Base64URL кодирование:**

```javascript
const header = {
  alg: "HS256",
  typ: "JWT",
};
const encodedHeader = btoa(JSON.stringify(header));
// Результат: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
```

### 2. **Payload (Полезная нагрузка)**

```json
{
  "userId": 1, // Пользовательские данные
  "username": "admin",
  "email": "admin@example.com",
  "firstName": "Администратор",
  "lastName": "Системы",
  "iat": 1635724800, // Время создания (issued at)
  "exp": 1635811200 // Время истечения (expires)
}
```

#### Стандартные claims (утверждения):

- **iat** (issued at) - время создания токена
- **exp** (expires) - время истечения токена
- **iss** (issuer) - издатель токена
- **aud** (audience) - аудитория токена
- **sub** (subject) - субъект токена

### 3. **Signature (Подпись)**

```javascript
const signature = HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
);
```

## 🔧 Реализация в BookStore2

### Создание JWT токена (Backend):

```javascript
// src/controllers/authController.js
const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  const payload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET, // Секретный ключ
    {
      expiresIn: "24h", // Время жизни
      issuer: "BookStore2", // Издатель
      audience: "bookstore-users", // Аудитория
    }
  );
};

// Использование при успешном входе
const login = async (req, res) => {
  try {
    // ... проверка пароля ...

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
};
```

### Проверка JWT токена (Middleware):

```javascript
// src/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  // Получение токена из заголовка Authorization
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      message: "Токен доступа отсутствует",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Токен истёк",
        });
      }
      if (err.name === "JsonWebTokenError") {
        return res.status(403).json({
          message: "Недействительный токен",
        });
      }
      return res.status(403).json({
        message: "Ошибка проверки токена",
      });
    }

    // Добавляем информацию о пользователе в запрос
    req.user = decoded;
    next();
  });
};

module.exports = { authenticateToken };
```

## 🖥 Frontend работа с JWT

### Утилиты для работы с токенами:

```javascript
// public/scripts/auth-utils.js

// Объект для работы с токенами
const AuthToken = {
  // Сохранение токена
  save: (token) => {
    try {
      localStorage.setItem("authToken", token);
      return true;
    } catch (error) {
      console.error("Ошибка сохранения токена:", error);
      return false;
    }
  },

  // Получение токена
  get: () => {
    try {
      return localStorage.getItem("authToken");
    } catch (error) {
      console.error("Ошибка получения токена:", error);
      return null;
    }
  },

  // Удаление токена
  remove: () => {
    try {
      localStorage.removeItem("authToken");
      return true;
    } catch (error) {
      console.error("Ошибка удаления токена:", error);
      return false;
    }
  },

  // Декодирование токена (без проверки подписи!)
  decode: (token) => {
    try {
      const payload = token.split(".")[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      console.error("Ошибка декодирования токена:", error);
      return null;
    }
  },

  // Проверка валидности токена
  isValid: (token) => {
    try {
      if (!token) return false;

      const decoded = AuthToken.decode(token);
      if (!decoded) return false;

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp > currentTime;
    } catch (error) {
      return false;
    }
  },

  // Получение информации о пользователе из токена
  getUserInfo: () => {
    const token = AuthToken.get();
    if (!token || !AuthToken.isValid(token)) {
      return null;
    }

    const decoded = AuthToken.decode(token);
    return {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    };
  },
};
```

### Использование в HTTP запросах:

```javascript
// Функция для выполнения аутентифицированных запросов
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = AuthToken.get();

  if (!token || !AuthToken.isValid(token)) {
    throw new Error("Требуется авторизация");
  }

  const authOptions = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, authOptions);

    // Если токен истёк
    if (response.status === 401) {
      AuthToken.remove();
      window.location.href = "/html/login.html";
      throw new Error("Сессия истекла");
    }

    return response;
  } catch (error) {
    console.error("Ошибка аутентифицированного запроса:", error);
    throw error;
  }
};

// Пример использования
const loadUserCart = async () => {
  try {
    const response = await makeAuthenticatedRequest("/api/cart");
    const cartData = await response.json();
    return cartData;
  } catch (error) {
    console.error("Ошибка загрузки корзины:", error);
  }
};
```

## 🔍 Декодирование и анализ токена

### Онлайн инструменты:

1. **jwt.io** - самый популярный декодер
2. **jwtdebugger.io** - альтернативный инструмент
3. **jwt-decode.com** - простой декодер

### Ручное декодирование:

```javascript
// Функция для ручного декодирования JWT
const manualDecodeJWT = (token) => {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Неверный формат JWT токена");
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Декодирование заголовка
  const header = JSON.parse(atob(headerB64));

  // Декодирование payload
  const payload = JSON.parse(atob(payloadB64));

  return {
    header,
    payload,
    signature: signatureB64,
    raw: {
      header: headerB64,
      payload: payloadB64,
      signature: signatureB64,
    },
  };
};

// Пример использования
const token = localStorage.getItem("authToken");
if (token) {
  const decoded = manualDecodeJWT(token);
  console.log("Header:", decoded.header);
  console.log("Payload:", decoded.payload);
  console.log("Expires:", new Date(decoded.payload.exp * 1000));
}
```

## ⚡ Автоматическое обновление токенов

### Проверка истечения токена:

```javascript
// Проверка токена при каждом запросе
const checkTokenExpiration = () => {
  const token = AuthToken.get();

  if (!token) {
    return false;
  }

  const decoded = AuthToken.decode(token);
  if (!decoded) {
    AuthToken.remove();
    return false;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const timeToExpire = decoded.exp - currentTime;

  // Если токен истекает через 5 минут - предупреждаем
  if (timeToExpire < 300 && timeToExpire > 0) {
    showWarning("Сессия скоро истечёт. Пожалуйста, обновите страницу.");
  }

  // Если токен истёк - удаляем и перенаправляем
  if (timeToExpire <= 0) {
    AuthToken.remove();
    window.location.href = "/html/login.html";
    return false;
  }

  return true;
};

// Проверяем токен каждую минуту
setInterval(checkTokenExpiration, 60000);
```

### Refresh токены (для продвинутых):

```javascript
// Концепция refresh токенов
const refreshToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    throw new Error("Refresh токен отсутствует");
  }

  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error("Не удалось обновить токен");
  }

  const data = await response.json();
  AuthToken.save(data.accessToken);

  return data.accessToken;
};
```

## 🛡 Безопасность JWT

### Важные принципы:

#### 1. **Секретный ключ:**

```javascript
// ✅ Хорошо - длинный случайный ключ
JWT_SECRET=your-super-long-random-secret-key-at-least-32-characters

// ❌ Плохо - короткий или предсказуемый ключ
JWT_SECRET=secret
```

#### 2. **Время жизни:**

```javascript
// ✅ Хорошо - короткое время жизни
jwt.sign(payload, secret, { expiresIn: "1h" });

// ❌ Плохо - слишком долгое время
jwt.sign(payload, secret, { expiresIn: "30d" });
```

#### 3. **Чувствительные данные:**

```javascript
// ✅ Хорошо - минимум информации
const payload = {
  userId: user.id,
  username: user.username,
};

// ❌ Плохо - чувствительные данные
const payload = {
  userId: user.id,
  password: user.password, // ❌ Никогда!
  creditCard: user.card, // ❌ Никогда!
};
```

## 🧪 Практические задания

### Задание 1: Анализ токена

1. Войдите в систему BookStore2
2. Скопируйте JWT токен из localStorage
3. Вставьте на jwt.io и изучите содержимое
4. Ответьте на вопросы:
   - Когда был создан токен?
   - Когда истечёт?
   - Какая информация о пользователе хранится?

### Задание 2: Тестирование безопасности

```javascript
// Добавьте в консоль браузера:
const token = localStorage.getItem("authToken");
const parts = token.split(".");

// Измените payload (например, userId)
const payload = JSON.parse(atob(parts[1]));
payload.userId = 999; // Попытка подделки
const fakePayload = btoa(JSON.stringify(payload));
const fakeToken = parts[0] + "." + fakePayload + "." + parts[2];

// Попробуйте использовать поддельный токен
fetch("/api/cart", {
  headers: {
    Authorization: `Bearer ${fakeToken}`,
  },
});
```

### Задание 3: Создание утилиты мониторинга

```javascript
// Создайте утилиту для мониторинга токена
const TokenMonitor = {
  start: () => {
    setInterval(() => {
      const token = AuthToken.get();
      if (token) {
        const decoded = AuthToken.decode(token);
        const timeLeft = decoded.exp - Math.floor(Date.now() / 1000);
        console.log(`Токен истекает через: ${Math.floor(timeLeft / 60)} минут`);
      }
    }, 30000); // Каждые 30 секунд
  },
};

TokenMonitor.start();
```

## 📊 Сравнение методов аутентификации

| Метод       | Плюсы                                             | Минусы                               | Использование               |
| ----------- | ------------------------------------------------- | ------------------------------------ | --------------------------- |
| **JWT**     | Stateless, масштабируемость, мобильные приложения | Нельзя отозвать, размер токена       | SPA, API, микросервисы      |
| **Session** | Можно отозвать, меньше трафика                    | Stateful, сложность в кластере       | Традиционные веб-приложения |
| **OAuth**   | Делегированный доступ, безопасность               | Сложность, зависимость от провайдера | Интеграция с соцсетями      |

## 🔗 Полезные ресурсы

- [JWT.io](https://jwt.io/) - Официальный сайт и декодер
- [RFC 7519](https://tools.ietf.org/html/rfc7519) - Спецификация JWT
- [Auth0 JWT Guide](https://auth0.com/learn/json-web-tokens/) - Подробное руководство
- [jwt-decode library](https://www.npmjs.com/package/jwt-decode) - Библиотека для декодирования

---

**Следующий урок:** [Урок 3: Backend авторизация](03_BACKEND_AUTH.md) 🚀

**Практика:** Создайте собственную утилиту для работы с JWT токенами!
