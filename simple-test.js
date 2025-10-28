const http = require("http");

const postData = JSON.stringify({
  firstName: "Тест",
  lastName: "Пользователь",
  email: "test" + Date.now() + "@example.com", // Уникальный email
  username: "testuser" + Date.now(),
  password: "TestPass123", // Соответствует всем требованиям
  confirmPassword: "TestPass123",
});

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/auth/register",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(postData),
  },
};

console.log("🧪 Тестируем регистрацию с паролем: TestPass123");
console.log("📋 Данные:", JSON.parse(postData));

const req = http.request(options, (res) => {
  console.log("📊 Статус:", res.statusCode);
  console.log("📋 Заголовки:", res.headers);

  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    try {
      const response = JSON.parse(data);
      console.log("📋 Ответ сервера:", response);

      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log("✅ Регистрация прошла успешно!");
      } else {
        console.log("❌ Ошибка регистрации:", response.message);
        if (response.errors) {
          console.log("🔍 Детали ошибок:", response.errors);
        }
      }
    } catch (error) {
      console.log("📄 Сырой ответ:", data);
    }
  });
});

req.on("error", (e) => {
  console.error("💥 Ошибка запроса:", e.message);
});

req.write(postData);
req.end();
