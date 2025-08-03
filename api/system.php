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

// Information file path
$infoFile = '../data/information.json';

function loadInformation() {
    global $infoFile;
    if (!file_exists($infoFile)) return [];
    $data = file_get_contents($infoFile);
    return json_decode($data, true) ?: [];
}

function saveInformation($info) {
    global $infoFile;
    return file_put_contents($infoFile, json_encode($info, JSON_PRETTY_PRINT));
}

function getNextInfoId() {
    $info = loadInformation();
    $maxId = 0;
    foreach ($info as $item) {
        if ($item['id'] > $maxId) {
            $maxId = $item['id'];
        }
    }
    return $maxId + 1;
}

function updateServerStatus($status) {
    $configFile = '../data/config.json';
    $config = [];
    
    if (file_exists($configFile)) {
        $data = file_get_contents($configFile);
        $config = json_decode($data, true) ?: [];
    }
    
    $config['server_status'] = $status;
    $config['last_updated'] = date('Y-m-d H:i:s');
    
    return file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));
}

function getServerStatus() {
    $config = loadConfig();
    return $config['server_status'] ?? 'online';
}

// Handle requests
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'server_status':
        $status = getServerStatus();
        echo json_encode([
            'success' => true,
            'status' => $status,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        break;
        
    case 'update_server_status':
        $adminId = $input['admin_id'] ?? '';
        $status = $input['status'] ?? '';
        
        // Only OWNER can update server status
        $admin = findUserById($adminId);
        if (!$admin || $admin['role'] !== 'OWNER') {
            echo json_encode(['success' => false, 'message' => 'Hanya OWNER yang dapat mengubah status server']);
            exit;
        }
        
        $validStatuses = ['online', 'offline', 'maintenance', 'error'];
        if (!in_array($status, $validStatuses)) {
            echo json_encode(['success' => false, 'message' => 'Status tidak valid']);
            exit;
        }
        
        if (updateServerStatus($status)) {
            // Log activity
            logActivity($adminId, "Updated server status to: {$status}");
            
            echo json_encode([
                'success' => true,
                'message' => 'Status server berhasil diupdate',
                'new_status' => $status
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal mengupdate status server']);
        }
        break;
        
    case 'get_info':
        $info = loadInformation();
        
        // Sort by created_at descending and limit to 20
        usort($info, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });
        
        $info = array_slice($info, 0, 20);
        
        echo json_encode([
            'success' => true,
            'info' => $info
        ]);
        break;
        
    case 'add_info':
        $adminId = $input['admin_id'] ?? '';
        $message = $input['message'] ?? '';
        
        // Only OWNER can add information
        $admin = findUserById($adminId);
        if (!$admin || $admin['role'] !== 'OWNER') {
            echo json_encode(['success' => false, 'message' => 'Hanya OWNER yang dapat menambah informasi']);
            exit;
        }
        
        if (empty($message)) {
            echo json_encode(['success' => false, 'message' => 'Pesan tidak boleh kosong']);
            exit;
        }
        
        $info = loadInformation();
        $newInfo = [
            'id' => getNextInfoId(),
            'message' => $message,
            'created_at' => date('Y-m-d H:i:s'),
            'created_by' => $adminId
        ];
        
        $info[] = $newInfo;
        
        // Keep only last 20 items
        if (count($info) > 20) {
            // Sort by created_at descending
            usort($info, function($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });
            $info = array_slice($info, 0, 20);
        }
        
        if (saveInformation($info)) {
            // Log activity
            logActivity($adminId, "Added information: " . substr($message, 0, 50) . (strlen($message) > 50 ? '...' : ''));
            
            echo json_encode([
                'success' => true,
                'message' => 'Informasi berhasil ditambahkan',
                'info_id' => $newInfo['id']
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal menyimpan informasi']);
        }
        break;
        
    case 'delete_info':
        $adminId = $input['admin_id'] ?? '';
        $infoId = $input['info_id'] ?? '';
        
        // Only OWNER can delete information
        $admin = findUserById($adminId);
        if (!$admin || $admin['role'] !== 'OWNER') {
            echo json_encode(['success' => false, 'message' => 'Hanya OWNER yang dapat menghapus informasi']);
            exit;
        }
        
        $info = loadInformation();
        $found = false;
        $deletedMessage = '';
        
        // Remove the information item
        $info = array_filter($info, function($item) use ($infoId, &$found, &$deletedMessage) {
            if ($item['id'] == $infoId) {
                $found = true;
                $deletedMessage = $item['message'];
                return false;
            }
            return true;
        });
        
        if (!$found) {
            echo json_encode(['success' => false, 'message' => 'Informasi tidak ditemukan']);
            exit;
        }
        
        // Reindex array
        $info = array_values($info);
        
        if (saveInformation($info)) {
            // Log activity
            logActivity($adminId, "Deleted information: " . substr($deletedMessage, 0, 50) . (strlen($deletedMessage) > 50 ? '...' : ''));
            
            echo json_encode([
                'success' => true,
                'message' => 'Informasi berhasil dihapus'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal menghapus informasi']);
        }
        break;
        
    case 'get_system_info':
        $config = loadConfig();
        $users = loadUsers();
        $info = loadInformation();
        
        // Calculate system statistics
        $totalUsers = count($users);
        $totalInfo = count($info);
        $serverStatus = getServerStatus();
        
        // Get disk usage (simulate)
        $diskUsage = [
            'total' => '1000MB',
            'used' => rand(100, 800) . 'MB',
            'free' => rand(200, 900) . 'MB'
        ];
        
        // Get memory usage (simulate)
        $memoryUsage = [
            'total' => '512MB',
            'used' => rand(50, 400) . 'MB',
            'free' => rand(100, 450) . 'MB'
        ];
        
        echo json_encode([
            'success' => true,
            'system_info' => [
                'server_status' => $serverStatus,
                'total_users' => $totalUsers,
                'total_information' => $totalInfo,
                'disk_usage' => $diskUsage,
                'memory_usage' => $memoryUsage,
                'php_version' => PHP_VERSION,
                'server_time' => date('Y-m-d H:i:s'),
                'uptime' => '24 hours 30 minutes' // Simulated
            ]
        ]);
        break;
        
    case 'backup_data':
        $adminId = $input['admin_id'] ?? '';
        
        // Only OWNER can backup data
        $admin = findUserById($adminId);
        if (!$admin || $admin['role'] !== 'OWNER') {
            echo json_encode(['success' => false, 'message' => 'Hanya OWNER yang dapat backup data']);
            exit;
        }
        
        $backupDir = '../data/backups';
        if (!file_exists($backupDir)) {
            mkdir($backupDir, 0755, true);
        }
        
        $timestamp = date('Y-m-d_H-i-s');
        $backupFile = "{$backupDir}/backup_{$timestamp}.json";
        
        $backupData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'users' => loadUsers(),
            'information' => loadInformation(),
            'config' => loadConfig()
        ];
        
        if (file_put_contents($backupFile, json_encode($backupData, JSON_PRETTY_PRINT))) {
            // Log activity
            logActivity($adminId, "Created system backup: backup_{$timestamp}.json");
            
            echo json_encode([
                'success' => true,
                'message' => 'Backup berhasil dibuat',
                'backup_file' => "backup_{$timestamp}.json"
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal membuat backup']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}
?>