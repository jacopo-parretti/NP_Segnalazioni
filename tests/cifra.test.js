'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');

const C = require(path.join(__dirname, '..', 'NPmonitor', 'js', 'cifra.js'));

const VELOCI = '{"N":1024,"r":8,"p":1}';

function record(extra) {
    return Object.assign({
        tipologia: 'Diritti dei lavoratori, Sicurezza in ambiente di lavoro',
        descrizione: 'Il capoturno ha detto: "fate presto" e l\'operatore è caduto. Perché? àèìòù ç ß € “virgolette” — 😀',
        luogo: 'Reparto stampaggio, linea 3',
        data_evento: '2026-10-01',
        ora_evento: '14:30',
        coinvolgimento: 'Sono testimone',
        prove: 'SI',
        segnalato: 'NO',
        matricola: '1234'
    }, extra || {});
}

async function gestore(password) {
    const sale = C.nuovoSale();
    const chiave = await C.derivaChiave(password, sale, VELOCI);
    const g = C.generaChiaveGestore(chiave);
    return { sale, chiave, g };
}

test('i parametri scrypt di default sono quelli misurati (N=2^17, r=8, p=1)', () => {
    assert.equal(C.testoParametri(), '{"N":131072,"r":8,"p":1}');
    assert.deepEqual(C.leggiParametri(C.testoParametri()), { N: 131072, r: 8, p: 1 });
    assert.equal(C.leggiParametri('{"N":1000,"r":8,"p":1}'), null);
    assert.equal(C.leggiParametri('non json'), null);
});

test('la chiave derivata dipende da password e sale', async () => {
    const s1 = C.nuovoSale();
    const s2 = C.nuovoSale();
    const a = await C.derivaChiave('Password-Lunga-2026', s1, VELOCI);
    const b = await C.derivaChiave('Password-Lunga-2026', s1, VELOCI);
    const c = await C.derivaChiave('Password-Lunga-2026', s2, VELOCI);
    const d = await C.derivaChiave('Password-Lunga-2027', s1, VELOCI);
    assert.equal(a.length, 32);
    assert.deepEqual(a, b);
    assert.notDeepEqual(a, c);
    assert.notDeepEqual(a, d);
});

test('S2: andata e ritorno di una segnalazione', async () => {
    const { g } = await gestore('Password-Lunga-2026');
    const r = record();
    const cifrato = C.cifraSegnalazione(r, g.pubblica);
    assert.deepEqual(C.decifraSegnalazione(cifrato, g.segreta), r);
});

test('S2/P6: testo con accenti, apostrofi e virgolette resta identico', async () => {
    const { g } = await gestore('x');
    const r = record({ descrizione: 'l\'ha detto "lui"; c\'è \\ barra e <b>tag</b> & ;--', luogo: 'Àà Èè Ìì Òò Ùù' });
    assert.deepEqual(C.decifraSegnalazione(C.cifraSegnalazione(r, g.pubblica), g.segreta), r);
});

test('S6: password sbagliata rifiutata, password giusta apre la chiave privata', async () => {
    const { sale, g } = await gestore('Password-Lunga-2026');
    const giusta = await C.derivaChiave('Password-Lunga-2026', sale, VELOCI);
    const sbagliata = await C.derivaChiave('Password-Lunga-2025', sale, VELOCI);
    const aperta = C.apri(g.privataDaPassword, giusta);
    assert.ok(aperta);
    assert.ok(C.coppiaValida(aperta, g.pubblica));
    assert.equal(C.apri(g.privataDaPassword, sbagliata), null);
});

test('S6: chiave di emergenza giusta apre, sbagliata rifiutata', async () => {
    const { g } = await gestore('Password-Lunga-2026');
    assert.match(g.emergenza, /^([0-9A-F]{4}-){15}[0-9A-F]{4}$/);
    const giusta = C.emergenzaDaTesto(g.emergenza.toLowerCase().replace(/-/g, ' '));
    const aperta = C.apri(g.privataDaEmergenza, giusta);
    assert.ok(C.coppiaValida(aperta, g.pubblica));
    const sbagliata = C.emergenzaDaTesto(g.emergenza.replace(/^./, (c) => (c === 'A' ? 'B' : 'A')));
    assert.equal(C.apri(g.privataDaEmergenza, sbagliata), null);
    assert.equal(C.emergenzaDaTesto('1234'), null);
    assert.equal(C.ultimoGruppo(g.emergenza), g.emergenza.slice(-4));
});

