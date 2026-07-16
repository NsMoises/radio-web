<?php
/**
 * API minimal para el ranking Top 20 de la radio.
 * Compatible con cPanel (PHP 7.4+). Sin dependencias.
 *
 *   GET  /api/ranking.php          -> devuelve el ranking.json actual
 *   POST /api/ranking.php          -> guarda el ranking.json enviado en el body
 *        Header: X-Panel-Password: <PANEL_PASSWORD>
 *        Body:   JSON del ranking
 *
 * El archivo se guarda en ./data/ranking.json (junto a este script).
 * Asegurate de dar permisos de escritura a esa carpeta (chmod 755 o 775).
 *
 * Cambia PANEL_PASSWORD abajo por la misma que uses en src/config.js.
 */

const PANEL_PASSWORD = "radio2026";
const DATA_DIR  = __DIR__ . "/data";
const DATA_FILE = DATA_DIR . "/ranking.json";

// Permite que la propia web (mismo dominio) consuma la API.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Panel-Password");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(204);
  exit;
}

// Crea la carpeta data si no existe.
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
  // Login por cabecera
  $pwd = isset($_SERVER["HTTP_X_PANEL_PASSWORD"]) ? $_SERVER["HTTP_X_PANEL_PASSWORD"] : "";
  if ($pwd !== PANEL_PASSWORD) {
    http_response_code(401);
    echo json_encode(["ok" => false, "error" => "Contraseña incorrecta"]);
    exit;
  }

  $raw = file_get_contents("php://input");
  $data = json_decode($raw, true);
  if (!is_array($data) || !isset($data["songs"]) || !is_array($data["songs"])) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "JSON inválido"]);
    exit;
  }

  // Validación mínima de cada entrada.
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
    setlocale(LC_TIME, "es_ES.UTF-8", "es_ES", "Spanish");
    $data["weekLabel"] = "Semana del " . date("d") . " de " . ucfirst(strftime("%B")) . " de " . date("Y");
  }

  $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  $ok = file_put_contents(DATA_FILE, $json);

  if ($ok === false) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "No se pudo escribir data/ranking.json (revisa permisos chmod 775)"]);
    exit;
  }
  echo json_encode(["ok" => true, "saved" => count($data["songs"]) . " canciones"]);
  exit;
}

http_response_code(405);
echo json_encode(["ok" => false, "error" => "Método no permitido"]);