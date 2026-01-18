<?php
declare(strict_types=1);

function json_response(array $data, int $status = 200): void {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function read_json(): array {
  $raw = file_get_contents('php://input');
  if ($raw === false || trim($raw) === '') return [];
  $data = json_decode($raw, true);
  if (!is_array($data)) json_response(['error' => 'Invalid JSON'], 400);
  return $data;
}

function require_method(string $method): void {
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) {
    json_response(['error' => 'Method not allowed'], 405);
  }
}

function now_utc(): DateTimeImmutable {
  return new DateTimeImmutable('now', new DateTimeZone('UTC'));
}

function random_token_hex(int $bytes = 32): string {
  return bin2hex(random_bytes($bytes)); // 64 hex
}
