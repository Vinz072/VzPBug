let currentUser = null;
let infoModal;

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const userData = localStorage.getItem('vzpbug_user');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = JSON.parse(userData);
    infoModal = new bootstrap.Modal(document.getElementById('infoModal'));
    
    // Initialize dashboard
    initializeDashboard();
    
    // Show info popup on first load
    setTimeout(() => {
        showInfo();
    }, 1000);
    
    // Setup form handlers
    setupEventHandlers();
    
    // Load server status
    loadServerStatus();
    
    // Auto refresh status every 30 seconds
    setInterval(loadServerStatus, 30000);
});

function initializeDashboard() {
    // Set user name
    document.getElementById('userName').textContent = currentUser.username.toUpperCase();
    
    // Set user stats
    document.getElementById('bugAttempts').textContent = currentUser.bug_attempts || 0;
    document.getElementById('userRole').textContent = currentUser.role || 'pengguna';
    document.getElementById('expiredDate').textContent = formatDate(currentUser.expired_date);
    
    // Show admin nav if user has admin privileges
    if (['reseller', 'admin', 'OWNER'].includes(currentUser.role)) {
        document.getElementById('adminNavItem').style.display = 'block';
    }
    
    // Check account status
    const now = new Date();
    const expiredDate = new Date(currentUser.expired_date);
    if (now > expiredDate) {
        document.getElementById('accountStatus').textContent = 'Expired';
        document.getElementById('accountStatus').className = 'text-danger fw-bold';
    }
}

function setupEventHandlers() {
    // Message type change handler
    document.getElementById('messageType').addEventListener('change', function() {
        const customDiv = document.getElementById('customMessageDiv');
        if (this.value === 'custom') {
            customDiv.style.display = 'block';
        } else {
            customDiv.style.display = 'none';
        }
    });
    
    // Message form submit handler
    document.getElementById('messageForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await sendTelegramMessage();
    });
}

async function sendTelegramMessage() {
    const messageType = document.getElementById('messageType').value;
    const customMessage = document.getElementById('customMessage').value;
    const sendBtn = document.getElementById('sendBtn');
    const resultDiv = document.getElementById('sendResult');
    
    if (!messageType) {
        showResult('error', 'Silakan pilih jenis pesan terlebih dahulu!');
        return;
    }
    
    if (messageType === 'custom' && !customMessage.trim()) {
        showResult('error', 'Silakan masukkan pesan custom!');
        return;
    }
    
    // Check account status
    const now = new Date();
    const expiredDate = new Date(currentUser.expired_date);
    if (now > expiredDate) {
        showResult('error', 'Akun Anda telah expired! Silakan perpanjang akun.');
        return;
    }
    
    // Show loading
    const originalText = sendBtn.innerHTML;
    sendBtn.innerHTML = '<span class="loading"></span> Mengirim...';
    sendBtn.disabled = true;
    
    try {
        const message = messageType === 'custom' ? customMessage : messageType;
        
        const response = await fetch('api/telegram.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'send_message',
                message: message,
                user_id: currentUser.id
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showResult('success', 'Pesan berhasil dikirim ke grup Telegram!');
            
            // Update bug attempts
            currentUser.bug_attempts = (currentUser.bug_attempts || 0) + 1;
            localStorage.setItem('vzpbug_user', JSON.stringify(currentUser));
            document.getElementById('bugAttempts').textContent = currentUser.bug_attempts;
            
            // Reset form
            document.getElementById('messageForm').reset();
            document.getElementById('customMessageDiv').style.display = 'none';
            
        } else {
            showResult('error', data.message || 'Gagal mengirim pesan. Silakan coba lagi.');
        }
        
    } catch (error) {
        console.error('Send message error:', error);
        let errorMessage = 'Terjadi kesalahan koneksi. Silakan coba lagi.';
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Server tidak merespons. Coba lagi dalam beberapa saat.';
        }
        
        showResult('error', errorMessage);
    } finally {
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
    }
}

function showResult(type, message) {
    const resultDiv = document.getElementById('sendResult');
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
    
    resultDiv.innerHTML = `
        <div class="alert ${alertClass} alert-custom">
            <i class="fas ${icon} me-2"></i>
            ${message}
        </div>
    `;
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        resultDiv.innerHTML = '';
    }, 5000);
}

async function loadServerStatus() {
    try {
        const response = await fetch('api/system.php?action=server_status');
        const data = await response.json();
        
        const statusElement = document.getElementById('serverStatus');
        const statusMap = {
            'online': { class: 'bg-success', icon: 'fa-circle', text: 'Online' },
            'offline': { class: 'bg-danger', icon: 'fa-times-circle', text: 'Offline' },
            'maintenance': { class: 'bg-warning', icon: 'fa-tools', text: 'Perbaikan' },
            'error': { class: 'bg-danger', icon: 'fa-exclamation-triangle', text: 'Error' }
        };
        
        const status = statusMap[data.status] || statusMap['error'];
        statusElement.className = `badge ${status.class}`;
        statusElement.innerHTML = `<i class="fas ${status.icon} me-1"></i>${status.text}`;
        
    } catch (error) {
        console.error('Load server status error:', error);
        const statusElement = document.getElementById('serverStatus');
        statusElement.className = 'badge bg-danger';
        statusElement.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i>Error';
        
        // Show error message to user
        showResult('error', 'Tidak dapat memuat status server. Periksa koneksi Anda.');
    }
}

async function showInfo() {
    infoModal.show();
    
    try {
        const response = await fetch('api/system.php?action=get_info');
        const data = await response.json();
        
        const infoContent = document.getElementById('infoContent');
        
        if (data.success && data.info.length > 0) {
            let html = '';
            data.info.forEach(item => {
                html += `
                    <div class="info-item">
                        <div class="info-date">${formatDateTime(item.created_at)}</div>
                        <div class="mt-2">${item.message}</div>
                    </div>
                `;
            });
            infoContent.innerHTML = html;
        } else {
            infoContent.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-info-circle fa-3x mb-3"></i>
                    <p>Belum ada informasi tersedia</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Load info error:', error);
        document.getElementById('infoContent').innerHTML = `
            <div class="text-center text-danger">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <p>Gagal memuat informasi</p>
                <small class="text-muted">Error: ${error.message}</small>
            </div>
        `;
    }
}

function refreshStatus() {
    loadServerStatus();
    
    // Show loading animation
    const statusElement = document.getElementById('serverStatus');
    statusElement.innerHTML = '<span class="loading"></span> Memuat...';
    
    // Refresh user data
    setTimeout(async () => {
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
                initializeDashboard();
            }
        } catch (error) {
            console.error('Refresh user error:', error);
            showResult('error', 'Gagal memperbarui data user. Silakan refresh halaman.');
        }
    }, 1000);
}

function clearHistory() {
    if (confirm('Yakin ingin membersihkan riwayat?')) {
        document.getElementById('sendResult').innerHTML = '';
        
        // Show success message
        showResult('success', 'Riwayat berhasil dibersihkan!');
    }
}

function logout() {
    if (confirm('Yakin ingin keluar?')) {
        localStorage.removeItem('vzpbug_user');
        window.location.href = 'index.html';
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID');
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID');
}