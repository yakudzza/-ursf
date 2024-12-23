const API_BASE_URL = 'http://localhost:8081/api';

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch (e) {
        return null;
    }
}

function checkAdminRole() {
    const token = localStorage.getItem('token');
    if (token) {
        const decodedToken = parseJwt(token);
        const possibleRoles = ['ADMIN', 'ROLE_ADMIN', 'admin', 'Admin'];
        
        if (decodedToken && decodedToken.roles) {
            return possibleRoles.some(role => decodedToken.roles.includes(role));
        }
        
        if (decodedToken && decodedToken.role) {
            return possibleRoles.some(role => decodedToken.role === role);
        }
        
        if (decodedToken && decodedToken.authorities) {
            return possibleRoles.some(role => 
                decodedToken.authorities.some(auth => 
                    auth === role || auth === `ROLE_${role}` || auth.authority === role || auth.authority === `ROLE_${role}`
                )
            );
        }
    }
    return false;
}

// Проверка авторизации и прав доступа
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }

    if (!checkAdminRole()) {
        window.location.href = '/dashboard.html';
        return;
    }

    // Если все проверки пройдены, отображаем email пользователя
    const userEmail = localStorage.getItem('userEmail');
    document.getElementById('userEmail').textContent = userEmail;
}

// Handle logout
window.handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    window.location.href = '/index.html';
};

// Add this function after the handleLogout function
window.navigateToCreateHackathon = () => {
    window.location.href = '/createHackathon.html';
};

// Добавим новую функцию навигации
window.navigateToManagers = () => {
    window.location.href = '/adminManagers.html';
};

// Добавляем после существующих импортов
async function fetchHackathons() {
    try {
        const response = await fetch(`${API_BASE_URL}/hackathon/getAllHackathon`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch hackathons');
        }
        
        const hackathons = await response.json();
        console.log('Полученные хакатоны:', hackathons); // Для отладки

        if (Array.isArray(hackathons)) {
            populateHackathonSelect(hackathons);
            populateHackathonStateSelect(hackathons);
        } else if (hackathons.content && Array.isArray(hackathons.content)) {
            // Если данные приходят в формате пагинации
            populateHackathonSelect(hackathons.content);
            populateHackathonStateSelect(hackathons.content);
        } else {
            console.error('Unexpected hackathons data format:', hackathons);
        }
    } catch (error) {
        console.error('Error fetching hackathons:', error);
    }
}

function populateHackathonSelect(hackathons) {
    const select = document.getElementById('hackathonSelect');
    select.innerHTML = '<option value="">Выберите хакатон</option>';
    
    hackathons.forEach(hackathon => {
        const option = document.createElement('option');
        option.value = hackathon.id;
        option.textContent = hackathon.title || hackathon.name; // Поддержка обоих вариантов
        select.appendChild(option);
    });
}

function populateHackathonStateSelect(hackathons) {
    const select = document.getElementById('hackathonStateSelect');
    select.innerHTML = '<option value="">Выберите хакатон</option>';
    
    hackathons.forEach(hackathon => {
        const option = document.createElement('option');
        option.value = hackathon.id;
        option.textContent = hackathon.title || hackathon.name; // Поддержка обоих вариантов
        select.appendChild(option);
    });
}

window.deleteHackathon = async () => {
    const select = document.getElementById('hackathonSelect');
    const hackathonId = select.value;
    
    if (!hackathonId) {
        alert('Пожалуйста, выберите хакатон');
        return;
    }
    
    if (!confirm('Вы уверены, что хотите удалить этот хакатон?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/admins/${hackathonId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete hackathon');
        }
        
        alert('Хакатон успешно удален');
        fetchHackathons(); // Обновляем список хакатонов
    } catch (error) {
        console.error('Error deleting hackathon:', error);
        alert('Ошибка при удалении хакатона');
    }
};

// Добавляем функцию создания хакатона
async function createHackathon(formData) {
    const token = localStorage.getItem('token');
    try {
        // Преобразуем даты в нужный формат
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);

        const hackathonData = {
            title: formData.title,
            description: formData.description,
            fullDescription: formData.fullDescription,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            maxTeams: parseInt(formData.maxTeams),
            managerId: parseInt(formData.managerId)
        };

        console.log('Отправляем данные:', hackathonData);

        const response = await fetch(`${API_BASE_URL}/hackathon/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(hackathonData)
        });

        // Получаем текст ошибки
        const responseText = await response.text();
        console.log('Ответ сервера:', responseText);

        if (!response.ok) {
            let errorMessage;
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.message || 'Unknown error';
            } catch (e) {
                errorMessage = responseText || 'Failed to create hackathon';
            }
            throw new Error(errorMessage);
        }

        alert('Хакатон успешно создан!');
        fetchHackathons();
        document.getElementById('createHackathonForm').reset();
    } catch (error) {
        console.error('Error creating hackathon:', error);
        console.error('Full error details:', error.stack);
        alert(`Ошибка при создании хакатона: ${error.message}`);
    }
}

// Добавляем обработчик отправки формы
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    fetchHackathons();
    
    // Добавляем обработчик формы создания хакатона
    document.getElementById('createHackathonForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            fullDescription: document.getElementById('fullDescription').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            maxTeams: parseInt(document.getElementById('maxTeams').value),
            managerId: document.getElementById('managerId').value
        };

        console.log('Form data before sending:', formData);
        console.log('Selected manager ID:', formData.managerId);
        console.log('Start date:', new Date(formData.startDate).toISOString());
        console.log('End date:', new Date(formData.endDate).toISOString());

        await createHackathon(formData);
    });

    document.getElementById('changeStateForm').addEventListener('submit', changeHackathonState);
});

// Добавляем функции для работы с менеджерами
async function loadManagers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/managers/getAllManagers`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load managers');
        
        const managers = await response.json();
        displayManagers(managers);
        populateManagerSelect(managers);
    } catch (error) {
        console.error('Error loading managers:', error);
        alert('Ошибка при загрузке списка менеджеров');
    }
}

