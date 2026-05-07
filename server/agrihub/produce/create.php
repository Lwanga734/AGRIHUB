<?php
require_once '../cors.php';
require_once '../config/database.php';
require_once '../config/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$user  = getAuthUser();
$input = json_decode(file_get_contents('php://input'), true);

$commodity       = trim($input['commodity']       ?? '');
$quantity_kg     = floatval($input['quantity_kg'] ?? 0);
$source_location = trim($input['source_location'] ?? '');
$notes           = trim($input['notes']           ?? '');

if (!$commodity || $quantity_kg <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Commodity and quantity are required']);
    exit();
}

$conn = getConnection();

$stmt = $conn->prepare(
    'INSERT INTO produce (farmer_id, commodity, quantity_kg, source_location, notes)
     VALUES (?, ?, ?, ?, ?)'
);
$stmt->bind_param('isdss', $user['sub'], $commodity, $quantity_kg, $source_location, $notes);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to register produce']);
    $stmt->close();
    $conn->close();
    exit();
}

$id = $conn->insert_id;
$stmt->close();

// Return the created produce with farmer name
$stmt2  = $conn->prepare(
    'SELECT p.*, u.name AS farmer_name FROM produce p
     LEFT JOIN users u ON u.id = p.farmer_id WHERE p.id = ?'
);
$stmt2->bind_param('i', $id);
$stmt2->execute();
$produce = $stmt2->get_result()->fetch_assoc();
$stmt2->close();
$conn->close();

http_response_code(201);
echo json_encode(['success' => true, 'produce' => $produce]);
