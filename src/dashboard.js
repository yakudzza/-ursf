const API_BASE_URL = 'http://localhost:8081/api';

// В начале файла добавим функцию для проверки JWT
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch (e) {
        return null;
    }
}

// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
    }
    return token;
}

// После функции checkAuth() добавим:
function checkAdminRole() {
    const token = localStorage.getItem('token');
    if (token) {
        const decodedToken = parseJwt(token);
        console.log('Decoded token:', decodedToken);
        
        // Проверяем роль в поле role
        if (decodedToken && decodedToken.role) {
            return decodedToken.role === 'ADMIN';
        }
    }
    return false;
}

// После функции checkAdminRole() добавим:
function checkManagerRole() {
    const token = localStorage.getItem('token');
    if (token) {
        const decodedToken = parseJwt(token);
        return decodedToken && decodedToken.role === 'MANAGER';
    }
    return false;
}

// Display user info
function displayUserInfo() {
    const userEmail = localStorage.getItem('userEmail');
    document.getElementById('userEmail').textContent = userEmail;
    
    const adminButton = document.getElementById('adminButton');
    const myTeamsButton = document.getElementById('myTeamsButton');
    const notificationsButton = document.getElementById('notificationsButton');
    const suggestIdeaButton = document.getElementById('suggestIdeaButton');
    
    const isAdmin = checkAdminRole();
    const isManager = checkManagerRole();
    
    // Обновляем логику отображения кнопок
    if (adminButton) {
        if (isAdmin) {
            adminButton.style.display = 'flex';
            adminButton.classList.add('visible');
            if (myTeamsButton) {
                myTeamsButton.style.display = 'none';
            }
            if (suggestIdeaButton) {
                suggestIdeaButton.style.display = 'none';
            }
        } else {
            adminButton.style.display = 'none';
            adminButton.classList.remove('visible');
            // Показываем кно��ку "Моя команда" и "Предложить идею" только если пользователь не менеджер
            if (myTeamsButton) {
                myTeamsButton.style.display = isManager ? 'none' : 'block';
            }
            if (suggestIdeaButton) {
                suggestIdeaButton.style.display = isManager ? 'none' : 'block';
            }
        }
    }

    // Показываем/скрываем кнопку уведомлений
    if (notificationsButton) {
        notificationsButton.style.display = isManager ? 'block' : 'none';
    }
}

// Fetch and display hackathons
async function loadHackathons() {
    const token = checkAuth();
    try {
        const response = await fetch(`${API_BASE_URL}/hackathon/getAllHackathon`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const hackathons = await response.json();
            if (hackathons && hackathons.length > 0) {
                displayHackathons(hackathons);
                document.getElementById('noHackathonsMessage').classList.add('hidden');
                document.getElementById('hackathonsList').classList.remove('hidden');
            } else {
                showNoHackathonsMessage();
            }
        } else {
            showNoHackathonsMessage();
        }
    } catch (error) {
        console.error('Error:', error);
        showNoHackathonsMessage();
    }
}

function showNoHackathonsMessage() {
    document.getElementById('hackathonsList').classList.add('hidden');
    document.getElementById('noHackathonsMessage').classList.remove('hidden');
}

// Добавим функцию для получения случайного изображения
function getRandomHackathonImage() {
    const imageNumber = Math.floor(Math.random() * 5) + 1; // Случайное число от 1 до 5
    return `/images/default-hackathon-${imageNumber}.jpg`;
}

