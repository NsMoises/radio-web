<?php
/**
 * API pública de chat en vivo.
 *
 *   GET  /api/chat.php?since=<timestamp>  → mensajes nuevos desde <timestamp>
 *   POST /api/chat.php                     → envía un mensaje
 *        Body: { "name": "...", "text": "..." }
 *
 * Rate limit: 3 mensajes por minuto por IP.
 * Datos: ./data/chat.json (últimos 200 mensajes).
 * NO requiere autenticación (chat público).
 */

const DATA_DIR  = __DIR__ . "/data";
const DATA_FILE = DATA_DIR . "/chat.json";
const MAX_MSGS  = 200;
const RATE_MAX  = 3;       // mensajes por ventana
const RATE_WINDOW = 60;    // segundos

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(204); exit; }
if (!is_dir(DATA_DIR)) { @mkdir(DATA_DIR, 0775, true); }
if (!file_exists(DATA_FILE)) { @file_put_contents(DATA_FILE, "[]"); }

// ── GET: mensajes recientes ──
if ($_SERVER["REQUEST_METHOD"] === "GET") {
  $since = isset($_GET["since"]) ? (float)$_GET["since"] : 0;
  $list = json_decode(@file_get_contents(DATA_FILE), true) ?: [];
  if ($since > 0) {
    $list = array_values(array_filter($list, function ($m) use ($since) {
      return ($m["ts"] ?? 0) > $since;
    }));
  }
  echo json_encode($list);
  exit;
}

// ── POST: enviar mensaje ──
if ($_SERVER["REQUEST_METHOD"] === "POST") {
  $raw = file_get_contents("php://input");
  $in  = json_decode($raw, true);
  if (!is_array($in)) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "JSON inválido"]);
    exit;
  }

  $name = mb_substr(trim($in["name"] ?? ""), 0, 30);
  $text = mb_substr(trim($in["text"] ?? ""), 0, 300);

  if ($name === "" || $text === "") {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Faltan campos (name, text)"]);
    exit;
  }

  // ── Rate limit por IP ──
  $ip  = $_SERVER["REMOTE_ADDR"] ?? "0.0.0.0";
  $now = time();
  $list = json_decode(@file_get_contents(DATA_FILE), true) ?: [];

  $recentCount = 0;
  foreach ($list as $m) {
    if (($m["ip"] ?? "") === $ip && ($m["ts"] ?? 0) > ($now - RATE_WINDOW)) {
      $recentCount++;
    }
  }
  if ($recentCount >= RATE_MAX) {
    $oldest = 0;
    foreach ($list as $m) {
      if (($m["ip"] ?? "") === $ip && ($m["ts"] ?? 0) > ($now - RATE_WINDOW)) {
        if ($oldest === 0 || ($m["ts"] ?? 0) < $oldest) $oldest = $m["ts"];
      }
    }
    $wait = $oldest ? ($oldest + RATE_WINDOW - $now) : RATE_WINDOW;
    http_response_code(429);
    echo json_encode(["ok" => false, "error" => "Rate limit", "retryAfter" => max(1, (int)$wait)]);
    exit;
  }

  // ── Guardar ──
  $msg = [
    "id"   => uniqid("c_", true),
    "name" => $name,
    "text" => $text,
    "ts"   => $now,
    "ip"   => $ip
  ];
  array_unshift($list, $msg);
  if (count($list) > MAX_MSGS) {
    $list = array_slice($list, 0, MAX_MSGS);
  }
  $ok = file_put_contents(DATA_FILE, json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

  if ($ok === false) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "No se pudo escribir (permisos)"]);
    exit;
  }
  echo json_encode(["ok" => true, "id" => $msg["id"], "ts" => $msg["ts"]]);
  exit;
}

http_response_code(405);
echo json_encode(["ok" => false, "error" => "Método no permitido"]);
