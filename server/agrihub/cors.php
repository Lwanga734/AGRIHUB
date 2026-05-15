<?php
// Origins allowed to call this API from the browser (must match exactly, no trailing slash)
$allowed_origins = [
    'http://localhost:5173',
    'https://agrihub-9dt3.vercel.app',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$origin_allowed = in_array($origin, $allowed_origins, true)
    || (preg_match('#^https://[a-z0-9-]+\.vercel\.app$#i', $origin) === 1);

if ($origin_allowed) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code($origin_allowed ? 200 : 204);
    exit();
}
