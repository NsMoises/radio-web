<?php
require_once __DIR__ . "/auth.php";
const DATA_DIR  = __DIR__ . "/data";
const DATA_FILE = DATA_DIR . "/premieres.json";

header("Access-Control-Allow-Origin: " . ($_SERVER["HTTP_ORIGIN"] ?? "*"));
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(204); exit; }
if (!is_dir(DATA_DIR)) { @mkdir(DATA_DIR, 0775, true); }

if ($_SERVER["REQUEST_METHOD"] === "GET") {
  if (!file_exists(DATA_FILE)) { http_response_code(404); echo json_encode(["ok" => false, "error" => "premieres.json no existe"]); exit; }
  readfile(DATA_FILE); exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  requireAuth();
  $raw = file_get_contents("php://input");
  $data = json_decode($raw, true);
  if (!is_array($data) || !isset($data["premieres"]) || !is_array($data["premieres"])) {
    http_response_code(400); echo json_encode(["ok" => false, "error" => "JSON inválido"]); exit;
  }
  foreach ($data["premieres"] as $i => &$p) {
    $p["title"]  = isset($p["title"]) ? trim($p["title"]) : "(sin título)";
    $p["url"]    = isset($p["url"]) ? trim($p["url"]) : "";
    $p["poster"] = isset($p["poster"]) ? trim($p["poster"]) : "";
    $p["date"]   = isset($p["date"]) ? trim($p["date"]) : date("Y-m-d");
    $p["genre"]  = isset($p["genre"]) ? trim($p["genre"]) : "";
    $p["description"] = isset($p["description"]) ? trim($p["description"]) : "";
    if (!isset($p["id"])) { $p["id"] = $i + 1; }
  }
  unset($p);
  $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  $ok = file_put_contents(DATA_FILE, $json);
  if ($ok === false) { http_response_code(500); echo json_encode(["ok" => false, "error" => "No se pudo escribir (revisa permisos)"]); exit; }
  echo json_encode(["ok" => true, "saved" => count($data["premieres"]) . " estrenos"]); exit;
}
http_response_code(405); echo json_encode(["ok" => false, "error" => "Método no permitido"]);
