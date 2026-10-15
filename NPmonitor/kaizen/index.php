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
<link rel="stylesheet" href="../css/stile.css?v=<?= (int) @filemtime(__DIR__ . '/../css/stile.css') ?>">
<title>KAIZEN - Modulo invio</title>
</head>
<body class="np modulo kaizen">
    <header class="barra">
        <a class="pulsante barra-indietro" href="../index.php">Indietro</a>
        <div class="barra-modulo">
            <img class="icona" src="Risorse/Images/kaizen.png" alt="">
            <h1 class="barra-titolo">Proposta di miglioramento <span class="barra-sigla">Kaizen</span></h1>
        </div>
        <img class="marchio" src="../Images/logo-bianco.png" alt="North Plastik">
    </header>
<?php if ($pronto): ?>
    <form class="foglio" name="insertkaizen" action="Pagine/insert_kaizen.php" method="post" autocomplete="off">
        <div class="passi">
            <section class="passo">
                <h2 class="passo-titolo"><span class="passo-numero">1</span>Chi propone</h2>
                <div class="campo cresce">
                    <label for="matricola">Proponente</label>
                    <select id="matricola" name="matricola" required data-persona>
                        <option value="" disabled selected></option>
                        <?= opzioni_personale($persone) ?>
                    </select>
                </div>
            </section>
            <section class="passo">
                <h2 class="passo-titolo"><span class="passo-numero">2</span>La proposta</h2>
                <div class="campo">
                    <label for="titolo">Titolo</label>
                    <input type="text" id="titolo" name="titolo" maxlength="100" required data-contatore>
                </div>
                <div class="campo cresce">
                    <label for="descrizione">Descrizione</label>
                    <textarea id="descrizione" name="descrizione" maxlength="1000" rows="5" required data-contatore placeholder="Cosa cambieresti, dove, e perché"></textarea>
                </div>
            </section>
            <section class="passo">
                <h2 class="passo-titolo"><span class="passo-numero">3</span>Classificazione</h2>
                <div class="campo">
                    <label for="categoria">Categoria</label>
                    <select id="categoria" name="categoria" required data-scelte>
                        <option value="" disabled selected></option>
<?php foreach ($categorie as $c): ?>
                        <option value="<?= h(trim((string) $c['ID_CATEGORIA'])) ?>"><?= h(trim((string) $c['CATEGORIA'])) ?></option>
<?php endforeach; ?>
                    </select>
                </div>
                <div class="campo">
                    <label for="benefici">Benefici attesi</label>
                    <select id="benefici" name="benefici" required data-scelte>
                        <option value="" disabled selected></option>
<?php foreach ($benefici as $b): ?>
                        <option value="<?= h(trim((string) $b['ID_BENEFICI'])) ?>"><?= h(trim((string) $b['BENEFICI'])) ?></option>
<?php endforeach; ?>
                    </select>
                </div>
            </section>
        </div>
        <footer class="azioni">
            <p class="azioni-nota">Tutti i campi sono obbligatori. Dopo l'invio ricevi un numero identificativo.</p>
            <button type="button" class="pulsante secondario tastiera-pulsante" data-tastiera-pulsante hidden>Tastiera</button>
            <button type="submit" class="pulsante invio" data-tastiera-invio>Invia proposta</button>
        </footer>
    </form>
<?php else: ?>
    <main class="foglio">
        <p class="avviso">Servizio momentaneamente non disponibile. Riprova più tardi.</p>
    </main>
<?php endif; ?>
    <script src="../js/moduli.js?v=<?= (int) @filemtime(__DIR__ . '/../js/moduli.js') ?>"></script>
    <script src="../js/tastiera.js?v=<?= (int) @filemtime(__DIR__ . '/../js/tastiera.js') ?>"></script>
</body>
</html>
