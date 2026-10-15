'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const M = require(path.join(__dirname, '..', 'NPmonitor', 'js', 'moduli.js'));

const PERSONE = [
    { valore: '101', cognome: 'ROSSI', nome: 'MARIO' },
    { valore: '102', cognome: 'DE ROSA', nome: 'ANNA' },
    { valore: '103', cognome: "D'AMICO", nome: 'LUCA' },
    { valore: '104', cognome: 'NICCOLÒ', nome: 'PIERO' },
    { valore: '105', cognome: 'BIANCHI', nome: 'ROSANNA' }
];

function valori(lista) {
    return lista.map((p) => p.valore);
}

test('ricerca vuota restituisce tutti', () => {
    assert.deepEqual(valori(M.filtraPersone(PERSONE, '')), ['101', '102', '103', '104', '105']);
});

test('cerca per inizio del cognome, senza badare a maiuscole', () => {
    assert.deepEqual(valori(M.filtraPersone(PERSONE, 'ros')), ['101', '102', '105']);
    assert.deepEqual(valori(M.filtraPersone(PERSONE, 'bian')), ['105']);
});

test('il cognome viene prima del nome', () => {
    const r = valori(M.filtraPersone(PERSONE, 'ros'));
    assert.equal(r[0], '101');
    assert.equal(r[r.length - 1], '105');
});

test('cognome e nome insieme', () => {
    assert.deepEqual(valori(M.filtraPersone(PERSONE, 'rossi m')), ['101']);
    assert.deepEqual(valori(M.filtraPersone(PERSONE, 'rossi x')), []);
});

test('accenti, apostrofi e cognomi composti', () => {
    assert.deepEqual(valori(M.filtraPersone(PERSONE, 'niccolo')), ['104']);
    assert.deepEqual(valori(M.filtraPersone(PERSONE, 'd’amico')), ['103']);
    assert.deepEqual(valori(M.filtraPersone(PERSONE, 'amico')), ['103']);
    assert.deepEqual(valori(M.filtraPersone(PERSONE, 'rosa')), ['102', '105']);
});

test('nessun risultato', () => {
    assert.deepEqual(M.filtraPersone(PERSONE, 'zz'), []);
});

test('date: lettura, formato e griglia del mese', () => {
    assert.equal(M.dataLeggibile('2026-10-15'), '15/10/2026');
    assert.equal(M.leggiData('2026-02-30'), null);
    assert.equal(M.dataLeggibile('x'), '');
    const g = M.grigliaMese(2026, 9);
    assert.equal(g.filter(Boolean).length, 31);
    assert.equal(g.indexOf('2026-10-01'), 3);
});
