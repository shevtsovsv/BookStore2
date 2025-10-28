# Урок 19: Валидация пользовательского ввода и UX паттерны

## Обзор урока

В этом уроке мы рассмотрим продвинутые техники валидации пользовательского ввода с акцентом на улучшение пользовательского опыта (UX). Изучим современные паттерны валидации, создание интуитивно понятных сообщений об ошибках и реализацию системы валидации в реальном времени.

### Цели урока
- Создать систему валидации в реальном времени
- Реализовать интуитивно понятные сообщения об ошибках
- Изучить UX паттерны для форм
- Обеспечить доступность валидационных сообщений
- Создать прогрессивное улучшение форм

### Принципы хорошей валидации UX
- **Быстрая обратная связь** - валидация в реальном времени
- **Понятные сообщения** - ясные инструкции по исправлению
- **Визуальная иерархия** - четкое выделение проблем
- **Прогрессивная валидация** - поэтапная проверка
- **Доступность** - поддержка скринридеров

## Часть 1: Система валидации в реальном времени

### 1.1 Базовый класс валидатора

```javascript
// enhanced-validator.js - Расширенная система валидации

/**
 * Класс для продвинутой валидации форм с UX фокусом
 */
class EnhancedValidator {
    constructor(options = {}) {
        this.options = {
            validateOnBlur: true,
            validateOnInput: true,
            validateOnSubmit: true,
            showSuccessStates: true,
            debounceTime: 300,
            animationDuration: 300,
            ...options
        };
        
        this.validators = new Map();
        this.fieldStates = new Map();
        this.validationTimers = new Map();
        
        this.initDefaultValidators();
    }

    /**
     * Инициализация встроенных валидаторов
     */
    initDefaultValidators() {
        // Email валидатор
        this.addValidator('email', {
            validate: (value) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value);
            },
            message: 'Введите корректный email адрес',
            hint: 'Например: user@example.com'
        });

        // Пароль валидатор
        this.addValidator('password', {
            validate: (value) => {
                return {
                    minLength: value.length >= 8,
                    hasUpperCase: /[A-Z]/.test(value),
                    hasLowerCase: /[a-z]/.test(value),
                    hasNumbers: (value.match(/\d/g) || []).length >= 2,
                    hasSpecialChars: /[@$!%*?&]/.test(value),
                    onlyAllowedChars: /^[a-zA-Z\d@$!%*?&]+$/.test(value)
                };
            },
            message: (checks) => {
                const failed = [];
                if (!checks.minLength) failed.push('минимум 8 символов');
                if (!checks.hasUpperCase) failed.push('заглавную букву');
                if (!checks.hasLowerCase) failed.push('строчную букву');
                if (!checks.hasNumbers) failed.push('минимум 2 цифры');
                if (!checks.hasSpecialChars) failed.push('специальный символ');
                if (!checks.onlyAllowedChars) failed.push('только разрешенные символы');
                
                return failed.length > 0 
                    ? `Пароль должен содержать: ${failed.join(', ')}`
                    : '';
            },
            hint: 'Используйте сильный пароль для безопасности'
        });

        // Имя валидатор
        this.addValidator('name', {
            validate: (value) => {
                return value.length >= 2 && value.length <= 50 && /^[а-яё\s\-]+$/i.test(value);
            },
            message: 'Имя должно содержать 2-50 символов (только русские буквы, пробелы и дефисы)',
            hint: 'Введите ваше настоящее имя'
        });

        // Логин валидатор
        this.addValidator('username', {
            validate: (value) => {
                return value.length >= 3 && value.length <= 20 && /^[a-zA-Z0-9_]+$/.test(value);
            },
            message: 'Логин должен содержать 3-20 символов (буквы, цифры, подчеркивание)',
            hint: 'Уникальный идентификатор для входа'
        });

        // Подтверждение пароля
        this.addValidator('confirmPassword', {
            validate: (value, formData) => {
                const password = formData.get('password');
                return value === password;
            },
            message: 'Пароли не совпадают',
            hint: 'Повторите пароль точно'
        });
    }

    /**
     * Добавить пользовательский валидатор
     */
    addValidator(name, config) {
        this.validators.set(name, {
            validate: config.validate,
            message: config.message,
            hint: config.hint || '',
            async: config.async || false,
            debounce: config.debounce || this.options.debounceTime
        });
    }

    /**
     * Валидация поля с обработкой состояний
     */
    async validateField(fieldName, value, formData = null, showFeedback = true) {
        const validator = this.validators.get(fieldName);
        if (!validator) return { isValid: true, message: '', hint: '' };

        try {
            let result;
            
            if (validator.async) {
                // Асинхронная валидация с debounce
                return new Promise((resolve) => {
                    clearTimeout(this.validationTimers.get(fieldName));
                    
                    const timer = setTimeout(async () => {
                        try {
                            result = await validator.validate(value, formData);
                            const validationResult = this.processValidationResult(
                                fieldName, result, validator, showFeedback
                            );
                            resolve(validationResult);
                        } catch (error) {
                            console.error(`Validation error for ${fieldName}:`, error);
                            resolve({ isValid: false, message: 'Ошибка валидации', hint: '' });
                        }
                    }, validator.debounce);
                    
                    this.validationTimers.set(fieldName, timer);
                });
            } else {
                // Синхронная валидация
                result = validator.validate(value, formData);
                return this.processValidationResult(fieldName, result, validator, showFeedback);
            }
        } catch (error) {
            console.error(`Validation error for ${fieldName}:`, error);
            return { isValid: false, message: 'Ошибка валидации', hint: '' };
        }
    }

    /**
     * Обработка результата валидации
     */
    processValidationResult(fieldName, result, validator, showFeedback) {
        let isValid, message, hint;

        if (typeof result === 'boolean') {
            isValid = result;
            message = isValid ? '' : (typeof validator.message === 'function' 
                ? validator.message() 
                : validator.message);
        } else if (typeof result === 'object') {
            // Для сложных валидаторов (например, пароль)
            isValid = Object.values(result).every(check => check === true);
            message = isValid ? '' : (typeof validator.message === 'function' 
                ? validator.message(result) 
                : validator.message);
        }

        hint = validator.hint || '';

        // Сохраняем состояние поля
        this.fieldStates.set(fieldName, {
            isValid,
            message,
            hint,
            timestamp: Date.now()
        });

        // Показываем обратную связь
        if (showFeedback) {
            this.showFieldFeedback(fieldName, { isValid, message, hint });
        }

        return { isValid, message, hint };
    }

    /**
     * Показать обратную связь для поля
     */
    showFieldFeedback(fieldName, feedback) {
        const field = document.getElementById(fieldName) || 
                     document.querySelector(`[name="${fieldName}"]`);
        const errorElement = document.getElementById(`${fieldName}-error`);
        const hintElement = document.getElementById(`${fieldName}-hint`);

        if (!field) return;

        // Убираем все предыдущие состояния
        field.classList.remove('valid', 'invalid', 'validating');
        
        if (feedback.isValid) {
            if (this.options.showSuccessStates && field.value.trim()) {
                field.classList.add('valid');
                this.animateValidState(field);
            }
            
            if (errorElement) {
                this.hideElement(errorElement);
            }
        } else {
            field.classList.add('invalid');
            this.animateInvalidState(field);
            
            if (errorElement) {
                this.showError(errorElement, feedback.message);
            }
        }

        // Показываем подсказку
        if (hintElement && feedback.hint) {
            this.showHint(hintElement, feedback.hint);
        }

        // Обновляем ARIA атрибуты для доступности
        this.updateAriaAttributes(field, feedback);
    }

    /**
     * Анимация валидного состояния
     */
    animateValidState(element) {
        element.style.animation = `successPulse ${this.options.animationDuration}ms ease-out`;
        setTimeout(() => {
            element.style.animation = '';
        }, this.options.animationDuration);
    }

    /**
     * Анимация невалидного состояния
     */
    animateInvalidState(element) {
        element.style.animation = `errorShake ${this.options.animationDuration}ms ease-out`;
        setTimeout(() => {
            element.style.animation = '';
        }, this.options.animationDuration);
    }

    /**
     * Показать ошибку с анимацией
     */
    showError(element, message) {
        element.textContent = message;
        element.classList.add('show');
        element.style.display = 'block';
        
        // Анимация появления
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }

    /**
     * Скрыть элемент с анимацией
     */
    hideElement(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            element.classList.remove('show');
            element.style.display = 'none';
            element.textContent = '';
        }, this.options.animationDuration);
    }

    /**
     * Показать подсказку
     */
    showHint(element, hint) {
        element.textContent = hint;
        element.style.display = 'block';
    }

    /**
     * Обновление ARIA атрибутов для доступности
     */
    updateAriaAttributes(field, feedback) {
        if (feedback.isValid) {
            field.setAttribute('aria-invalid', 'false');
            field.removeAttribute('aria-describedby');
        } else {
            field.setAttribute('aria-invalid', 'true');
            const errorId = `${field.id || field.name}-error`;
            field.setAttribute('aria-describedby', errorId);
        }
    }

    /**
     * Валидация всей формы
     */
    async validateForm(form) {
        const formData = new FormData(form);
        const results = new Map();
        const fields = form.querySelectorAll('[data-validate]');

        // Валидируем все поля параллельно
        const validationPromises = Array.from(fields).map(async (field) => {
            const fieldName = field.name || field.id;
            const validatorName = field.dataset.validate;
            const value = formData.get(fieldName);
            
            const result = await this.validateField(validatorName, value, formData, true);
            results.set(fieldName, result);
            
            return result;
        });

        const validationResults = await Promise.all(validationPromises);
        const isFormValid = validationResults.every(result => result.isValid);

        return {
            isValid: isFormValid,
            results: Object.fromEntries(results),
            firstErrorField: this.getFirstErrorField(fields, results)
        };
    }

    /**
     * Получить первое поле с ошибкой для фокуса
     */
    getFirstErrorField(fields, results) {
        for (const field of fields) {
            const fieldName = field.name || field.id;
            const result = results.get(fieldName);
            
            if (result && !result.isValid) {
                return field;
            }
        }
        return null;
    }

    /**
     * Инициализация валидации для формы
     */
    initFormValidation(formSelector) {
        const form = document.querySelector(formSelector);
        if (!form) return;

        const fields = form.querySelectorAll('[data-validate]');

        fields.forEach(field => {
            // Валидация при потере фокуса
            if (this.options.validateOnBlur) {
                field.addEventListener('blur', async (e) => {
                    const fieldName = e.target.name || e.target.id;
                    const validatorName = e.target.dataset.validate;
                    const formData = new FormData(form);
                    
                    await this.validateField(validatorName, e.target.value, formData);
                });
            }

            // Валидация при вводе (с debounce)
            if (this.options.validateOnInput) {
                field.addEventListener('input', (e) => {
                    const fieldName = e.target.name || e.target.id;
                    
                    // Убираем ошибку при начале ввода
                    if (e.target.classList.contains('invalid')) {
                        e.target.classList.remove('invalid');
                        const errorElement = document.getElementById(`${fieldName}-error`);
                        if (errorElement) {
                            this.hideElement(errorElement);
                        }
                    }
                    
                    // Валидируем с задержкой
                    clearTimeout(this.validationTimers.get(fieldName));
                    const timer = setTimeout(async () => {
                        const validatorName = e.target.dataset.validate;
                        const formData = new FormData(form);
                        await this.validateField(validatorName, e.target.value, formData);
                    }, this.options.debounceTime);
                    
                    this.validationTimers.set(fieldName, timer);
                });
            }
        });

        // Валидация при отправке формы
        if (this.options.validateOnSubmit) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const validationResult = await this.validateForm(form);
                
                if (validationResult.isValid) {
                    // Форма валидна, можно отправлять
                    this.onFormValid(form, validationResult);
                } else {
                    // Есть ошибки, фокусируемся на первом поле с ошибкой
                    if (validationResult.firstErrorField) {
                        validationResult.firstErrorField.focus();
                    }
                    this.onFormInvalid(form, validationResult);
                }
            });
        }
    }

    /**
     * Колбэк для валидной формы
     */
    onFormValid(form, validationResult) {
        // Можно переопределить в наследуемых классах
        console.log('Form is valid:', validationResult);
    }

    /**
     * Колбэк для невалидной формы
     */
    onFormInvalid(form, validationResult) {
        // Можно переопределить в наследуемых классах
        console.log('Form has errors:', validationResult);
    }

    /**
     * Очистка валидации
     */
    clearValidation(formSelector) {
        const form = document.querySelector(formSelector);
        if (!form) return;

        const fields = form.querySelectorAll('[data-validate]');
        
        fields.forEach(field => {
            field.classList.remove('valid', 'invalid', 'validating');
            field.removeAttribute('aria-invalid');
            field.removeAttribute('aria-describedby');
            
            const fieldName = field.name || field.id;
            const errorElement = document.getElementById(`${fieldName}-error`);
            const hintElement = document.getElementById(`${fieldName}-hint`);
            
            if (errorElement) {
                this.hideElement(errorElement);
            }
            
            if (hintElement) {
                hintElement.style.display = 'none';
            }
        });

        // Очищаем таймеры
        this.validationTimers.clear();
        this.fieldStates.clear();
    }
}
```

