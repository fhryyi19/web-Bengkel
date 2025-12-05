<?php
/**
 * Get Services API Endpoint
 * File: api/services/get.php
 * Method: GET
 */

require_once __DIR__ . '/../../config.php';

try {
    // Fetch all active services
    $stmt = $conn->prepare("SELECT id, service_key, service_name, description, price, points_earned FROM services WHERE is_active = TRUE ORDER BY id ASC");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $services = [];
    while ($row = $result->fetch_assoc()) {
        $services[] = $row;
    }
    
    sendResponse(true, 'Services retrieved successfully', [
        'services' => $services,
        'count' => count($services)
    ]);
    
} catch (Exception $e) {
    logError('Get Services Error: ' . $e->getMessage());
    sendResponse(false, 'Gagal memuat layanan', null, 500);
}

?>
