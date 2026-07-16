<?php
/**
 * API de votacion para el Top 20.
 * Anti-spam: 1 voto por IP por dia (una cancion).
 * Soporta voto y retirar voto.
 *
 *   GET  /api/votar.php   -> { ok, votes: { songId: count, ... }, myVote: <songId|null> }
 *   POST /api/votar.php   -> { ok, votes: {...}, myVote: <songId|null> }
 *        Body: { "songId": <int> }  o  { "songId": <int>, "action": "unvote" }
 */
const DATA_DIR  = __DIR__ . "/data";
const DATA_FILE = DATA_DIR . "/votos.json";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(204); exit; }

if (!is_dir(DATA_DIR)) { @mkdir(DATA_DIR, 0775, true); }
if (!file_exists(DATA_FILE)) { @file_put_contents(DATA_FILE, "[]"); }

function loadVotes() {
  return json_decode(file_get_contents(DATA_FILE), true) ?: [];
}

function saveVotes($list) {
  return file_put_contents(DATA_FILE, json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function getVoteCounts($list) {
  $counts = [];
  foreach ($list as $v) {
    $id = (int)($v["songId"] ?? 0);
    if ($id > 0) $counts[$id] = ($counts[$id] ?? 0) + 1;
  }
  return $counts;
}

function myVote($list, $ip, $today) {
  foreach ($list as $v) {
    if (($v["ip"] ?? "") === $ip && ($v["date"] ?? "") === $today) {
      return (int)($v["songId"] ?? 0);
    }
  }
  return null;
}

function buildResponse($list, $ip, $today) {
  return [
    "ok" => true,
    "votes" => getVoteCounts($list),
    "myVote" => myVote($list, $ip, $today)
  ];
}

if ($_SERVER["REQUEST_METHOD"] === "GET") {
  $list = loadVotes();
  $ip = $_SERVER["REMOTE_ADDR"] ?? "0.0.0.0";
  $today = date("Y-m-d");
  echo json_encode(buildResponse($list, $ip, $today));
  exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  $raw = file_get_contents("php://input");
  $body = json_decode($raw, true);
  $songId = (int)($body["songId"] ?? 0);
  $action = $body["action"] ?? "vote";

  if ($songId <= 0) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "songId invalido"]);
    exit;
  }

  $ip = $_SERVER["REMOTE_ADDR"] ?? "0.0.0.0";
  $today = date("Y-m-d");
  $list = loadVotes();

  if ($action === "unvote") {
    // Retirar voto
    $found = false;
    foreach ($list as $k => $v) {
      if ((int)($v["songId"] ?? 0) === $songId && ($v["ip"] ?? "") === $ip && ($v["date"] ?? "") === $today) {
        array_splice($list, $k, 1);
        $found = true;
        break;
      }
    }
    if ($found) saveVotes($list);
    echo json_encode(buildResponse($list, $ip, $today));
    exit;
  }

  // Verificar: esta IP ya voto hoy por alguna cancion?
  $existing = myVote($list, $ip, $today);
  if ($existing !== null) {
    if ($existing === $songId) {
      // Ya voto esta cancion -> retirar voto (toggle)
      foreach ($list as $k => $v) {
        if ((int)($v["songId"] ?? 0) === $songId && ($v["ip"] ?? "") === $ip && ($v["date"] ?? "") === $today) {
          array_splice($list, $k, 1);
          break;
        }
      }
      saveVotes($list);
      echo json_encode(buildResponse($list, $ip, $today));
      exit;
    }
    http_response_code(429);
    echo json_encode([
      "ok" => false,
      "error" => "Ya votaste hoy por otra cancion",
      "votes" => getVoteCounts($list),
      "myVote" => $existing
    ]);
    exit;
  }

  // Nuevo voto
  $nombre = trim($body["nombre"] ?? "");
  if ($nombre === "") $nombre = "Anónimo";
  $list[] = [
    "songId"    => $songId,
    "nombre"    => mb_substr($nombre, 0, 60),
    "ip"        => $ip,
    "date"      => $today,
    "createdAt" => date("c")
  ];
  saveVotes($list);
  echo json_encode(buildResponse($list, $ip, $today));
  exit;
}

http_response_code(405);
echo json_encode(["ok" => false, "error" => "Metodo no permitido"]);
