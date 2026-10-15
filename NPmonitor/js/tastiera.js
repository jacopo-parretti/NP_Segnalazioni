(function (radice, fabbrica) {
    const api = fabbrica();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else {
        radice.NPTastiera = api;
        if (typeof document !== 'undefined') {
            api.avvia(document);
        }
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const PAGINE = Object.freeze({
        lettere: [
            ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'è', 'é', '#chiudi'],
            ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ò', 'à', 'ù'],
            ['#maiuscole', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'ì', ',', '.', '#cancella'],
            ['#numeri', '\'', '#spazio', '-', '#acapo']
        ],
        numeri: [
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '#chiudi'],
            ['€', '@', '(', ')', '/', '-', '\'', '"', '?', '!'],
            ['.', ',', ':', ';', '%', '+', '=', '&', '_', '#cancella'],
            ['#lettere', '\'', '#spazio', '-', '#acapo']
        ]
    });

    const NOMI = Object.freeze({
        maiuscole: 'Maiusc',
        cancella: 'Cancella',
        numeri: '123',
        lettere: 'ABC',
        spazio: 'Spazio',
        acapo: 'A capo',
        chiudi: 'Chiudi tastiera'
    });

    function limite(stato) {
        return typeof stato.massimo === 'number' && stato.massimo >= 0 ? stato.massimo : Infinity;
    }

    function inserisci(stato, testo) {
        const v = stato.valore;
        const inizio = Math.min(stato.inizio, stato.fine);
        const fine = Math.max(stato.inizio, stato.fine);
        if (v.length - (fine - inizio) + testo.length > limite(stato)) {
            return null;
        }
        const pos = inizio + testo.length;
        return { valore: v.slice(0, inizio) + testo + v.slice(fine), inizio: pos, fine: pos, massimo: stato.massimo };
    }

    function cancella(stato) {
        const v = stato.valore;
        const inizio = Math.min(stato.inizio, stato.fine);
        const fine = Math.max(stato.inizio, stato.fine);
        if (inizio !== fine) {
            return { valore: v.slice(0, inizio) + v.slice(fine), inizio, fine: inizio, massimo: stato.massimo };
        }
        if (inizio === 0) {
            return null;
        }
        const passo = inizio >= 2 && /[\uDC00-\uDFFF]/.test(v[inizio - 1]) && /[\uD800-\uDBFF]/.test(v[inizio - 2]) ? 2 : 1;
        return { valore: v.slice(0, inizio - passo) + v.slice(inizio), inizio: inizio - passo, fine: inizio - passo, massimo: stato.massimo };
    }

    function carattere(tasto, maiuscolo) {
        return maiuscolo ? tasto.toLocaleUpperCase('it-IT') : tasto;
    }

    function idoneo(el) {
        if (!el || el.disabled || el.closest('.tastiera')) {
            return false;
        }
        if (el.tagName === 'TEXTAREA') {
            return true;
        }
        return el.tagName === 'INPUT' && ['text', 'search', ''].includes((el.getAttribute('type') || '').toLowerCase());
    }

    function leggiTotem(cerca, salvato) {
        const m = /[?&]totem=([01])(?:&|$)/.exec(cerca || '');
        if (m) {
            return { totem: m[1] === '1', salva: m[1] };
        }
        return { totem: salvato === '1', salva: null };
    }

    function avvia(doc) {
        if (doc.readyState === 'loading') {
            doc.addEventListener('DOMContentLoaded', () => monta(doc));
        } else {
            monta(doc);
        }
    }

    function monta(doc) {
        const win = doc.defaultView;
        let campo = null;
        let pagina = 'lettere';
        let maiuscolo = false;
        let blocco = false;
        let ultimoMaiusc = 0;
        let ripeti = null;
        let ripetuto = false;

        const pannello = doc.createElement('div');
        pannello.className = 'tastiera';
        pannello.hidden = true;
        pannello.setAttribute('role', 'group');
        pannello.setAttribute('aria-label', 'Tastiera a schermo');
        doc.body.appendChild(pannello);

        let totem = false;
        try {
            const t = leggiTotem(win.location.search, win.localStorage.getItem('npTotem'));
            totem = t.totem;
            if (t.salva === '1') {
                win.localStorage.setItem('npTotem', '1');
            } else if (t.salva === '0') {
                win.localStorage.removeItem('npTotem');
            }
        } catch (e) {
            totem = leggiTotem(win.location.search, null).totem;
        }

        let ultimo = null;
        const pulsanti = Array.from(doc.querySelectorAll('[data-tastiera-pulsante]'));

        function aggiornaPulsanti() {
            for (const p of pulsanti) {
                p.setAttribute('aria-pressed', pannello.hidden ? 'false' : 'true');
                p.textContent = pannello.hidden ? 'Tastiera' : 'Chiudi tastiera';
            }
        }

        function primoCampo() {
            return Array.from(doc.querySelectorAll('input, textarea')).find(
                (x) => idoneo(x) && x.offsetParent !== null && !x.classList.contains('nativo-nascosto')
            ) || null;
        }

        for (const el of doc.querySelectorAll('input, textarea')) {
            if (idoneo(el)) {
                el.setAttribute('inputmode', 'none');
            }
        }

        const bersaglioInvio = doc.querySelector('[data-tastiera-invio]');

        function disegna() {
            pannello.textContent = '';
            const corpo = doc.createElement('div');
            corpo.className = 'tastiera-corpo';
            if (bersaglioInvio) {
                const invio = doc.createElement('button');
                invio.type = 'button';
                invio.tabIndex = -1;
                invio.className = 'tasto tasto-invio';
                invio.dataset.comando = 'invia';
                invio.textContent = bersaglioInvio.textContent.trim();
                invio.disabled = bersaglioInvio.disabled;
                corpo.appendChild(invio);
            }
            const righe = doc.createElement('div');
            righe.className = 'tastiera-righe';
            corpo.appendChild(righe);
            for (const fila of PAGINE[pagina]) {
                const riga = doc.createElement('div');
                riga.className = 'tastiera-fila';
                for (const t of fila) {
                    if (t === '#acapo' && !(campo && campo.tagName === 'TEXTAREA')) {
                        continue;
                    }
                    const b = doc.createElement('button');
                    b.type = 'button';
                    b.tabIndex = -1;
                    if (t[0] === '#') {
                        const nome = t.slice(1);
                        b.dataset.comando = nome;
                        b.className = 'tasto tasto-' + nome;
                        b.textContent = NOMI[nome];
                        if (nome === 'maiuscole') {
                            b.setAttribute('aria-pressed', maiuscolo ? 'true' : 'false');
                            b.classList.toggle('attivo', maiuscolo);
                            b.classList.toggle('bloccato', blocco);
                            b.textContent = blocco ? 'MAIUSC' : NOMI.maiuscole;
                        }
                    } else {
                        b.className = 'tasto';
                        b.dataset.testo = t;
                        b.textContent = carattere(t, maiuscolo && pagina === 'lettere');
                    }
                    riga.appendChild(b);
                }
                righe.appendChild(riga);
            }
            pannello.appendChild(corpo);
        }

        if (bersaglioInvio && win.MutationObserver) {
            new win.MutationObserver(function () {
                const invio = pannello.querySelector('.tasto-invio');
                if (invio) {
                    invio.disabled = bersaglioInvio.disabled;
                }
            }).observe(bersaglioInvio, { attributes: true, attributeFilter: ['disabled'] });
        }

        function stato() {
            const inizio = typeof campo.selectionStart === 'number' ? campo.selectionStart : campo.value.length;
            const fine = typeof campo.selectionEnd === 'number' ? campo.selectionEnd : inizio;
            return { valore: campo.value, inizio, fine, massimo: campo.maxLength };
        }

        function applica(nuovo) {
            if (!nuovo || !campo) {
                return false;
            }
            campo.value = nuovo.valore;
            try {
                campo.setSelectionRange(nuovo.inizio, nuovo.fine);
            } catch (e) {
                void e;
            }
            campo.dispatchEvent(new win.Event('input', { bubbles: true }));
            return true;
        }

        function scrivi(testo) {
            applica(inserisci(stato(), testo));
        }

        let ristretto = null;

        function liberaRistretto() {
            if (ristretto) {
                ristretto.style.removeProperty('max-height');
                ristretto = null;
            }
        }

        function mostraCampo() {
            if (!campo) {
                return;
            }
            liberaRistretto();
            const alto = pannello.offsetHeight;
            const margine = 16;
            const disponibile = win.innerHeight - alto;
            const r = campo.getBoundingClientRect();
            const riga = parseFloat(win.getComputedStyle(campo).lineHeight) || 24;
            if (r.top + Math.min(r.height, riga * 2.5) <= disponibile - margine) {
                if (campo.tagName === 'TEXTAREA' && r.bottom > disponibile - margine) {
                    campo.style.setProperty('max-height', Math.floor(disponibile - margine - r.top) + 'px');
                    ristretto = campo;
                }
                return;
            }
            doc.body.style.setProperty('padding-bottom', alto + 'px');
            let meta;
            if (campo.hasAttribute('data-tastiera-alto') || r.height > disponibile - 2 * margine) {
                meta = margine;
            } else {
                meta = Math.min(Math.max(r.top, margine), disponibile - r.height - margine);
            }
            if (Math.abs(r.top - meta) > 1) {
                win.scrollBy(0, r.top - meta);
            }
            const dentro = campo.getBoundingClientRect();
            if (dentro.top < margine || dentro.bottom > disponibile - margine) {
                campo.scrollIntoView({ block: campo.hasAttribute('data-tastiera-alto') ? 'start' : 'nearest' });
            }
        }

        function apri(el) {
            const cambia = campo !== el;
            campo = el;
            if (cambia) {
                pagina = 'lettere';
                maiuscolo = false;
                blocco = false;
            }
            disegna();
            pannello.hidden = false;
            doc.documentElement.classList.add('con-tastiera');
            aggiornaPulsanti();
            win.requestAnimationFrame(mostraCampo);
        }

        function chiudi() {
            if (pannello.hidden) {
                return;
            }
            pannello.hidden = true;
            doc.documentElement.classList.remove('con-tastiera');
            doc.body.style.removeProperty('padding-bottom');
            liberaRistretto();
            aggiornaPulsanti();
            const c = campo;
            campo = null;
            if (c && doc.activeElement === c) {
                c.blur();
            }
        }

        function fermaRipeti() {
            if (ripeti) {
                win.clearTimeout(ripeti);
                win.clearInterval(ripeti);
                ripeti = null;
            }
        }

        function comando(nome) {
            if (nome === 'cancella') {
                applica(cancella(stato()));
            } else if (nome === 'spazio') {
                scrivi(' ');
            } else if (nome === 'acapo') {
                scrivi('\n');
            } else if (nome === 'chiudi') {
                chiudi();
                return;
            } else if (nome === 'invia') {
                chiudi();
                if (bersaglioInvio && !bersaglioInvio.disabled) {
                    bersaglioInvio.click();
                }
                return;
            } else if (nome === 'numeri' || nome === 'lettere') {
                pagina = nome;
                disegna();
                return;
            } else if (nome === 'maiuscole') {
                const ora = Date.now();
                if (maiuscolo && !blocco && ora - ultimoMaiusc < 450) {
                    blocco = true;
                } else if (maiuscolo) {
                    maiuscolo = false;
                    blocco = false;
                } else {
                    maiuscolo = true;
                }
                ultimoMaiusc = ora;
                disegna();
                return;
            }
        }

        pannello.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            const b = e.target.closest('button');
            if (b && b.dataset.comando === 'cancella') {
                ripetuto = false;
                fermaRipeti();
                ripeti = win.setTimeout(function () {
                    ripeti = win.setInterval(function () {
                        ripetuto = true;
                        if (campo) {
                            applica(cancella(stato()));
                        }
                    }, 70);
                }, 450);
            }
        });
        pannello.addEventListener('mousedown', (e) => e.preventDefault());
        for (const tipo of ['pointerup', 'pointercancel', 'pointerleave']) {
            pannello.addEventListener(tipo, fermaRipeti);
        }
        pannello.addEventListener('click', function (e) {
            const b = e.target.closest('button');
            if (!b || !campo) {
                return;
            }
            if (doc.activeElement !== campo) {
                campo.focus({ preventScroll: true });
            }
            if (b.dataset.comando) {
                if (b.dataset.comando === 'cancella' && ripetuto) {
                    ripetuto = false;
                    return;
                }
                comando(b.dataset.comando);
                return;
            }
            scrivi(carattere(b.dataset.testo, maiuscolo && pagina === 'lettere'));
            if (maiuscolo && !blocco && pagina === 'lettere') {
                maiuscolo = false;
                disegna();
            }
        });

        let tocco = null;
        let tempo = null;

        function sblocca(el) {
            if (el && el.dataset.tastieraSola === '1') {
                el.readOnly = false;
                el.removeAttribute('data-tastiera-sola');
            }
        }

        doc.addEventListener('pointerdown', function (e) {
            const el = e.target;
            if (pannello.contains(el)) {
                return;
            }
            const daDito = totem || e.pointerType === 'touch' || e.pointerType === 'pen';
            if (idoneo(el) && (daDito || !pannello.hidden)) {
                if (daDito && !el.readOnly) {
                    el.readOnly = true;
                    el.dataset.tastieraSola = '1';
                    win.clearTimeout(tempo);
                    tempo = win.setTimeout(() => sblocca(el), 900);
                }
                tocco = el;
                return;
            }
            if (!el.closest || !el.closest('[data-tastiera-tiene]')) {
                chiudi();
            }
        }, true);

        doc.addEventListener('focusin', function (e) {
            if (idoneo(e.target)) {
                ultimo = e.target;
            }
        });

        for (const p of pulsanti) {
            p.hidden = false;
            p.setAttribute('data-tastiera-tiene', '');
            p.addEventListener('mousedown', (e) => e.preventDefault());
            p.addEventListener('click', function () {
                if (!pannello.hidden) {
                    chiudi();
                    return;
                }
                const att = doc.activeElement;
                const el = idoneo(att) ? att : (ultimo && ultimo.isConnected && ultimo.offsetParent !== null ? ultimo : primoCampo());
                if (el) {
                    el.focus({ preventScroll: true });
                    apri(el);
                }
            });
        }
        aggiornaPulsanti();

        doc.addEventListener('click', function (e) {
            const el = e.target;
            if (el === tocco) {
                tocco = null;
                win.setTimeout(() => sblocca(el), 0);
                apri(el);
            }
        }, true);

        doc.addEventListener('focusout', function (e) {
            if (e.target === campo) {
                win.setTimeout(function () {
                    const att = doc.activeElement;
                    if (campo && att !== campo && !(att && pannello.contains(att))) {
                        if (idoneo(att) && tocco === att) {
                            return;
                        }
                        chiudi();
                    }
                }, 0);
            }
        });

        doc.addEventListener('keydown', function (e) {
            if (!pannello.hidden && e.key === 'Escape') {
                chiudi();
            }
        });

        win.addEventListener('resize', function () {
            if (!pannello.hidden) {
                mostraCampo();
            }
        });
    }

    return { PAGINE, NOMI, inserisci, cancella, carattere, idoneo, leggiTotem, avvia };
});