// Обновим функцию displayHackathons
function displayHackathons(hackathons) {
    const container = document.getElementById('hackathonsList');
    container.innerHTML = '';

    hackathons.forEach(hackathon => {
        const card = document.createElement('div');
        card.className = 'hackathon-card';
        card.onclick = () => {
            window.location.href = `/hackathon-details.html?id=${hackathon.id}`;
        };
        
        // Форматируем даты
        let startDate = 'Дата не указана';
        let endDate = 'Дата не указана';
        
        try {
            if (Array.isArray(hackathon.startDate) && hackathon.startDate.length === 5) {
                const [year, month, day, hour, minute] = hackathon.startDate;
                const startDateTime = new Date(year, month - 1, day, hour, minute);
                startDate = startDateTime.toLocaleString('ru-RU', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            
            if (Array.isArray(hackathon.endDate) && hackathon.endDate.length === 5) {
                const [year, month, day, hour, minute] = hackathon.endDate;
                const endDateTime = new Date(year, month - 1, day, hour, minute);
                endDate = endDateTime.toLocaleString('ru-RU', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        } catch (error) {
            console.error('Error parsing dates:', error);
        }

        const stateTranslations = {
            'ANNOUNCED': 'Анонсирован',
            'OPENED_REGISTRATION': 'Открыта регистрация',
            'CLOSED_REGISTRATION': 'Регистрация закрыта',
            'COMPLETED': 'Завершён'
        };

        const stateText = stateTranslations[hackathon.state] || 'Статус неизвестен';
        const stateClass = `state-${hackathon.state?.toLowerCase()}`;

        // Получаем случайное изображение для хакатона
        const randomImage = getRandomHackathonImage();

        card.innerHTML = `
            <div class="hackathon-image">
                <img src="${randomImage}" alt="${hackathon.name}">
            </div>
            <h2>${hackathon.name}</h2>
            <div class="state ${stateClass}">${stateText}</div>
            <div class="dates">
                <div>Начало: ${startDate}</div>
                <div>Конец: ${endDate}</div>
            </div>
            <div class="team-size">
                <i class="fas fa-users"></i> Максимальное количество команд: ${hackathon.maxTeams}
            </div>
            <div class="description">${hackathon.description}</div>
        `;
        container.appendChild(card);
    });
}

// Handle logout
window.handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    window.location.href = '/index.html';
};

// Show modal function
function showModal() {
    const modal = document.getElementById('teamModal');
    modal.style.display = 'block';
}

// Hide modal function
function hideModal() {
    const modal = document.getElementById('teamModal');
    modal.style.display = 'none';
}

// Fetch and display team information
async function loadTeamInfo() {
    const token = checkAuth();
    try {
        // Получаем memberId из токена
        const decodedToken = parseJwt(token);
        const memberId = decodedToken.id; // Предполагаем, что ID пользователя хранится в поле id токена

        const response = await fetch(`${API_BASE_URL}/teams/member-team?memberId=${memberId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const teamInfoContent = document.getElementById('teamInfoContent');
        
        if (response.ok) {
            const teamData = await response.json();
            if (teamData && teamData.teamName) {
                teamInfoContent.innerHTML = `
                    <p><strong>Название команды:</strong> ${teamData.teamName}</p>
                    <p><strong>Хакатон:</strong> ${teamData.hackathonName || 'Не указано'}</p>
                `;
            } else {
                teamInfoContent.innerHTML = `
                    <div class="no-team-message">
                        <p>Вы пока не состоите ни в одной команде</p>
                    </div>
                `;
            }
        } else {
            teamInfoContent.innerHTML = `
                <div class="no-team-message">
                    <p>Не удалось загрузить информацию о команде</p>
                </div>
            `;
        }
        
        showModal();
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('teamInfoContent').innerHTML = `
            <div class="no-team-message">
                <p>Произошла ошибка при загрузке информации о команде</p>
            </div>
        `;
        showModal();
    }
}

// Добавляем функцию для отправки идеи
async function suggestIdea() {
    const token = checkAuth();
    const ideaText = document.getElementById('ideaText').value;
    const managerId = document.getElementById('managerSelect').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/members/submitIdea?managerId=${managerId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ideaText)
        });

        if (response.ok) {
            alert('Идея успешно отправлена!');
            hideIdeaModal();
            document.getElementById('ideaForm').reset();
        } else {
            const errorText = await response.text();
            alert(`Ошибка при отправке идеи: ${errorText}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Произошла ошибка при отправке идеи');
    }
}

// Функции для работы с модальным окном идеи
function showIdeaModal() {
    const modal = document.getElementById('ideaModal');
    loadManagers(); // Загружаем список менеджеров при открытии модального окна
    modal.style.display = 'block';
}

function hideIdeaModal() {
    const modal = document.getElementById('ideaModal');
    modal.style.display = 'none';
}

// Обновляем функцию загрузки списка менеджеров
async function loadManagers() {
    const token = checkAuth();
    try {
        const response = await fetch(`${API_BASE_URL}/managers/getAllManagers`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const managers = await response.json();
            const managerSelect = document.getElementById('managerSelect');
            managerSelect.innerHTML = managers.map(manager => 
                `<option value="${manager.id}">${manager.firstname}</option>`
            ).join('');
        } else {
            console.error('Failed to load managers');
            alert('Ошибка при загрузке списка менеджеров');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при загрузке списка менеджеров');
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    if (!checkAdminRole()) {
        const adminButton = document.getElementById('adminButton');
        if (adminButton) {
            adminButton.style.display = 'none';
        }
    }
    displayUserInfo();
    loadHackathons();

    // Add event listeners for the team modal
    const myTeamsButton = document.getElementById('myTeamsButton');
    if (myTeamsButton) {
        myTeamsButton.addEventListener('click', (e) => {
            e.preventDefault();
            loadTeamInfo();
        });
    }

    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', hideModal);
    }

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('teamModal');
        if (event.target === modal) {
            hideModal();
        }
    });

    // Добавляем обработчики для модального окна идеи
    const suggestIdeaButton = document.getElementById('suggestIdeaButton');
    if (suggestIdeaButton) {
        suggestIdeaButton.addEventListener('click', showIdeaModal);
    }

    const closeIdeaModal = document.querySelector('.close-idea-modal');
    if (closeIdeaModal) {
        closeIdeaModal.addEventListener('click', hideIdeaModal);
    }

    const ideaForm = document.getElementById('ideaForm');
    if (ideaForm) {
        ideaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            suggestIdea();
        });
    }

    // Закрытие модального окна при клике вне его
    window.addEventListener('click', (event) => {
        const ideaModal = document.getElementById('ideaModal');
        if (event.target === ideaModal) {
            hideIdeaModal();
        }
    });
});
  