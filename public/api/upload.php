<?php
require_once __DIR__ . "/auth.php";
const UPLOAD_DIR = __DIR__ . "/uploads";

header("Access-Control-Allow-Origin: " . ($_SERVER["HTTP_ORIGIN"] ?? "*"));
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(204); exit; }

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  http_response_code(405);
  echo json_encode(["ok" => false, "error" => "Método no permitido"]);
  exit;
}

requireAuth();

if (!is_dir(UPLOAD_DIR)) { @mkdir(UPLOAD_DIR, 0775, true); }

if (!isset($_FILES["file"]) || $_FILES["file"]["error"] !== UPLOAD_ERR_OK) {
  $code = isset($_FILES["file"]) ? $_FILES["file"]["error"] : -1;
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Error al subir archivo (código $code)"]);
  exit;
}

$file = $_FILES["file"];
$allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file["tmp_name"]);
finfo_close($finfo);

if (!in_array($mime, $allowed)) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Formato no permitido. Usa JPG, PNG, GIF o WebP."]);
  exit;
}

if ($file["size"] > 5 * 1024 * 1024) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "La imagen es demasiado grande. Máximo 5 MB."]);
  exit;
}

$ext = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
$validExt = ["jpg", "jpeg", "png", "gif", "webp"];
if (!in_array($ext, $validExt)) {
  $map = ["image/jpeg" => "jpg", "image/png" => "png", "image/gif" => "gif", "image/webp" => "webp"];
  $ext = isset($map[$mime]) ? $map[$mime] : "jpg";
}

$filename = date("Ymd_His") . "_" . bin2hex(random_bytes(4)) . "." . $ext;
$dest = UPLOAD_DIR . "/" . $filename;

if (!move_uploaded_file($file["tmp_name"], $dest)) {
  http_response_code(500);
  echo json_encode(["ok" => false, "error" => "No se pudo guardar el archivo (revisa permisos de uploads/)"]);
  exit;
}

echo json_encode(["ok" => true, "url" => "/api/uploads/" . $filename, "filename" => $filename]);
