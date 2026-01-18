<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';

function auth_boot(): void {
  $cfg = require __DIR__ . '/config.php';
  session_name($cfg['security']['session_name']);
  session_start();
}

function require_role(array $roles): void {
  $role = $_SESSION['role'] ?? null;
  if (!$role || !in_array($role, $roles, true)) {
    json_response(['error' => 'Unauthorized'], 401);
  }
}

function login_user(string $username, string $password): void {
  $pdo = db();
  $st = $pdo->prepare("SELECT id, username, password_hash, role, is_active FROM users WHERE username = ? LIMIT 1");
  $st->execute([$username]);
  $u = $st->fetch();
  if (!$u || (int)$u['is_active'] !== 1) json_response(['error' => 'Bad credentials'], 401);
  if (!password_verify($password, $u['password_hash'])) json_response(['error' => 'Bad credentials'], 401);

  $_SESSION['uid'] = (int)$u['id'];
  $_SESSION['role'] = $u['role'];
  $_SESSION['username'] = $u['username'];

  json_response(['ok' => true, 'role' => $u['role'], 'username' => $u['username']]);
}

function logout_user(): void {
  $_SESSION = [];
  if (ini_get('session.use_cookies')) {
    $p = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
  }
  session_destroy();
  json_response(['ok' => true]);
}
