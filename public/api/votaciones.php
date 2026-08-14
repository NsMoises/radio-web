<?php
require_once __DIR__ . "/auth.php";

const DATA_DIR = __DIR__ . "/data";

corsAllowed();
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(204); exit; }
if (!in_array($_SERVER["REQUEST_METHOD"], ["GET", "POST"])) {
  http_response_code(405);
  echo json_encode(["ok" => false, "error" => "Metodo no permitido"]);
  exit;
}

requireAuth();

// DELETE de votos: elimina todos los votos de un elemento
// que ya no esta en la lista. Body: { "category": "top20|top15|candidatos", "id": "<id>" }
if ($_SERVER["REQUEST_METHOD"] === "POST") {
  $CATS = [
    "top20"      => ["votos.json", "songId"],
    "top15"      => ["votos-videos.json", "videoId"],
    "candidatos" => ["votos-candidatos.json", "candidatoId"]
  ];
  $raw = file_get_contents("php://input");
  $body = json_decode($raw, true);
  $category = $body["category"] ?? "";
  $id = (string)($body["id"] ?? "");

  if (!isset($CATS[$category]) || $id === "") {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "category/id invalidos"]);
    exit;
  }

  [$file, $key] = $CATS[$category];
  $path = DATA_DIR . "/" . $file;
  if (!file_exists($path)) {
    echo json_encode(["ok" => true, "removed" => 0]);
    exit;
  }

  $list = json_decode(file_get_contents($path), true) ?: [];
  $before = count($list);
  $list = array_values(array_filter($list, function ($v) use ($key, $id) {
    return (string)($v[$key] ?? "") !== $id;
  }));
  $ok = file_put_contents($path, json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
  echo json_encode([
    "ok" => $ok !== false,
    "removed" => $before - count($list)
  ]);
  exit;
}

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
      $inList = isset($items[$id]);
      $byItem[$id] = [
        "id" => $id,
        "title" => $items[$id]["title"] ?? "(#$id)",
        "artist" => $items[$id]["artist"] ?? "",
        "position" => $items[$id]["position"] ?? 0,
        "inList" => $inList,
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
