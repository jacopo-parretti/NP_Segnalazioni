<?php

declare(strict_types=1);

require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/personale.php';

$persone = personale_in_forza();
$categorie = db_righe('SELECT ID_CATEGORIA, CATEGORIA FROM dbo.CATEGORIA_KAIZEN');
$benefici = db_righe('SELECT ID_BENEFICI, BENEFICI FROM dbo.BENEFICI_KAIZEN');
$pronto = $persone !== null && $categorie !== null && $benefici !== null;
?>
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" href="../Images/favicon.png" type="image/png">
<link rel="stylesheet" href="../css/stile.css">
<title>KAIZEN - Modulo invio</title>
</head>
<body class="modulo">
    <div class="wrapper">
        <div class="logo-container">
            <img src="Risorse/Images/logo.png" alt="Logo Aziendale">
            <img src="Risorse/Images/kaizen.png" alt="Logo Kaizen" id="logo">
        </div>
        <div class="form-container">
            <h2>KAIZEN - PROPOSTA DI MIGLIORAMENTO</h2>
<?php if ($pronto): ?>
            <form name="insertkaizen" action="Pagine/insert_kaizen.php" method="post">
                <div class="form-group">
                    <label for="matricola">Nome proponente</label>
                    <select id="matricola" name="matricola" required>
                        <option value="" disabled selected></option>
                        <?= opzioni_personale($persone) ?>
                    </select>
                </div>
                <div class="form-group">
                    <label for="titolo">Titolo proposta</label>
                    <input type="text" id="titolo" name="titolo" maxlength="100" required>
                </div>
                <div class="form-group">
                    <label for="descrizione">Descrizione proposta di miglioramento (max 1000 caratteri)</label>
                    <textarea id="descrizione" name="descrizione" maxlength="1000" rows="5" required></textarea>
                </div>
                <div class="form-group">
                    <label for="categoria">Categoria</label>
                    <select id="categoria" name="categoria" required>
                        <option value="" disabled selected></option>
<?php foreach ($categorie as $c): ?>
                        <option value="<?= h(trim((string) $c['ID_CATEGORIA'])) ?>"><?= h($c['CATEGORIA']) ?></option>
<?php endforeach; ?>
                    </select>
                </div>
                <div class="form-group">
                    <label for="benefici">Benefici Attesi</label>
                    <select id="benefici" name="benefici" required>
                        <option value="" disabled selected></option>
<?php foreach ($benefici as $b): ?>
                        <option value="<?= h(trim((string) $b['ID_BENEFICI'])) ?>"><?= h($b['BENEFICI']) ?></option>
<?php endforeach; ?>
                    </select>
                </div>
                <div id="submit-container">
                    <button type="submit">INVIA ✔</button>
                </div>
            </form>
<?php else: ?>
            <p class="errore">Servizio momentaneamente non disponibile. Riprova più tardi.</p>
<?php endif; ?>
        </div>
        <div class="back-button-container">
            <a href="../index.php"><button type="button">◄ INDIETRO</button></a>
        </div>
    </div>
</body>
</html>
