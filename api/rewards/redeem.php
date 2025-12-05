<?php
require_once __DIR__ . '/../../config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Invalid request method. Use POST.', null, 405);
}
$user_id = checkAuth();
$input = json_decode(file_get_contents("php:
if (!isset($input['rewardId'])) {
    sendResponse(false, 'Reward ID harus diisi', null, 400);
}
$reward_id = intval($input['rewardId']);
try {
    $stmt = $conn->prepare("SELECT id, reward_name, points_required FROM reward_shop WHERE id = ? AND is_active = TRUE");
    $stmt->bind_param("i", $reward_id);
    $stmt->execute();
    $reward = $stmt->get_result()->fetch_assoc();
    if (!$reward) {
        sendResponse(false, 'Reward tidak ditemukan', null, 404);
    }
    $stmt = $conn->prepare("SELECT total_points FROM user_rewards WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $user_reward = $stmt->get_result()->fetch_assoc();
    if (!$user_reward) {
        sendResponse(false, 'Data reward user tidak ditemukan', null, 404);
    }
    if ($user_reward['total_points'] < $reward['points_required']) {
        sendResponse(false, 'Poin Anda tidak cukup untuk menukar reward ini', null, 400);
    }
    $stmt = $conn->prepare("INSERT INTO reward_redemptions (user_id, reward_id, points_redeemed, status) VALUES (?, ?, ?, 'completed')");
    $stmt->bind_param("iii", $user_id, $reward_id, $reward['points_required']);
    $stmt->execute();
    $redemption_id = $conn->insert_id;
    $stmt = $conn->prepare("UPDATE user_rewards SET points_used = points_used + ?, total_points = total_points - ? WHERE user_id = ?");
    $stmt->bind_param("iii", $reward['points_required'], $reward['points_required'], $user_id);
    $stmt->execute();
    $stmt = $conn->prepare("SELECT total_points FROM user_rewards WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $updated_points = $stmt->get_result()->fetch_assoc();
    sendResponse(true, 'Reward berhasil ditukarkan!', [
        'redemption_id' => $redemption_id,
        'reward_name' => $reward['reward_name'],
        'points_used' => $reward['points_required'],
        'remaining_points' => $updated_points['total_points']
    ], 201);
} catch (Exception $e) {
    logError('Redeem Reward Error: ' . $e->getMessage());
    sendResponse(false, 'Penukaran reward gagal', null, 500);
}
?>
