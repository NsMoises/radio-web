<?php
// login.php — login / logout del panel.
//   POST { "password": "..." }  -> inicia sesion
//   POST { "action": "logout" }  -> cierra sesion
//   GET                          -> verifica si la sesion esta activa

require_once __DIR__ . "/auth.php";

header("Access-Control-Allow-Origin: " . ($_SERVER["HTTP_ORIGIN"] ?? "*"));
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
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
    session_destroy();
    echo json_encode(["ok" => true]);
    exit;
  }

  $password = $body["password"] ?? "";
  if ($password === PANEL_PASSWORD) {
    $_SESSION["panel_authed"] = true;
    echo json_encode(["ok" => true]);
    exit;
  }

  http_response_code(401);
  echo json_encode(["ok" => false, "error" => "Contraseña incorrecta"]);
  exit;
}

http_response_code(405);
echo json_encode(["ok" => false, "error" => "Metodo no permitido"]);