function displayManagers(managers) {
    const listElement = document.getElementById('managersList');
    listElement.innerHTML = managers.map(manager => `
        <div class="manager-item">
            <div class="manager-info">
                <p>Имя: ${manager.firstname}</p>
            </div>
        </div>
    `).join('');
    
    // Выведем в консоль стрктуру первого менеджера для отладки
    if (managers.length > 0) {
        console.log('Структура данных менеджера:', managers[0]);
    }
}

const PHONE_REGEX = /^\+7\d{10}$/;

window.createManager = async function(event) {
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

    // Проверка пароля
    const password = document.getElementById('regPassword').value;
    if (password.length < 6) {
        alert('Пароль должен содержать минимум 6 символов');
        return;
    }
    
    const managerData = {
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        firstname: document.getElementById('firstname').value,
        lastname: document.getElementById('lastname').value,
        patronymic: document.getElementById('patronymic').value,
        phoneNumber: phoneNumber,
        additionalInfo: document.getElementById('additionalInfo').value
    };

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/auth/register/manager`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(managerData)
        });

        // Получаем текст ответа
        const responseText = await response.text();
        console.log('Ответ сервера при создании менеджера:', responseText);

        if (!response.ok) {
            let errorMessage;
            try {
                // Пробуем распарсить JSON только если он есть
                if (responseText) {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message;
                }
            } catch (e) {
                // Если не получилось распарсить JSON, используем текст ответа
                errorMessage = responseText;
            }

            if (response.status === 409) {
                throw new Error('Менеджер с такой почтой уже зарегистрирован');
            } else {
                throw new Error(errorMessage || 'Ошибка при создании менеджера');
            }
        }

        alert('Менеджер успешно добавлен');
        document.getElementById('managerForm').reset();
        loadManagers();
    } catch (error) {
        console.error('Error creating manager:', error);
        console.error('Full error details:', error.stack);
        alert(error.message || 'Ошибка при создании менеджера');
    }
}

function validatePhoneNumber(phoneNumber) {
    return PHONE_REGEX.test(phoneNumber);
}

// Добавляем функцию заполнения select менеджеров
function populateManagerSelect(managers) {
    const select = document.getElementById('managerId');
    select.innerHTML = '<option value="">Выберите менеджера</option>';
    
    managers.forEach(manager => {
        const option = document.createElement('option');
        option.value = manager.id;
        option.textContent = manager.firstname;
        select.appendChild(option);
    });
}

// Добавляем функционал переключения вкладок
function initTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Убираем активный класс со всех вкладок
            tabs.forEach(t => t.classList.remove('active'));
            // Добавляем активный класс текущей вкладке
            tab.classList.add('active');

            // Скрываем все контенты вкладок
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            // оказываем контент выбранной вкладки
            const tabId = tab.dataset.tab + 'Tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Обноляем инициализацию при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    fetchHackathons();
    loadManagers();
    initTabs();
});

// Добавляем функцию изменения состояния хакатона
async function changeHackathonState(event) {
    event.preventDefault();
    
    const hackathonId = document.getElementById('hackathonStateSelect').value;
    const newState = document.getElementById('stateSelect').value;
    
    if (!hackathonId || !newState) {
        alert('Пожалуйста, выберите хакатон и новое состояние');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/hackathon/update-state`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                hackathonId: parseInt(hackathonId),
                newState: newState
            })
        });

        // Получаем текст ошибки для отладки
        const responseText = await response.text();
        console.log('Ответ сервера при изменении состояния:', responseText);
        
        if (!response.ok) {
            let errorMessage;
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.message || 'Unknown error';
            } catch (e) {
                errorMessage = responseText || 'Failed to change hackathon state';
            }
            throw new Error(errorMessage);
        }
        
        alert('Состояние хакатона успешно изменено');
        document.getElementById('changeStateForm').reset();
        fetchHackathons(); // Обновляем списки хакатонов
    } catch (error) {
        console.error('Error changing hackathon state:', error);
        console.error('Full error details:', error.stack);
        alert(`Ошибка при изменении состояния хакатона: ${error.message}`);
    }
} 