<?php
/**
 * API de votacion para candidatos (proxima semana).
 * Anti-spam: 1 voto por IP por dia (un candidato).
 * Soporta voto y retirar voto.
 *
 *   GET  /api/votar-candidato.php   -> { ok, votes: { candidatoId: count, ... }, myVote: <candidatoId|null> }
 *   POST /api/votar-candidato.php   -> { ok, votes: {...}, myVote: <candidatoId|null> }
 *        Body: { "candidatoId": <string> }  o  { "candidatoId": <string>, "action": "unvote" }
 *
 * El candidatoId es el videoId de YouTube: identidad estable del candidato,
 * no su posicion en la lista.
 */
const DATA_DIR  = __DIR__ . "/data";
const DATA_FILE = DATA_DIR . "/votos-candidatos.json";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Cache-Control: no-cache, no-store, must-revalidate");
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

// Migra votos viejos (candidatoId = posicion numerica) a la identidad estable (videoId).
function migrateLegacyVotes($list) {
  $rf = DATA_DIR . "/candidatos.json";
  if (!file_exists($rf)) return $list;
  $rd = json_decode(file_get_contents($rf), true) ?: [];
  $map = [];
  foreach (($rd["candidatos"] ?? []) as $i => $s) {
    $vid = is_string($s["videoId"] ?? "") ? $s["videoId"] : "";
    if ($vid === "") $vid = extractVideoId($s["url"] ?? "");
    if ($vid !== "") $map[$i + 1] = $vid;
  }
  if (!$map) return $list;
  $changed = false;
  foreach ($list as $k => $v) {
    $id = (string)($v["candidatoId"] ?? "");
    if (preg_match('/^\d+$/', $id) && isset($map[(int)$id])) {
      $list[$k]["candidatoId"] = $map[(int)$id];
      $changed = true;
    }
  }
  if ($changed) saveVotes($list);
  return $list;
}

function loadVotes() {
  return migrateLegacyVotes(json_decode(file_get_contents(DATA_FILE), true) ?: []);
}

function getCounts($list) {
  $counts = [];
  foreach ($list as $v) {
    $id = (string)($v["candidatoId"] ?? "");
    if ($id !== "") $counts[$id] = ($counts[$id] ?? 0) + 1;
  }
  return $counts;
}

function myVote($list, $ip, $today) {
  foreach ($list as $v) {
    if (($v["ip"] ?? "") === $ip && ($v["date"] ?? "") === $today) {
      return (string)($v["candidatoId"] ?? "");
    }
  }
  return null;
}

function buildResponse($list, $ip, $today) {
  return ["ok" => true, "votes" => getCounts($list), "myVote" => myVote($list, $ip, $today)];
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
  $candidatoId = trim((string)($body["candidatoId"] ?? ""));
  $action = $body["action"] ?? "vote";

  if ($candidatoId === "") {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "candidatoId invalido"]);
    exit;
  }

  $ip = $_SERVER["REMOTE_ADDR"] ?? "0.0.0.0";
  $today = date("Y-m-d");
  $list = loadVotes();

  if ($action === "unvote") {
    foreach ($list as $k => $v) {
      if ((string)($v["candidatoId"] ?? "") === $candidatoId && ($v["ip"] ?? "") === $ip && ($v["date"] ?? "") === $today) {
        array_splice($list, $k, 1); break;
      }
    }
    saveVotes($list);
    echo json_encode(buildResponse($list, $ip, $today));
    exit;
  }

  $existing = myVote($list, $ip, $today);
  if ($existing !== null) {
    if ($existing === $candidatoId) {
      foreach ($list as $k => $v) {
        if ((string)($v["candidatoId"] ?? "") === $candidatoId && ($v["ip"] ?? "") === $ip && ($v["date"] ?? "") === $today) {
          array_splice($list, $k, 1); break;
        }
      }
      saveVotes($list);
      echo json_encode(buildResponse($list, $ip, $today));
      exit;
    }
    http_response_code(429);
    echo json_encode(["ok" => false, "error" => "Ya votaste hoy por otro candidato", "votes" => getCounts($list), "myVote" => $existing]);
    exit;
  }

  $nombre = trim($body["nombre"] ?? "");
  if ($nombre === "") $nombre = "Anonimo";
  $list[] = [
    "candidatoId" => $candidatoId,
    "nombre"      => mb_substr($nombre, 0, 60),
    "ip"          => $ip,
    "date"        => $today,
    "createdAt"   => date("c")
  ];
  saveVotes($list);
  echo json_encode(buildResponse($list, $ip, $today));
  exit;
}

http_response_code(405);
echo json_encode(["ok" => false, "error" => "Metodo no permitido"]);
