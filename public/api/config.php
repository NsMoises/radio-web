<?php
require_once __DIR__ . "/auth.php";
const DATA_DIR  = __DIR__ . "/data";
const DATA_FILE = DATA_DIR . "/config.json";

$DEFAULT_CONFIG = [
  "streamUrl"   => "https://streaming12.elitecomunicacion.es:8208/stream?type=.mp3",
  "ytChannelId" => ""
];

// Todos los valores de STREAM_URL/YT se cargan tambien por defaults en el frontend,
// pero aqui se persisten para permitir editarlos desde el panel sin recompilar.

header("Access-Control-Allow-Origin: " . ($_SERVER["HTTP_ORIGIN"] ?? "*"));
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(204); exit; }
if (!is_dir(DATA_DIR)) { @mkdir(DATA_DIR, 0775, true); }

if ($_SERVER["REQUEST_METHOD"] === "GET") {
  if (!file_exists(DATA_FILE)) {
    file_put_contents(DATA_FILE, json_encode($DEFAULT_CONFIG, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
  }
  $raw = file_get_contents(DATA_FILE);
  $cfg = json_decode($raw, true);
  if (!is_array($cfg)) { $cfg = $DEFAULT_CONFIG; }
  // Merge con defaults para no romper si faltan campos
  $cfg = array_merge($DEFAULT_CONFIG, $cfg);
  echo json_encode($cfg, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  requireAuth();
  $raw = file_get_contents("php://input");
  $in = json_decode($raw, true);
  if (!is_array($in)) { http_response_code(400); echo json_encode(["ok" => false, "error" => "JSON inválido"]); exit; }

  $streamUrl = isset($in["streamUrl"]) ? trim($in["streamUrl"]) : "";
  $ytChannelId = isset($in["ytChannelId"]) ? trim($in["ytChannelId"]) : "";
  if ($streamUrl !== "" && !filter_var($streamUrl, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "El enlace de streaming no es una URL válida"]); exit;
  }

  $cfg = ["streamUrl" => $streamUrl, "ytChannelId" => $ytChannelId];
  $ok = file_put_contents(DATA_FILE, json_encode($cfg, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
  if ($ok === false) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "No se pudo escribir config.json (revisa permisos)"]); exit;
  }
  echo json_encode(["ok" => true, "saved" => $cfg]);
  exit;
}

http_response_code(405);
echo json_encode(["ok" => false, "error" => "Método no permitido"]);