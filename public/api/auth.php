<?php
// auth.php — sistema de autenticacion por sesion.
// La contrasena del panel se lee desde api/data/panel-secret.txt (NO desde el repo):
//   - En produccion: deploy.yml la genera desde el secret PANEL_PASSWORD de GitHub.
//   - En local: crea un archivo manualmente (ver SECURITY.md).
// NUNCA guardar la contrasena en este archivo ni en el repositorio.

session_start();

function isAuthed() {
  return !empty($_SESSION["panel_authed"]) && $_SESSION["panel_authed"] === true;
}

function requireAuth() {
  if (!isAuthed()) {
    http_response_code(401);
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode(["ok" => false, "error" => "No autorizado"]);
    exit;
  }
}

// Lee la contrasena del panel desde el archivo de secretos (fuera del repo).
function panelPassword() {
  $file = __DIR__ . "/data/panel-secret.txt";
  if (is_file($file)) {
    $pwd = trim((string)@file_get_contents($file));
    if ($pwd !== "") return $pwd;
  }
  // Fallback SOLO local: si no existe el secret, se niega el acceso.
  // También se intenta un hash colocado manualmente (ver SECURITY.md).
  $hashFile = __DIR__ . "/data/panel-secret.php";
  if (is_file($hashFile)) {
    $hash = trim((string)@require $hashFile);
    if ($hash !== "") {
      return ["hash" => $hash];
    }
  }
  return ""; // sin secret -> login imposible (seguro por defecto)
}

function verifyPassword($input) {
  $secret = panelPassword();
  if (is_string($secret)) {
    return hash_equals($secret, (string)$input);
  }
  if (is_array($secret) && isset($secret["hash"])) {
    return password_verify((string)$input, $secret["hash"]);
  }
  return false;
}

// Devuelve el origin permitido para respuestas CORS con credenciales.
// Solo permite origenes de la propia aplicacion; nunca * con credenciales.
function allowedOrigin() {
  $origin = $_SERVER["HTTP_ORIGIN"] ?? "";
  $allowed = [
    "https://radio.solperuradio.es",
    "https://solperuradio.es",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ];
  if (in_array($origin, $allowed, true)) return $origin;
  return "https://radio.solperuradio.es";
}

// Para endpoints que requieren credenciales, el CORS debe ser fijo (whitelist),
// nunca "*" ni reflejar origenes arbitrarios.
function corsAllowed() {
  header("Access-Control-Allow-Origin: " . allowedOrigin());
  header("Access-Control-Allow-Credentials: true");
  header("Vary: Origin");
}