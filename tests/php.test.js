'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const C = require(path.join(__dirname, '..', 'NPmonitor', 'js', 'cifra.js'));
const V = require(path.join(__dirname, '..', 'NPevo_nearmiss', 'js', 'segnalazioni.js'));
const X = require(path.join(__dirname, '..', 'NPevo_nearmiss', 'js', 'xlsx.js'));

const PHP = process.env.PHP_BIN || path.join(process.env.LOCALAPPDATA || '', 'php82', 'php.exe');
const BANCO = path.join(__dirname, 'php', 'banco.php');

function php(comando, ingresso) {
    assert.ok(fs.existsSync(PHP), 'PHP 8.2 non trovato in ' + PHP + ' (lancia prova\\prova.cmd o imposta PHP_BIN)');
    const r = spawnSync(PHP, [BANCO, comando], {
        input: JSON.stringify(ingresso === undefined ? null : ingresso),
        encoding: 'utf8',
        env: Object.assign({}, process.env, { NPSEG_CONFIG: path.join(__dirname, 'fixtures', 'config.test.php') })
    });
    assert.equal(r.status, 0, r.stderr + r.stdout);
    return r.stdout;
}

function gestore() {
    return C.generaChiaveGestore(new Uint8Array(32).fill(3));
}

test('T5: insert_segnalazioni accetta solo cifrato + versione e rifiuta qualunque campo in chiaro', () => {
    const g = gestore();
    const buono = C.campiInvio({ descrizione: 'prova' }, g.pubblica);
    const esiti = JSON.parse(php('segnalazione_da_post', [
        buono,
        Object.assign({ descrizione: 'in chiaro' }, buono),
        Object.assign({ matricola: '1234' }, buono),
        { cifrato: buono.cifrato },
        { cifrato: buono.cifrato, versione: '2' },
        { tipologia: 'x', descrizione: 'y', luogo: 'z', data: '2026-10-01', prove: 'SI', gia_segnalato: 'NO', fornire_dati: 'NO' },
        { cifrato: Buffer.from('testo in chiaro travestito').toString('base64'), versione: '1' },
        { cifrato: buono.cifrato + '!', versione: '1' },
        { cifrato: ['a'], versione: '1' }
    ]));
    assert.equal(esiti[0], buono.cifrato);
    assert.deepEqual(esiti.slice(1), [null, null, null, null, null, null, null, null]);
});

test('T2/N2: il JSON per Power Automate ha le stesse chiavi e formati di oggi', () => {
    const atteso = fs.readFileSync(path.join(__dirname, 'fixtures', 'payload_nearmiss.json'), 'utf8').trim();
    const ottenuto = php('nearmiss_payload', {
        id: 55,
        nominativo: 'Mario Rossi',
        data: '2025-10-31',
        reparto: 'Stampaggio          ',
        descrizione: 'Carrello all\'uscita del magazzino: "quasi" investito, è successo alle 7/8'
    });
    assert.equal(ottenuto, atteso);
    assert.deepEqual(Object.keys(JSON.parse(ottenuto)), ['ID_NM', 'MATRICOLA', 'DATA_AVVENIMENTO', 'REPARTO', 'DESC_EV']);
});

