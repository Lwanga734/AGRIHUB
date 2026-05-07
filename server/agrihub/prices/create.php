<?php
require_once '../cors.php';
require_once '../config/database.php';
require_once '../config/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$user = getAuthUser();

if (!in_array($user['role'], ['official', 'admin'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Only market officials can log prices']);
    exit();
}

$input     = json_decode(file_get_contents('php://input'), true);
$commodity = trim($input['commodity'] ?? '');
$price_ugx = floatval($input['price_ugx'] ?? 0);
$unit      = trim($input['unit'] ?? 'kg');

if (!$commodity || $price_ugx <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Commodity and price are required']);
    exit();
}

$conn = getConnection();

$stmt = $conn->prepare(
    'INSERT INTO prices (commodity, price_ugx, unit, logged_by) VALUES (?, ?, ?, ?)'
);
$stmt->bind_param('sdsi', $commodity, $price_ugx, $unit, $user['sub']);
$stmt->execute();
$id = $conn->insert_id;
$stmt->close();

$stmt2 = $conn->prepare(
    'SELECT p.*, u.name AS logged_by_name FROM prices p
     LEFT JOIN users u ON u.id = p.logged_by WHERE p.id = ?'
);
$stmt2->bind_param('i', $id);
$stmt2->execute();
$price = $stmt2->get_result()->fetch_assoc();
$stmt2->close();
$conn->close();

http_response_code(201);
echo json_encode(['success' => true, 'price' => $price]);
