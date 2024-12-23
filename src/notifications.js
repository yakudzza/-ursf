const API_BASE_URL = 'http://localhost:8081/api';

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

async function loadTeamRequests() {
    const token = checkAuth();
    try {
        console.log('Fetching notifications...');
        const response = await fetch(`${API_BASE_URL}/notifications/all`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const notifications = await response.json();
            console.log('Raw response:', notifications);
            console.log('Response type:', typeof notifications);
            if (Array.isArray(notifications)) {
                console.log('Number of notifications:', notifications.length);
                notifications.forEach((notification, index) => {
                    console.log(`Notification ${index}:`, {
                        id: notification.id,
                        text: notification.text,
                        rawObject: notification
                    });
                });
            }
            displayNotifications(notifications);
        } else {
            console.error('Failed to load notifications. Status:', response.status);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            showNoNotifications();
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        showNoNotifications();
    }
}

function displayNotifications(notifications) {
    const container = document.getElementById('teamRequests');
    
    if (!notifications || notifications.length === 0) {
        showNoNotifications();
        return;
    }

    console.log('Building notifications HTML...');
    const html = `
        <h3>Уведомления</h3>
        ${notifications.map(notification => {
            console.log('Processing notification:', notification);
            console.log('wereFrom:', notification.wereFrom);
            console.log('teamId:', notification.teamId);
            console.log('memberId:', notification.memberId);
            
            const isTeamRequest = notification.wereFrom === 'TEAM';
            const isMemberRequest = notification.wereFrom === 'MEMBER';
            
            return `
                <div class="notification" data-notification-id="${notification.id}">
                    <div class="notification-info">
                        <div class="notification-text">${notification.text}</div>
                    </div>
                    ${isTeamRequest ? `
                        <div class="action-buttons">
                            <button class="approve-btn" onclick="approveTeam(${notification.teamId})">
                                Одобрить команду
                            </button>
                            <button class="reject-btn" onclick="declineTeam(${notification.teamId})">
                                Отклонить команду
                            </button>
                        </div>
                    ` : ''}
                    ${isMemberRequest ? `
                        <div class="action-buttons">
                            <button class="approve-btn" onclick="approveMember(${notification.teamId}, ${notification.memberId})">
                                Принять участника
                            </button>
                            <button class="reject-btn" onclick="rejectMember(${notification.teamId}, ${notification.memberId})">
                                Отклонить участника
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('')}
    `;

    console.log('Setting container HTML');
    container.innerHTML = html;
}

function showNoNotifications() {
    const container = document.getElementById('teamRequests');
    container.innerHTML = '<div class="no-requests">Нет новых уведомлений</div>';
}

window.handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    window.location.href = '/index.html';
};

async function approveTeam(teamId) {
    const token = checkAuth();
    try {
        const response = await fetch(`${API_BASE_URL}/managers/approve?teamId=${teamId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            await loadTeamRequests();
            alert('Команда успешно одобрена');
        } else {
            const error = await response.text();
            alert(error || 'Ошибка при одобрении команды');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при одобрении команды');
    }
}

async function declineTeam(teamId) {
    const token = checkAuth();
    try {
        const response = await fetch(`${API_BASE_URL}/managers/declineTeam?teamId=${teamId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            await loadTeamRequests();
            alert('Команда успешно отклонена');
        } else {
            const error = await response.text();
            alert(error || 'Ошибка при отклонении команды');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при отклонении команды');
    }
}

async function approveMember(teamId, memberId) {
    const token = checkAuth();
    try {
        const response = await fetch(`${API_BASE_URL}/members/approve-member?teamId=${teamId}&memberId=${memberId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            await loadTeamRequests();
            alert('Участник успешно добавлен в команду');
        } else {
            const error = await response.text();
            alert(error || 'Ошибка при добавлении участника');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при добавлении участника');
    }
}

async function rejectMember(teamId, memberId) {
    const token = checkAuth();
    try {
        const response = await fetch(`${API_BASE_URL}/members/decline-member?teamId=${teamId}&memberId=${memberId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            await loadTeamRequests();
            alert('Запрос на вступление отклонен');
        } else {
            const error = await response.text();
            alert(error || 'Ошибка при отклонении запроса');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при отклонении запроса');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    displayUserInfo();
    loadTeamRequests();
}); 