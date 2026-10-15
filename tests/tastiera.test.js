'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const T = require(path.join(__dirname, '..', 'NPmonitor', 'js', 'tastiera.js'));

function s(valore, inizio, fine, massimo) {
    return { valore, inizio, fine: fine === undefined ? inizio : fine, massimo: massimo === undefined ? -1 : massimo };
}

test('inserisce nel punto del cursore', () => {
    const r = T.inserisci(s('ciao mondo', 4), ' bel');
    assert.equal(r.valore, 'ciao bel mondo');
    assert.equal(r.inizio, 8);
    assert.equal(r.fine, 8);
});

test('sostituisce la selezione', () => {
    const r = T.inserisci(s('ciao mondo', 5, 10), 'a tutti');
    assert.equal(r.valore, 'ciao a tutti');
    assert.equal(r.inizio, 12);
});

test('rispetta maxlength', () => {
    assert.equal(T.inserisci(s('abc', 3, 3, 3), 'd'), null);
    assert.equal(T.inserisci(s('abc', 3, 3, 4), 'd').valore, 'abcd');
    assert.equal(T.inserisci(s('abc', 0, 3, 3), 'xyz').valore, 'xyz');
    assert.equal(T.inserisci(s('abc', 3, 3, -1), 'd').valore, 'abcd');
});

test('scrive le lettere accentate italiane', () => {
    let st = s('', 0);
    for (const c of ['à', 'è', 'é', 'ì', 'ò', 'ù']) {
        st = T.inserisci(st, c);
    }
    assert.equal(st.valore, 'àèéìòù');
    assert.equal(T.carattere('è', true), 'È');
    assert.equal(T.carattere('à', false), 'à');
    const lettere = T.PAGINE.lettere.flat();
    for (const c of ['à', 'è', 'é', 'ì', 'ò', 'ù']) {
        assert.ok(lettere.includes(c), c);
    }
});

test('la pagina dei simboli ha quelli richiesti', () => {
    const tutti = T.PAGINE.numeri.flat().concat(T.PAGINE.lettere.flat());
    for (const c of ['€', '\'', '"', ',', '.', '-', '/', '@', '(', ')', '?', '!', '0', '9']) {
        assert.ok(tutti.includes(c), c);
    }
    for (const nome of ['#spazio', '#cancella', '#acapo', '#chiudi', '#maiuscole']) {
        assert.ok(tutti.includes(nome), nome);
    }
});

test('cancella il carattere prima del cursore o la selezione', () => {
    assert.equal(T.cancella(s('ciao', 4)).valore, 'cia');
    assert.equal(T.cancella(s('ciao', 2)).valore, 'cao');
    assert.equal(T.cancella(s('ciao', 2)).inizio, 1);
    assert.equal(T.cancella(s('ciao', 0)), null);
    assert.equal(T.cancella(s('ciao mondo', 4, 10)).valore, 'ciao');
    assert.equal(T.cancella(s('aò', 2)).valore, 'a');
});

test('si apre solo su campi di testo', () => {
    const campo = (tag, tipo, extra) => Object.assign({ tagName: tag, disabled: false, closest: () => null, getAttribute: () => tipo }, extra);
    assert.equal(T.idoneo(campo('INPUT', 'text')), true);
    assert.equal(T.idoneo(campo('INPUT', null)), true);
    assert.equal(T.idoneo(campo('TEXTAREA', null)), true);
    assert.equal(T.idoneo(campo('INPUT', 'hidden')), false);
    assert.equal(T.idoneo(campo('INPUT', 'checkbox')), false);
    assert.equal(T.idoneo(campo('INPUT', 'text', { disabled: true })), false);
    assert.equal(T.idoneo(campo('INPUT', 'text', { closest: () => ({}) })), false);
    assert.equal(T.idoneo(null), false);
});

test('modalità totem: attivata e spenta da indirizzo, poi ricordata', () => {
    assert.deepEqual(T.leggiTotem('?totem=1', null), { totem: true, salva: '1' });
    assert.deepEqual(T.leggiTotem('?a=2&totem=0', '1'), { totem: false, salva: '0' });
    assert.deepEqual(T.leggiTotem('', '1'), { totem: true, salva: null });
    assert.deepEqual(T.leggiTotem('?totem=10', null), { totem: false, salva: null });
    assert.deepEqual(T.leggiTotem('', null), { totem: false, salva: null });
});