### 1.2 Специализированный валидатор для авторизации

```javascript
// auth-validator.js - Валидатор для форм авторизации

/**
 * Специализированный валидатор для форм авторизации
 */
class AuthValidator extends EnhancedValidator {
    constructor(options = {}) {
        super({
            validateOnBlur: true,
            validateOnInput: true,
            showSuccessStates: true,
            debounceTime: 400,
            ...options
        });
        
        this.initAuthValidators();
    }

    /**
     * Инициализация валидаторов для авторизации
     */
    initAuthValidators() {
        // Валидатор поля логин/email
        this.addValidator('loginField', {
            validate: (value) => {
                if (!value.trim()) return false;
                
                // Если содержит @, валидируем как email
                if (value.includes('@')) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                }
                
                // Иначе валидируем как username
                return /^[a-zA-Z0-9_]{3,20}$/.test(value);
            },
            message: 'Введите корректный email или логин (3-20 символов)',
            hint: 'Email или логин для входа в систему'
        });

        // Валидатор email с проверкой доступности
        this.addValidator('emailWithAvailability', {
            validate: async (value) => {
                // Сначала проверяем формат
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    return { format: false, available: true };
                }
                
                // Затем проверяем доступность на сервере
                try {
                    const response = await fetch('/api/auth/check-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: value })
                    });
                    
                    const data = await response.json();
                    return { format: true, available: !data.exists };
                } catch (error) {
                    // В случае ошибки сети считаем доступным
                    return { format: true, available: true };
                }
            },
            message: (result) => {
                if (!result.format) return 'Введите корректный email адрес';
                if (!result.available) return 'Этот email уже зарегистрирован';
                return '';
            },
            hint: 'Используйте активный email адрес',
            async: true,
            debounce: 800
        });

        // Валидатор логина с проверкой доступности
        this.addValidator('usernameWithAvailability', {
            validate: async (value) => {
                // Проверяем формат
                if (!/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
                    return { format: false, available: true };
                }
                
                // Проверяем доступность
                try {
                    const response = await fetch('/api/auth/check-username', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: value })
                    });
                    
                    const data = await response.json();
                    return { format: true, available: !data.exists };
                } catch (error) {
                    return { format: true, available: true };
                }
            },
            message: (result) => {
                if (!result.format) return 'Логин: 3-20 символов (буквы, цифры, _)';
                if (!result.available) return 'Этот логин уже занят';
                return '';
            },
            hint: 'Уникальный идентификатор для входа',
            async: true,
            debounce: 600
        });

        // Продвинутый валидатор пароля с индикатором силы
        this.addValidator('passwordStrength', {
            validate: (value) => {
                const checks = {
                    length: value.length >= 8,
                    uppercase: /[A-Z]/.test(value),
                    lowercase: /[a-z]/.test(value),
                    numbers: (value.match(/\d/g) || []).length >= 2,
                    special: /[@$!%*?&]/.test(value),
                    allowed: /^[a-zA-Z\d@$!%*?&]+$/.test(value)
                };
                
                const strength = this.calculatePasswordStrength(checks);
                
                return {
                    ...checks,
                    strength,
                    isValid: Object.values(checks).every(check => check === true)
                };
            },
            message: (result) => {
                const failed = [];
                if (!result.length) failed.push('минимум 8 символов');
                if (!result.uppercase) failed.push('заглавную букву');
                if (!result.lowercase) failed.push('строчную букву');
                if (!result.numbers) failed.push('минимум 2 цифры');
                if (!result.special) failed.push('специальный символ');
                if (!result.allowed) failed.push('только разрешенные символы');
                
                return failed.length > 0 
                    ? `Добавьте: ${failed.join(', ')}`
                    : '';
            },
            hint: 'Создайте надежный пароль'
        });
    }

    /**
     * Расчет силы пароля
     */
    calculatePasswordStrength(checks) {
        const weights = {
            length: 2,
            uppercase: 1,
            lowercase: 1,
            numbers: 2,
            special: 2,
            allowed: 1
        };
        
        const maxScore = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        const currentScore = Object.entries(checks)
            .filter(([key]) => key !== 'isValid')
            .reduce((sum, [key, passed]) => {
                return sum + (passed ? weights[key] || 0 : 0);
            }, 0);
        
        const percentage = (currentScore / maxScore) * 100;
        
        if (percentage < 40) return 'weak';
        if (percentage < 70) return 'medium';
        return 'strong';
    }

    /**
     * Показать индикатор силы пароля
     */
    showPasswordStrength(fieldName, strength) {
        const strengthIndicator = document.getElementById(`${fieldName}-strength`);
        if (!strengthIndicator) return;
        
        strengthIndicator.className = `password-strength ${strength}`;
        
        const strengthText = {
            weak: 'Слабый пароль',
            medium: 'Средний пароль',
            strong: 'Надежный пароль'
        };
        
        strengthIndicator.textContent = strengthText[strength] || '';
    }

    /**
     * Переопределяем показ обратной связи для включения индикатора силы пароля
     */
    showFieldFeedback(fieldName, feedback) {
        super.showFieldFeedback(fieldName, feedback);
        
        // Дополнительно для паролей показываем индикатор силы
        if (fieldName === 'password' && typeof feedback.result === 'object' && feedback.result.strength) {
            this.showPasswordStrength(fieldName, feedback.result.strength);
        }
    }

    /**
     * Специальная обработка для поля подтверждения пароля
     */
    async validatePasswordConfirmation(confirmValue, passwordValue) {
        const isMatching = confirmValue === passwordValue;
        const feedback = {
            isValid: isMatching,
            message: isMatching ? '' : 'Пароли не совпадают',
            hint: 'Повторите пароль точно как в поле выше'
        };
        
        this.showFieldFeedback('confirmPassword', feedback);
        return feedback;
    }

    /**
     * Валидация в реальном времени для подтверждения пароля
     */
    initPasswordConfirmationValidation(formSelector) {
        const form = document.querySelector(formSelector);
        if (!form) return;
        
        const passwordField = form.querySelector('[name="password"]');
        const confirmField = form.querySelector('[name="confirmPassword"]');
        
        if (!passwordField || !confirmField) return;
        
        const validateConfirmation = () => {
            this.validatePasswordConfirmation(confirmField.value, passwordField.value);
        };
        
        confirmField.addEventListener('input', validateConfirmation);
        confirmField.addEventListener('blur', validateConfirmation);
        passwordField.addEventListener('input', () => {
            if (confirmField.value) {
                validateConfirmation();
            }
        });
    }
}
```

