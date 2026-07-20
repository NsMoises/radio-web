<?php
require_once __DIR__ . "/auth.php";
const DATA_DIR  = __DIR__ . "/data";
const DATA_FILE = DATA_DIR . "/banner.json";

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
    $defaults = [
      "seasonLabel" => "Temporada actual",
      "slides" => [
        ["id" => 1, "image" => "", "title" => "Bienvenido a la radio", "subtitle" => "La mejor música 24/7", "season" => ""],
        ["id" => 2, "image" => "", "title" => "Música sin pausa", "subtitle" => "Programación en vivo todo el día", "season" => ""]
      ]
    ];
    file_put_contents(DATA_FILE, json_encode($defaults, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
  }
  readfile(DATA_FILE);
  exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  requireAuth();
  $raw = file_get_contents("php://input");
  $data = json_decode($raw, true);
  if (!is_array($data) || !isset($data["slides"]) || !is_array($data["slides"])) {
    http_response_code(400); echo json_encode(["ok" => false, "error" => "JSON inválido"]); exit;
  }
  $data["seasonLabel"] = isset($data["seasonLabel"]) ? trim($data["seasonLabel"]) : "Temporada actual";
  foreach ($data["slides"] as $i => &$s) {
    $s["title"]    = isset($s["title"]) ? trim($s["title"]) : "";
    $s["subtitle"] = isset($s["subtitle"]) ? trim($s["subtitle"]) : "";
    $s["image"]    = isset($s["image"]) ? trim($s["image"]) : "";
    $s["season"]   = isset($s["season"]) ? trim($s["season"]) : "";
    if (!isset($s["id"])) { $s["id"] = $i + 1; }
  }
  unset($s);
  $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  $ok = file_put_contents(DATA_FILE, $json);
  if ($ok === false) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "No se pudo escribir banner.json (revisa permisos)"]);
    exit;
  }
  echo json_encode(["ok" => true, "saved" => count($data["slides"]) . " diapositivas"]);
  exit;
}

http_response_code(405);
echo json_encode(["ok" => false, "error" => "Método no permitido"]);
