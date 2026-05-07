<?php
require_once '../cors.php';
require_once '../config/database.php';
require_once '../config/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

getAuthUser(); // require login

$conn = getConnection();

$result = $conn->query(
    'SELECT p.*, u.name AS farmer_name
     FROM produce p
     LEFT JOIN users u ON u.id = p.farmer_id
     ORDER BY p.created_at DESC'
);

$produce = [];
while ($row = $result->fetch_assoc()) {
    $produce[] = $row;
}

$conn->close();

echo json_encode(['success' => true, 'produce' => $produce]);
