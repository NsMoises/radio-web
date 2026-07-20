<?php
require_once __DIR__ . "/auth.php";

const DATA_DIR = __DIR__ . "/data";

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

function loadSongs($file) {
  $path = DATA_DIR . "/$file";
  if (!file_exists($path)) return [];
  $data = json_decode(file_get_contents($path), true) ?: [];
  $songs = [];
  foreach ($data["songs"] ?? [] as $s) {
    $songs[(int)$s["id"]] = [
      "title" => $s["title"] ?? "",
      "artist" => $s["artist"] ?? "",
      "position" => $s["position"] ?? 0
    ];
  }
  return $songs;
}

function groupVotes($votes, $songs, $idKey) {
  $byItem = [];
  foreach ($votes as $v) {
    $id = (int)($v[$idKey] ?? 0);
    if ($id <= 0) continue;
    if (!isset($byItem[$id])) {
      $byItem[$id] = [
        "id" => $id,
        "title" => $songs[$id]["title"] ?? "(#$id)",
        "artist" => $songs[$id]["artist"] ?? "",
        "position" => $songs[$id]["position"] ?? 0,
        "total" => 0,
        "voters" => []
      ];
    }
    $byItem[$id]["total"]++;
    $byItem[$id]["voters"][] = [
      "nombre" => $v["nombre"] ?? "Anónimo",
      "date" => $v["date"] ?? "",
      "createdAt" => $v["createdAt"] ?? ""
    ];
  }
  usort($byItem, function($a, $b) { return $b["total"] - $a["total"]; });
  return $byItem;
}

function loadVotes($file) {
  $path = DATA_DIR . "/$file";
  if (!file_exists($path)) return [];
  return json_decode(file_get_contents($path), true) ?: [];
}

$top20Songs = loadSongs("ranking.json");
$top15Songs = loadSongs("videos.json");

$top20Votes   = loadVotes("votos.json");
$top15Votes   = loadVotes("votos-videos.json");
$candVotes    = loadVotes("votos-candidatos.json");

$top20Results = groupVotes($top20Votes, $top20Songs, "songId");
$top15Results = groupVotes($top15Votes, $top15Songs, "videoId");
$candResults  = groupVotes($candVotes, [], "candidatoId");

echo json_encode([
  "ok" => true,
  "categories" => [
    "top20" => [
      "label" => "Top 20",
      "results" => $top20Results,
      "totalVotes" => count($top20Votes)
    ],
    "top15" => [
      "label" => "Top 15 Videos",
      "results" => $top15Results,
      "totalVotes" => count($top15Votes)
    ],
    "candidatos" => [
      "label" => "Candidatos",
      "results" => $candResults,
      "totalVotes" => count($candVotes)
    ]
  ],
  "totalVotes" => count($top20Votes) + count($top15Votes) + count($candVotes)
]);
