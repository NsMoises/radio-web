<?php
require_once __DIR__ . "/auth.php";
const DATA_DIR  = __DIR__ . "/data";
const DATA_FILE = DATA_DIR . "/news.json";

header("Access-Control-Allow-Origin: " . ($_SERVER["HTTP_ORIGIN"] ?? "*"));
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(204); exit; }
if (!is_dir(DATA_DIR)) { @mkdir(DATA_DIR, 0775, true); }

if ($_SERVER["REQUEST_METHOD"] === "GET") {
  if (!file_exists(DATA_FILE)) { http_response_code(404); echo json_encode(["ok" => false, "error" => "news.json no existe"]); exit; }
  readfile(DATA_FILE); exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  requireAuth();
  $raw = file_get_contents("php://input");
  $data = json_decode($raw, true);
  if (!is_array($data) || !isset($data["articles"]) || !is_array($data["articles"])) {
    http_response_code(400); echo json_encode(["ok" => false, "error" => "JSON inválido"]); exit;
  }
  foreach ($data["articles"] as $i => &$a) {
    $a["title"]  = isset($a["title"]) ? trim($a["title"]) : "(sin título)";
    $a["excerpt"] = isset($a["excerpt"]) ? trim($a["excerpt"]) : "";
    $a["body"]   = isset($a["body"]) ? trim($a["body"]) : "";
    $a["cover"]  = isset($a["cover"]) ? trim($a["cover"]) : "";
    $a["date"]   = isset($a["date"]) ? trim($a["date"]) : date("Y-m-d");
    $a["category"] = isset($a["category"]) ? trim($a["category"]) : "General";
    if (!isset($a["id"])) { $a["id"] = $i + 1; }
  }
  unset($a);
  $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  $ok = file_put_contents(DATA_FILE, $json);
  if ($ok === false) { http_response_code(500); echo json_encode(["ok" => false, "error" => "No se pudo escribir (revisa permisos)"]); exit; }
  echo json_encode(["ok" => true, "saved" => count($data["articles"]) . " artículos"]); exit;
}
http_response_code(405); echo json_encode(["ok" => false, "error" => "Método no permitido"]);
