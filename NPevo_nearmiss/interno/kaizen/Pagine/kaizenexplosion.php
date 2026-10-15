<?php

declare(strict_types=1);

require __DIR__ . '/../../../lib/db.php';
require __DIR__ . '/../../../lib/auth.php';
require __DIR__ . '/../../../lib/stati.php';

richiedi_accesso('../../../login.php');

$id = id_da($_GET);
$k = $id === null ? null : db_riga(
    'SELECT K.ID, K.TITOLO, K.DATA, K.STATO, K.DESCRIZIONE, P.NOME, P.COGNOME, C.CATEGORIA, B.BENEFICI
     FROM ' . tabella('KAIZEN') . ' AS K
     OUTER APPLY (SELECT TOP 1 NOME, COGNOME FROM dbo.PERSONALENP_ALL WHERE MATRICOLA = K.MATRICOLA ORDER BY CASE WHEN FINERAPP IS NULL THEN 0 ELSE 1 END, FINERAPP DESC, COGNOME, NOME) AS P
     LEFT JOIN dbo.CATEGORIA_KAIZEN AS C ON K.CATEGORIA_ID = C.ID_CATEGORIA
     LEFT JOIN dbo.BENEFICI_KAIZEN AS B ON K.BENEFICI_ID = B.ID_BENEFICI
     WHERE K.ID = ?',
    [$id]
);
?>
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="../../../css/stile.css">
<title>Richieste Kaizen</title>
</head>
<body class="dettaglio">
<a href="kaizenlist.php"><div class="back-button">◄ INDIETRO</div></a>
<div class="header">
<h1>RICHIESTA KAIZEN</h1>
</div>
<div class="list-container">
<div class="elenco">
<?php if ($k === null): ?>
<p class="errore">Richiesta non trovata.</p>
<?php else: ?>
<div class="item da-incaricare">
<strong>ID</strong><br> K<?= h($k['ID']) ?>
<br><br>
<strong>Richiedente</strong><br><?= h(trim(($k['COGNOME'] ?? '') . ' ' . ($k['NOME'] ?? ''))) ?>
<br><br>
<strong>Data</strong><br><?= h(data_ora($k['DATA'])) ?>
<br><br>
<strong>Titolo</strong><br><?= h($k['TITOLO']) ?>
<br><br>
<strong>Descrizione</strong><br><?= h($k['DESCRIZIONE']) ?>
<br><br>
<strong>Categoria</strong><br><?= h($k['CATEGORIA']) ?>
<br><br>
<strong>Beneficio</strong><br><?= h($k['BENEFICI']) ?>
<br><br>
<br><br>
<form name="insertstatus" action="insert_status.php" method="post">
<div class="form-group">
<label for="stato"><strong>Stato</strong></label>
<select id="stato" name="stato" required>
<?= opzioni_stato((int) $k['STATO'], 'Accettata') ?>
</select>
</div>
<input type="hidden" name="id" value="<?= h($k['ID']) ?>">
<input type="hidden" name="csrf" value="<?= h(token_csrf()) ?>">
<div id="submit-container">
<button type="submit">AGGIORNA STATO</button>
</div>
</form>
</div>
<?php endif; ?>
</div>
</div>
</body>
</html>
