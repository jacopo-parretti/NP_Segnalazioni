<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" href="Images/favicon.png" type="image/png">
<link rel="stylesheet" href="css/stile.css?v=<?= (int) @filemtime(__DIR__ . '/css/stile.css') ?>">
<title>Proposte e Segnalazioni</title>
</head>
<body class="np home">
    <header class="barra">
        <img class="marchio" src="Images/logo-bianco.png" alt="North Plastik">
        <span class="barra-titolo">Proposte e segnalazioni</span>
    </header>
    <main class="ingresso">
        <h1 class="ingresso-titolo">Seleziona il modulo da compilare</h1>
        <nav class="moduli" aria-label="Moduli">
            <a href="kaizen/index.php" class="modulo-voce">
                <span class="modulo-figura"><img src="Images/kaizen.png" alt=""></span>
                <span class="modulo-nome">Proposta di miglioramento<span class="modulo-sigla">Kaizen</span></span>
            </a>
            <a href="nearmiss/index.php" class="modulo-voce">
                <span class="modulo-figura"><img src="Images/nearmiss.png" alt=""></span>
                <span class="modulo-nome">Mancato incidente<span class="modulo-sigla">Infortunio</span></span>
            </a>
            <a href="segnalazioni/index.php" class="modulo-voce">
                <span class="modulo-figura"><img src="Images/segnalazioni.png" alt=""></span>
                <span class="modulo-nome">Segnalazioni</span>
            </a>
        </nav>
    </main>
    <script src="js/tastiera.js?v=<?= (int) @filemtime(__DIR__ . '/js/tastiera.js') ?>"></script>
</body>
</html>