## Часть 2: UX Паттерны для валидации

### 2.1 Прогрессивная валидация

```javascript
// progressive-validation.js - Прогрессивная валидация

/**
 * Класс для прогрессивной валидации форм
 */
class ProgressiveValidator extends AuthValidator {
    constructor(options = {}) {
        super(options);
        
        this.validationSteps = new Map();
        this.currentStep = 0;
        this.stepValidationResults = new Map();
    }

    /**
     * Инициализация шагов валидации
     */
    initValidationSteps(steps) {
        this.validationSteps = new Map(steps.map((step, index) => [index, step]));
        this.currentStep = 0;
    }

    /**
     * Валидация текущего шага
     */
    async validateCurrentStep(form) {
        const currentStepConfig = this.validationSteps.get(this.currentStep);
        if (!currentStepConfig) return { isValid: true, results: {} };

        const stepFields = currentStepConfig.fields;
        const results = new Map();

        for (const fieldConfig of stepFields) {
            const field = form.querySelector(`[name="${fieldConfig.name}"]`);
            if (!field) continue;

            const result = await this.validateField(
                fieldConfig.validator,
                field.value,
                new FormData(form),
                true
            );

            results.set(fieldConfig.name, result);
        }

        const isStepValid = Array.from(results.values()).every(result => result.isValid);
        
        this.stepValidationResults.set(this.currentStep, {
            isValid: isStepValid,
            results: Object.fromEntries(results)
        });

        return {
            isValid: isStepValid,
            results: Object.fromEntries(results),
            step: this.currentStep,
            stepConfig: currentStepConfig
        };
    }

    /**
     * Переход к следующему шагу
     */
    async nextStep(form) {
        const stepValidation = await this.validateCurrentStep(form);
        
        if (stepValidation.isValid) {
            this.currentStep++;
            this.showStepProgress();
            return { success: true, nextStep: this.currentStep };
        } else {
            this.showStepErrors(stepValidation);
            return { success: false, errors: stepValidation.results };
        }
    }

    /**
     * Возврат к предыдущему шагу
     */
    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStepProgress();
            return { success: true, previousStep: this.currentStep };
        }
        return { success: false, reason: 'Already at first step' };
    }

    /**
     * Показать прогресс шагов
     */
    showStepProgress() {
        const progressIndicator = document.querySelector('.step-progress');
        if (!progressIndicator) return;

        const steps = progressIndicator.querySelectorAll('.step');
        steps.forEach((step, index) => {
            step.classList.remove('current', 'completed', 'error');
            
            if (index < this.currentStep) {
                step.classList.add('completed');
            } else if (index === this.currentStep) {
                step.classList.add('current');
            }
            
            // Показываем ошибки для завершенных шагов
            const stepResult = this.stepValidationResults.get(index);
            if (stepResult && !stepResult.isValid) {
                step.classList.add('error');
            }
        });
    }

    /**
     * Показать ошибки шага
     */
    showStepErrors(stepValidation) {
        const stepContainer = document.querySelector(`[data-step="${this.currentStep}"]`);
        if (!stepContainer) return;

        Object.entries(stepValidation.results).forEach(([fieldName, result]) => {
            if (!result.isValid) {
                const field = stepContainer.querySelector(`[name="${fieldName}"]`);
                if (field) {
                    this.showFieldFeedback(fieldName, result);
                    
                    // Добавляем shake анимацию
                    field.classList.add('error-shake');
                    setTimeout(() => {
                        field.classList.remove('error-shake');
                    }, 500);
                }
            }
        });
    }
}
```

