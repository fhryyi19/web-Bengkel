<?php
// Update password for testuser to 'secret' using mysqli
$mysqli = new mysqli('localhost','root','','bengkel_db',3306);
if ($mysqli->connect_error) {
    echo "CONNECT_ERROR: " . $mysqli->connect_error . "\n";
    exit(1);
}
$hash = password_hash('secret', PASSWORD_BCRYPT);
$user = 'testuser';
$stmt = $mysqli->prepare('UPDATE users SET password = ? WHERE username = ?');
$stmt->bind_param('ss', $hash, $user);
$stmt->execute();
echo "affected_rows=" . $stmt->affected_rows . "\n";
$stmt->close();
$mysqli->close();
?>