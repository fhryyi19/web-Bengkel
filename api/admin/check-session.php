<?php
/**
 * Check Admin Session
 * File: api/admin/check-session.php
 */

require_once __DIR__ . '/../../config.php';

$admin_id = $_SESSION['admin_id'] ?? null;

if ($admin_id) {
    sendResponse(true, 'Admin session active', [
        'admin_id' => $admin_id,
        'admin_username' => $_SESSION['admin_username'] ?? null
    ]);
} else {
    sendResponse(false, 'No admin session', null, 401);
}
?>