### 2.2 Система умных подсказок

```javascript
// smart-hints.js - Умные подсказки для форм

/**
 * Класс для управления умными подсказками
 */
class SmartHints {
    constructor() {
        this.hints = new Map();
        this.activeHint = null;
        this.hintHistory = new Set();
        
        this.initDefaultHints();
    }

    /**
     * Инициализация стандартных подсказок
     */
    initDefaultHints() {
        this.addHint('email', {
            triggers: ['focus', 'invalid'],
            content: {
                focus: 'Введите ваш email адрес для входа',
                invalid: 'Проверьте правильность написания email',
                suggestion: 'Возможно, вы имели в виду: '
            },
            suggestions: {
                'gmail.co': 'gmail.com',
                'yandex.r': 'yandex.ru',
                'mail.r': 'mail.ru',
                'hotmail.co': 'hotmail.com'
            }
        });

        this.addHint('password', {
            triggers: ['focus', 'input'],
            content: {
                focus: 'Создайте надежный пароль',
                weak: 'Пароль слишком простой. Добавьте символы разных типов',
                medium: 'Хороший пароль! Можно усилить специальными символами',
                strong: 'Отличный пароль! Высокий уровень безопасности'
            }
        });

        this.addHint('confirmPassword', {
            triggers: ['focus', 'input'],
            content: {
                focus: 'Повторите пароль для подтверждения',
                mismatch: 'Пароли не совпадают. Проверьте внимательно',
                match: 'Пароли совпадают ✓'
            }
        });
    }

    /**
     * Добавить подсказку для поля
     */
    addHint(fieldName, config) {
        this.hints.set(fieldName, {
            triggers: config.triggers || ['focus'],
            content: config.content || {},
            suggestions: config.suggestions || {},
            position: config.position || 'bottom',
            delay: config.delay || 300,
            duration: config.duration || 5000
        });
    }

    /**
     * Показать подсказку
     */
    showHint(fieldName, type, context = {}) {
        const hintConfig = this.hints.get(fieldName);
        if (!hintConfig || !hintConfig.content[type]) return;

        const field = document.getElementById(fieldName) || 
                     document.querySelector(`[name="${fieldName}"]`);
        if (!field) return;

        // Скрываем активную подсказку
        this.hideActiveHint();

        // Создаем элемент подсказки
        const hintElement = this.createHintElement(
            hintConfig.content[type],
            type,
            context
        );

        // Позиционируем подсказку
        this.positionHint(hintElement, field, hintConfig.position);

        // Показываем с анимацией
        this.animateHintIn(hintElement);

        // Сохраняем ссылку на активную подсказку
        this.activeHint = {
            element: hintElement,
            field: fieldName,
            type: type
        };

        // Автоскрытие
        if (hintConfig.duration > 0) {
            setTimeout(() => {
                this.hideHint(hintElement);
            }, hintConfig.duration);
        }

        // Сохраняем в историю
        this.hintHistory.add(`${fieldName}:${type}`);
    }

    /**
     * Создать элемент подсказки
     */
    createHintElement(content, type, context) {
        const hint = document.createElement('div');
        hint.className = `smart-hint smart-hint--${type}`;
        hint.setAttribute('role', 'tooltip');
        hint.setAttribute('aria-live', 'polite');

        // Иконка в зависимости от типа
        const icon = this.getHintIcon(type);
        
        hint.innerHTML = `
            <div class="smart-hint__content">
                <span class="smart-hint__icon">${icon}</span>
                <span class="smart-hint__text">${content}</span>
                ${context.suggestion ? `<div class="smart-hint__suggestion">${context.suggestion}</div>` : ''}
            </div>
            <div class="smart-hint__arrow"></div>
        `;

        document.body.appendChild(hint);
        return hint;
    }

    /**
     * Получить иконку для типа подсказки
     */
    getHintIcon(type) {
        const icons = {
            focus: '💡',
            invalid: '⚠️',
            suggestion: '💭',
            weak: '🔓',
            medium: '🔐',
            strong: '🔒',
            mismatch: '❌',
            match: '✅',
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        
        return icons[type] || 'ℹ️';
    }

    /**
     * Позиционировать подсказку
     */
    positionHint(hintElement, targetField, position) {
        const fieldRect = targetField.getBoundingClientRect();
        const hintRect = hintElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        let top, left;

        switch (position) {
            case 'top':
                top = fieldRect.top + scrollTop - hintRect.height - 10;
                left = fieldRect.left + scrollLeft + (fieldRect.width - hintRect.width) / 2;
                hintElement.classList.add('smart-hint--top');
                break;
            case 'bottom':
                top = fieldRect.bottom + scrollTop + 10;
                left = fieldRect.left + scrollLeft + (fieldRect.width - hintRect.width) / 2;
                hintElement.classList.add('smart-hint--bottom');
                break;
            case 'left':
                top = fieldRect.top + scrollTop + (fieldRect.height - hintRect.height) / 2;
                left = fieldRect.left + scrollLeft - hintRect.width - 10;
                hintElement.classList.add('smart-hint--left');
                break;
            case 'right':
                top = fieldRect.top + scrollTop + (fieldRect.height - hintRect.height) / 2;
                left = fieldRect.right + scrollLeft + 10;
                hintElement.classList.add('smart-hint--right');
                break;
            default:
                top = fieldRect.bottom + scrollTop + 10;
                left = fieldRect.left + scrollLeft;
                hintElement.classList.add('smart-hint--bottom');
        }

        // Проверяем границы экрана
        const maxLeft = window.innerWidth - hintRect.width - 10;
        const maxTop = window.innerHeight - hintRect.height - 10;

        left = Math.max(10, Math.min(left, maxLeft));
        top = Math.max(10, Math.min(top, maxTop));

        hintElement.style.position = 'absolute';
        hintElement.style.top = `${top}px`;
        hintElement.style.left = `${left}px`;
        hintElement.style.zIndex = '10000';
    }

    /**
     * Анимация появления подсказки
     */
    animateHintIn(hintElement) {
        hintElement.style.opacity = '0';
        hintElement.style.transform = 'translateY(-10px) scale(0.9)';
        hintElement.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

        requestAnimationFrame(() => {
            hintElement.style.opacity = '1';
            hintElement.style.transform = 'translateY(0) scale(1)';
        });
    }

    /**
     * Скрыть активную подсказку
     */
    hideActiveHint() {
        if (this.activeHint) {
            this.hideHint(this.activeHint.element);
            this.activeHint = null;
        }
    }

    /**
     * Скрыть подсказку с анимацией
     */
    hideHint(hintElement) {
        if (!hintElement || !hintElement.parentNode) return;

        hintElement.style.opacity = '0';
        hintElement.style.transform = 'translateY(-10px) scale(0.9)';

        setTimeout(() => {
            if (hintElement.parentNode) {
                hintElement.parentNode.removeChild(hintElement);
            }
        }, 300);
    }

    /**
     * Проверить email на типичные ошибки и предложить исправления
     */
    checkEmailSuggestions(email) {
        const hintConfig = this.hints.get('email');
        if (!hintConfig) return null;

        for (const [mistake, correction] of Object.entries(hintConfig.suggestions)) {
            if (email.includes(mistake)) {
                return email.replace(mistake, correction);
            }
        }

        return null;
    }

    /**
     * Инициализация обработчиков для поля
     */
    initFieldHints(fieldName) {
        const field = document.getElementById(fieldName) || 
                     document.querySelector(`[name="${fieldName}"]`);
        if (!field) return;

        const hintConfig = this.hints.get(fieldName);
        if (!hintConfig) return;

        // Показ подсказки при фокусе
        if (hintConfig.triggers.includes('focus')) {
            field.addEventListener('focus', () => {
                setTimeout(() => {
                    this.showHint(fieldName, 'focus');
                }, hintConfig.delay);
            });
        }

        // Скрытие при потере фокуса
        field.addEventListener('blur', () => {
            this.hideActiveHint();
        });

        // Специальная логика для email
        if (fieldName === 'email') {
            field.addEventListener('blur', () => {
                const suggestion = this.checkEmailSuggestions(field.value);
                if (suggestion) {
                    this.showHint('email', 'suggestion', {
                        suggestion: `${hintConfig.content.suggestion}${suggestion}`
                    });
                }
            });
        }

        // Специальная логика для пароля
        if (fieldName === 'password') {
            field.addEventListener('input', () => {
                // Логика для показа подсказок по силе пароля
                // будет реализована в основном валидаторе
            });
        }
    }

    /**
     * Инициализация всех подсказок для формы
     */
    initFormHints(formSelector) {
        const form = document.querySelector(formSelector);
        if (!form) return;

        // Инициализируем подсказки для всех полей с data-hint
        const fields = form.querySelectorAll('[data-hint]');
        fields.forEach(field => {
            const fieldName = field.name || field.id;
            this.initFieldHints(fieldName);
        });

        // Скрываем подсказки при клике вне формы
        document.addEventListener('click', (e) => {
            if (!form.contains(e.target)) {
                this.hideActiveHint();
            }
        });
    }
}
```

Продолжу создание оставшихся частей урока в отдельном файле, так как содержимое становится объемным.
