'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const C = require(path.join(__dirname, '..', 'NPmonitor', 'js', 'cifra.js'));

function storico() {
    return [
        { id: 1, chiaro: { tipologia: 'Tutela dell’ambiente', descrizione: 'Scarico d\'acqua sospetto, è grave', luogo: 'Piazzale', data_evento: '2025-10-23', ora_evento: null, coinvolgimento: 'Sono testimone', prove: 'NO', segnalato: 'NO', matricola: null, data_inserimento: '2025-10-23 08:12:44.123' }, cifrato: null },
        { id: 2, chiaro: { tipologia: null, descrizione: 'Testo "tra virgolette"', luogo: 'Ufficio', data_evento: null, ora_evento: '09:15', coinvolgimento: 'Diretto coinvolto', prove: 'SI', segnalato: 'SI', matricola: '1234', data_inserimento: '2026-01-02 17:00:00.000' }, cifrato: null },
        { id: 3, chiaro: { tipologia: 'Parità di genere, Violenza verbale o abusi', descrizione: 'àèìòù', luogo: 'Mensa', data_evento: '2026-10-07 10:30:00', ora_evento: '10:30:15', coinvolgimento: 'Sono la vittima', prove: 'NO', segnalato: 'NO', matricola: null, data_inserimento: '2026-10-07 11:00:00.997' }, cifrato: null }
    ];
}

function dbFinto(righe, opzioni) {
    const o = opzioni || {};
    const stato = { righe: righe.map((r) => Object.assign({}, r)), salvate: 0, riscritte: 0, svuotamenti: 0 };
    stato.api = {
        async leggi() {
            return {
                totale: stato.righe.length,
                righe: stato.righe.map((r) => ({
                    id: r.id,
                    cifrato: o.corrompiLettura && o.corrompiLettura.id === r.id && r.cifrato ? o.corrompiLettura.fn(r.cifrato) : r.cifrato,
                    chiaro: r.chiaro && o.alteraChiaro && o.alteraChiaro.id === r.id && r.cifrato ? Object.assign({}, r.chiaro, o.alteraChiaro.campi) : r.chiaro
                }))
            };
        },
        async salva(id, cifrato, precedente) {
            const r = stato.righe.find((x) => x.id === id);
            if (!r) {
                return;
            }
            if (precedente ? r.cifrato === precedente && r.chiaro !== null : r.cifrato === null) {
                r.cifrato = cifrato;
                stato.salvate++;
                if (precedente) {
                    stato.riscritte++;
                }
            }
        },
        async svuota(elenco) {
            stato.svuotamenti++;
            const prima = stato.righe.length;
            for (const e of elenco) {
                const r = stato.righe.find((x) => x.id === e.id && x.cifrato === e.cifrato);
                if (!r) {
                    throw new Error('riga non coincidente');
                }
            }
            for (const e of elenco) {
                stato.righe.find((x) => x.id === e.id).chiaro = null;
            }
            return { prima, dopo: stato.righe.length, svuotate: elenco.length };
        }
    };
    return stato;
}

function gestore() {
    return C.generaChiaveGestore(new Uint8Array(32).fill(7));
}

test('S8/S9: tutte le righe coincidono, i campi in chiaro si svuotano e nessuna riga sparisce', async () => {
    const g = gestore();
    const db = dbFinto(storico());
    const esito = await C.migraStorico(db.api, g.pubblica, g.segreta);
    assert.equal(esito.esito, 'svuotate');
    assert.equal(esito.svuotate, 3);
    assert.equal(esito.totalePrima, 3);
    assert.equal(esito.totaleDopo, 3);
    assert.deepEqual(db.righe.map((r) => r.id), [1, 2, 3]);
    const originali = storico();
    for (const r of db.righe) {
        assert.equal(r.chiaro, null);
        assert.deepEqual(C.decifraSegnalazione(r.cifrato, g.segreta), originali.find((x) => x.id === r.id).chiaro);
    }
});

test('S8: ripetibile, la seconda volta non fa nulla', async () => {
    const g = gestore();
    const db = dbFinto(storico());
    await C.migraStorico(db.api, g.pubblica, g.segreta);
    const cifrati = db.righe.map((r) => r.cifrato);
    const esito = await C.migraStorico(db.api, g.pubblica, g.segreta);
    assert.equal(esito.esito, 'nulla');
    assert.equal(db.salvate, 3);
    assert.equal(db.svuotamenti, 1);
    assert.deepEqual(db.righe.map((r) => r.cifrato), cifrati);
});

