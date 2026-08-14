<?php
// login.php — login / logout del panel.
//   POST { "password": "..." }  -> inicia sesion
//   POST { "action": "logout" }  -> cierra sesion
//   GET                          -> verifica si la sesion esta activa

require_once __DIR__ . "/auth.php";

corsAllowed();

header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(204); exit; }

if ($_SERVER["REQUEST_METHOD"] === "GET") {
  echo json_encode(["ok" => true, "authed" => isAuthed()]);
  exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  $raw = file_get_contents("php://input");
  $body = json_decode($raw, true) ?: [];

  if (($body["action"] ?? "") === "logout") {
    session_unset();
    session_destroy();
    echo json_encode(["ok" => true]);
    exit;
  }

  // Rate limiting por intentos fallidos (por IP).
  $maxAttempts = 5;
  $lockSeconds = 300; // 5 minutos
  $key = "login_" . ($_SERVER["REMOTE_ADDR"] ?? "0.0.0.0");
  $fails = (int)($_SESSION[$key . "_fails"] ?? 0);
  $lockedUntil = (int)($_SESSION[$key . "_until"] ?? 0);

  if ($fails >= $maxAttempts && time() < $lockedUntil) {
    http_response_code(429);
    echo json_encode(["ok" => false, "error" => "Demasiados intentos. Espera unos minutos e intenta de nuevo."]);
    exit;
  }
  if (time() >= $lockedUntil) {
    $_SESSION[$key . "_fails"] = 0;
    $_SESSION[$key . "_until"] = 0;
  }

  $password = $body["password"] ?? "";
  if (is_string($password) && verifyPassword($password)) {
    $_SESSION["panel_authed"] = true;
    $_SESSION[$key . "_fails"] = 0;
    $_SESSION[$key . "_until"] = 0;
    session_regenerate_id(true); // evitar session fixation
    echo json_encode(["ok" => true]);
    exit;
  }

  $fails = (int)($_SESSION[$key . "_fails"] ?? 0) + 1;
  $_SESSION[$key . "_fails"] = $fails;
  if ($fails >= $maxAttempts) {
    $_SESSION[$key . "_until"] = time() + $lockSeconds;
  }
  http_response_code(401);
  echo json_encode(["ok" => false, "error" => "Contraseña incorrecta"]);
  exit;
}

http_response_code(405);
echo json_encode(["ok" => false, "error" => "Metodo no permitido"]);