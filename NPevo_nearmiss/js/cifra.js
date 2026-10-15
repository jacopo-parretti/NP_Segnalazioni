(function (radice, fabbrica) {
    if (typeof module === 'object' && module.exports) {
        module.exports = fabbrica(require('./vendor/nacl-fast.js'), require('./vendor/scrypt.js'), require('./vendor/md5.js'));
    } else {
        radice.NPCifra = fabbrica(radice.nacl, radice.scrypt, radice.md5);
    }
})(typeof self !== 'undefined' ? self : this, function (nacl, scrypt, md5) {
    'use strict';

    const VERSIONE = 1;
    const BLOCCO = 1024;
    const LUNGHEZZA_TESTA = 32 + 24 + 16;
    const PARAMETRI_KDF = Object.freeze({ N: 131072, r: 8, p: 1 });
    const CAMPI = Object.freeze([
        'tipologia', 'descrizione', 'luogo', 'data_evento', 'ora_evento',
        'coinvolgimento', 'prove', 'segnalato', 'matricola', 'data_inserimento'
    ]);

    function inBase64(u8) {
        let s = '';
        for (let i = 0; i < u8.length; i++) {
            s += String.fromCharCode(u8[i]);
        }
        return btoa(s);
    }

    function daBase64(testo) {
        if (typeof testo !== 'string' || testo.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(testo)) {
            return null;
        }
        const s = atob(testo);
        const u8 = new Uint8Array(s.length);
        for (let i = 0; i < s.length; i++) {
            u8[i] = s.charCodeAt(i);
        }
        return u8;
    }

    function utf8(s) {
        return new TextEncoder().encode(s);
    }

    function daUtf8(u8) {
        return new TextDecoder('utf-8', { fatal: true }).decode(u8);
    }

    function unisci(...parti) {
        const totale = parti.reduce((n, p) => n + p.length, 0);
        const out = new Uint8Array(totale);
        let pos = 0;
        for (const p of parti) {
            out.set(p, pos);
            pos += p.length;
        }
        return out;
    }

    function uguali(a, b) {
        if (!a || !b || a.length !== b.length) {
            return false;
        }
        let d = 0;
        for (let i = 0; i < a.length; i++) {
            d |= a[i] ^ b[i];
        }
        return d === 0;
    }

    function senzaBarre(s) {
        return s.replace(/\\([\s\S]?)/g, (m, c) => (c === '0' ? '\u0000' : c));
    }

    function accessoDaPassword(password) {
        return md5(senzaBarre(password));
    }

    function nuovoSale() {
        return inBase64(nacl.randomBytes(16));
    }

    function testoParametri(parametri) {
        const p = parametri || PARAMETRI_KDF;
        return JSON.stringify({ N: p.N, r: p.r, p: p.p });
    }

    function leggiParametri(testo) {
        let p;
        try {
            p = JSON.parse(testo);
        } catch (e) {
            return null;
        }
        if (!p || !Number.isInteger(p.N) || !Number.isInteger(p.r) || !Number.isInteger(p.p)) {
            return null;
        }
        if (p.N < 1024 || p.N > 1048576 || (p.N & (p.N - 1)) !== 0 || p.r < 1 || p.r > 16 || p.p < 1 || p.p > 4) {
            return null;
        }
        return { N: p.N, r: p.r, p: p.p };
    }

    async function derivaChiave(password, saleBase64, parametriTesto) {
        const sale = daBase64(saleBase64);
        const p = leggiParametri(parametriTesto);
        if (!sale || sale.length < 16 || !p) {
            throw new Error('Parametri della chiave non validi');
        }
        await new Promise((fatto) => setTimeout(fatto, 30));
        return new Uint8Array(scrypt.syncScrypt(utf8(password.normalize('NFKC')), sale, p.N, p.r, p.p, 32));
    }

    function incapsula(segreta, chiave) {
        const nonce = nacl.randomBytes(24);
        return inBase64(unisci(nonce, nacl.secretbox(segreta, nonce, chiave)));
    }

    function apri(incapsulata, chiave) {
        const b = daBase64(incapsulata);
        if (!b || b.length < 24 + 16 || !chiave || chiave.length !== 32) {
            return null;
        }
        return nacl.secretbox.open(b.subarray(24), b.subarray(0, 24), chiave) || null;
    }

    function emergenzaInGruppi(u8) {
        let hex = '';
        for (let i = 0; i < u8.length; i++) {
            hex += u8[i].toString(16).padStart(2, '0');
        }
        return hex.toUpperCase().match(/.{4}/g).join('-');
    }

    function emergenzaDaTesto(testo) {
        const hex = String(testo || '').toUpperCase().replace(/[^0-9A-F]/g, '');
        if (hex.length !== 64) {
            return null;
        }
        const u8 = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
            u8[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return u8;
    }

    function ultimoGruppo(gruppi) {
        const parti = gruppi.split('-');
        return parti[parti.length - 1];
    }

    function coppiaValida(segreta, pubblicaBase64) {
        if (!segreta || segreta.length !== 32) {
            return false;
        }
        return uguali(nacl.box.keyPair.fromSecretKey(segreta).publicKey, daBase64(pubblicaBase64));
    }

    function impronta(pubblicaBase64) {
        const pubblica = daBase64(pubblicaBase64);
        if (!pubblica || pubblica.length !== 32) {
            return null;
        }
        const h = nacl.hash(pubblica).subarray(0, 16);
        let hex = '';
        for (let i = 0; i < h.length; i++) {
            hex += h[i].toString(16).padStart(2, '0');
        }
        return hex.toUpperCase().match(/.{4}/g).join('-');
    }

    function generaChiaveGestore(chiavePassword) {
        const coppia = nacl.box.keyPair();
        const emergenza = nacl.randomBytes(32);
        return {
            pubblica: inBase64(coppia.publicKey),
            privataDaPassword: incapsula(coppia.secretKey, chiavePassword),
            privataDaEmergenza: incapsula(coppia.secretKey, emergenza),
            emergenza: emergenzaInGruppi(emergenza),
            segreta: coppia.secretKey
        };
    }

    function cifraSegnalazione(record, pubblicaBase64) {
        const pubblica = daBase64(pubblicaBase64);
        if (!pubblica || pubblica.length !== 32) {
            throw new Error('Chiave pubblica del gestore non valida');
        }
        const json = utf8(JSON.stringify(record));
        const chiaro = new Uint8Array(Math.ceil((json.length + 4) / BLOCCO) * BLOCCO);
        new DataView(chiaro.buffer).setUint32(0, json.length);
        chiaro.set(json, 4);
        const effimera = nacl.box.keyPair();
        const nonce = nacl.randomBytes(24);
        const scatola = nacl.box(chiaro, nonce, pubblica, effimera.secretKey);
        effimera.secretKey.fill(0);
        chiaro.fill(0);
        return inBase64(unisci(effimera.publicKey, nonce, scatola));
    }

    function formaCifrataValida(cifrato) {
        const b = daBase64(cifrato);
        return !!b && b.length >= LUNGHEZZA_TESTA + BLOCCO && (b.length - LUNGHEZZA_TESTA) % BLOCCO === 0;
    }

    function decifraSegnalazione(cifrato, segreta) {
        if (!formaCifrataValida(cifrato) || !segreta) {
            return null;
        }
        const b = daBase64(cifrato);
        const chiaro = nacl.box.open(b.subarray(56), b.subarray(32, 56), b.subarray(0, 32), segreta);
        if (!chiaro) {
            return null;
        }
        const n = new DataView(chiaro.buffer, chiaro.byteOffset, chiaro.byteLength).getUint32(0);
        if (n > chiaro.length - 4) {
            return null;
        }
        try {
            return JSON.parse(daUtf8(chiaro.subarray(4, 4 + n)));
        } catch (e) {
            return null;
        }
    }

    function campiInvio(record, pubblicaBase64) {
        return { cifrato: cifraSegnalazione(record, pubblicaBase64), versione: String(VERSIONE) };
    }

    function differenze(atteso, ottenuto) {
        const chiavi = new Set(Object.keys(atteso || {}).concat(Object.keys(ottenuto || {})));
        const diverse = [];
        for (const k of chiavi) {
            const a = atteso && Object.prototype.hasOwnProperty.call(atteso, k) ? atteso[k] : null;
            const o = ottenuto && Object.prototype.hasOwnProperty.call(ottenuto, k) ? ottenuto[k] : null;
            if (a !== o) {
                diverse.push(k);
            }
        }
        return diverse;
    }

    function inChiaro(riga) {
        return riga.chiaro !== null && riga.chiaro !== undefined;
    }

    function campiDiversi(riga, segreta) {
        const record = riga.cifrato ? decifraSegnalazione(riga.cifrato, segreta) : null;
        return record ? differenze(riga.chiaro, record) : ['cifrato'];
    }

    async function migraStorico(api, pubblicaBase64, segreta) {
        const prima = await api.leggi();
        for (const r of prima.righe.filter(inChiaro)) {
            if (!r.cifrato) {
                await api.salva(r.id, cifraSegnalazione(r.chiaro, pubblicaBase64), null);
            } else if (campiDiversi(r, segreta).length > 0) {
                await api.salva(r.id, cifraSegnalazione(r.chiaro, pubblicaBase64), r.cifrato);
            }
        }
        const rilette = await api.leggi();
        const daSvuotare = rilette.righe.filter(inChiaro);
        if (daSvuotare.length === 0) {
            return { esito: 'nulla', svuotate: 0, totalePrima: prima.totale, totaleDopo: rilette.totale };
        }
        for (const r of daSvuotare) {
            const diverse = campiDiversi(r, segreta);
            if (diverse.length > 0) {
                return { esito: 'diverso', svuotate: 0, id: r.id, campi: diverse, totalePrima: prima.totale, totaleDopo: rilette.totale };
            }
        }
        const fatto = await api.svuota(daSvuotare.map((r) => ({ id: r.id, cifrato: r.cifrato })));
        return { esito: 'svuotate', svuotate: fatto.svuotate, totalePrima: fatto.prima, totaleDopo: fatto.dopo };
    }

    return {
        VERSIONE,
        PARAMETRI_KDF,
        CAMPI,
        inBase64,
        daBase64,
        accessoDaPassword,
        senzaBarre,
        nuovoSale,
        testoParametri,
        leggiParametri,
        derivaChiave,
        incapsula,
        apri,
        emergenzaInGruppi,
        emergenzaDaTesto,
        ultimoGruppo,
        coppiaValida,
        impronta,
        generaChiaveGestore,
        cifraSegnalazione,
        formaCifrataValida,
        decifraSegnalazione,
        campiInvio,
        differenze,
        migraStorico
    };
});
