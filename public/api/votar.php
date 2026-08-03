<?php
/**
 * API de votacion para el Top 20.
 * Anti-spam: 1 voto por IP por dia (una cancion).
 * Soporta voto y retirar voto.
 *
 *   GET  /api/votar.php   -> { ok, votes: { songId: count, ... }, myVote: <songId|null> }
 *   POST /api/votar.php   -> { ok, votes: {...}, myVote: <songId|null> }
 *        Body: { "songId": <string> }  o  { "songId": <string>, "action": "unvote" }
 *
 * El songId es el videoId de YouTube: identidad estable de la cancion,
 * no la posicion del ranking.
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

function extractVideoId($url) {
  if (!is_string($url)) return "";
  if (preg_match('/[?&]v=([A-Za-z0-9_-]{11})/', $url, $m)) return $m[1];
  if (preg_match('#youtu\.be/([A-Za-z0-9_-]{11})#', $url, $m)) return $m[1];
  if (preg_match('/^[A-Za-z0-9_-]{11}$/', $url)) return $url;
  return "";
}

function saveVotes($list) {
  return file_put_contents(DATA_FILE, json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Migra votos viejos (songId = posicion numerica) a la identidad estable (videoId).
function migrateLegacyVotes($list) {
  $rf = DATA_DIR . "/ranking.json";
  if (!file_exists($rf)) return $list;
  $rd = json_decode(file_get_contents($rf), true) ?: [];
  $map = [];
  foreach (($rd["songs"] ?? []) as $i => $s) {
    $vid = is_string($s["videoId"] ?? "") ? $s["videoId"] : "";
    if ($vid === "") $vid = extractVideoId($s["url"] ?? "");
    if ($vid !== "") $map[$i + 1] = $vid;
  }
  if (!$map) return $list;
  $changed = false;
  foreach ($list as $k => $v) {
    $id = (string)($v["songId"] ?? "");
    if (preg_match('/^\d+$/', $id) && isset($map[(int)$id])) {
      $list[$k]["songId"] = $map[(int)$id];
      $changed = true;
    }
  }
  if ($changed) saveVotes($list);
  return $list;
}

function loadVotes() {
  return migrateLegacyVotes(json_decode(file_get_contents(DATA_FILE), true) ?: []);
}

function getVoteCounts($list) {
  $counts = [];
  foreach ($list as $v) {
    $id = (string)($v["songId"] ?? "");
    if ($id !== "") $counts[$id] = ($counts[$id] ?? 0) + 1;
  }
  return $counts;
}

function myVote($list, $ip, $today) {
  foreach ($list as $v) {
    if (($v["ip"] ?? "") === $ip && ($v["date"] ?? "") === $today) {
      return (string)($v["songId"] ?? "");
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
  $songId = trim((string)($body["songId"] ?? ""));
  $action = $body["action"] ?? "vote";

  if ($songId === "") {
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
      if ((string)($v["songId"] ?? "") === $songId && ($v["ip"] ?? "") === $ip && ($v["date"] ?? "") === $today) {
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
        if ((string)($v["songId"] ?? "") === $songId && ($v["ip"] ?? "") === $ip && ($v["date"] ?? "") === $today) {
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
