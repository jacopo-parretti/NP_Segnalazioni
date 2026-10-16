<?php

declare(strict_types=1);

require __DIR__ . '/../../../lib/db.php';
require __DIR__ . '/../../../lib/auth.php';
require __DIR__ . '/../../../lib/schema.php';

richiedi_accesso('../../../login.php');
intestazioni_protette();
$schema = schema_assicura();
?>
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="../../../css/stile.css?v=<?= (int) @filemtime(__DIR__ . '/../../../css/stile.css') ?>">
<title>Segnalazioni</title>
</head>
<body class="segnalazioni" data-csrf="<?= h(token_csrf()) ?>">
<header class="barra">
    <img class="marchio" src="../../../Images/logo-bianco.png" alt="North Plastik">
    <span class="barra-titolo">Gestione segnalazioni</span>
    <div class="destra"><a href="../../index.php" class="btn">Indietro</a></div>
</header>
<main class="pagina larga">
<div class="testa"><h1>Segnalazioni</h1></div>

<?php if ($schema['stato'] === 'irraggiungibile'): ?>
<div class="stato errore">Il database non risponde: le segnalazioni non si possono aprire adesso. Riprova più tardi.</div>
</main>
<?php elseif ($schema['stato'] !== 'ok'): ?>
<div class="stato errore">Le tabelle delle segnalazioni cifrate non esistono e non è stato possibile crearle. Fai lanciare questo SQL su CED_DB e ricarica la pagina:</div>
<pre class="sql"><?= h($schema['sql']) ?></pre>
</main>
<?php else: ?>
<div id="stato" class="stato">Apertura delle segnalazioni in corso…</div>

<div id="pannelloImpronta" class="pannello hidden">
    <h2>Impronta da copiare nel config di NPmonitor</h2>
    <p>Il modulo Segnalazioni di NPmonitor si attiva solo se in <code>NPmonitor/config.php</code> la voce <code>impronta_chiave_gestore</code> contiene esattamente questa impronta:</p>
    <div id="impronta" class="emergenza"></div>
    <p>Sul PC con il repo: <code>node tools/genera-config.js --impronta <span id="improntaComando"></span></code>, poi copiare <code>NPmonitor</code> su srv-web.</p>
</div>

<div id="impostazione" class="pannello hidden">
    <h2>Impostazione della chiave delle segnalazioni</h2>
    <p>Le segnalazioni saranno leggibili solo da qui, con la password di questo utente. Insieme alla chiave viene creata una chiave di emergenza: è l'unico modo per rileggere le segnalazioni se la password si perde o cambia.</p>
    <button type="button" id="genera" class="btn principale">Genera la chiave</button>
    <div id="passoEmergenza" class="hidden">
        <p><strong>Chiave di emergenza.</strong> Stampala e conservala in un luogo chiuso. Non verrà mostrata di nuovo.</p>
        <div id="emergenza" class="emergenza"></div>
        <p><button type="button" id="stampa" class="btn">Stampa</button></p>
        <p><label for="conferma">Per confermare di averla stampata, scrivi l'ultimo gruppo di 4 caratteri:</label></p>
        <p><input type="text" id="conferma" maxlength="4" autocomplete="off"></p>
        <p><button type="button" id="attiva" class="btn principale">Conferma e attiva</button></p>
    </div>
</div>

<div id="lista" class="wrap hidden">
    <div class="actions">
        <button type="button" id="esporta" class="btn">Esporta Excel</button>
    </div>
    <div class="table-scroll">
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Inserita il</th>
                    <th>Tipologia</th>
                    <th>Luogo</th>
                    <th>Data evento</th>
                    <th>Ora</th>
                    <th>Descrizione</th>
                    <th>Coinvolgimento</th>
                    <th>Prove</th>
                    <th>Già segnalato</th>
                    <th>Matricola</th>
                    <th>Contromisure applicate</th>
                    <th>Costi implementazione</th>
                </tr>
            </thead>
            <tbody id="righe"></tbody>
        </table>
    </div>
    <p id="improntaLista" class="nota"></p>
</div>
</main>

<div class="stampa">
    <h1>NP Segnalazioni - chiave di emergenza</h1>
    <p>Apre le segnalazioni cifrate se la password del gestore si perde o cambia. Conservare in luogo chiuso.</p>
    <div id="emergenzaStampa" class="emergenza"></div>
    <p id="dataStampa"></p>
</div>

<script src="../../../js/vendor/nacl-fast.js?v=<?= (int) @filemtime(__DIR__ . '/../../../js/vendor/nacl-fast.js') ?>"></script>
<script src="../../../js/vendor/scrypt.js?v=<?= (int) @filemtime(__DIR__ . '/../../../js/vendor/scrypt.js') ?>"></script>
<script src="../../../js/cifra.js?v=<?= (int) @filemtime(__DIR__ . '/../../../js/cifra.js') ?>"></script>
<script src="../../../js/xlsx.js?v=<?= (int) @filemtime(__DIR__ . '/../../../js/xlsx.js') ?>"></script>
<script src="../../../js/campi.js?v=<?= (int) @filemtime(__DIR__ . '/../../../js/campi.js') ?>"></script>
<script src="../../../js/segnalazioni.js?v=<?= (int) @filemtime(__DIR__ . '/../../../js/segnalazioni.js') ?>"></script>
<?php endif; ?>
</body>
</html>
