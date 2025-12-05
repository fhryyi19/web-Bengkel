<?php
/**
 * Admin Logout
 * File: api/admin/logout.php
 */

require_once __DIR__ . '/../../config.php';

session_destroy();
sendResponse(true, 'Logout berhasil');
?>
