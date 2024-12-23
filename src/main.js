const API_BASE_URL = 'http://localhost:8081/api/auth';
const PHONE_REGEX = /^\+7\d{10}$/;

// Toggle between login and register forms
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

function switchToLogin() {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginBtn.classList.add('active');
    registerBtn.classList.remove('active');
}

function switchToRegister() {
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    registerBtn.classList.add('active');
    loginBtn.classList.remove('active');
}

loginBtn.addEventListener('click', switchToLogin);
registerBtn.addEventListener('click', switchToRegister);

// Handle login form submission
window.handleLogin = async (event) => {
    event.preventDefault();
    
    const authRequest = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(authRequest)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Received token:', data.token);
            localStorage.setItem('token', data.token);
            localStorage.setItem('userEmail', authRequest.email);
            window.location.href = '/dashboard.html';
        } else {
            const errorData = await response.text();
            if (response.status === 401) {
                alert('Неправильная почта или пароль');
            } else {
                alert(errorData.message || 'Не удалось войти. Попробуйте еще раз.');
            }
        }
            
    } catch (error) {
        console.error('Error:', error);
        alert('Произошла ошибка при входе. Попробуйте еще раз.');
    }
};

// Handle register form submission
window.handleRegister = async (event) => {
    event.preventDefault();
    
    const phoneInput = document.getElementById('phoneNumber');
    const phoneError = document.getElementById('phoneError');
    const phoneNumber = phoneInput.value;

    // Сбросим предыдущее состояние валидации
    phoneInput.classList.remove('invalid');
    phoneError.style.display = 'none';

    // Проверка формата телефона
    if (!validatePhoneNumber(phoneNumber)) {
        phoneInput.classList.add('invalid');
        phoneError.style.display = 'block';
        return;
    }
    
    const registerForm = document.getElementById('registerForm').querySelector('form');
    const registerRequest = {
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        firstname: document.getElementById('firstname').value,
        lastname: document.getElementById('lastname').value,
        patronymic: document.getElementById('patronymic').value,
        phoneNumber: phoneNumber,
        typeDev: document.getElementById('typeDev').value,
        additionalInfo: document.getElementById('additionalInfo').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/register/member`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerRequest)
        });

        if (response.ok) {
            const data = await response.json();
            // Очищаем форму
            registerForm.reset();
            // Переключаемся на форму входа и заполняем email
            switchToLogin();
            document.getElementById('loginEmail').value = registerRequest.email;
            alert('Регистрация прошла успешно');
        } else {
            const errorData = await response.text();
            if (response.status === 409) {
                alert('Пользователь с такой почтой уже зарегистрирован');
            } else {
                alert(errorData || 'Не удалось зарегистрироваться. Попробуйте еще раз.');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Произошла ошибка при регистрации. Попробуйте еще раз.');
    }
};

function validatePhoneNumber(phoneNumber) {
    return PHONE_REGEX.test(phoneNumber);
}
