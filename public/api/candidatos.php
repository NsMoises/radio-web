<?php
require_once __DIR__ . "/auth.php";
const DATA_DIR  = __DIR__ . "/data";
const DATA_FILE = DATA_DIR . "/candidatos.json";

corsAllowed();
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(204); exit; }
if (!is_dir(DATA_DIR)) { @mkdir(DATA_DIR, 0775, true); }

if ($_SERVER["REQUEST_METHOD"] === "GET") {
  if (!file_exists(DATA_FILE)) { http_response_code(404); echo json_encode(["ok" => false, "error" => "candidatos.json no existe"]); exit; }
  readfile(DATA_FILE); exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  requireAuth();
  $raw = file_get_contents("php://input");
  $data = json_decode($raw, true);
  if (!is_array($data) || !isset($data["candidatos"]) || !is_array($data["candidatos"])) {
    http_response_code(400); echo json_encode(["ok" => false, "error" => "JSON invalido"]); exit;
  }
  foreach ($data["candidatos"] as $i => &$c) {
    $c["position"] = $i + 1;
    $c["title"]   = isset($c["title"]) ? trim($c["title"]) : "(sin titulo)";
    $c["artist"]  = isset($c["artist"]) ? trim($c["artist"]) : "(sin artista)";
    $c["videoId"] = isset($c["videoId"]) ? trim($c["videoId"]) : "";
    $c["cover"]   = isset($c["cover"]) ? trim($c["cover"]) : "";
    if (!isset($c["id"])) { $c["id"] = $i + 1; }
  }
  unset($c);
  if (!isset($data["weekLabel"])) { $data["weekLabel"] = "Candidatos de la semana"; }
  $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  $ok = file_put_contents(DATA_FILE, $json);
  if ($ok === false) { http_response_code(500); echo json_encode(["ok" => false, "error" => "No se pudo escribir (revisa permisos)"]); exit; }
  echo json_encode(["ok" => true, "saved" => count($data["candidatos"]) . " candidatos"]); exit;
}

http_response_code(405); echo json_encode(["ok" => false, "error" => "Metodo no permitido"]);