test('S8: una riga riletta diversa dall\'originale, nulla viene svuotato', async () => {
    const g = gestore();
    const db = dbFinto(storico(), { alteraChiaro: { id: 2, campi: { descrizione: 'Testo ?tra virgolette?' } } });
    const esito = await C.migraStorico(db.api, g.pubblica, g.segreta);
    assert.equal(esito.esito, 'diverso');
    assert.equal(esito.id, 2);
    assert.deepEqual(esito.campi, ['descrizione']);
    assert.equal(esito.svuotate, 0);
    assert.equal(db.svuotamenti, 0);
    assert.ok(db.righe.every((r) => r.chiaro !== null));
    assert.equal(db.righe.length, 3);
});

test('S8: un cifrato riletto rovinato, nulla viene svuotato', async () => {
    const g = gestore();
    const rovina = (c) => (c[60] === 'A' ? c.slice(0, 60) + 'B' + c.slice(61) : c.slice(0, 60) + 'A' + c.slice(61));
    const db = dbFinto(storico(), { corrompiLettura: { id: 3, fn: rovina } });
    const esito = await C.migraStorico(db.api, g.pubblica, g.segreta);
    assert.equal(esito.esito, 'diverso');
    assert.equal(esito.id, 3);
    assert.equal(db.svuotamenti, 0);
    assert.ok(db.righe.every((r) => r.chiaro !== null));
});

test('S8: un cifrato salvato che non verifica viene riscritto finché il chiaro c\'è, poi si svuota', async () => {
    const g = gestore();
    const altro = C.generaChiaveGestore(new Uint8Array(32).fill(9));
    const righe = storico();
    const sbagliato = C.cifraSegnalazione(righe[0].chiaro, altro.pubblica);
    righe[0].cifrato = sbagliato;
    const db = dbFinto(righe);
    const esito = await C.migraStorico(db.api, g.pubblica, g.segreta);
    assert.equal(esito.esito, 'svuotate');
    assert.equal(esito.svuotate, 3);
    assert.equal(db.riscritte, 1);
    assert.notEqual(db.righe[0].cifrato, sbagliato);
    assert.deepEqual(C.decifraSegnalazione(db.righe[0].cifrato, g.segreta), storico()[0].chiaro);
    assert.ok(db.righe.every((r) => r.chiaro === null));
});

test('S8: un cifrato che non verifica su una riga già svuotata non viene mai riscritto', async () => {
    const g = gestore();
    const altro = C.generaChiaveGestore(new Uint8Array(32).fill(9));
    const svuotata = { id: 5, chiaro: null, cifrato: C.cifraSegnalazione({ descrizione: 'x' }, altro.pubblica) };
    const db = dbFinto([svuotata]);
    const esito = await C.migraStorico(db.api, g.pubblica, g.segreta);
    assert.equal(esito.esito, 'nulla');
    assert.equal(db.salvate, 0);
    assert.equal(db.righe[0].cifrato, svuotata.cifrato);
    await db.api.salva(5, C.cifraSegnalazione({ descrizione: 'y' }, g.pubblica), svuotata.cifrato);
    assert.equal(db.righe[0].cifrato, svuotata.cifrato);
});

test('S8: riprende un lavoro interrotto dopo il salvataggio senza ricifrare', async () => {
    const g = gestore();
    const righe = storico();
    righe[1].cifrato = C.cifraSegnalazione(righe[1].chiaro, g.pubblica);
    const giaSalvato = righe[1].cifrato;
    const db = dbFinto(righe);
    const esito = await C.migraStorico(db.api, g.pubblica, g.segreta);
    assert.equal(esito.esito, 'svuotate');
    assert.equal(db.salvate, 2);
    assert.equal(db.righe[1].cifrato, giaSalvato);
    assert.ok(db.righe.every((r) => r.chiaro === null));
});

test('le righe nuove gia cifrate senza chiaro non vengono toccate', async () => {
    const g = gestore();
    const nuova = { id: 9, chiaro: null, cifrato: C.cifraSegnalazione({ descrizione: 'nuova' }, g.pubblica) };
    const db = dbFinto([nuova]);
    const esito = await C.migraStorico(db.api, g.pubblica, g.segreta);
    assert.equal(esito.esito, 'nulla');
    assert.equal(db.salvate, 0);
    assert.equal(db.righe[0].cifrato, nuova.cifrato);
});
