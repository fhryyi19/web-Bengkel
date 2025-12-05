<?php
require_once '../../config.php';

// Check admin session
if (!isset($_SESSION['admin_id'])) {
    sendResponse(false, 'Unauthorized', null, 401);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'POST') {
        handleCreateService();
    } elseif ($method === 'PUT') {
        handleUpdateService();
    } elseif ($method === 'DELETE') {
        handleDeleteService();
    } else {
        sendResponse(false, 'Method not allowed', null, 405);
    }
} catch (Exception $e) {
    sendResponse(false, $e->getMessage(), null, 500);
}

function handleCreateService() {
    global $conn;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['service_name']) || !isset($input['price']) || !isset($input['points_earned'])) {
        sendResponse(false, 'service_name, price, and points_earned are required', null, 400);
        exit;
    }
    
    $serviceName = sanitizeInput($input['service_name']);
    $price = sanitizeInput($input['price']);
    $pointsEarned = sanitizeInput($input['points_earned']);
    $description = sanitizeInput($input['description'] ?? '');
    $serviceKey = strtolower(str_replace(' ', '_', $serviceName));
    
    $query = "INSERT INTO services (service_key, service_name, price, points_earned, description, is_active) 
              VALUES (?, ?, ?, ?, ?, 1)";
    
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        throw new Exception($conn->error);
    }
    
    $stmt->bind_param('ssdis', $serviceKey, $serviceName, $price, $pointsEarned, $description);
    
    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }
    
    sendResponse(true, 'Service created successfully', [
        'serviceId' => $stmt->insert_id
    ]);
}

function handleUpdateService() {
    global $conn;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['serviceId'])) {
        sendResponse(false, 'serviceId is required', null, 400);
        exit;
    }
    
    $serviceId = sanitizeInput($input['serviceId']);
    $serviceName = sanitizeInput($input['service_name'] ?? '');
    $price = sanitizeInput($input['price'] ?? 0);
    $pointsEarned = sanitizeInput($input['points_earned'] ?? 0);
    $description = sanitizeInput($input['description'] ?? '');
    
    $query = "UPDATE services SET service_name = ?, price = ?, points_earned = ?, description = ? WHERE id = ?";
    
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        throw new Exception($conn->error);
    }
    
    $stmt->bind_param('sdisi', $serviceName, $price, $pointsEarned, $description, $serviceId);
    
    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }
    
    if ($stmt->affected_rows === 0) {
        sendResponse(false, 'Service not found', null, 404);
        exit;
    }
    
    sendResponse(true, 'Service updated successfully', [
        'serviceId' => $serviceId
    ]);
}

function handleDeleteService() {
    global $conn;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['serviceId'])) {
        sendResponse(false, 'serviceId is required', null, 400);
        exit;
    }
    
    $serviceId = sanitizeInput($input['serviceId']);
    
    $query = "DELETE FROM services WHERE id = ?";
    
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        throw new Exception($conn->error);
    }
    
    $stmt->bind_param('i', $serviceId);
    
    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }
    
    if ($stmt->affected_rows === 0) {
        sendResponse(false, 'Service not found', null, 404);
        exit;
    }
    
    sendResponse(true, 'Service deleted successfully', [
        'serviceId' => $serviceId
    ]);
}
?>
