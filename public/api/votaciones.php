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

function loadItems($file, $listKey) {
  $path = DATA_DIR . "/$file";
  if (!file_exists($path)) return [];
  $data = json_decode(file_get_contents($path), true) ?: [];
  $items = [];
  foreach ($data[$listKey] ?? [] as $s) {
    $key = $s["videoId"] ?? $s["id"] ?? "";
    if ($key === "") continue;
    $items[(string)$key] = [
      "title" => $s["title"] ?? "",
      "artist" => $s["artist"] ?? "",
      "position" => $s["position"] ?? 0
    ];
  }
  return $items;
}

function groupVotes($votes, $items, $idKey) {
  $byItem = [];
  foreach ($votes as $v) {
    $id = (string)($v[$idKey] ?? "");
    if ($id === "") continue;
    if (!isset($byItem[$id])) {
      $byItem[$id] = [
        "id" => $id,
        "title" => $items[$id]["title"] ?? "(#$id)",
        "artist" => $items[$id]["artist"] ?? "",
        "position" => $items[$id]["position"] ?? 0,
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

$top20Songs = loadItems("ranking.json", "songs");
$top15Songs = loadItems("top15videos.json", "videos");
$candSongs  = loadItems("candidatos.json", "candidatos");

$top20Votes   = loadVotes("votos.json");
$top15Votes   = loadVotes("votos-videos.json");
$candVotes    = loadVotes("votos-candidatos.json");

$top20Results = groupVotes($top20Votes, $top20Songs, "songId");
$top15Results = groupVotes($top15Votes, $top15Songs, "videoId");
$candResults  = groupVotes($candVotes, $candSongs, "candidatoId");

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
