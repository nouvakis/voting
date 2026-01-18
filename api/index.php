<?php
declare(strict_types=1);

/**
 * API Router (no rewrite rules needed)
 * Usage:
 *   /school/voting/api/index.php?r=/kiosk/polls/12/images
 */

require_once __DIR__ . '/../app/helpers.php';
require_once __DIR__ . '/../app/auth.php';
require_once __DIR__ . '/../app/controllers.php';
require_once __DIR__ . '/../app/controllers_admin.php';

auth_boot();

$r = (string)($_GET['r'] ?? '');
$r = '/' . ltrim($r, '/');

/* ---------------- AUTH ---------------- */
if ($r === '/auth/login') handle_auth_login();
if ($r === '/auth/logout') handle_auth_logout();

/* ---------------- OPERATOR ---------------- */
if ($r === '/operator/polls') handle_operator_polls();

if (preg_match('#^/operator/polls/(\d+)/start$#', $r, $m)) {
  handle_operator_start((int)$m[1]);
}
if (preg_match('#^/operator/polls/(\d+)/end$#', $r, $m)) {
  handle_operator_end((int)$m[1]);
}

/* ---------------- KIOSK ---------------- */
if (preg_match('#^/kiosk/polls/(\d+)$#', $r, $m)) {
  handle_kiosk_poll((int)$m[1]);
}
if (preg_match('#^/kiosk/polls/(\d+)/images$#', $r, $m)) {
  handle_kiosk_images((int)$m[1]);
}
if (preg_match('#^/kiosk/polls/(\d+)/voter-sessions$#', $r, $m)) {
  handle_kiosk_new_session((int)$m[1]);
}
if (preg_match('#^/kiosk/polls/(\d+)/submit$#', $r, $m)) {
  handle_kiosk_submit((int)$m[1]);
}

/* ---------------- ADMIN ---------------- */
if ($r === '/admin/polls' && (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET')) {
  handle_admin_list_polls();
}
if ($r === '/admin/polls' && (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST')) {
  handle_admin_create_poll();
}

if (preg_match('#^/admin/polls/(\d+)/images$#', $r, $m) && (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET')) {
  handle_admin_list_images((int)$m[1]);
}
if (preg_match('#^/admin/polls/(\d+)/images$#', $r, $m) && (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST')) {
  handle_admin_upload_image((int)$m[1]);
}

if (preg_match('#^/admin/polls/(\d+)/reset$#', $r, $m)) {
  handle_admin_reset((int)$m[1]);
}
if (preg_match('#^/admin/polls/(\d+)/results$#', $r, $m)) {
  handle_admin_results((int)$m[1]);
}

/* ---------------- NOT FOUND ---------------- */
json_response(['error' => 'Not found', 'route' => $r], 404);
