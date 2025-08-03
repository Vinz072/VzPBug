let currentUser = null;
let allUsers = [];
let currentExtendUserId = null;
let userDetailModal, extendUserModal;

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and admin privileges
    const userData = localStorage.getItem('vzpbug_user');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = JSON.parse(userData);
    
    // Check if user has admin privileges
    if (!['reseller', 'admin', 'OWNER'].includes(currentUser.role)) {
        alert('Akses ditolak! Anda tidak memiliki hak admin.');
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Initialize modals
    userDetailModal = new bootstrap.Modal(document.getElementById('userDetailModal'));
    extendUserModal = new bootstrap.Modal(document.getElementById('extendUserModal'));
    
    // Initialize admin panel
    initializeAdminPanel();
    
    // Setup event handlers
    setupEventHandlers();
    
    // Load initial data
    loadStats();
    loadUsers();
    loadInfoList();
    
    // Auto refresh every 30 seconds
    setInterval(loadStats, 30000);
});

function initializeAdminPanel() {
    // Setup role options based on current user role
    const roleSelect = document.getElementById('newRole');
    const roleHierarchy = {
        'OWNER': ['pengguna', 'reseller', 'admin'],
        'admin': ['pengguna', 'reseller'],
        'reseller': ['pengguna']
    };
    
    const availableRoles = roleHierarchy[currentUser.role] || [];
    availableRoles.forEach(role => {
        const option = document.createElement('option');
        option.value = role;
        option.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        roleSelect.appendChild(option);
    });
    
    // Show owner-only features
    if (currentUser.role === 'OWNER') {
        document.getElementById('ownerOnlyStats').style.display = 'block';
        document.getElementById('serverControl').style.display = 'block';
        document.getElementById('infoManagement').style.display = 'block';
        loadServerStatus();
    }
    
    // Set daily limit based on role
    const limits = {
        'OWNER': 'Unlimited',
        'admin': '10',
        'reseller': '10'
    };
    document.getElementById('dailyLimit').textContent = limits[currentUser.role] || '0';
}

function setupEventHandlers() {
    // Create user form
    document.getElementById('createUserForm').addEventListener('submit', createUser);
    
    // Add info form
    document.getElementById('addInfoForm').addEventListener('submit', addInfo);
    
    // Search and filter handlers
    document.getElementById('searchUser').addEventListener('input', filterUsers);
    document.getElementById('filterRole').addEventListener('change', filterUsers);
    document.getElementById('filterStatus').addEventListener('change', filterUsers);
}

async function createUser(e) {
    e.preventDefault();
    
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    const duration = parseInt(document.getElementById('duration').value);
    
    if (!username || !password || !role || !duration) {
        alert('Semua field harus diisi!');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading"></span> Membuat...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('api/admin.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'create_user',
                username: username,
                password: password,
                role: role,
                duration: duration,
                admin_id: currentUser.id
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Akun berhasil dibuat!');
            document.getElementById('createUserForm').reset();
            document.getElementById('duration').value = 30;
            loadUsers();
            loadStats();
        } else {
            alert(data.message || 'Gagal membuat akun');
        }
        
    } catch (error) {
        console.error('Create user error:', error);
        alert('Terjadi kesalahan koneksi');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function loadStats() {
    try {
        const response = await fetch('api/admin.php?action=get_stats');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalUsers').textContent = data.stats.total_users || 0;
            document.getElementById('activeUsers').textContent = data.stats.active_users || 0;
            document.getElementById('totalAttempts').textContent = data.stats.total_attempts || 0;
            document.getElementById('createdToday').textContent = data.stats.created_today || 0;
            
            if (currentUser.role === 'OWNER') {
                document.getElementById('adminCreated').textContent = data.stats.admin_created || 0;
            }
        }
    } catch (error) {
        console.error('Load stats error:', error);
    }
}

