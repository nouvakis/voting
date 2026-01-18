<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

function handle_admin_create_poll(): void {
  require_method('POST');
  require_role(['admin']);

  $d = read_json();
  $title = trim((string)($d['title'] ?? ''));
  $starts_at = (string)($d['starts_at'] ?? '');
  $ends_at   = (string)($d['ends_at'] ?? '');

  if ($title === '' || $starts_at === '' || $ends_at === '') {
    json_response(['error' => 'Missing title/starts_at/ends_at'], 400);
  }

  // Απλό format check: "YYYY-MM-DD HH:MM:SS"
  if (!preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $starts_at) ||
      !preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $ends_at)) {
    json_response(['error' => 'Invalid datetime format. Use YYYY-MM-DD HH:MM:SS'], 400);
  }

  $pdo = db();
  $st = $pdo->prepare("
    INSERT INTO polls (title, starts_at, ends_at, state, created_by)
    VALUES (?, ?, ?, 'prepared', ?)
  ");
  $st->execute([$title, $starts_at, $ends_at, (int)($_SESSION['uid'] ?? 0)]);
  json_response(['ok' => true, 'poll_id' => (int)$pdo->lastInsertId()]);
}

function handle_admin_list_polls(): void {
  require_method('GET');
  require_role(['admin']);

  $pdo = db();
  $st = $pdo->query("SELECT id, title, starts_at, ends_at, state FROM polls ORDER BY id DESC LIMIT 500");
  json_response(['polls' => $st->fetchAll()]);
}

function handle_admin_list_images(int $pollId): void {
  require_method('GET');
  require_role(['admin']);

  $pdo = db();
  $st = $pdo->prepare("
    SELECT id, poll_id, title, file_path, sort_order
    FROM poll_images
    WHERE poll_id=?
    ORDER BY sort_order, id
  ");
  $st->execute([$pollId]);
  json_response(['images' => $st->fetchAll()]);
}

function handle_admin_upload_image(int $pollId): void {
  require_method('POST');
  require_role(['admin']);

  if (!isset($_FILES['image'])) {
    json_response(['error' => 'Missing file field: image'], 400);
  }

  $title = trim((string)($_POST['title'] ?? ''));
  $sort_order = (int)($_POST['sort_order'] ?? 0);

  $f = $_FILES['image'];
  if (($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    json_response(['error' => 'Upload error'], 400);
  }

  $tmp = $f['tmp_name'];
  $orig = (string)($f['name'] ?? 'file');
  $size = (int)($f['size'] ?? 0);

  if ($size <= 0) json_response(['error' => 'Empty file'], 400);
  if ($size > 30 * 1024 * 1024) json_response(['error' => 'File too large (max 30MB)'], 413);

  $mime = mime_content_type($tmp) ?: '';
  $allowed = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
  ];
  if (!isset($allowed[$mime])) {
    json_response(['error' => 'Unsupported image type'], 415);
  }
  $ext = $allowed[$mime];

  // Φάκελος αποθήκευσης (public, γιατί δεν έχεις server-level deny)
  $cfg = require __DIR__ . '/config.php';
  $uploadsDir = rtrim((string)$cfg['app']['uploads_dir'], '/');
  $pollDir = $uploadsDir . '/polls/' . $pollId;

  if (!is_dir($pollDir) && !mkdir($pollDir, 0755, true)) {
    json_response(['error' => 'Cannot create upload dir'], 500);
  }

  $name = bin2hex(random_bytes(16)) . '.' . $ext;
  $destAbs = $pollDir . '/' . $name;

  if (!move_uploaded_file($tmp, $destAbs)) {
    json_response(['error' => 'Failed to move upload'], 500);
  }

  // Αυτό είναι το relative path που αποθηκεύεις στη DB
  $filePath = 'uploads/polls/' . $pollId . '/' . $name;

  if ($title === '') {
    // default: filename χωρίς extension
    $title = pathinfo($orig, PATHINFO_FILENAME);
  }

  $pdo = db();
  $st = $pdo->prepare("
    INSERT INTO poll_images (poll_id, title, file_path, sort_order)
    VALUES (?, ?, ?, ?)
  ");
  $st->execute([$pollId, $title, $filePath, $sort_order]);

  json_response([
    'ok' => true,
    'image_id' => (int)$pdo->lastInsertId(),
    'file_path' => $filePath,
    'mime' => $mime,
  ]);
}
