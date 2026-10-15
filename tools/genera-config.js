'use strict';

const fs = require('node:fs');
const path = require('node:path');

const radice = path.join(__dirname, '..');
const argomenti = process.argv.slice(2);
const soloProva = argomenti.includes('--solo-prova');
const posImpronta = argomenti.indexOf('--impronta');
const improntaNuova = posImpronta >= 0 ? argomenti[posImpronta + 1] : null;
const legacy = argomenti.find((a, i) => !a.startsWith('--') && (posImpronta < 0 || i !== posImpronta + 1)) || path.join(radice, '..');

const FILE_NPMONITOR = path.join(radice, 'NPmonitor', 'config.php');
const FILE_NPEVO = path.join(radice, 'NPevo_nearmiss', 'config.php');
const FILE_PROVA = path.join(radice, 'prova', 'config.php');
const REGOLA_IMPRONTA = /'impronta_chiave_gestore' => '([0-9A-F-]*)'/;

function estrai(file, regola, nome) {
    const m = fs.readFileSync(file, 'utf8').match(regola);
    if (!m) {
        throw new Error(nome + ' non trovato in ' + file);
    }
    return m[1];
}

function php(s) {
    return '\'' + String(s).replace(/\\/g, '\\\\').replace(/'/g, '\\\'') + '\'';
}

function normalizza(impronta) {
    const hex = String(impronta || '').toUpperCase().replace(/[^0-9A-F]/g, '');
    if (hex.length !== 32) {
        throw new Error('Impronta non valida: servono 32 caratteri esadecimali (8 gruppi da 4)');
    }
    return hex.match(/.{4}/g).join('-');
}

function improntaEsistente(file) {
    if (!fs.existsSync(file)) {
        return '';
    }
    const m = fs.readFileSync(file, 'utf8').match(REGOLA_IMPRONTA);
    return m ? m[1] : '';
}

function config(password, tabelle, url, impronta) {
    const righe = [
        '<?php',
        '',
        'return [',
        '    \'db\' => [',
        '        \'server\' => \'SRV-DB,1433\',',
        '        \'database\' => \'CED_DB\',',
        '        \'utente\' => \'ced_db\',',
        '        \'password\' => ' + php(password) + ',',
        '    ],',
        '    \'tabelle\' => ['
    ];
    for (const nome of ['SEGNALAZIONI', 'SEGNALAZIONI_CHIAVI', 'KAIZEN', 'NEARMISS']) {
        righe.push('        \'' + nome + '\' => ' + php(nome + tabelle) + ',');
    }
    righe.push(
        '    ],',
        '    \'impronta_chiave_gestore\' => ' + php(impronta) + ',',
        '    \'power_automate\' => [',
        '        \'attivo\' => ' + (url ? 'true' : 'false') + ',',
        '        \'url\' => ' + php(url || '') + ',',
        '    ],',
        '];',
        ''
    );
    return righe.join('\n');
}

if (improntaNuova !== null) {
    const file = soloProva ? FILE_PROVA : FILE_NPMONITOR;
    if (!fs.existsSync(file)) {
        throw new Error(path.relative(radice, file) + ' non esiste: generalo prima senza --impronta');
    }
    const testo = fs.readFileSync(file, 'utf8');
    if (!REGOLA_IMPRONTA.test(testo)) {
        throw new Error(path.relative(radice, file) + ' non ha la voce impronta_chiave_gestore: rigeneralo');
    }
    fs.writeFileSync(file, testo.replace(REGOLA_IMPRONTA, '\'impronta_chiave_gestore\' => \'' + normalizza(improntaNuova) + '\''), { encoding: 'utf8' });
    console.log('impronta scritta in ' + path.relative(radice, file));
    process.exit(0);
}

const password = estrai(path.join(legacy, 'NPevo_nearmiss', 'confirm.php'), /"PWD"\s*=>\s*"([^"]+)"/, 'Password del database');
const url = estrai(path.join(legacy, 'NPmonitor', 'nearmiss', 'insert_nearmiss.php'), /\$endpoint\s*=\s*"([^"]+)"/, 'URL di Power Automate');

const destinazioni = [
    [FILE_PROVA, config(password, '_PROVA', '', improntaEsistente(FILE_PROVA))]
];
if (!soloProva) {
    destinazioni.push(
        [FILE_NPMONITOR, config(password, '', url, improntaEsistente(FILE_NPMONITOR))],
        [FILE_NPEVO, config(password, '', '', '')]
    );
}
for (const [file, contenuto] of destinazioni) {
    fs.writeFileSync(file, contenuto, { encoding: 'utf8' });
    console.log('scritto ' + path.relative(radice, file));
}
