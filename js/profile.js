let currentUser = null;
let sessionStartTime = null;
let sessionTimer = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const userData = localStorage.getItem('vzpbug_user');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = JSON.parse(userData);
    sessionStartTime = new Date();
    
    // Initialize profile
    initializeProfile();
    
    // Start session timer
    startSessionTimer();
    
    // Start cursor blinking
    startCursorBlink();
    
    // Load server status
    loadServerStatus();
    
    // Show admin nav if needed
    if (['reseller', 'admin', 'OWNER'].includes(currentUser.role)) {
        document.getElementById('adminNavItem').style.display = 'block';
    }
});

function initializeProfile() {
    // Set user data
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileRole').textContent = getRoleDisplay(currentUser.role);
    document.getElementById('profileBugAttempts').textContent = currentUser.bug_attempts || 0;
    document.getElementById('profileCreated').textContent = formatDate(currentUser.created_at);
    document.getElementById('profileExpired').textContent = formatDate(currentUser.expired_date);
    document.getElementById('profileLastLogin').textContent = formatDateTime(currentUser.last_login);
    
    // Set account status
    const now = new Date();
    const expiredDate = new Date(currentUser.expired_date);
    const isExpired = now > expiredDate;
    
    const statusElement = document.getElementById('profileStatus');
    if (isExpired) {
        statusElement.textContent = 'EXPIRED';
        statusElement.style.color = '#ff4444';
    } else {
        statusElement.textContent = 'ACTIVE';
        statusElement.style.color = '#00ff00';
    }
    
    // Calculate days remaining
    const daysRemaining = Math.ceil((expiredDate - now) / (1000 * 60 * 60 * 24));
    const daysElement = document.getElementById('daysRemaining');
    
    if (daysRemaining <= 0) {
        daysElement.textContent = 'EXPIRED';
        daysElement.style.color = '#ff4444';
    } else if (daysRemaining <= 7) {
        daysElement.textContent = `${daysRemaining} days`;
        daysElement.style.color = '#ffaa00';
    } else {
        daysElement.textContent = `${daysRemaining} days`;
        daysElement.style.color = '#00ff00';
    }
}

function getRoleDisplay(role) {
    const roleMap = {
        'pengguna': 'USER',
        'reseller': 'RESELLER', 
        'admin': 'ADMIN',
        'OWNER': 'OWNER'
    };
    return roleMap[role] || role.toUpperCase();
}

function startSessionTimer() {
    sessionTimer = setInterval(() => {
        const now = new Date();
        const diff = now - sessionStartTime;
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('sessionTime').textContent = timeString;
    }, 1000);
}

function startCursorBlink() {
    const cursor = document.getElementById('commandPrompt');
    setInterval(() => {
        cursor.style.opacity = cursor.style.opacity === '0' ? '1' : '0';
    }, 500);
}

async function loadServerStatus() {
    try {
        const response = await fetch('api/system.php?action=server_status');
        const data = await response.json();
        
        const statusElement = document.getElementById('serverStatusTerminal');
        const statusMap = {
            'online': { text: 'ONLINE', color: '#00ff00' },
            'offline': { text: 'OFFLINE', color: '#ff4444' },
            'maintenance': { text: 'MAINTENANCE', color: '#ffaa00' },
            'error': { text: 'ERROR', color: '#ff4444' }
        };
        
        const status = statusMap[data.status] || statusMap['error'];
        statusElement.textContent = status.text;
        statusElement.style.color = status.color;
        
    } catch (error) {
        console.error('Load server status error:', error);
        const statusElement = document.getElementById('serverStatusTerminal');
        statusElement.textContent = 'CONNECTION_ERROR';
        statusElement.style.color = '#ff4444';
    }
}

function executeCommand(command) {
    const prompt = document.getElementById('commandPrompt');
    
    // Show command execution
    prompt.innerHTML = `<span style="color: #00ff00;">${command}</span>`;
    
    setTimeout(() => {
        switch(command) {
            case 'refresh':
                refreshUserData();
                break;
            case 'logout':
                logout();
                break;
            case 'clear':
                clearTerminal();
                break;
            case 'dashboard':
                window.location.href = 'dashboard.html';
                break;
            default:
                addTerminalLine(`Command '${command}' not found. Type 'help' for available commands.`, '#ff4444');
        }
        
        // Reset prompt
        setTimeout(() => {
            prompt.innerHTML = '_';
        }, 1000);
    }, 500);
}

async function refreshUserData() {
    addTerminalLine('Refreshing user data...', '#ffaa00');
    
    try {
        const response = await fetch('api/auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'refresh_user',
                user_id: currentUser.id
            })
        });
        
        const data = await response.json();
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('vzpbug_user', JSON.stringify(currentUser));
            initializeProfile();
            loadServerStatus();
            addTerminalLine('User data refreshed successfully!', '#00ff00');
        } else {
            addTerminalLine('Failed to refresh user data.', '#ff4444');
        }
    } catch (error) {
        console.error('Refresh error:', error);
        addTerminalLine('Connection error while refreshing data.', '#ff4444');
    }
}

function clearTerminal() {
    addTerminalLine('Clearing terminal...', '#ffaa00');
    
    setTimeout(() => {
        const terminalContent = document.getElementById('terminalContent');
        terminalContent.innerHTML = `
            <div class="terminal-line">
                <span class="terminal-prompt">clear</span>
            </div>
            <div class="terminal-line">
                <span style="color: #00ff00;">Terminal cleared.</span>
            </div>
            <div class="terminal-line">
                <span style="color: #ffffff;">Type 'help' for available commands.</span>
            </div>
            <div class="terminal-line">&nbsp;</div>
            <div class="terminal-line">
                <span class="terminal-prompt" id="commandPrompt">_</span>
            </div>
        `;
        startCursorBlink();
    }, 1000);
}

function addTerminalLine(text, color = '#ffffff') {
    const terminalContent = document.getElementById('terminalContent');
    const commandPrompt = document.getElementById('commandPrompt');
    
    // Remove current prompt
    commandPrompt.remove();
    
    // Add new line
    const newLine = document.createElement('div');
    newLine.className = 'terminal-line';
    newLine.innerHTML = `<span style="color: ${color};">${text}</span>`;
    terminalContent.appendChild(newLine);
    
    // Add new prompt
    const newPrompt = document.createElement('div');
    newPrompt.className = 'terminal-line';
    newPrompt.innerHTML = '<span class="terminal-prompt" id="commandPrompt">_</span>';
    terminalContent.appendChild(newPrompt);
    
    // Restart cursor blink
    startCursorBlink();
    
    // Scroll to bottom
    terminalContent.scrollTop = terminalContent.scrollHeight;
}

function logout() {
    addTerminalLine('Logging out...', '#ffaa00');
    
    setTimeout(() => {
        if (sessionTimer) {
            clearInterval(sessionTimer);
        }
        localStorage.removeItem('vzpbug_user');
        window.location.href = 'index.html';
    }, 1500);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID');
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID');
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey) {
        switch(e.key) {
            case 'r':
                e.preventDefault();
                executeCommand('refresh');
                break;
            case 'l':
                e.preventDefault();
                executeCommand('clear');
                break;
            case 'd':
                e.preventDefault();
                executeCommand('dashboard');
                break;
        }
    }
});