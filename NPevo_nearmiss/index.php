<?php

declare(strict_types=1);

require __DIR__ . '/lib/auth.php';

header('Location: ' . (utente_collegato() ? 'interno/index.php' : 'login.php'));
exit;
