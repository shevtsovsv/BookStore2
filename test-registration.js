/**
 * Тестовый скрипт для проверки регистрации
 */

const testRegistration = async () => {
  const testUser = {
    firstName: "Тест",
    lastName: "Пользователь",
    email: "test@example.com",
    username: "testuser",
    password: "TestPass123!", // Соответствует всем требованиям
    confirmPassword: "TestPass123!",
  };

  console.log("🧪 Тестируем регистрацию с данными:", {
    ...testUser,
    password: "[СКРЫТО]",
    confirmPassword: "[СКРЫТО]",
  });

  try {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testUser),
    });

    const data = await response.json();

    console.log("📊 Статус ответа:", response.status);
    console.log("📋 Ответ сервера:", data);

    if (response.ok && data.success) {
      console.log("✅ Регистрация прошла успешно!");
    } else {
      console.log("❌ Ошибка регистрации:", data.message);
      if (data.errors) {
        console.log("🔍 Детали ошибок:", data.errors);
      }
    }
  } catch (error) {
    console.error("💥 Ошибка запроса:", error.message);
  }
};

// Проверка валидации пароля
const testPasswordValidation = () => {
  console.log("\n🔐 Тестируем валидацию пароля:");

  const passwords = [
    "12345678", // Только цифры
    "password", // Только строчные буквы
    "PASSWORD", // Только заглавные
    "Pass1", // Слишком короткий
    "Password1", // Только 1 цифра
    "TestPass123!", // ✅ Правильный
    "MyPassword99", // ✅ Правильный
  ];

  passwords.forEach((password) => {
    // Симулируем валидацию как на клиенте
    const errors = [];

    if (password.length < 8) {
      errors.push("Минимум 8 символов");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Минимум 1 заглавная буква");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Строчные английские буквы");
    }
    if (!/\d.*\d/.test(password)) {
      errors.push("Минимум 2 цифры");
    }
    if (!/^[A-Za-z\d@$!%*?&]+$/.test(password)) {
      errors.push("Только английские буквы, цифры и символы @$!%*?&");
    }

    const isValid = errors.length === 0;
    console.log(
      `${isValid ? "✅" : "❌"} "${password}" - ${
        isValid ? "Валидный" : errors.join(", ")
      }`
    );
  });
};

// Запускаем тесты
testPasswordValidation();
console.log("\n" + "=".repeat(50));
testRegistration();