test('S8/D4: la normalizzazione delle righe storiche non perde nulla', () => {
    const r = JSON.parse(php('riga_segnalazione', {
        ID: 7,
        DATA_INSERIMENTO: '2025-10-23 08:12:44.123',
        TIPOLOGIA: 'Tutela dell’ambiente',
        LUOGO: 'Àà',
        DATA_EVENTO: '2025-10-20 00:00:00',
        ORA_EVENTO: '1900-01-01 09:15:30.25',
        DESCRIZIONE: 'l\'operatore "x" è caduto',
        COINVOLGIMENTO: 'Sono testimone',
        PROVE: 1,
        SEGNALATO: 0,
        MATRICOLA: 1234,
        CIFRATO: null,
        VERSIONE_CIFRATURA: null
    }));
    assert.deepEqual(r, {
        id: 7,
        data_inserimento: '2025-10-23',
        cifrato: null,
        versione: null,
        contromisure_cifrato: null,
        costi_cifrato: null,
        chiaro: {
            tipologia: 'Tutela dell’ambiente',
            descrizione: 'l\'operatore "x" è caduto',
            luogo: 'Àà',
            data_evento: '2025-10-20',
            ora_evento: '09:15:30.250000',
            coinvolgimento: 'Sono testimone',
            prove: 'SI',
            segnalato: 'NO',
            matricola: '1234',
            data_inserimento: '2025-10-23 08:12:44.123000'
        }
    });
    const nuova = JSON.parse(php('riga_segnalazione', {
        ID: 8, DATA_INSERIMENTO: '2026-10-15 00:00:00', TIPOLOGIA: null, LUOGO: null, DATA_EVENTO: null, ORA_EVENTO: null,
        DESCRIZIONE: null, COINVOLGIMENTO: null, PROVE: null, SEGNALATO: null, MATRICOLA: null, CIFRATO: 'abc', VERSIONE_CIFRATURA: 1
    }));
    assert.equal(nuova.chiaro, null);
    assert.equal(nuova.versione, 1);
    const conOra = JSON.parse(php('riga_segnalazione', {
        ID: 9, DATA_INSERIMENTO: '2026-01-01 10:00:00', TIPOLOGIA: 'x', LUOGO: null, DATA_EVENTO: '2026-01-01 10:30:00', ORA_EVENTO: '1900-01-01 10:30:00',
        DESCRIZIONE: null, COINVOLGIMENTO: null, PROVE: null, SEGNALATO: null, MATRICOLA: null, CIFRATO: null, VERSIONE_CIFRATURA: null
    }));
    assert.equal(conOra.chiaro.data_evento, '2026-01-01 10:30:00');
    assert.equal(conOra.chiaro.ora_evento, '10:30');
    assert.equal(conOra.chiaro.prove, null);
});

test('G1/D2: md5 calcolato nel browser uguale a md5(stripslashes()) del vecchio confirm.php', () => {
    const password = ['Password-Lunga-2026', 'Pàssword con àccenti €', 'con\\barra\\\\doppia e \\0 zero\\', 'apice\'e"virgolette'];
    assert.deepEqual(JSON.parse(php('md5', password)), password.map((p) => C.accessoDaPassword(p)));
});

test('P3/T8: schema e nomi delle tabelle scritte vengono da config.php', () => {
    const s = JSON.parse(php('schema'));
    assert.equal(s.tabella, 'dbo.[KAIZEN_PROVA]');
    assert.equal(s.istruzioni.length, 9);
    assert.ok(s.istruzioni.every((i) => i.includes('_PROVA')));
    assert.ok(s.istruzioni[8].includes('SEGNALAZIONI_CHIAVI_PROVA'));
    for (const [tabella, colonna] of [['KAIZEN_PROVA', 'AVANZAMENTO'], ['KAIZEN_PROVA', 'COSTI_IMPLEMENTAZIONE'], ['NEARMISS_PROVA', 'CONTROMISURE_APPLICATE'], ['NEARMISS_PROVA', 'COSTI_IMPLEMENTAZIONE'], ['SEGNALAZIONI_PROVA', 'CONTROMISURE_CIFRATO'], ['SEGNALAZIONI_PROVA', 'COSTI_CIFRATO']]) {
        assert.ok(s.istruzioni.some((i) => i.includes('[' + tabella + '] ADD ' + colonna + ' ')), tabella + '.' + colonna);
    }
    assert.ok(!s.istruzioni.join(' ').match(/\b(DROP|DELETE|TRUNCATE)\b/i));
    assert.deepEqual(JSON.parse(php('nome_tabella_cattivo')), { eccezione: true });
});

test('P3: DB irraggiungibile si distingue da tabelle mancanti e non mostra SQL', () => {
    assert.deepEqual(JSON.parse(php('schema_stato')), { stato: 'irraggiungibile', sql: '' });
});

