<?php
// auth.php — sistema de autenticacion por sesion.
// Incluir este archivo al inicio de cualquier endpoint que requiera auth.

session_start();

const PANEL_PASSWORD = "radio2026";

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
