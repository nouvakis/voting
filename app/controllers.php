<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

function handle_auth_login(): void {
  require_method('POST');
  $d = read_json();
  $username = trim((string)($d['username'] ?? ''));
  $password = (string)($d['password'] ?? '');
  if ($username === '' || $password === '') json_response(['error' => 'Missing credentials'], 400);
  login_user($username, $password);
}

function handle_auth_logout(): void {
  require_method('POST');
  logout_user();
}

/* Operator: λίστα polls που “βλέπει” */
function handle_operator_polls(): void {
  require_method('GET');
  require_role(['operator','admin']);

  $pdo = db();
  $st = $pdo->query("SELECT id, title, starts_at, ends_at, state FROM polls ORDER BY id DESC LIMIT 200");
  json_response(['polls' => $st->fetchAll()]);
}

function handle_operator_start(int $pollId): void {
  require_method('POST');
  require_role(['operator','admin']);

  $pdo = db();
  $pdo->beginTransaction();
  try {
    $st = $pdo->prepare("SELECT id, starts_at, ends_at, state FROM polls WHERE id=? FOR UPDATE");
    $st->execute([$pollId]);
    $p = $st->fetch();
    if (!$p) json_response(['error' => 'Poll not found'], 404);

    if ($p['state'] === 'ended') json_response(['error' => 'Poll already ended'], 409);

    $pdo->prepare("UPDATE polls SET state='running', running_started_at=NOW() WHERE id=?")
        ->execute([$pollId]);

    $pdo->commit();
    json_response(['ok' => true]);
  } catch (Throwable $e) {
    $pdo->rollBack();
    json_response(['error' => 'Server error'], 500);
  }
}

function handle_operator_end(int $pollId): void {
  require_method('POST');
  require_role(['operator','admin']);

  $pdo = db();
  $pdo->beginTransaction();
  try {
    $st = $pdo->prepare("SELECT id, state FROM polls WHERE id=? FOR UPDATE");
    $st->execute([$pollId]);
    $p = $st->fetch();
    if (!$p) json_response(['error' => 'Poll not found'], 404);

    $pdo->prepare("UPDATE polls SET state='ended', running_ended_at=NOW() WHERE id=?")
        ->execute([$pollId]);

    $pdo->commit();
    json_response(['ok' => true]);
  } catch (Throwable $e) {
    $pdo->rollBack();
    json_response(['error' => 'Server error'], 500);
  }
}

/* Kiosk: poll info */
function handle_kiosk_poll(int $pollId): void {
  require_method('GET');
  $pdo = db();
  $st = $pdo->prepare("SELECT id, title, starts_at, ends_at, state FROM polls WHERE id=?");
  $st->execute([$pollId]);
  $p = $st->fetch();
  if (!$p) json_response(['error' => 'Poll not found'], 404);
  json_response(['poll' => $p]);
}

/* Kiosk: images */
function handle_kiosk_images(int $pollId): void {
  require_method('GET');
  $pdo = db();
  $st = $pdo->prepare("SELECT id, title, file_path, sort_order FROM poll_images WHERE poll_id=? ORDER BY sort_order, id");
  $st->execute([$pollId]);
  json_response(['images' => $st->fetchAll()]);
}

/* Kiosk: new voter session */
function handle_kiosk_new_session(int $pollId): void {
  require_method('POST');

  $pdo = db();
  $token = random_token_hex(32);

  $st = $pdo->prepare("INSERT INTO voter_sessions (poll_id, token) VALUES (?, ?)");
  $st->execute([$pollId, $token]);

  json_response(['token' => $token]);
}

