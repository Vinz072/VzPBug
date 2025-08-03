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

// Telegram configuration
$telegramConfig = loadConfig();
$API_ID = $telegramConfig['telegram_api_id'] ?? '29400040';
$API_HASH = $telegramConfig['telegram_api_hash'] ?? '5ffd282cc743acc1c31f83f6589d9b98';
$GROUP_ID = $telegramConfig['telegram_group_id'] ?? '-1002741451900';

// Simple Telegram Bot API implementation
function sendTelegramMessage($message, $chatId = null) {
    global $GROUP_ID;
    
    if (!$chatId) {
        $chatId = $GROUP_ID;
    }
    
    // For demo purposes, we'll simulate sending message
    // In production, you would use actual Telegram Bot API or MTProto
    
    // Simulate API call delay
    usleep(500000); // 0.5 second delay
    
    // Log the message
    $logFile = '../data/telegram_messages.json';
    $messages = [];
    
    if (file_exists($logFile)) {
        $data = file_get_contents($logFile);
        $messages = json_decode($data, true) ?: [];
    }
    
    $messages[] = [
        'message' => $message,
        'chat_id' => $chatId,
        'timestamp' => date('Y-m-d H:i:s'),
        'status' => 'sent'
    ];
    
    // Keep only last 100 messages
    if (count($messages) > 100) {
        $messages = array_slice($messages, -100);
    }
    
    file_put_contents($logFile, json_encode($messages, JSON_PRETTY_PRINT));
    
    // Simulate success/failure (90% success rate)
    $success = rand(1, 10) <= 9;
    
    return [
        'success' => $success,
        'message_id' => $success ? rand(1000, 9999) : null,
        'error' => $success ? null : 'Failed to send message'
    ];
}

function getBotInfo() {
    // Simulate bot info
    return [
        'id' => 123456789,
        'is_bot' => true,
        'first_name' => 'VzPBug Bot',
        'username' => 'vzpbug_bot',
        'can_join_groups' => true,
        'can_read_all_group_messages' => true,
        'supports_inline_queries' => false
    ];
}

// Handle requests
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'send_message':
        $message = $input['message'] ?? '';
        $userId = $input['user_id'] ?? '';
        
        if (empty($message) || empty($userId)) {
            echo json_encode(['success' => false, 'message' => 'Message dan User ID harus diisi']);
            exit;
        }
        
        // Verify user exists and is active
        $user = findUserById($userId);
        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'User tidak ditemukan']);
            exit;
        }
        
        // Check if account is expired
        $now = new DateTime();
        $expiredDate = new DateTime($user['expired_date']);
        
        if ($now > $expiredDate) {
            echo json_encode(['success' => false, 'message' => 'Akun Anda telah expired']);
            exit;
        }
        
        // Format message based on type
        $formattedMessage = formatMessage($message, $user);
        
        // Send message to Telegram
        $result = sendTelegramMessage($formattedMessage);
        
        if ($result['success']) {
            // Update user bug attempts
            $newAttempts = ($user['bug_attempts'] ?? 0) + 1;
            updateUser($userId, ['bug_attempts' => $newAttempts]);
            
            // Log activity
            logActivity($userId, "Sent message: " . substr($message, 0, 50) . (strlen($message) > 50 ? '...' : ''));
            
            echo json_encode([
                'success' => true,
                'message' => 'Pesan berhasil dikirim ke grup Telegram',
                'message_id' => $result['message_id'],
                'bug_attempts' => $newAttempts
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Gagal mengirim pesan: ' . ($result['error'] ?? 'Unknown error')
            ]);
        }
        break;
        
    case 'get_bot_info':
        $botInfo = getBotInfo();
        echo json_encode([
            'success' => true,
            'bot_info' => $botInfo
        ]);
        break;
        
    case 'get_message_history':
        $logFile = '../data/telegram_messages.json';
        $messages = [];
        
        if (file_exists($logFile)) {
            $data = file_get_contents($logFile);
            $messages = json_decode($data, true) ?: [];
        }
        
        // Get last 20 messages
        $recentMessages = array_slice($messages, -20);
        
        echo json_encode([
            'success' => true,
            'messages' => array_reverse($recentMessages) // Show newest first
        ]);
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}

function formatMessage($message, $user) {
    $timestamp = date('Y-m-d H:i:s');
    $username = $user['username'];
    
    // Pre-defined message templates
    $templates = [
        '/pesan1' => "🚀 VzPBug v1.0 - Test Message 1\n👤 User: {$username}\n⏰ Time: {$timestamp}\n📱 Status: Testing connection...",
        '/pesan2' => "⚡ VzPBug v1.0 - Test Message 2\n👤 User: {$username}\n⏰ Time: {$timestamp}\n🔧 Status: Bug testing in progress...",
        '/pesan3' => "🎯 VzPBug v1.0 - Test Message 3\n👤 User: {$username}\n⏰ Time: {$timestamp}\n💻 Status: System check...",
        '/pesan4' => "🔥 VzPBug v1.0 - Test Message 4\n👤 User: {$username}\n⏰ Time: {$timestamp}\n⚙️ Status: Advanced testing...",
        '/pesan5' => "💎 VzPBug v1.0 - Test Message 5\n👤 User: {$username}\n⏰ Time: {$timestamp}\n🌟 Status: Premium test...",
        '/pesan_rahasia' => "🔒 VzPBug v1.0 - Secret Message\n👤 User: {$username}\n⏰ Time: {$timestamp}\n🤫 Status: Confidential test...",
        '/pesan_khusus' => "✨ VzPBug v1.0 - Special Message\n👤 User: {$username}\n⏰ Time: {$timestamp}\n🎉 Status: Special testing mode..."
    ];
    
    // Return template if exists, otherwise return custom message
    if (isset($templates[$message])) {
        return $templates[$message];
    } else {
        return "📝 VzPBug v1.0 - Custom Message\n👤 User: {$username}\n⏰ Time: {$timestamp}\n💬 Message: {$message}";
    }
}
?>