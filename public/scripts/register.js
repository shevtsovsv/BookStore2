/**
 * JavaScript для страницы регистрации
 * Обработка формы, валидация, API интеграция
 */

document.addEventListener("DOMContentLoaded", function () {
  // Проверить, не авторизован ли уже пользователь
  if (Auth.isAuthenticated()) {
    console.log("Пользователь уже авторизован, перенаправляем...");
    NavigationUtils.redirectAfterLogin();
    return;
  }

  // Получить элементы формы
  const registerForm = document.getElementById("registerForm");
  const firstNameField = document.getElementById("firstName");
  const lastNameField = document.getElementById("lastName");
  const emailField = document.getElementById("email");
  const usernameField = document.getElementById("username");
  const passwordField = document.getElementById("password");
  const confirmPasswordField = document.getElementById("confirmPassword");

  // Обработчик отправки формы
  registerForm.addEventListener("submit", handleRegisterSubmit);

  // Валидация в реальном времени
  emailField.addEventListener("blur", validateEmailField);
  passwordField.addEventListener("input", validatePasswordField);
  confirmPasswordField.addEventListener("input", validateConfirmPasswordField);
  firstNameField.addEventListener("blur", validateRequiredField);
  lastNameField.addEventListener("blur", validateRequiredField);

  /**
   * Обработчик отправки формы регистрации
   */
  async function handleRegisterSubmit(event) {
    event.preventDefault();

    console.log("Начинаем процесс регистрации...");

    // Не очищаем ошибки перед валидацией, чтобы не сбрасывать сообщения до проверки

    // Собрать данные формы
    const formData = {
      firstName: firstNameField.value.trim(),
      lastName: lastNameField.value.trim(),
      email: emailField.value.trim(),
      username: usernameField.value.trim() || undefined,
      password: passwordField.value,
      confirmPassword: confirmPasswordField.value,
    };

    console.log("Данные формы:", {
      ...formData,
      password: "[СКРЫТО]",
      confirmPassword: "[СКРЫТО]",
    });

    // Валидация на клиенте
    if (!validateForm(formData)) {
      console.log("Валидация формы не прошла");
      return;
    }

    try {
      // Показать состояние загрузки
      FormUtils.setButtonLoading("registerBtn", true);
      FormUtils.showNotification("Регистрация...", "info");

      // Отправить запрос на сервер
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          username: formData.username,
          password: formData.password,
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      const data = await response.json();
      console.log("Ответ сервера:", data);
      console.log("Response ok:", response.ok);
      console.log("Data success:", data.success);

      if (response.ok && data.success) {
        // Успешная регистрация
        console.log("Регистрация успешна:", data.data.user);

        FormUtils.showNotification(
          "Регистрация успешна! Добро пожаловать!",
          "success"
        );

        // Сохранить токен и данные пользователя
        Auth.login(data.data.token, data.data.user);

        // Перенаправить на главную страницу или сохраненную страницу
        setTimeout(() => {
          NavigationUtils.redirectAfterLogin();
        }, 1500);
      } else {
        // Ошибки от сервера
        console.error("Ошибка регистрации:", data);
        handleServerErrors(data);
      }
    } catch (error) {
      console.error("Ошибка сети при регистрации:", error);
      FormUtils.showNotification(
        "Ошибка соединения с сервером. Попробуйте позже.",
        "error"
      );
    } finally {
      // Убрать состояние загрузки
      FormUtils.setButtonLoading("registerBtn", false);
    }
  }

  /**
   * Валидация всей формы
   */
  function validateForm(data) {
    let isValid = true;

    // Проверка имени
    if (!data.firstName || data.firstName.length < 1) {
      FormUtils.showFieldError("firstName", "Имя обязательно для заполнения");
      isValid = false;
    }

    // Проверка фамилии
    if (!data.lastName || data.lastName.length < 1) {
      FormUtils.showFieldError(
        "lastName",
        "Фамилия обязательна для заполнения"
      );
      isValid = false;
    }

    // Проверка email
    if (!data.email) {
      FormUtils.showFieldError("email", "Email обязателен для заполнения");
      isValid = false;
    } else if (!FormUtils.validateEmail(data.email)) {
      FormUtils.showFieldError("email", "Введите корректный email адрес");
      isValid = false;
    }

    // Проверка пароля
    if (!data.password) {
      FormUtils.showFieldError("password", "Пароль обязателен для заполнения");
      isValid = false;
    } else {
      const passwordValidation = FormUtils.validatePassword(data.password);
      if (!passwordValidation.isValid) {
        FormUtils.showFieldError(
          "password",
          passwordValidation.errors.join(", ")
        );
        isValid = false;
      }
    }

    // Проверка подтверждения пароля
    if (!data.confirmPassword) {
      FormUtils.showFieldError("confirmPassword", "Подтвердите пароль");
      isValid = false;
    } else if (data.password !== data.confirmPassword) {
      FormUtils.showFieldError("confirmPassword", "Пароли не совпадают");
      isValid = false;
    }

    // Проверка username если указан
    if (data.username && data.username.length < 3) {
      FormUtils.showFieldError(
        "username",
        "Логин должен содержать минимум 3 символа"
      );
      isValid = false;
    }

    return isValid;
  }

  /**
   * Обработка ошибок от сервера
   */
  function handleServerErrors(data) {
    if (data.errors && Array.isArray(data.errors)) {
      // Ошибки валидации express-validator
      data.errors.forEach((error) => {
        const fieldName = error.path || error.param;
        if (fieldName) {
          FormUtils.showFieldError(fieldName, error.msg);
        }
      });
    } else if (data.message) {
      // Общая ошибка
      FormUtils.showNotification(data.message, "error");
    } else {
      // Неизвестная ошибка
      FormUtils.showNotification("Произошла ошибка при регистрации", "error");
    }
  }

  /**
   * Валидация email поля
   */
  function validateEmailField() {
    const email = emailField.value.trim();
    const errorElement = document.getElementById("email-error");

    if (email && !FormUtils.validateEmail(email)) {
      FormUtils.showFieldError("email", "Введите корректный email адрес");
    } else if (errorElement) {
      errorElement.style.display = "none";
      emailField.classList.remove("error");
    }
  }

  /**
   * Валидация пароля
   */
  function validatePasswordField() {
    const password = passwordField.value;
    const errorElement = document.getElementById("password-error");

    if (password) {
      const passwordValidation = FormUtils.validatePassword(password);
      if (!passwordValidation.isValid) {
        FormUtils.showFieldError(
          "password",
          passwordValidation.errors.join(", ")
        );
      } else if (errorElement) {
        errorElement.style.display = "none";
        passwordField.classList.remove("error");
      }
    }

    // Проверить подтверждение пароля если оно заполнено
    if (confirmPasswordField.value) {
      validateConfirmPasswordField();
    }
  }

  /**
   * Валидация подтверждения пароля
   */
  function validateConfirmPasswordField() {
    const password = passwordField.value;
    const confirmPassword = confirmPasswordField.value;
    const errorElement = document.getElementById("confirmPassword-error");

    if (confirmPassword && password !== confirmPassword) {
      FormUtils.showFieldError("confirmPassword", "Пароли не совпадают");
    } else if (errorElement) {
      errorElement.style.display = "none";
      confirmPasswordField.classList.remove("error");
    }
  }

  /**
   * Валидация обязательного поля
   */
  function validateRequiredField(event) {
    const field = event.target;
    const value = field.value.trim();
    const fieldId = field.id;
    const errorElement = document.getElementById(`${fieldId}-error`);

    if (!value) {
      FormUtils.showFieldError(fieldId, "Это поле обязательно для заполнения");
    } else if (errorElement) {
      errorElement.style.display = "none";
      field.classList.remove("error");
    }
  }

  console.log("Register script initialized");
});
