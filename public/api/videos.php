<?php
require_once __DIR__ . "/auth.php";
const DATA_DIR  = __DIR__ . "/data";
const DATA_FILE = DATA_DIR . "/top15videos.json";

header("Access-Control-Allow-Origin: " . ($_SERVER["HTTP_ORIGIN"] ?? "*"));
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(204); exit; }
if (!is_dir(DATA_DIR)) { @mkdir(DATA_DIR, 0775, true); }

if ($_SERVER["REQUEST_METHOD"] === "GET") {
  if (!file_exists(DATA_FILE)) { http_response_code(404); echo json_encode(["ok" => false, "error" => "top15videos.json no existe"]); exit; }
  readfile(DATA_FILE); exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  requireAuth();
  $raw = file_get_contents("php://input");
  $data = json_decode($raw, true);
  if (!is_array($data) || !isset($data["videos"]) || !is_array($data["videos"])) {
    http_response_code(400); echo json_encode(["ok" => false, "error" => "JSON inválido"]); exit;
  }
  foreach ($data["videos"] as $i => &$v) {
    $v["rank"]    = $i + 1;
    $v["position"] = $i + 1;
    $v["lastWeekPosition"] = isset($v["lastWeekPosition"]) ? (int)$v["lastWeekPosition"] : 0;
    $v["peakPosition"]     = isset($v["peakPosition"]) ? (int)$v["peakPosition"] : ($i + 1);
    $v["title"]   = isset($v["title"]) ? trim($v["title"]) : "(sin título)";
    $v["artist"]  = isset($v["artist"]) ? trim($v["artist"]) : "(sin artista)";
    $v["videoId"] = isset($v["videoId"]) ? trim($v["videoId"]) : "";
    $v["url"]     = isset($v["url"]) ? trim($v["url"]) : "";
    $v["enteredAt"] = isset($v["enteredAt"]) ? trim($v["enteredAt"]) : date("Y-m-d");
    $v["isNew"]   = !empty($v["isNew"]);
    $v["cover"]   = isset($v["cover"]) ? trim($v["cover"]) : ("https://img.youtube.com/vi/" . $v["videoId"] . "/hqdefault.jpg");
    if (!isset($v["id"])) { $v["id"] = $i + 1; }
  }
  unset($v);
  if (!isset($data["lastUpdatedAt"])) { $data["lastUpdatedAt"] = date("Y-m-d"); }
  $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  $ok = file_put_contents(DATA_FILE, $json);
  if ($ok === false) { http_response_code(500); echo json_encode(["ok" => false, "error" => "No se pudo escribir (revisa permisos)"]); exit; }
  echo json_encode(["ok" => true, "saved" => count($data["videos"]) . " vídeos"]); exit;
}
http_response_code(405); echo json_encode(["ok" => false, "error" => "Método no permitido"]);