async function loadUsers() {
    try {
        const response = await fetch('api/admin.php?action=get_users');
        const data = await response.json();
        
        if (data.success) {
            allUsers = data.users;
            displayUsers(allUsers);
        }
    } catch (error) {
        console.error('Load users error:', error);
        document.getElementById('usersTableBody').innerHTML = `
            <tr><td colspan="6" class="text-center text-danger">Gagal memuat data user</td></tr>
        `;
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada user ditemukan</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => {
        const now = new Date();
        const expiredDate = new Date(user.expired_date);
        const isExpired = now > expiredDate;
        const statusClass = isExpired ? 'text-danger' : 'text-success';
        const statusText = isExpired ? 'Expired' : 'Aktif';
        
        return `
            <tr>
                <td>
                    <strong>${user.username}</strong>
                    <br><small class="text-muted">ID: ${user.id}</small>
                </td>
                <td>
                    <span class="badge bg-info">${user.role}</span>
                </td>
                <td>
                    <span class="text-danger fw-bold">${user.bug_attempts || 0}</span>
                </td>
                <td>
                    <span class="${statusClass}">${statusText}</span>
                </td>
                <td>
                    <small>${formatDate(user.expired_date)}</small>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info" onclick="showUserDetail(${user.id})" title="Detail">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="showExtendModal(${user.id}, '${user.username}')" title="Perpanjang">
                            <i class="fas fa-clock"></i>
                        </button>
                        ${currentUser.role === 'OWNER' ? `
                        <button class="btn btn-outline-danger" onclick="deleteUser(${user.id})" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterUsers() {
    const search = document.getElementById('searchUser').value.toLowerCase();
    const roleFilter = document.getElementById('filterRole').value;
    const statusFilter = document.getElementById('filterStatus').value;
    
    let filtered = allUsers.filter(user => {
        const matchSearch = user.username.toLowerCase().includes(search);
        const matchRole = !roleFilter || user.role === roleFilter;
        
        let matchStatus = true;
        if (statusFilter) {
            const now = new Date();
            const expiredDate = new Date(user.expired_date);
            const isExpired = now > expiredDate;
            matchStatus = (statusFilter === 'active' && !isExpired) || 
                         (statusFilter === 'expired' && isExpired);
        }
        
        return matchSearch && matchRole && matchStatus;
    });
    
    displayUsers(filtered);
}

async function showUserDetail(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    try {
        const response = await fetch(`api/admin.php?action=get_user_detail&user_id=${userId}`);
        const data = await response.json();
        
        if (data.success) {
            const detail = data.user_detail;
            const now = new Date();
            const expiredDate = new Date(user.expired_date);
            const daysRemaining = Math.ceil((expiredDate - now) / (1000 * 60 * 60 * 24));
            
            document.getElementById('userDetailContent').innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h6>Informasi Akun</h6>
                        <table class="table table-sm table-dark">
                            <tr><td>Username:</td><td><strong>${user.username}</strong></td></tr>
                            <tr><td>Role:</td><td><span class="badge bg-info">${user.role}</span></td></tr>
                            <tr><td>Status:</td><td><span class="${daysRemaining > 0 ? 'text-success' : 'text-danger'}">${daysRemaining > 0 ? 'Aktif' : 'Expired'}</span></td></tr>
                            <tr><td>Dibuat:</td><td>${formatDateTime(user.created_at)}</td></tr>
                            <tr><td>Expired:</td><td>${formatDate(user.expired_date)}</td></tr>
                            <tr><td>Sisa Hari:</td><td><strong>${daysRemaining > 0 ? daysRemaining + ' hari' : 'Expired'}</strong></td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h6>Statistik Aktivitas</h6>
                        <table class="table table-sm table-dark">
                            <tr><td>Bug Attempts:</td><td><strong class="text-danger">${user.bug_attempts || 0}</strong></td></tr>
                            <tr><td>Last Login:</td><td>${formatDateTime(user.last_login)}</td></tr>
                            <tr><td>Total Login:</td><td>${detail.total_logins || 0}</td></tr>
                            <tr><td>Messages Sent:</td><td>${detail.messages_sent || 0}</td></tr>
                            <tr><td>Created By:</td><td>${detail.created_by || 'System'}</td></tr>
                            <tr><td>IP Address:</td><td>${detail.last_ip || 'N/A'}</td></tr>
                        </table>
                    </div>
                </div>
                
                <div class="mt-3">
                    <h6>Aktivitas Terbaru</h6>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${detail.recent_activities ? detail.recent_activities.map(activity => `
                            <div class="alert alert-dark alert-sm">
                                <small class="text-muted">${formatDateTime(activity.timestamp)}</small><br>
                                ${activity.activity}
                            </div>
                        `).join('') : '<p class="text-muted">Tidak ada aktivitas terbaru</p>'}
                    </div>
                </div>
            `;
            
            userDetailModal.show();
        }
    } catch (error) {
        console.error('Show user detail error:', error);
        alert('Gagal memuat detail user');
    }
}

function showExtendModal(userId, username) {
    currentExtendUserId = userId;
    document.getElementById('extendUsername').textContent = username;
    extendUserModal.show();
}

async function extendUser() {
    if (!currentExtendUserId) return;
    
    const duration = parseInt(document.getElementById('extendDuration').value);
    if (!duration || duration < 1) {
        alert('Durasi tidak valid!');
        return;
    }
    
    try {
        const response = await fetch('api/admin.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'extend_user',
                user_id: currentExtendUserId,
                duration: duration,
                admin_id: currentUser.id
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Akun berhasil diperpanjang!');
            extendUserModal.hide();
            loadUsers();
        } else {
            alert(data.message || 'Gagal memperpanjang akun');
        }
    } catch (error) {
        console.error('Extend user error:', error);
        alert('Terjadi kesalahan koneksi');
    }
}

async function deleteUser(userId) {
    if (currentUser.role !== 'OWNER') {
        alert('Hanya OWNER yang dapat menghapus user!');
        return;
    }
    
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    if (!confirm(`Yakin ingin menghapus user "${user.username}"? Tindakan ini tidak dapat dibatalkan!`)) {
        return;
    }
    
    try {
        const response = await fetch('api/admin.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'delete_user',
                user_id: userId,
                admin_id: currentUser.id
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('User berhasil dihapus!');
            loadUsers();
            loadStats();
        } else {
            alert(data.message || 'Gagal menghapus user');
        }
    } catch (error) {
        console.error('Delete user error:', error);
        alert('Terjadi kesalahan koneksi');
    }
}

async function loadServerStatus() {
    try {
        const response = await fetch('api/system.php?action=server_status');
        const data = await response.json();
        
        document.getElementById('serverStatusSelect').value = data.status || 'online';
    } catch (error) {
        console.error('Load server status error:', error);
    }
}

async function updateServerStatus() {
    const status = document.getElementById('serverStatusSelect').value;
    
    try {
        const response = await fetch('api/system.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'update_server_status',
                status: status,
                admin_id: currentUser.id
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Status server berhasil diupdate!');
        } else {
            alert(data.message || 'Gagal mengupdate status server');
        }
    } catch (error) {
        console.error('Update server status error:', error);
        alert('Terjadi kesalahan koneksi');
    }
}

async function addInfo(e) {
    e.preventDefault();
    
    const message = document.getElementById('infoMessage').value.trim();
    if (!message) {
        alert('Pesan informasi tidak boleh kosong!');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading"></span> Menambah...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('api/system.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'add_info',
                message: message,
                admin_id: currentUser.id
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Informasi berhasil ditambahkan!');
            document.getElementById('infoMessage').value = '';
            loadInfoList();
        } else {
            alert(data.message || 'Gagal menambah informasi');
        }
    } catch (error) {
        console.error('Add info error:', error);
        alert('Terjadi kesalahan koneksi');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function loadInfoList() {
    if (currentUser.role !== 'OWNER') return;
    
    try {
        const response = await fetch('api/system.php?action=get_info');
        const data = await response.json();
        
        const infoList = document.getElementById('infoList');
        
        if (data.success && data.info.length > 0) {
            infoList.innerHTML = data.info.map(item => `
                <div class="info-item mb-2">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <div class="info-date">${formatDateTime(item.created_at)}</div>
                            <div class="mt-1">${item.message}</div>
                        </div>
                        <button class="btn btn-outline-danger btn-sm ms-2" onclick="deleteInfo(${item.id})" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            infoList.innerHTML = '<p class="text-muted text-center">Belum ada informasi</p>';
        }
    } catch (error) {
        console.error('Load info error:', error);
        document.getElementById('infoList').innerHTML = '<p class="text-danger text-center">Gagal memuat informasi</p>';
    }
}

async function deleteInfo(infoId) {
    if (!confirm('Yakin ingin menghapus informasi ini?')) return;
    
    try {
        const response = await fetch('api/system.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'delete_info',
                info_id: infoId,
                admin_id: currentUser.id
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadInfoList();
        } else {
            alert(data.message || 'Gagal menghapus informasi');
        }
    } catch (error) {
        console.error('Delete info error:', error);
        alert('Terjadi kesalahan koneksi');
    }
}

function refreshUsers() {
    loadUsers();
    loadStats();
}

function setDuration(days) {
    document.getElementById('duration').value = days;
}

function setExtendDuration(days) {
    document.getElementById('extendDuration').value = days;
}

function logout() {
    if (confirm('Yakin ingin keluar?')) {
        localStorage.removeItem('vzpbug_user');
        window.location.href = 'index.html';
    }
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