/* Kiosk: submit votes (atomic) */
function handle_kiosk_submit(int $pollId): void {
  require_method('POST');
  $d = read_json();

  $token = (string)($d['token'] ?? '');
  $votes = $d['votes'] ?? null;

  if ($token === '' || !is_array($votes) || count($votes) < 1) {
    json_response(['error' => 'Missing token or votes'], 400);
  }

  $pdo = db();
  $pdo->beginTransaction();
  try {
    // 1) Poll checks
    $st = $pdo->prepare("SELECT id, starts_at, ends_at, state FROM polls WHERE id=? FOR UPDATE");
    $st->execute([$pollId]);
    $p = $st->fetch();
    if (!$p) json_response(['error' => 'Poll not found'], 404);

    if ($p['state'] !== 'running') json_response(['error' => 'Voting not running'], 403);

    $now = new DateTimeImmutable('now');
    $starts = new DateTimeImmutable($p['starts_at']);
    $ends = new DateTimeImmutable($p['ends_at']);
    if ($now < $starts || $now > $ends) json_response(['error' => 'Out of time window'], 403);

    // 2) Session lock
    $st = $pdo->prepare("SELECT id, submitted_at FROM voter_sessions WHERE poll_id=? AND token=? FOR UPDATE");
    $st->execute([$pollId, $token]);
    $s = $st->fetch();
    if (!$s) json_response(['error' => 'Invalid token'], 401);
    if ($s['submitted_at'] !== null) json_response(['error' => 'Already submitted'], 409);

    $sessionId = (int)$s['id'];

    // 3) Validate & insert votes
    $ins = $pdo->prepare("INSERT INTO votes (voter_session_id, image_id, rating) VALUES (?, ?, ?)");

    foreach ($votes as $v) {
      $imageId = (int)($v['imageId'] ?? 0);
      $rating = (int)($v['rating'] ?? 0);
      if ($imageId <= 0 || $rating < 1 || $rating > 5) {
        json_response(['error' => 'Invalid vote payload'], 400);
      }
      $ins->execute([$sessionId, $imageId, $rating]);
    }

    // 4) Mark submitted
    $pdo->prepare("UPDATE voter_sessions SET submitted_at=NOW() WHERE id=?")->execute([$sessionId]);

    $pdo->commit();
    json_response(['ok' => true]);
  } catch (PDOException $e) {
    $pdo->rollBack();
    // Duplicate (same image twice) => 409
    if ((int)($e->errorInfo[1] ?? 0) === 1062) {
      json_response(['error' => 'Duplicate image vote'], 409);
    }
    json_response(['error' => 'DB error'], 500);
  } catch (Throwable $e) {
    $pdo->rollBack();
    json_response(['error' => 'Server error'], 500);
  }
}

/* Admin: reset poll votes */
function handle_admin_reset(int $pollId): void {
  require_method('POST');
  require_role(['admin']);

  $pdo = db();
  $pdo->beginTransaction();
  try {
    // Διαγράφουμε ψήφους & sessions του poll
    $pdo->prepare("
      DELETE v FROM votes v
      JOIN voter_sessions s ON s.id = v.voter_session_id
      WHERE s.poll_id = ?
    ")->execute([$pollId]);

    $pdo->prepare("DELETE FROM voter_sessions WHERE poll_id=?")->execute([$pollId]);

    $pdo->commit();
    json_response(['ok' => true]);
  } catch (Throwable $e) {
    $pdo->rollBack();
    json_response(['error' => 'Server error'], 500);
  }
}

/* Admin: results */
function handle_admin_results(int $pollId): void {
  require_method('GET');
  require_role(['admin','operator']);

  $pdo = db();
  $st = $pdo->prepare("
    SELECT
      pi.id AS image_id,
      pi.title,
      pi.file_path,
      COUNT(v.id) AS votes_count,
      AVG(v.rating) AS avg_rating
    FROM poll_images pi
    LEFT JOIN votes v ON v.image_id = pi.id
    WHERE pi.poll_id = ?
    GROUP BY pi.id, pi.title, pi.file_path
    ORDER BY avg_rating DESC, votes_count DESC, pi.id ASC
  ");
  $st->execute([$pollId]);
  json_response(['results' => $st->fetchAll()]);
}
