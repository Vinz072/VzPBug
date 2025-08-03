<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Include auth functions
require_once 'auth.php';

function hasAdminPrivileges($userId) {
    $user = findUserById($userId);
    if (!$user) return false;
    return in_array($user['role'], ['reseller', 'admin', 'OWNER']);
}

function canCreateRole($adminRole, $targetRole) {
    $hierarchy = [
        'OWNER' => ['pengguna', 'reseller', 'admin'],
        'admin' => ['pengguna', 'reseller'],
        'reseller' => ['pengguna']
    ];
    
    return isset($hierarchy[$adminRole]) && in_array($targetRole, $hierarchy[$adminRole]);
}

function getNextUserId() {
    $users = loadUsers();
    $maxId = 0;
    foreach ($users as $user) {
        if ($user['id'] > $maxId) {
            $maxId = $user['id'];
        }
    }
    return $maxId + 1;
}

function checkDailyLimit($adminId) {
    $users = loadUsers();
    $today = date('Y-m-d');
    $count = 0;
    
    foreach ($users as $user) {
        if ($user['created_by'] == $adminId && 
            substr($user['created_at'], 0, 10) === $today) {
            $count++;
        }
    }
    
    $admin = findUserById($adminId);
    $limits = [
        'OWNER' => PHP_INT_MAX,
        'admin' => 10,
        'reseller' => 10
    ];
    
    $limit = $limits[$admin['role']] ?? 0;
    return $count < $limit;
}

function getStats() {
    $users = loadUsers();
    $now = new DateTime();
    $today = date('Y-m-d');
    
    $totalUsers = count($users);
    $activeUsers = 0;
    $totalAttempts = 0;
    $createdToday = 0;
    $adminCreated = 0;
    
    foreach ($users as $user) {
        $expiredDate = new DateTime($user['expired_date']);
        if ($now <= $expiredDate) {
            $activeUsers++;
        }
        
        $totalAttempts += $user['bug_attempts'] ?? 0;
        
        if (substr($user['created_at'], 0, 10) === $today) {
            $createdToday++;
        }
        
        if ($user['created_by'] !== 'system') {
            $adminCreated++;
        }
    }
    
    return [
        'total_users' => $totalUsers,
        'active_users' => $activeUsers,
        'total_attempts' => $totalAttempts,
        'created_today' => $createdToday,
        'admin_created' => $adminCreated
    ];
}

function getUserDetail($userId) {
    $user = findUserById($userId);
    if (!$user) return null;
    
    // Get activity logs
    $logFile = '../data/activity_logs.json';
    $logs = [];
    
    if (file_exists($logFile)) {
        $data = file_get_contents($logFile);
        $allLogs = json_decode($data, true) ?: [];
        
        // Filter logs for this user
        foreach ($allLogs as $log) {
            if ($log['user_id'] == $userId) {
                $logs[] = $log;
            }
        }
    }
    
    // Get recent activities (last 10)
    $recentActivities = array_slice(array_reverse($logs), 0, 10);
    
    // Calculate statistics
    $totalLogins = 0;
    $messagesSent = 0;
    $lastIp = null;
    
    foreach ($logs as $log) {
        if (strpos($log['activity'], 'logged in') !== false) {
            $totalLogins++;
        }
        if (strpos($log['activity'], 'Sent message') !== false) {
            $messagesSent++;
        }
        $lastIp = $log['ip_address'];
    }
    
    // Get creator name
    $createdBy = 'System';
    if ($user['created_by'] !== 'system') {
        $creator = findUserById($user['created_by']);
        if ($creator) {
            $createdBy = $creator['username'];
        }
    }
    
    return [
        'total_logins' => $totalLogins,
        'messages_sent' => $messagesSent,
        'last_ip' => $lastIp,
        'created_by' => $createdBy,
        'recent_activities' => array_map(function($log) {
            return [
                'timestamp' => $log['timestamp'],
                'activity' => $log['activity']
            ];
        }, $recentActivities)
    ];
}

