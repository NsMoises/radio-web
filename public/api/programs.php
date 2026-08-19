<?php
require_once __DIR__ . "/auth.php";
const DATA_DIR  = __DIR__ . "/data";
const DATA_FILE = DATA_DIR . "/programs.json";

corsAllowed();
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(204); exit; }
if (!is_dir(DATA_DIR)) { @mkdir(DATA_DIR, 0775, true); }

if ($_SERVER["REQUEST_METHOD"] === "GET") {
  if (!file_exists(DATA_FILE)) { http_response_code(404); echo json_encode(["ok" => false, "error" => "programs.json no existe"]); exit; }
  readfile(DATA_FILE); exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  requireAuth();
  $raw = file_get_contents("php://input");
  $data = json_decode($raw, true);
  if (!is_array($data) || !isset($data["programs"]) || !is_array($data["programs"])) {
    http_response_code(400); echo json_encode(["ok" => false, "error" => "JSON inválido"]); exit;
  }
$validDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  foreach ($data["programs"] as $i => &$p) {
    $p["day"]   = isset($p["day"]) ? trim($p["day"]) : "Lunes";
    if (!in_array($p["day"], $validDays)) { $p["day"] = "Lunes"; }
    $p["start"] = isset($p["start"]) ? trim($p["start"]) : "";
    $p["end"]   = isset($p["end"]) ? trim($p["end"]) : "";
    $p["title"] = isset($p["title"]) ? trim($p["title"]) : "";
    $p["host"]  = isset($p["host"]) ? trim($p["host"]) : "";
    $p["desc"]  = isset($p["desc"]) ? trim($p["desc"]) : "";
    if (!isset($p["id"])) { $p["id"] = $i + 1; }
  }
  unset($p);
  $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  $ok = file_put_contents(DATA_FILE, $json);
  if ($ok === false) { http_response_code(500); echo json_encode(["ok" => false, "error" => "No se pudo escribir (revisa permisos)"]); exit; }
  echo json_encode(["ok" => true, "saved" => count($data["programs"]) . " programas"]); exit;
}
http_response_code(405); echo json_encode(["ok" => false, "error" => "Método no permitido"]);