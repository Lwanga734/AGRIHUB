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

// Only officials and admins can verify
if (!in_array($user['role'], ['official', 'admin'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Only market officials can verify produce']);
    exit();
}

$input      = json_decode(file_get_contents('php://input'), true);
$produce_id = intval($input['produce_id'] ?? 0);
$grade      = trim($input['grade']        ?? '');
$notes      = trim($input['notes']        ?? '');

$allowedGrades = ['A', 'B', 'C'];
if (!$produce_id || !in_array($grade, $allowedGrades)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Valid produce ID and grade (A, B, C) are required']);
    exit();
}

$conn = getConnection();

// Update produce quality grade and status
$stmt = $conn->prepare(
    'UPDATE produce SET quality_grade = ?, status = "verified" WHERE id = ?'
);
$stmt->bind_param('si', $grade, $produce_id);
$stmt->execute();
$stmt->close();

// Log quality check
$stmt2 = $conn->prepare(
    'INSERT INTO quality_checks (produce_id, official_id, grade, notes) VALUES (?, ?, ?, ?)'
);
$stmt2->bind_param('iiss', $produce_id, $user['sub'], $grade, $notes);
$stmt2->execute();
$stmt2->close();
$conn->close();

echo json_encode(['success' => true, 'message' => 'Produce verified successfully']);
