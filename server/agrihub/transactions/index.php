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
$conn = getConnection();

$result = $conn->query(
    'SELECT t.*,
            p.commodity,
            buyer.name  AS buyer_name,
            seller.name AS seller_name,
            rec.name    AS recorded_by_name
     FROM transactions t
     LEFT JOIN produce p      ON p.id  = t.produce_id
     LEFT JOIN users  buyer   ON buyer.id  = t.buyer_id
     LEFT JOIN users  seller  ON seller.id = t.seller_id
     LEFT JOIN users  rec     ON rec.id    = t.recorded_by
     ORDER BY t.created_at DESC'
);

$transactions = [];
while ($row = $result->fetch_assoc()) {
    $transactions[] = $row;
}

$conn->close();
echo json_encode(['success' => true, 'transactions' => $transactions]);
