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

$produce_id  = intval($input['produce_id']  ?? 0);
$buyer_id    = intval($input['buyer_id']    ?? $user['sub']);
$amount_ugx  = floatval($input['amount_ugx']  ?? 0);
$quantity_kg = floatval($input['quantity_kg'] ?? 0);

if (!$produce_id || $amount_ugx <= 0 || $quantity_kg <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Produce, amount and quantity are required']);
    exit();
}

$conn = getConnection();

$stmt = $conn->prepare('SELECT * FROM produce WHERE id = ? AND status = "verified"');
$stmt->bind_param('i', $produce_id);
$stmt->execute();
$produce = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$produce) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Produce not found or not yet verified']);
    $conn->close();
    exit();
}

$seller_id   = $produce['farmer_id'];
$recorded_by = $user['sub'];

$stmt = $conn->prepare(
    'INSERT INTO transactions (produce_id, buyer_id, seller_id, amount_ugx, quantity_kg, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?)'
);
$stmt->bind_param('iiiddi', $produce_id, $buyer_id, $seller_id, $amount_ugx, $quantity_kg, $recorded_by);
$stmt->execute();
$tx_id = $conn->insert_id;
$stmt->close();

$stmt2 = $conn->prepare('UPDATE produce SET status = "sold" WHERE id = ?');
$stmt2->bind_param('i', $produce_id);
$stmt2->execute();
$stmt2->close();

$stmt3 = $conn->prepare(
    'SELECT t.*, p.commodity,
            buyer.name  AS buyer_name,
            seller.name AS seller_name,
            rec.name    AS recorded_by_name
     FROM transactions t
     LEFT JOIN produce p     ON p.id      = t.produce_id
     LEFT JOIN users  buyer  ON buyer.id  = t.buyer_id
     LEFT JOIN users  seller ON seller.id = t.seller_id
     LEFT JOIN users  rec    ON rec.id    = t.recorded_by
     WHERE t.id = ?'
);
$stmt3->bind_param('i', $tx_id);
$stmt3->execute();
$transaction = $stmt3->get_result()->fetch_assoc();
$stmt3->close();
$conn->close();

http_response_code(201);
echo json_encode(['success' => true, 'transaction' => $transaction]);
