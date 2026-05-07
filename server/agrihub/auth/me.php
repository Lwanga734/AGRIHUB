<?php
require_once '../cors.php';
require_once '../config/database.php';
require_once '../config/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Verify token and get payload
$payload = getAuthUser();

$conn = getConnection();

$stmt = $conn->prepare(
    'SELECT id, name, email, role, phone FROM users WHERE id = ?'
);
$stmt->bind_param('i', $payload['sub']);
$stmt->execute();
$result = $stmt->get_result();
$user   = $result->fetch_assoc();
$stmt->close();
$conn->close();

if (!$user) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit();
}

echo json_encode([
    'success' => true,
    'user'    => $user
]);