test('impronta: il PHP calcola la stessa del browser e attiva il modulo solo con l\'impronta giusta', () => {
    const g = gestore();
    const altro = C.generaChiaveGestore(new Uint8Array(32).fill(4));
    const giusta = C.impronta(g.pubblica);
    assert.match(giusta, /^([0-9A-F]{4}-){7}[0-9A-F]{4}$/);
    const casi = [
        [g.pubblica, giusta, g.pubblica],
        [g.pubblica, giusta.toLowerCase().replace(/-/g, ' '), g.pubblica],
        [altro.pubblica, giusta, null],
        [g.pubblica, '', null],
        [g.pubblica, 'ABCD', null],
        ['non base64', giusta, null]
    ];
    for (const [pubblica, attesa, risultato] of casi) {
        const r = JSON.parse(php('impronta', { pubblica, attesa }));
        assert.equal(r.ammessa, risultato, attesa);
        if (pubblica === g.pubblica) {
            assert.equal(r.impronta, giusta);
        }
    }
});

test('migrazione lato server: il cifrato si riscrive solo con chiaro presente, lo svuotamento non tocca DATA_INSERIMENTO', () => {
    const condizione = JSON.parse(php('impronta', { pubblica: gestore().pubblica, attesa: '' })).condizione;
    for (const campo of ['TIPOLOGIA', 'LUOGO', 'DATA_EVENTO', 'ORA_EVENTO', 'DESCRIZIONE', 'COINVOLGIMENTO', 'PROVE', 'SEGNALATO', 'MATRICOLA']) {
        assert.ok(condizione.includes(campo + ' IS NOT NULL'), campo);
    }
    assert.ok(!condizione.includes('DATA_INSERIMENTO'));
    const pagine = path.join(__dirname, '..', 'NPevo_nearmiss', 'interno', 'segnalazioni', 'Pagine');
    const salva = fs.readFileSync(path.join(pagine, 'api_salva_cifrato.php'), 'utf8');
    assert.match(salva, /WHERE ID = \? AND CIFRATO = \? AND ' \. condizione_in_chiaro\(\)/);
    assert.match(salva, /WHERE ID = \? AND CIFRATO IS NULL/);
    const svuota = fs.readFileSync(path.join(pagine, 'api_svuota_chiaro.php'), 'utf8');
    assert.ok(!svuota.includes('DATA_INSERIMENTO'));
    assert.match(svuota, /WHERE ID = \? AND VERSIONE_CIFRATURA = 1 AND LEFT\(CONVERT\(varchar\(128\), HASHBYTES\(\\'SHA2_512\\', CIFRATO\), 2\), 64\) = \?/);
});

function dbProva(comando) {
    const r = spawnSync(PHP, [path.join(__dirname, '..', 'prova', 'db_prova.php'), comando], {
        encoding: 'utf8',
        env: Object.assign({}, process.env, { NPSEG_CONFIG: path.join(__dirname, 'fixtures', 'config.test.php') })
    });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout;
}

test('banco di prova: segnalazioni finte che coprono il modulo, nessuna copiata dalla tabella vera', () => {
    const { colonne, righe } = JSON.parse(dbProva('righe'));
    const campo = (r, nome) => r[colonne.indexOf(nome)];
    const modulo = fs.readFileSync(path.join(__dirname, '..', 'NPmonitor', 'segnalazioni', 'index.php'), 'utf8');
    const tipologie = [...modulo.matchAll(/<option>([^<]+)<\/option>/g)].map((m) => m[1]);
    const coinvolgimenti = [...modulo.matchAll(/name="coinvolgimento" value="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(tipologie.length, 3);
    assert.equal(coinvolgimenti.length, 6);
    assert.ok(righe.length >= 6 && righe.length <= 8);
    assert.deepEqual([...new Set(righe.map((r) => campo(r, 'TIPOLOGIA')).filter(Boolean))].sort(), [...tipologie].sort());
    assert.deepEqual([...new Set(righe.map((r) => campo(r, 'COINVOLGIMENTO')))].sort(), [...coinvolgimenti].sort());
    for (const r of righe) {
        assert.ok(campo(r, 'DESCRIZIONE').startsWith('PROVA - '));
        assert.ok(campo(r, 'LUOGO').startsWith('PROVA - '));
        assert.ok(campo(r, 'MATRICOLA') === null || campo(r, 'MATRICOLA') >= 999000);
        assert.ok([...campo(r, 'DESCRIZIONE')].length <= 1000);
    }
    const testi = righe.map((r) => campo(r, 'DESCRIZIONE')).join(' ');
    for (const c of ['€', '\'', '"', 'à', 'è', '’', '“']) {
        assert.ok(testi.includes(c), c);
    }
    const cp1252 = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
    for (const ch of testi + righe.map((r) => (campo(r, 'TIPOLOGIA') || '') + campo(r, 'LUOGO') + campo(r, 'COINVOLGIMENTO')).join('')) {
        const n = ch.codePointAt(0);
        assert.ok((n < 0x80 || (n >= 0xa0 && n <= 0xff) || cp1252.includes(ch)), 'carattere non Latin1/cp1252: ' + ch);
    }
    assert.ok(righe.some((r) => [...campo(r, 'DESCRIZIONE')].length >= 950));
    assert.ok(righe.some((r) => campo(r, 'ORA_EVENTO') === null) && righe.some((r) => campo(r, 'ORA_EVENTO') !== null));
    for (const c of ['PROVE', 'SEGNALATO']) {
        assert.ok(righe.some((r) => campo(r, c) === 1) && righe.some((r) => campo(r, c) === 0), c);
    }
    assert.ok(righe.some((r) => campo(r, 'MATRICOLA') === null) && righe.some((r) => campo(r, 'MATRICOLA') !== null));
    assert.equal(new Set(righe.map((r) => campo(r, 'DATA_INSERIMENTO').slice(11, 13))).size, righe.length);
    const sql = dbProva('sql');
    assert.match(sql, /^SELECT TOP 0 \* INTO dbo\.\[SEGNALAZIONI_PROVA\] FROM dbo\.\[SEGNALAZIONI\];/);
    assert.ok(!/SELECT \* INTO dbo\.\[SEGNALAZIONI_PROVA\]/.test(sql));
    assert.match(sql, /SELECT \* INTO dbo\.\[KAIZEN_PROVA\] FROM dbo\.\[KAIZEN\];/);
    assert.match(sql, /SELECT \* INTO dbo\.\[NEARMISS_PROVA\] FROM dbo\.\[NEARMISS\];/);
    assert.equal((sql.match(/INSERT INTO dbo\.\[SEGNALAZIONI_PROVA\]/g) || []).length, righe.length);
    assert.ok(!/\b(DELETE|DROP|TRUNCATE|UPDATE)\b/i.test(sql));
    assert.ok(!/dbo\.\[?(SEGNALAZIONI|KAIZEN|NEARMISS|USERS)\]? \(/.test(sql));
});

test('formati accettati dal server per chiave, sale, parametri, stati e testi', () => {
    const g = gestore();
    const v = JSON.parse(php('validatori', {
        pubblica: g.pubblica,
        privata_password: g.privataDaPassword,
        privata_emergenza: g.privataDaEmergenza,
        sale: C.nuovoSale(),
        parametri: C.testoParametri()
    }));
    assert.deepEqual(v, {
        pubblica: true,
        privata_password: true,
        privata_emergenza: true,
        sale: true,
        parametri: true,
        stato_5: null,
        testo_1001: null,
        testo_1000: true,
        intero: [12, null, null, 3]
    });
});

test('S7: export Excel con intestazione blu, bordi neri, colonne di oggi e ID come S<ID>', () => {
    const g = gestore();
    const nuova = { id: 15, data_inserimento: '2026-10-15', cifrato: C.cifraSegnalazione({ tipologia: 'T', descrizione: '<b>x</b> & "y"', luogo: 'L', data_evento: '2026-10-14', ora_evento: '08:05', coinvolgimento: 'C', prove: 'SI', segnalato: 'NO', matricola: null }, g.pubblica), chiaro: null };
    const storica = { id: 3, data_inserimento: '2025-10-23', cifrato: null, chiaro: { tipologia: null, descrizione: 'd', luogo: null, data_evento: null, ora_evento: null, coinvolgimento: null, prove: null, segnalato: 'SI', matricola: '1234', data_inserimento: '2025-10-23 08:12:44.123000' } };
    const tabella = [nuova, storica].map((r) => V.colonne(r, V.recordDi(r, g.segreta)));
    assert.deepEqual(tabella[0], ['S15', '15/10/2026', 'T', 'L', '14/10/2026', '08:05', '<b>x</b> & "y"', 'C', 'SI', 'NO', '', '', '']);
    assert.deepEqual(tabella[1], ['S3', '23/10/2025 08:12:44', '', '', '', '', 'd', '', 'NO', 'SI', '1234', '', '']);
    const file = apriZip(V.xlsx(tabella));
    assert.deepEqual(Object.keys(file).sort(), ['[Content_Types].xml', '_rels/.rels', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/workbook.xml', 'xl/worksheets/sheet1.xml']);
    const foglio = file['xl/worksheets/sheet1.xml'];
    assert.equal((foglio.match(/<row r="1">.*?<\/row>/)[0].match(/s="1"/g) || []).length, 13);
    assert.ok(foglio.includes('<t xml:space="preserve">S15</t>'));
    assert.ok(foglio.includes('&lt;b&gt;x&lt;/b&gt; &amp; &quot;y&quot;'));
    assert.ok(!foglio.includes('<b>x</b>'));
    assert.ok(foglio.includes('<autoFilter ref="A1:M3"/>'));
    assert.ok(file['xl/styles.xml'].includes('FF2E3E6A'));
    assert.ok(file['xl/workbook.xml'].includes('name="Segnalazioni"'));
    assert.match(X.nomeFile('segnalazioni', new Date(2026, 9, 15, 9, 5, 7)), /^segnalazioni_20261015_090507\.xlsx$/);
});

function apriZip(u8) {
    const v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    const file = {};
    let i = 0;
    while (v.getUint32(i, true) === 0x04034b50) {
        assert.equal(v.getUint16(8, true), 0);
        const crc = v.getUint32(i + 14, true);
        const n = v.getUint32(i + 18, true);
        const lNome = v.getUint16(i + 26, true);
        const lExtra = v.getUint16(i + 28, true);
        const nome = Buffer.from(u8.subarray(i + 30, i + 30 + lNome)).toString('utf8');
        const dati = u8.subarray(i + 30 + lNome + lExtra, i + 30 + lNome + lExtra + n);
        assert.equal(X.crc32(dati), crc);
        file[nome] = Buffer.from(dati).toString('utf8');
        i += 30 + lNome + lExtra + n;
    }
    assert.equal(v.getUint32(i, true), 0x02014b50);
    return file;
}

test('xlsx: CRC32 standard, colonne oltre la Z, caratteri non validi in XML tolti', () => {
    assert.equal(X.crc32(new TextEncoder().encode('123456789')), 0xCBF43926);
    assert.equal(X.colonna(0), 'A');
    assert.equal(X.colonna(25), 'Z');
    assert.equal(X.colonna(26), 'AA');
    const file = apriZip(X.creaXlsx(['a'], [['x\u0001y\nz']], 'Prova'));
    assert.ok(file['xl/worksheets/sheet1.xml'].includes('<t xml:space="preserve">xy\nz</t>'));
});

test('campi di gestione delle segnalazioni: cifrati per il gestore, decifrati in lista ed export', () => {
    const g = gestore();
    const altro = C.generaChiaveGestore(new Uint8Array(32).fill(6));
    const riga = { id: 4, data_inserimento: '2026-10-15', cifrato: null, chiaro: { descrizione: 'd' }, contromisure_cifrato: C.cifraSegnalazione({ testo: 'Formazione è fatta' }, g.pubblica), costi_cifrato: C.cifraSegnalazione({ testo: '1.200 €' }, altro.pubblica) };
    const gestione = V.gestioneDi(riga, g.segreta);
    assert.deepEqual(gestione, ['Formazione è fatta', null]);
    const colonne = V.colonne(riga, V.recordDi(riga, g.segreta), gestione);
    assert.equal(colonne.length, 13);
    assert.deepEqual(colonne.slice(11), ['Formazione è fatta', '']);
    assert.deepEqual(V.gestioneDi({ id: 5 }, g.segreta), ['', '']);
});

test('campi modificabili: un salvataggio troppo grande per il proxy viene fermato prima di partire', () => {
    const Kc = require(path.join(__dirname, '..', 'NPevo_nearmiss', 'js', 'campi.js'));
    assert.equal(Kc.corpoTroppoGrande(new URLSearchParams({ csrf: 'a'.repeat(64), valore: 'è'.repeat(1000) }).toString()), false);
    assert.equal(Kc.corpoTroppoGrande(new URLSearchParams({ valore: '😀'.repeat(1000) }).toString()), true);
});