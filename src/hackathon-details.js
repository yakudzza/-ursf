const API_BASE_URL = 'http://localhost:8081/api';
let currentHackathonId = null;
let currentHackathonName = null;

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
    }
    return token;
}

function displayUserInfo() {
    const userEmail = localStorage.getItem('userEmail');
    document.getElementById('userEmail').textContent = userEmail;
}

function getHackathonIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function formatDateTime(dateArray) {
    if (!Array.isArray(dateArray) || dateArray.length !== 5) return 'Дата не указана';
    
    const [year, month, day, hour, minute] = dateArray;
    const date = new Date(year, month - 1, day, hour, minute);
    return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

const stateTranslations = {
    'ANNOUNCED': 'Анонсирован',
    'OPENED_REGISTRATION': 'Открыта регистрация',
    'CLOSED_REGISTRATION': 'Регистрация закрыта',
    'COMPLETED': 'Завершён'
};

async function loadHackathonDetails() {
    const token = checkAuth();
    currentHackathonId = getHackathonIdFromUrl();
    
    if (!currentHackathonId) {
        window.location.href = '/dashboard.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/hackathon/${currentHackathonId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const hackathon = await response.json();
            currentHackathonName = hackathon.title;
            displayHackathonDetails(hackathon);
        } else {
            console.error('Failed to load hackathon details');
            window.location.href = '/dashboard.html';
        }
    } catch (error) {
        console.error('Error:', error);
        window.location.href = '/dashboard.html';
    }
}

function getRandomHackathonImage() {
    const imageNumber = Math.floor(Math.random() * 5) + 1;
    return `/images/default-hackathon-${imageNumber}.jpg`;
}

function displayHackathonDetails(hackathon) {
    const container = document.getElementById('hackathonDetails');
    const stateText = stateTranslations[hackathon.state] || 'Стат��с неизвестен';
    const stateClass = `state-${hackathon.state?.toLowerCase()}`;
    const showTeamButtons = hackathon.state === 'OPENED_REGISTRATION';
    
    const randomImage = getRandomHackathonImage();

    container.innerHTML = `
        <div class="hackathon-header">
            <h1>${hackathon.title}</h1>
            <div class="header-controls">
                <button class="create-stickers-btn" onclick="createStickers('${hackathon.title}', '${hackathon.fullDescription}')">
                    <i class="fas fa-sticky-note"></i> Создать стикер
                </button>
                <div class="hackathon-state ${stateClass}">${stateText}</div>
            </div>
        </div>
        <div class="content-wrapper">
            <div class="hackathon-image">
                <img src="${randomImage}" alt="${hackathon.name}">
            </div>
            <div class="hackathon-info">
                <div class="info-content">
                    <div class="info-section">
                        <h3>Сроки проведения</h3>
                        <p>Начало: ${formatDateTime(hackathon.startDate)}</p>
                        <p>Окончание: ${formatDateTime(hackathon.endDate)}</p>
                    </div>
                    
                    <div class="info-section">
                        <h3>Информация о командах</h3>
                        <p>Количество команд: ${hackathon.teamSize}/${hackathon.maxTeams}</p>
                    </div>
                </div>
                
                <div class="action-buttons-container">
                    ${showTeamButtons ? `
                        <div class="action-buttons">
                            <button class="btn btn-primary join-team-btn">Вступить в команду</button>
                            <button class="btn btn-primary create-team-btn">Создать команду</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
        
        <div class="description-section">
            <h3>Описание</h3>
            <div class="full-description">${hackathon.fullDescription}</div>
        </div>
    `;

    if (showTeamButtons) {
        initializeTeamCreation();
        initializeJoinTeam();
    }
}

function initializeTeamCreation() {
    const modal = document.getElementById('createTeamModal');
    const createTeamBtn = document.querySelector('.create-team-btn');
    const closeBtn = document.querySelector('.close');
    const form = document.getElementById('createTeamForm');

    if (!modal || !createTeamBtn || !closeBtn || !form) {
        console.error('Required elements not found');
        return;
    }

    createTeamBtn.removeEventListener('click', showModal);
    closeBtn.removeEventListener('click', hideModal);
    form.removeEventListener('submit', handleSubmit);

    function showModal() {
        modal.style.display = 'block';
    }

    function hideModal() {
        modal.style.display = 'none';
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const teamName = document.getElementById('teamName').value;
        await createTeam(teamName);
    }

    createTeamBtn.addEventListener('click', showModal);
    closeBtn.addEventListener('click', hideModal);
    form.addEventListener('submit', handleSubmit);

    window.onclick = function(event) {
        if (event.target === modal) {
            hideModal();
        }
    };
}

async function createTeam(teamName) {
    const token = checkAuth();
    try {
        const requestData = {
            name: teamName,
            hackathonName: currentHackathonName
        };
        
        console.log('Sending request with data:', requestData);

        const response = await fetch(`${API_BASE_URL}/teams/create`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (response.ok) {
            const modal = document.getElementById('createTeamModal');
            modal.style.display = 'none';
            document.getElementById('createTeamForm').reset();
            
            await loadHackathonDetails();
            
            alert('Команда успешно создана!');
        } else {
            const errorText = await response.text();
            console.error('Server response:', errorText);
            try {
                const error = JSON.parse(errorText);
                alert(error.message || 'Ошибка при создании команды');
            } catch (e) {
                alert('Ошибка при создании команды');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Произошла ошибка при создании команды');
    }
}

function initializeJoinTeam() {
    const modal = document.getElementById('joinTeamModal');
    const joinTeamBtn = document.querySelector('.join-team-btn');
    const closeBtn = modal.querySelector('.close');

    joinTeamBtn.addEventListener('click', async () => {
        await loadTeams();
        modal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

async function loadTeams() {
    const token = checkAuth();
    try {
        const response = await fetch(`${API_BASE_URL}/teams/accepted`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const teams = await response.json();
            displayTeams(teams);
        } else {
            console.error('Failed to load teams');
            alert('Ошибка при загрузке списка команд');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при загрузке списка команд');
    }
}

function displayTeams(teams) {
    const teamsContainer = document.getElementById('teamsList');
    if (teams.length === 0) {
        teamsContainer.innerHTML = '<p>Нет доступных команд</p>';
        return;
    }

    teamsContainer.innerHTML = teams.map(team => `
        <div class="team-item">
            <span class="team-name">${team.name}</span>
            <button class="join-btn" onclick="requestJoinTeam(${team.id})">
                Вступить
            </button>
        </div>
    `).join('');
}

async function requestJoinTeam(teamId) {
    const token = checkAuth();
    try {
        const response = await fetch(`${API_BASE_URL}/members/request-join?teamId=${teamId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert('Запрос на вступление в команду успешно отправлен!');
            const modal = document.getElementById('joinTeamModal');
            modal.style.display = 'none';
        } else {
            const errorText = await response.text();
            alert(errorText || 'Ошибка при отправке запроса на вступление');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при отправке запроса на вступление');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    displayUserInfo();
    loadHackathonDetails();
}); 

window.handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    window.location.href = '/index.html';
};

async function createStickers(name, description) {
    const token = checkAuth();
    try {
        const response = await fetch(`${API_BASE_URL}/hackathon/createSticker`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `name=${encodeURIComponent(name)}&description=${encodeURIComponent(description)}`
        });

        if (response.ok) {
            const message = await response.text();
            alert(message);
        } else {
            const errorText = await response.text();
            alert(`Ошибка при создании стикеров: ${errorText}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Произошла ошибка при создании стикеров');
    }
}