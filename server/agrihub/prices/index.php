<?php
require_once '../cors.php';
require_once '../config/database.php';
require_once '../config/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

getAuthUser();

$conn   = getConnection();
$result = $conn->query(
    'SELECT p.*, u.name AS logged_by_name
     FROM prices p
     LEFT JOIN users u ON u.id = p.logged_by
     ORDER BY p.created_at DESC'
);

$prices = [];
while ($row = $result->fetch_assoc()) {
    $prices[] = $row;
}

$conn->close();
echo json_encode(['success' => true, 'prices' => $prices]);
