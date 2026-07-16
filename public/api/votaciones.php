<?php
// votaciones.php — endpoint admin que devuelve todos los votos con nombres.
// Requiere sesion auth.

require_once __DIR__ . "/auth.php";

const DATA_DIR  = __DIR__ . "/data";
const DATA_FILE = DATA_DIR . "/votos.json";
const RANKING_FILE = DATA_DIR . "/ranking.json";

header("Access-Control-Allow-Origin: " . ($_SERVER["HTTP_ORIGIN"] ?? "*"));
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(204); exit; }
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
  http_response_code(405);
  echo json_encode(["ok" => false, "error" => "Metodo no permitido"]);
  exit;
}

requireAuth();

if (!file_exists(DATA_FILE)) {
  echo json_encode(["ok" => true, "votes" => [], "songs" => []]);
  exit;
}

$votes = json_decode(file_get_contents(DATA_FILE), true) ?: [];
$songs = [];
if (file_exists(RANKING_FILE)) {
  $ranking = json_decode(file_get_contents(RANKING_FILE), true) ?: [];
  foreach ($ranking["songs"] ?? [] as $s) {
    $songs[(int)$s["id"]] = [
      "title" => $s["title"] ?? "",
      "artist" => $s["artist"] ?? "",
      "position" => $s["position"] ?? 0
    ];
  }
}

// Agrupar votos por cancion
$bySong = [];
foreach ($votes as $v) {
  $id = (int)($v["songId"] ?? 0);
  if ($id <= 0) continue;
  if (!isset($bySong[$id])) {
    $bySong[$id] = [
      "songId" => $id,
      "title" => $songs[$id]["title"] ?? "(canción #$id)",
      "artist" => $songs[$id]["artist"] ?? "",
      "position" => $songs[$id]["position"] ?? 0,
      "total" => 0,
      "voters" => []
    ];
  }
  $bySong[$id]["total"]++;
  $bySong[$id]["voters"][] = [
    "nombre" => $v["nombre"] ?? "Anónimo",
    "date" => $v["date"] ?? "",
    "createdAt" => $v["createdAt"] ?? ""
  ];
}

// Ordenar por total descendente
usort($bySong, function($a, $b) { return $b["total"] - $a["total"]; });

echo json_encode(["ok" => true, "results" => $bySong, "totalVotes" => count($votes)]);
