<?php

declare(strict_types=1);

$radice = dirname(__DIR__, 2);
require $radice . '/NPmonitor/lib/db.php';
require $radice . '/NPmonitor/lib/validazione.php';
require $radice . '/NPmonitor/lib/nearmiss.php';
require $radice . '/NPmonitor/lib/segnalazione.php';
require $radice . '/NPevo_nearmiss/lib/schema.php';
require $radice . '/NPevo_nearmiss/lib/storico.php';
require $radice . '/NPevo_nearmiss/lib/chiavi.php';
require $radice . '/NPevo_nearmiss/lib/stati.php';

$ingresso = json_decode((string) stream_get_contents(STDIN), true);
$comando = $argv[1] ?? '';

function data(string $s): DateTimeImmutable
{
    return new DateTimeImmutable($s);
}

switch ($comando) {
    case 'segnalazione_da_post':
        $esiti = [];
        foreach ($ingresso as $post) {
            $esiti[] = segnalazione_da_post($post);
        }
        echo json_encode($esiti);
        break;
    case 'nearmiss_payload':
        echo nearmiss_payload(
            $ingresso['id'],
            $ingresso['nominativo'],
            data($ingresso['data']),
            $ingresso['reparto'],
            $ingresso['descrizione']
        );
        break;
    case 'riga_segnalazione':
        $r = $ingresso;
        foreach (['DATA_INSERIMENTO', 'DATA_EVENTO', 'ORA_EVENTO'] as $campo) {
            if (is_string($r[$campo])) {
                $r[$campo] = data($r[$campo]);
            }
        }
        echo json_encode(riga_segnalazione($r), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        break;
    case 'md5':
        $out = [];
        foreach ($ingresso as $pw) {
            $out[] = md5(stripslashes($pw));
        }
        echo json_encode($out);
        break;
    case 'schema':
        echo json_encode(['istruzioni' => schema_istruzioni(), 'tabella' => tabella('KAIZEN')]);
        break;
    case 'validatori':
        echo json_encode([
            'pubblica' => pubblica_valida($ingresso['pubblica']),
            'privata_password' => privata_valida($ingresso['privata_password']),
            'privata_emergenza' => privata_valida($ingresso['privata_emergenza']),
            'sale' => sale_valido($ingresso['sale']),
            'parametri' => parametri_validi($ingresso['parametri']),
            'stato_5' => (function () {
                $_POST['stato'] = '5';
                return stato_da_post();
            })(),
            'testo_1001' => testo_valido(str_repeat('è', 1001), 1000),
            'testo_1000' => testo_valido(str_repeat('è', 1000), 1000) !== null,
            'intero' => [intero_positivo('12'), intero_positivo('1 OR 1=1'), intero_positivo('0'), intero_positivo('3  ')],
        ]);
        break;
    case 'impronta':
        echo json_encode([
            'impronta' => impronta_pubblica($ingresso['pubblica']),
            'ammessa' => pubblica_ammessa($ingresso['pubblica'], $ingresso['attesa']),
            'condizione' => condizione_in_chiaro(),
        ]);
        break;
    case 'schema_stato':
        echo json_encode(schema_assicura());
        break;
    case 'nome_tabella_cattivo':
        try {
            tabella('NON_CONFIGURATA');
            echo json_encode(['eccezione' => false]);
        } catch (RuntimeException $e) {
            echo json_encode(['eccezione' => true]);
        }
        break;
    default:
        fwrite(STDERR, 'comando sconosciuto');
        exit(2);
}