test('S10: cambio password ricifra solo la chiave privata, le segnalazioni restano leggibili', async () => {
    const { g } = await gestore('Vecchia-Password-1');
    const cifrato = C.cifraSegnalazione(record(), g.pubblica);
    const sale2 = C.nuovoSale();
    const nuova = await C.derivaChiave('Nuova-Password-2', sale2, VELOCI);
    const daEmergenza = C.apri(g.privataDaEmergenza, C.emergenzaDaTesto(g.emergenza));
    const reincapsulata = C.incapsula(daEmergenza, nuova);
    const riaperta = C.apri(reincapsulata, await C.derivaChiave('Nuova-Password-2', sale2, VELOCI));
    assert.deepEqual(C.decifraSegnalazione(cifrato, riaperta), record());
    assert.equal(C.apri(reincapsulata, await C.derivaChiave('Vecchia-Password-1', sale2, VELOCI)), null);
});

test('una chiave privata diversa non decifra', async () => {
    const a = await gestore('a');
    const b = await gestore('b');
    const cifrato = C.cifraSegnalazione(record(), a.g.pubblica);
    assert.equal(C.decifraSegnalazione(cifrato, b.g.segreta), null);
});

test('P6: dimensione del cifrato indipendente dalla lunghezza entro 1 KB', async () => {
    const { g } = await gestore('x');
    const corto = C.cifraSegnalazione(record({ descrizione: 'a', luogo: 'b' }), g.pubblica);
    const lungo = C.cifraSegnalazione(record({ descrizione: 'x'.repeat(600), luogo: 'y'.repeat(150) }), g.pubblica);
    assert.equal(corto.length, lungo.length);
    assert.equal(C.daBase64(corto).length, 32 + 24 + 16 + 1024);
    const oltre = C.cifraSegnalazione(record({ descrizione: 'è'.repeat(1000), luogo: 'z'.repeat(300) }), g.pubblica);
    assert.equal((C.daBase64(oltre).length - 72) % 1024, 0);
    assert.ok(C.formaCifrataValida(oltre));
    assert.equal(C.formaCifrataValida(C.inBase64(new Uint8Array(100))), false);
});

test('P6: due cifrature dello stesso testo sono diverse e il JSON in chiaro non compare', async () => {
    const { g } = await gestore('x');
    const r = record();
    const a = C.cifraSegnalazione(r, g.pubblica);
    const b = C.cifraSegnalazione(r, g.pubblica);
    assert.notEqual(a, b);
    const grezzo = Buffer.from(C.daBase64(a));
    assert.equal(grezzo.indexOf(Buffer.from(JSON.stringify(r))), -1);
    for (const v of Object.values(r).filter((x) => x.length >= 4)) {
        assert.equal(grezzo.indexOf(Buffer.from(v)), -1);
        assert.equal(a.indexOf(v), -1);
    }
});

test('S2/S5 T5: la richiesta di invio contiene solo cifrato e versione, nessun valore del modulo', async () => {
    const { g } = await gestore('x');
    const r = record();
    const campi = C.campiInvio(r, g.pubblica);
    assert.deepEqual(Object.keys(campi).sort(), ['cifrato', 'versione']);
    assert.equal(campi.versione, '1');
    const corpo = new URLSearchParams(campi).toString();
    for (const v of Object.values(r).filter((x) => x.length >= 4)) {
        assert.equal(corpo.indexOf(encodeURIComponent(v)), -1);
        assert.equal(corpo.indexOf(v), -1);
    }
    assert.deepEqual(C.decifraSegnalazione(campi.cifrato, g.segreta), r);
});

test('S5: accesso = md5 della password come oggi, la chiave di decifratura non si ricava dal md5', async () => {
    const pw = 'Pàssword-Lunga-2026';
    const atteso = crypto.createHash('md5').update(Buffer.from(pw, 'utf8')).digest('hex');
    assert.equal(C.accessoDaPassword(pw), atteso);
    assert.equal(C.senzaBarre('a\\\\b\\c\\0d\\'), 'a\\bc\u0000d');
    const sale = C.nuovoSale();
    const chiave = await C.derivaChiave(pw, sale, VELOCI);
    assert.notEqual(Buffer.from(chiave).toString('hex'), atteso);
    assert.equal(Buffer.from(chiave).toString('hex').indexOf(atteso), -1);
});
