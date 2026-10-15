<?php

declare(strict_types=1);

require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/personale.php';

$persone = personale_in_forza();
$reparti = db_righe('SELECT REPARTO_ID, REPARTO FROM dbo.NEARMISS_REPARTI ORDER BY REPARTO');
$pronto = $persone !== null && $reparti !== null;
?>
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" href="../Images/favicon.png" type="image/png">
<link rel="stylesheet" href="../css/stile.css?v=<?= (int) @filemtime(__DIR__ . '/../css/stile.css') ?>">
<title>Near Miss - Modulo invio</title>
</head>
<body class="np modulo nearmiss">
    <header class="barra">
        <a class="pulsante barra-indietro" href="../index.php">Indietro</a>
        <div class="barra-modulo">
            <img class="icona" src="Risorse/Images/nearmiss.png" alt="">
            <h1 class="barra-titolo">Mancato incidente / infortunio <span class="barra-sigla">Near Miss</span></h1>
        </div>
        <img class="marchio" src="../Images/logo-bianco.png" alt="North Plastik">
    </header>
<?php if ($pronto): ?>
    <form class="foglio" name="insertnearmiss" action="insert_nearmiss.php" method="post" autocomplete="off">
        <div class="passi">
            <section class="passo">
                <h2 class="passo-titolo"><span class="passo-numero">1</span>Chi segnala</h2>
                <div class="campo cresce">
                    <label for="matricola">Nome e cognome</label>
                    <select id="matricola" name="matricola" required data-persona>
                        <option value="" disabled selected></option>
                        <?= opzioni_personale($persone) ?>
                    </select>
                </div>
            </section>
            <section class="passo">
                <h2 class="passo-titolo"><span class="passo-numero">2</span>Dove e quando</h2>
                <div class="campo">
                    <label for="reparto">Reparto</label>
                    <select id="reparto" name="reparto" required data-scelte>
                        <option value="" disabled selected></option>
<?php foreach ($reparti as $r): ?>
                        <option value="<?= h((int) $r['REPARTO_ID']) ?>"><?= h(trim((string) $r['REPARTO'])) ?></option>
<?php endforeach; ?>
                    </select>
                </div>
                <div class="campo">
                    <label for="data">Data dell'evento</label>
                    <input type="date" id="data" name="data" required data-calendario>
                </div>
            </section>
            <section class="passo">
                <h2 class="passo-titolo"><span class="passo-numero">3</span>Cosa è successo</h2>
                <div class="campo cresce">
                    <label for="event-description">Descrizione dell'evento</label>
                    <textarea id="event-description" name="descrizione" maxlength="1000" rows="6" required data-contatore placeholder="Cosa stavi facendo, cosa è successo, cosa poteva succedere"></textarea>
                </div>
            </section>
        </div>
        <footer class="azioni">
            <p class="azioni-nota">Tutti i campi sono obbligatori. Dopo l'invio ricevi un numero identificativo.</p>
            <button type="button" class="pulsante secondario tastiera-pulsante" data-tastiera-pulsante hidden>Tastiera</button>
            <button type="submit" class="pulsante invio" data-tastiera-invio>Invia segnalazione</button>
        </footer>
    </form>
<?php else: ?>
    <main class="foglio">
        <p class="avviso">Errore di connessione al database.</p>
    </main>
<?php endif; ?>
    <script src="../js/moduli.js?v=<?= (int) @filemtime(__DIR__ . '/../js/moduli.js') ?>"></script>
    <script src="../js/tastiera.js?v=<?= (int) @filemtime(__DIR__ . '/../js/tastiera.js') ?>"></script>
</body>
</html>
