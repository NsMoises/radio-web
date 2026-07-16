<?php
/**
 * API para el ranking Top 20 de la radio.
 *   GET  -> devuelve ranking.json
 *   POST -> guarda ranking.json (requiere sesion auth)
 */
require_once __DIR__ . "/auth.php";

const DATA_DIR  = __DIR__ . "/data";
const DATA_FILE = DATA_DIR . "/ranking.json";

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
    http_response_code(404);
    echo json_encode(["ok" => false, "error" => "ranking.json no existe"]);
    exit;
  }
  readfile(DATA_FILE);
  exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  requireAuth();

  $raw = file_get_contents("php://input");
  $data = json_decode($raw, true);
  if (!is_array($data) || !isset($data["songs"]) || !is_array($data["songs"])) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "JSON inválido"]);
    exit;
  }

  foreach ($data["songs"] as $i => &$s) {
    $s["position"]   = $i + 1;
    $s["lastWeekPosition"] = isset($s["lastWeekPosition"]) ? (int)$s["lastWeekPosition"] : 0;
    $s["peakPosition"]     = isset($s["peakPosition"]) ? (int)$s["peakPosition"] : ($i + 1);
    $s["title"]   = isset($s["title"]) ? trim($s["title"]) : "(sin título)";
    $s["artist"]  = isset($s["artist"]) ? trim($s["artist"]) : "(sin artista)";
    $s["url"]     = isset($s["url"]) ? trim($s["url"]) : "";
    $s["enteredAt"] = isset($s["enteredAt"]) ? trim($s["enteredAt"]) : date("Y-m-d");
    $s["isNew"]   = !empty($s["isNew"]);
    if (!isset($s["id"])) { $s["id"] = $i + 1; }
  }
  unset($s);

  if (!isset($data["lastUpdatedAt"])) { $data["lastUpdatedAt"] = date("Y-m-d"); }
  if (!isset($data["weekLabel"]) || $data["weekLabel"] === "") {
    $months = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    $m = (int)date("n") - 1;
    $data["weekLabel"] = "Semana del " . date("d") . " de " . ucfirst($months[$m]) . " de " . date("Y");
  }

  $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  $ok = file_put_contents(DATA_FILE, $json);

  if ($ok === false) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "No se pudo escribir data/ranking.json (revisa permisos 775)"]);
    exit;
  }
  echo json_encode(["ok" => true, "saved" => count($data["songs"]) . " canciones"]);
  exit;
}

http_response_code(405);
echo json_encode(["ok" => false, "error" => "Método no permitido"]);