// Handle requests
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'create_user':
        $adminId = $input['admin_id'] ?? '';
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';
        $role = $input['role'] ?? '';
        $duration = $input['duration'] ?? 30;
        
        // Validate admin privileges
        if (!hasAdminPrivileges($adminId)) {
            echo json_encode(['success' => false, 'message' => 'Akses ditolak']);
            exit;
        }
        
        $admin = findUserById($adminId);
        
        // Check if admin can create this role
        if (!canCreateRole($admin['role'], $role)) {
            echo json_encode(['success' => false, 'message' => 'Anda tidak dapat membuat role ini']);
            exit;
        }
        
        // Check daily limit
        if (!checkDailyLimit($adminId)) {
            echo json_encode(['success' => false, 'message' => 'Limit harian tercapai (10 akun per hari)']);
            exit;
        }
        
        // Check if username already exists
        if (findUserByUsername($username)) {
            echo json_encode(['success' => false, 'message' => 'Username sudah digunakan']);
            exit;
        }
        
        // Create new user
        $users = loadUsers();
        $newUser = [
            'id' => getNextUserId(),
            'username' => $username,
            'password' => password_hash($password, PASSWORD_DEFAULT),
            'role' => $role,
            'bug_attempts' => 0,
            'created_at' => date('Y-m-d H:i:s'),
            'expired_date' => date('Y-m-d', strtotime("+{$duration} days")),
            'last_login' => null,
            'created_by' => $adminId
        ];
        
        $users[] = $newUser;
        saveUsers($users);
        
        // Log activity
        logActivity($adminId, "Created user: {$username} with role: {$role}");
        
        echo json_encode([
            'success' => true,
            'message' => 'User berhasil dibuat',
            'user_id' => $newUser['id']
        ]);
        break;
        
    case 'get_users':
        $users = loadUsers();
        
        // Remove passwords from response
        $safeUsers = array_map(function($user) {
            unset($user['password']);
            return $user;
        }, $users);
        
        echo json_encode([
            'success' => true,
            'users' => $safeUsers
        ]);
        break;
        
    case 'get_stats':
        $stats = getStats();
        echo json_encode([
            'success' => true,
            'stats' => $stats
        ]);
        break;
        
    case 'get_user_detail':
        $userId = $_GET['user_id'] ?? '';
        
        if (empty($userId)) {
            echo json_encode(['success' => false, 'message' => 'User ID tidak valid']);
            exit;
        }
        
        $userDetail = getUserDetail($userId);
        
        if (!$userDetail) {
            echo json_encode(['success' => false, 'message' => 'User tidak ditemukan']);
            exit;
        }
        
        echo json_encode([
            'success' => true,
            'user_detail' => $userDetail
        ]);
        break;
        
    case 'extend_user':
        $adminId = $input['admin_id'] ?? '';
        $userId = $input['user_id'] ?? '';
        $duration = $input['duration'] ?? 30;
        
        // Validate admin privileges
        if (!hasAdminPrivileges($adminId)) {
            echo json_encode(['success' => false, 'message' => 'Akses ditolak']);
            exit;
        }
        
        $user = findUserById($userId);
        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'User tidak ditemukan']);
            exit;
        }
        
        // Calculate new expiry date
        $currentExpiry = new DateTime($user['expired_date']);
        $now = new DateTime();
        
        // If already expired, extend from now, otherwise extend from current expiry
        $baseDate = $currentExpiry > $now ? $currentExpiry : $now;
        $newExpiry = $baseDate->modify("+{$duration} days");
        
        // Update user
        updateUser($userId, ['expired_date' => $newExpiry->format('Y-m-d')]);
        
        // Log activity
        logActivity($adminId, "Extended user {$user['username']} by {$duration} days");
        
        echo json_encode([
            'success' => true,
            'message' => 'Akun berhasil diperpanjang',
            'new_expiry' => $newExpiry->format('Y-m-d')
        ]);
        break;
        
    case 'delete_user':
        $adminId = $input['admin_id'] ?? '';
        $userId = $input['user_id'] ?? '';
        
        // Only OWNER can delete users
        $admin = findUserById($adminId);
        if (!$admin || $admin['role'] !== 'OWNER') {
            echo json_encode(['success' => false, 'message' => 'Hanya OWNER yang dapat menghapus user']);
            exit;
        }
        
        $user = findUserById($userId);
        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'User tidak ditemukan']);
            exit;
        }
        
        // Cannot delete OWNER
        if ($user['role'] === 'OWNER') {
            echo json_encode(['success' => false, 'message' => 'Tidak dapat menghapus OWNER']);
            exit;
        }
        
        // Remove user
        $users = loadUsers();
        $users = array_filter($users, function($u) use ($userId) {
            return $u['id'] != $userId;
        });
        
        // Reindex array
        $users = array_values($users);
        saveUsers($users);
        
        // Log activity
        logActivity($adminId, "Deleted user: {$user['username']}");
        
        echo json_encode([
            'success' => true,
            'message' => 'User berhasil dihapus'
        ]);
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}
?>