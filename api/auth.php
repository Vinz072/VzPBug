<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database file paths
$usersFile = '../data/users.json';
$configFile = '../data/config.json';

// Ensure data directory exists
if (!file_exists('../data')) {
    mkdir('../data', 0755, true);
}

// Initialize users file if not exists
if (!file_exists($usersFile)) {
    $defaultUsers = [
        [
            'id' => 1,
            'username' => 'admin',
            'password' => password_hash('admin123', PASSWORD_DEFAULT),
            'role' => 'OWNER',
            'bug_attempts' => 0,
            'created_at' => date('Y-m-d H:i:s'),
            'expired_date' => date('Y-m-d', strtotime('+365 days')),
            'last_login' => null,
            'created_by' => 'system'
        ]
    ];
    file_put_contents($usersFile, json_encode($defaultUsers, JSON_PRETTY_PRINT));
}

// Initialize config file if not exists
if (!file_exists($configFile)) {
    $defaultConfig = [
        'server_status' => 'online',
        'telegram_api_id' => '29400040',
        'telegram_api_hash' => '5ffd282cc743acc1c31f83f6589d9b98',
        'telegram_group_id' => '-1002741451900'
    ];
    file_put_contents($configFile, json_encode($defaultConfig, JSON_PRETTY_PRINT));
}

function loadUsers() {
    global $usersFile;
    if (!file_exists($usersFile)) return [];
    $data = file_get_contents($usersFile);
    return json_decode($data, true) ?: [];
}

function saveUsers($users) {
    global $usersFile;
    return file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT));
}

function loadConfig() {
    global $configFile;
    if (!file_exists($configFile)) return [];
    $data = file_get_contents($configFile);
    return json_decode($data, true) ?: [];
}

function findUserByUsername($username) {
    $users = loadUsers();
    foreach ($users as $user) {
        if ($user['username'] === $username) {
            return $user;
        }
    }
    return null;
}

function findUserById($id) {
    $users = loadUsers();
    foreach ($users as $user) {
        if ($user['id'] == $id) {
            return $user;
        }
    }
    return null;
}

function updateUser($userId, $updates) {
    $users = loadUsers();
    for ($i = 0; $i < count($users); $i++) {
        if ($users[$i]['id'] == $userId) {
            foreach ($updates as $key => $value) {
                $users[$i][$key] = $value;
            }
            saveUsers($users);
            return $users[$i];
        }
    }
    return null;
}

function logActivity($userId, $activity) {
    $logFile = "../data/activity_logs.json";
    $logs = [];
    
    if (file_exists($logFile)) {
        $data = file_get_contents($logFile);
        $logs = json_decode($data, true) ?: [];
    }
    
    $logs[] = [
        'user_id' => $userId,
        'activity' => $activity,
        'timestamp' => date('Y-m-d H:i:s'),
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];
    
    // Keep only last 1000 logs
    if (count($logs) > 1000) {
        $logs = array_slice($logs, -1000);
    }
    
    file_put_contents($logFile, json_encode($logs, JSON_PRETTY_PRINT));
}

// Handle requests
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';
        
        if (empty($username) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Username dan password harus diisi']);
            exit;
        }
        
        $user = findUserByUsername($username);
        
        if (!$user) {
            echo json_encode([
                'success' => false, 
                'message' => 'Akun tidak ditemukan, harap membeli akun atau meminta bantuan ke seller kami'
            ]);
            exit;
        }
        
        if (!password_verify($password, $user['password'])) {
            echo json_encode([
                'success' => false, 
                'message' => 'Password salah'
            ]);
            exit;
        }
        
        // Check if account is expired
        $now = new DateTime();
        $expiredDate = new DateTime($user['expired_date']);
        
        if ($now > $expiredDate) {
            echo json_encode([
                'success' => false, 
                'message' => 'Akun Anda telah expired. Silakan perpanjang akun.'
            ]);
            exit;
        }
        
        // Update last login
        updateUser($user['id'], ['last_login' => date('Y-m-d H:i:s')]);
        logActivity($user['id'], 'User logged in');
        
        // Remove password from response
        unset($user['password']);
        
        echo json_encode([
            'success' => true,
            'user' => $user,
            'message' => 'Login berhasil'
        ]);
        break;
        
    case 'refresh_user':
        $userId = $input['user_id'] ?? '';
        
        if (empty($userId)) {
            echo json_encode(['success' => false, 'message' => 'User ID tidak valid']);
            exit;
        }
        
        $user = findUserById($userId);
        
        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'User tidak ditemukan']);
            exit;
        }
        
        // Remove password from response
        unset($user['password']);
        
        echo json_encode([
            'success' => true,
            'user' => $user
        ]);
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}
?>