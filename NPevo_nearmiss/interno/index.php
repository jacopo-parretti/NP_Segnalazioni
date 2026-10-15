<?php

declare(strict_types=1);

require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/auth.php';
require __DIR__ . '/../lib/schema.php';

richiedi_accesso('../login.php');
intestazioni_protette();
schema_assicura();
?>
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="../css/stile.css">
<title>Home Page</title>
</head>
<body class="home">
    <div class="header">
        <img src="Images/logo.png" alt="Logo Aziendale" id="logo">
        <h1>SELEZIONA RAPPORTI DA VISUALIZZARE</h1>
        <div></div>
    </div>
    <div class="buttons">
        <a href="kaizen/Pagine/kaizenlist.php" class="button">
            <img src="Images/kaizen.png" alt="Logo Kaizen">
            <span><h2>PROPOSTA DI MIGLIORAMENTO</h2></span>
        </a>
        <a href="nearmiss/Pagine/nearmisslist.php" class="button">
            <img src="Images/nearmiss.png" alt="Logo Mancato Infortunio">
            <span><h2>MANCATO INFORTUNIO</h2></span>
        </a>
        <a href="segnalazioni/Pagine/segnalazionilist.php" class="button">
            <img src="Images/segnalazioni.png" alt="Logo Segnalazioni">
            <span><h2>SEGNALAZIONI</h2></span>
        </a>
    </div>
    <a href="logout.php" class="back-button">ESCI</a>
</body>
</html>
