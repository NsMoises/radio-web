<?php
/**
 * API de votacion para el Top 15 de videos.
 * Anti-spam: 1 voto por IP por dia (un video).
 * Soporta voto y retirar voto.
 *
 *   GET  /api/votar-video.php   -> { ok, votes: { videoId: count, ... }, myVote: <videoId|null> }
 *   POST /api/votar-video.php   -> { ok, votes: {...}, myVote: <videoId|null> }
 *        Body: { "videoId": <string> }  o  { "videoId": <string>, "action": "unvote" }
 *
 * El videoId es el ID de YouTube: identidad estable del video,
 * no su posicion en el ranking.
 */
const DATA_DIR  = __DIR__ . "/data";
const DATA_FILE = DATA_DIR . "/votos-videos.json";

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

// Valida que el videoId exista realmente en el Top 15.
function isVideoInList($videoId, $rf) {
  if (!file_exists($rf)) return true;
  $rd = json_decode(file_get_contents($rf), true) ?: [];
  foreach (($rd["videos"] ?? []) as $s) {
    $vid = is_string($s["videoId"] ?? "") ? $s["videoId"] : "";
    if ($vid === "") $vid = extractVideoId($s["url"] ?? "");
    if ($vid !== "" && $vid === $videoId) return true;
  }
  return false;
}

// Cooldown anti-spam: minimo COOLDOWN_MIN seg entre votos de la misma IP.
const COOLDOWN_MIN = 30;
function lastVoteAt($list, $ip) {
  $t = 0;
  foreach ($list as $v) {
    if (($v["ip"] ?? "") === $ip && !empty($v["createdAt"])) {
      $ts = strtotime($v["createdAt"]);
      if ($ts !== false && $ts > $t) $t = $ts;
    }
  }
  return $t;
}

// Migra votos viejos (videoId = posicion numerica) a la identidad estable (videoId de YouTube).
function migrateLegacyVotes($list) {
  $rf = DATA_DIR . "/top15videos.json";
  if (!file_exists($rf)) return $list;
  $rd = json_decode(file_get_contents($rf), true) ?: [];
  $map = [];
  foreach (($rd["videos"] ?? []) as $i => $s) {
    $vid = is_string($s["videoId"] ?? "") ? $s["videoId"] : "";
    if ($vid === "") $vid = extractVideoId($s["url"] ?? "");
    if ($vid !== "") $map[$i + 1] = $vid;
  }
  if (!$map) return $list;
  $changed = false;
  foreach ($list as $k => $v) {
    $id = (string)($v["videoId"] ?? "");
    if (preg_match('/^\d+$/', $id) && isset($map[(int)$id])) {
      $list[$k]["videoId"] = $map[(int)$id];
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
    $id = (string)($v["videoId"] ?? "");
    if ($id !== "") $counts[$id] = ($counts[$id] ?? 0) + 1;
  }
  return $counts;
}

function myVote($list, $ip, $today) {
  foreach ($list as $v) {
    if (($v["ip"] ?? "") === $ip && ($v["date"] ?? "") === $today) {
      return (string)($v["videoId"] ?? "");
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
  $videoId = trim((string)($body["videoId"] ?? ""));
  $action = $body["action"] ?? "vote";

  if ($videoId === "") {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "videoId invalido"]);
    exit;
  }

  $ip = $_SERVER["REMOTE_ADDR"] ?? "0.0.0.0";
  $today = date("Y-m-d");
  $list = loadVotes();

  if ($action === "unvote") {
    $found = false;
    foreach ($list as $k => $v) {
      if ((string)($v["videoId"] ?? "") === $videoId && ($v["ip"] ?? "") === $ip && ($v["date"] ?? "") === $today) {
        array_splice($list, $k, 1);
        $found = true;
        break;
      }
    }
    if ($found) saveVotes($list);
    echo json_encode(buildResponse($list, $ip, $today));
    exit;
  }

  // El videoId debe estar en la lista actual (anti-spam / items fuera de lista)
  $rf = DATA_DIR . "/top15videos.json";
  if (!isVideoInList($videoId, $rf)) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Ese video no está en el Top 15"]);
    exit;
  }

  // Cooldown por IP
  $last = lastVoteAt($list, $ip);
  if ($last > 0 && (time() - $last) < COOLDOWN_MIN) {
    http_response_code(429);
    echo json_encode(["ok" => false, "error" => "Espera unos segundos antes de votar de nuevo", "votes" => getVoteCounts($list), "myVote" => myVote($list, $ip, $today)]);
    exit;
  }

  $existing = myVote($list, $ip, $today);
  if ($existing !== null) {
    if ($existing === $videoId) {
      foreach ($list as $k => $v) {
        if ((string)($v["videoId"] ?? "") === $videoId && ($v["ip"] ?? "") === $ip && ($v["date"] ?? "") === $today) {
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
      "error" => "Ya votaste hoy por otro video",
      "votes" => getVoteCounts($list),
      "myVote" => $existing
    ]);
    exit;
  }

  $nombre = trim($body["nombre"] ?? "");
  if ($nombre === "") $nombre = "Anónimo";
  $list[] = [
    "videoId"   => $videoId,
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
