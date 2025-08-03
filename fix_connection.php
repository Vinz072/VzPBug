<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Function to check and fix common issues
function checkAndFixIssues() {
    $issues = [];
    $fixes = [];
    
    // Check data directory
    $dataDir = './data';
    if (!file_exists($dataDir)) {
        $issues[] = 'Data directory tidak ada';
        mkdir($dataDir, 0755, true);
        $fixes[] = 'Data directory berhasil dibuat';
    }
    
    // Check data directory permissions
    if (!is_writable($dataDir)) {
        $issues[] = 'Data directory tidak dapat ditulis';
        chmod($dataDir, 0755);
        $fixes[] = 'Permission data directory diperbaiki';
    }
    
    // Check required JSON files
    $requiredFiles = [
        'users.json' => '[]',
        'config.json' => '{"server_status":"online","telegram_api_id":"29400040","telegram_api_hash":"5ffd282cc743acc1c31f83f6589d9b98","telegram_group_id":"-1002741451900"}',
        'information.json' => '[{"id":1,"title":"Selamat Datang","content":"Website tool sender Telegram","created_at":"2024-01-01 00:00:00","created_by":"system"}]',
        'activity_logs.json' => '[]',
        'telegram_messages.json' => '[]'
    ];
    
    foreach ($requiredFiles as $filename => $defaultContent) {
        $filepath = $dataDir . '/' . $filename;
        if (!file_exists($filepath)) {
            $issues[] = "File {$filename} tidak ada";
            file_put_contents($filepath, $defaultContent);
            chmod($filepath, 0644);
            $fixes[] = "File {$filename} berhasil dibuat";
        }
    }
    
    // Check PHP configuration
    if (!function_exists('json_encode')) {
        $issues[] = 'JSON extension tidak tersedia';
    }
    
    if (!function_exists('password_hash')) {
        $issues[] = 'Password hashing tidak tersedia';
    }
    
    // Check if we can write to files
    $testFile = $dataDir . '/test_write.json';
    if (!file_put_contents($testFile, '{"test":"ok"}')) {
        $issues[] = 'Tidak dapat menulis ke file';
    } else {
        unlink($testFile);
    }
    
    return [
        'issues' => $issues,
        'fixes' => $fixes,
        'success' => empty($issues)
    ];
}

// Run the check
$result = checkAndFixIssues();

echo json_encode([
    'success' => true,
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'result' => $result
]);
?>