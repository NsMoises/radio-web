<?php
/**
 * API para guardar pedidos musicales de los oyentes.
 * Compatible cPanel (PHP 7.4+). Sin dependencias.
 *
 *   GET  /api/pedidos.php        -> devuelve los pedidos recientes (opcional)
 *   POST /api/pedidos.php        -> guarda un nuevo pedido
 *        Body: { "nombre": "...", "cancion": "...", "dedicatoria": "..." }
 *
 * El archivo se guarda en ./data/pedidos.json (lista de pedidos).
 */

const DATA_DIR  = __DIR__ . "/data";
const DATA_FILE = DATA_DIR . "/pedidos.json";
const MAX_PEDIDOS = 500;  // mantén solo los últimos 500
const TIME_LIMIT_MIN = 0; // 0 = sin límite por IP

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(204); exit; }

if (!is_dir(DATA_DIR)) { @mkdir(DATA_DIR, 0775, true); }
if (!file_exists(DATA_FILE)) { @file_put_contents(DATA_FILE, "[]"); }

if ($_SERVER["REQUEST_METHOD"] === "GET") {
  readfile(DATA_FILE);
  exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  $raw = file_get_contents("php://input");
  $data = json_decode($raw, true);
  if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "JSON inválido"]);
    exit;
  }

  $nombre     = trim($data["nombre"] ?? "");
  $cancion    = trim($data["cancion"] ?? "");
  $dedicatoria = trim($data["dedicatoria"] ?? "");

  if ($nombre === "" || $cancion === "") {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Faltan campos requeridos"]);
    exit;
  }

  $pedido = [
    "id"        => uniqid("p_", true),
    "nombre"    => mb_substr($nombre, 0, 80),
    "cancion"   => mb_substr($cancion, 0, 120),
    "dedicatoria" => mb_substr($dedicatoria, 0, 280),
    "ip"        => $_SERVER["REMOTE_ADDR"] ?? "0.0.0.0",
    "createdAt" => date("c")
  ];

  $list = json_decode(file_get_contents(DATA_FILE), true) ?: [];
  array_unshift($list, $pedido);
  if (count($list) > MAX_PEDIDOS) {
    $list = array_slice($list, 0, MAX_PEDIDOS);
  }
  $ok = file_put_contents(DATA_FILE, json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

  if ($ok === false) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "No se pudo escribir (revisa permisos chmod 775)"]);
    exit;
  }
  echo json_encode(["ok" => true, "id" => $pedido["id"]]);
  exit;
}

http_response_code(405);
echo json_encode(["ok" => false, "error" => "Método no permitido"]);