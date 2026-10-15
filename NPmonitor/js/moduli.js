(function (radice, fabbrica) {
    const api = fabbrica();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else {
        radice.NPModuli = api;
        if (typeof document !== 'undefined') {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => api.monta(document));
            } else {
                api.monta(document);
            }
        }
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const MESI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    const GIORNI = ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'];

    function normalizza(s) {
        return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’`]/g, '\'').replace(/\s+/g, ' ').trim().toUpperCase();
    }

    function filtraPersone(persone, ricerca) {
        const q = normalizza(ricerca);
        if (q === '') {
            return persone.slice();
        }
        const primi = [];
        const altri = [];
        for (const p of persone) {
            const cognome = normalizza(p.cognome);
            const nome = normalizza(p.nome);
            if (cognome.startsWith(q) || (cognome + ' ' + nome).startsWith(q)) {
                primi.push(p);
            } else if (nome.startsWith(q) || cognome.split(/[ ']/).some((w) => w.startsWith(q))) {
                altri.push(p);
            }
        }
        return primi.concat(altri);
    }

    function due(n) {
        return (n < 10 ? '0' : '') + n;
    }

    function isoData(d) {
        return d.getFullYear() + '-' + due(d.getMonth() + 1) + '-' + due(d.getDate());
    }

    function leggiData(s) {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
        if (!m) {
            return null;
        }
        const d = new Date(+m[1], +m[2] - 1, +m[3]);
        return isoData(d) === s ? d : null;
    }

    function dataLeggibile(s) {
        const d = leggiData(s);
        return d ? due(d.getDate()) + '/' + due(d.getMonth() + 1) + '/' + d.getFullYear() : '';
    }

    function grigliaMese(anno, mese) {
        const primo = new Date(anno, mese, 1);
        const vuoti = (primo.getDay() + 6) % 7;
        const giorni = new Date(anno, mese + 1, 0).getDate();
        const celle = [];
        for (let i = 0; i < vuoti; i++) {
            celle.push(null);
        }
        for (let g = 1; g <= giorni; g++) {
            celle.push(isoData(new Date(anno, mese, g)));
        }
        return celle;
    }

    function monta(doc) {
        const win = doc.defaultView;

        function el(tag, classe, testo) {
            const e = doc.createElement(tag);
            if (classe) {
                e.className = classe;
            }
            if (testo !== undefined) {
                e.textContent = testo;
            }
            return e;
        }

        function pulsante(classe, testo) {
            const b = el('button', classe, testo);
            b.type = 'button';
            return b;
        }

        function cambiato(campo) {
            campo.dispatchEvent(new win.Event('input', { bubbles: true }));
            campo.dispatchEvent(new win.Event('change', { bubbles: true }));
        }

        function contenitore(campo) {
            return campo.closest('.campo') || campo.parentElement;
        }

        function nascondi(campo) {
            campo.classList.add('nativo-nascosto');
            campo.tabIndex = -1;
            campo.setAttribute('aria-hidden', 'true');
        }

        let separaPopup = null;

        function chiudiPopup() {
            if (separaPopup) {
                const f = separaPopup;
                separaPopup = null;
                f();
            }
        }

        doc.addEventListener('pointerdown', function (e) {
            if (separaPopup && !e.target.closest('.popup, .apre-popup')) {
                chiudiPopup();
            }
        }, true);
        doc.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                chiudiPopup();
            }
        });

        function apriPopup(apri, popup, chiudi) {
            chiudiPopup();
            popup.hidden = false;
            apri.setAttribute('aria-expanded', 'true');
            separaPopup = function () {
                popup.hidden = true;
                apri.setAttribute('aria-expanded', 'false');
                if (chiudi) {
                    chiudi();
                }
            };
            win.requestAnimationFrame(function () {
                const r = popup.getBoundingClientRect();
                if (r.bottom > win.innerHeight - 16) {
                    win.scrollBy(0, r.bottom - win.innerHeight + 16);
                } else if (r.top < 16) {
                    win.scrollBy(0, r.top - 16);
                }
            });
        }

        function scelte(select) {
            const gruppo = el('div', 'scelte');
            gruppo.setAttribute('role', 'radiogroup');
            const etichetta = doc.querySelector('label[for="' + select.id + '"]');
            if (etichetta) {
                etichetta.id = etichetta.id || select.id + '-etichetta';
                gruppo.setAttribute('aria-labelledby', etichetta.id);
                etichetta.addEventListener('click', function (e) {
                    e.preventDefault();
                    const primo = gruppo.querySelector('[aria-checked="true"]') || gruppo.querySelector('button');
                    if (primo) {
                        primo.focus();
                    }
                });
            }
            if (select.dataset.scelte === 'larghe') {
                gruppo.classList.add('larghe');
            }
            const voci = [];
            for (const o of select.options) {
                if (o.value === '' || o.disabled) {
                    continue;
                }
                const b = pulsante('scelta', o.textContent.trim());
                b.setAttribute('role', 'radio');
                b.dataset.valore = o.value;
                b.addEventListener('click', function () {
                    select.value = o.value;
                    aggiorna();
                    cambiato(select);
                });
                gruppo.appendChild(b);
                voci.push(b);
            }
            function aggiorna() {
                for (const b of voci) {
                    const si = b.dataset.valore === select.value && select.selectedIndex >= 0 && !select.options[select.selectedIndex].disabled;
                    b.setAttribute('aria-checked', si ? 'true' : 'false');
                    b.tabIndex = si || (!voci.some((x) => x.dataset.valore === select.value) && b === voci[0]) ? 0 : -1;
                }
            }
            gruppo.addEventListener('keydown', function (e) {
                const i = voci.indexOf(doc.activeElement);
                if (i < 0) {
                    return;
                }
                const passo = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
                if (passo) {
                    e.preventDefault();
                    const b = voci[(i + passo + voci.length) % voci.length];
                    b.focus();
                    b.click();
                }
            });
            nascondi(select);
            select.after(gruppo);
            select.addEventListener('change', aggiorna);
            select.npFuoco = () => (voci[0] && voci[0].focus());
            aggiorna();
        }

        function persona(select) {
            const persone = [];
            for (const o of select.options) {
                if (o.value === '' || o.disabled) {
                    continue;
                }
                persone.push({ valore: o.value, cognome: o.dataset.cognome || o.textContent, nome: o.dataset.nome || '', testo: o.textContent.trim() });
            }
            const radiceP = el('div', 'persona');
            const scelta = el('div', 'persona-scelta');
            const nomeScelto = el('span', 'persona-nome');
            const cambia = pulsante('pulsante secondario', 'Cambia');
            scelta.append(nomeScelto, cambia);
            const cerca = el('div', 'persona-cerca');
            const filtro = el('input', 'persona-filtro');
            filtro.type = 'text';
            filtro.id = select.id + '-cerca';
            filtro.autocomplete = 'off';
            filtro.spellcheck = false;
            filtro.placeholder = 'Scrivi il cognome';
            filtro.setAttribute('data-tastiera-alto', '');
            filtro.setAttribute('role', 'combobox');
            filtro.setAttribute('aria-autocomplete', 'list');
            const elenco = el('div', 'persona-elenco');
            elenco.id = select.id + '-elenco';
            elenco.setAttribute('role', 'listbox');
            elenco.setAttribute('data-tastiera-tiene', '');
            filtro.setAttribute('aria-controls', elenco.id);
            filtro.setAttribute('aria-expanded', 'true');
            const nessuno = el('p', 'persona-nessuno', 'Nessun nome trovato.');
            nessuno.hidden = true;
            cerca.append(filtro, elenco, nessuno);
            radiceP.append(scelta, cerca);
            const etichetta = doc.querySelector('label[for="' + select.id + '"]');
            if (etichetta) {
                etichetta.htmlFor = filtro.id;
            }
            let attivo = -1;
            let mostrati = [];

            function evidenzia(i) {
                const voci = elenco.children;
                if (attivo >= 0 && voci[attivo]) {
                    voci[attivo].classList.remove('attiva');
                }
                attivo = i;
                if (i >= 0 && voci[i]) {
                    voci[i].classList.add('attiva');
                    voci[i].scrollIntoView({ block: 'nearest' });
                    filtro.setAttribute('aria-activedescendant', voci[i].id);
                } else {
                    filtro.removeAttribute('aria-activedescendant');
                }
            }

            function elenca() {
                mostrati = filtraPersone(persone, filtro.value);
                elenco.textContent = '';
                mostrati.forEach(function (p, i) {
                    const b = pulsante('persona-voce');
                    if (p.nome) {
                        b.append(el('strong', null, p.cognome), doc.createTextNode(' ' + p.nome));
                    } else {
                        b.textContent = p.testo;
                    }
                    b.tabIndex = -1;
                    b.id = select.id + '-voce-' + i;
                    b.setAttribute('role', 'option');
                    b.addEventListener('click', () => scegli(p));
                    elenco.appendChild(b);
                });
                nessuno.hidden = mostrati.length > 0;
                attivo = -1;
                elenco.scrollTop = 0;
            }

            function mostra() {
                const p = persone.find((x) => x.valore === select.value);
                scelta.hidden = !p;
                cerca.hidden = !!p;
                nomeScelto.textContent = p ? p.testo : '';
            }

            function scegli(p) {
                select.value = p.valore;
                filtro.value = '';
                if (filtro === doc.activeElement) {
                    filtro.blur();
                }
                mostra();
                cambiato(select);
                cambia.focus({ preventScroll: true });
            }

            cambia.addEventListener('click', function () {
                select.value = '';
                cambiato(select);
                mostra();
                elenca();
                filtro.focus();
            });
            filtro.addEventListener('input', elenca);
            filtro.addEventListener('keydown', function (e) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    evidenzia(Math.min(attivo + 1, mostrati.length - 1));
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    evidenzia(Math.max(attivo - 1, 0));
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const p = mostrati[attivo >= 0 ? attivo : 0];
                    if (p && (attivo >= 0 || mostrati.length === 1)) {
                        scegli(p);
                    }
                }
            });
            nascondi(select);
            select.after(radiceP);
            select.addEventListener('change', mostra);
            select.npFuoco = function () {
                if (cerca.hidden) {
                    cambia.focus();
                } else {
                    filtro.focus();
                }
            };
            elenca();
            mostra();
        }

        function calendario(input) {
            const campoVisibile = pulsante('selettore apre-popup');
            campoVisibile.setAttribute('aria-haspopup', 'dialog');
            campoVisibile.setAttribute('aria-expanded', 'false');
            const etichetta = doc.querySelector('label[for="' + input.id + '"]');
            if (etichetta) {
                etichetta.htmlFor = '';
                etichetta.id = etichetta.id || input.id + '-etichetta';
                campoVisibile.setAttribute('aria-labelledby', etichetta.id);
                etichetta.addEventListener('click', () => campoVisibile.click());
            }
            const popup = el('div', 'popup calendario');
            popup.hidden = true;
            popup.setAttribute('role', 'dialog');
            popup.setAttribute('aria-label', 'Scegli la data');
            const testa = el('div', 'calendario-testa');
            const prima = pulsante('pulsante secondario', 'Mese prima');
            const titolo = el('strong', 'calendario-mese');
            const dopo = pulsante('pulsante secondario', 'Mese dopo');
            testa.append(prima, titolo, dopo);
            const griglia = el('div', 'calendario-griglia');
            const piede = el('div', 'popup-piede');
            const oggi = pulsante('pulsante secondario', 'Oggi');
            const ieri = pulsante('pulsante secondario', 'Ieri');
            const chiudi = pulsante('pulsante secondario', 'Chiudi');
            piede.append(oggi, ieri, chiudi);
            popup.append(testa, griglia, piede);
            const avvolto = el('div', 'con-popup');
            avvolto.append(campoVisibile, popup);
            let vista = new Date();

            function scrivi() {
                const t = dataLeggibile(input.value);
                campoVisibile.textContent = t || 'Scegli la data';
                campoVisibile.classList.toggle('vuoto', !t);
            }

            function disegna() {
                titolo.textContent = MESI[vista.getMonth()] + ' ' + vista.getFullYear();
                griglia.textContent = '';
                for (const g of GIORNI) {
                    griglia.appendChild(el('span', 'calendario-giorno', g));
                }
                const oggiIso = isoData(new Date());
                for (const c of grigliaMese(vista.getFullYear(), vista.getMonth())) {
                    if (c === null) {
                        griglia.appendChild(el('span'));
                        continue;
                    }
                    const b = pulsante('calendario-cella', String(+c.slice(8)));
                    b.setAttribute('aria-label', dataLeggibile(c));
                    if (c === input.value) {
                        b.setAttribute('aria-pressed', 'true');
                    }
                    if (c === oggiIso) {
                        b.classList.add('oggi');
                    }
                    b.addEventListener('click', () => imposta(c));
                    griglia.appendChild(b);
                }
            }

            function imposta(iso) {
                input.value = iso;
                scrivi();
                chiudiPopup();
                cambiato(input);
                campoVisibile.focus({ preventScroll: true });
            }

            campoVisibile.addEventListener('click', function () {
                if (!popup.hidden) {
                    chiudiPopup();
                    return;
                }
                vista = leggiData(input.value) || new Date();
                vista = new Date(vista.getFullYear(), vista.getMonth(), 1);
                disegna();
                apriPopup(campoVisibile, popup);
            });
            prima.addEventListener('click', function () {
                vista = new Date(vista.getFullYear(), vista.getMonth() - 1, 1);
                disegna();
            });
            dopo.addEventListener('click', function () {
                vista = new Date(vista.getFullYear(), vista.getMonth() + 1, 1);
                disegna();
            });
            oggi.addEventListener('click', () => imposta(isoData(new Date())));
            ieri.addEventListener('click', function () {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                imposta(isoData(d));
            });
            chiudi.addEventListener('click', chiudiPopup);
            nascondi(input);
            input.after(avvolto);
            input.npFuoco = () => campoVisibile.focus();
            scrivi();
        }

        function orario(input) {
            const passo = Math.max(1, parseInt(input.dataset.passo || '5', 10));
            const campoVisibile = pulsante('selettore apre-popup');
            campoVisibile.setAttribute('aria-haspopup', 'dialog');
            campoVisibile.setAttribute('aria-expanded', 'false');
            const etichetta = doc.querySelector('label[for="' + input.id + '"]');
            if (etichetta) {
                etichetta.htmlFor = '';
                etichetta.id = etichetta.id || input.id + '-etichetta';
                campoVisibile.setAttribute('aria-labelledby', etichetta.id);
                etichetta.addEventListener('click', () => campoVisibile.click());
            }
            const popup = el('div', 'popup orario');
            popup.hidden = true;
            popup.setAttribute('role', 'dialog');
            popup.setAttribute('aria-label', 'Scegli l\'ora');
            const colonne = el('div', 'orario-colonne');
            const ore = el('div', 'orario-ore');
            const minuti = el('div', 'orario-minuti');
            const colOre = el('div', 'orario-colonna');
            colOre.append(el('strong', 'orario-titolo', 'Ora'), ore);
            const colMin = el('div', 'orario-colonna');
            colMin.append(el('strong', 'orario-titolo', 'Minuti'), minuti);
            colonne.append(colOre, colMin);
            const piede = el('div', 'popup-piede');
            const togli = pulsante('pulsante secondario', 'Nessuna ora');
            const fatto = pulsante('pulsante', 'Fatto');
            piede.append(togli, fatto);
            popup.append(colonne, piede);
            const avvolto = el('div', 'con-popup');
            avvolto.append(campoVisibile, popup);
            let ora = null;
            let minuto = null;

            function scrivi() {
                const m = /^(\d{2}):(\d{2})/.exec(input.value);
                campoVisibile.textContent = m ? m[1] + ':' + m[2] : 'Scegli l\'ora';
                campoVisibile.classList.toggle('vuoto', !m);
            }

            function salva() {
                if (ora !== null) {
                    input.value = due(ora) + ':' + due(minuto === null ? 0 : minuto);
                    scrivi();
                    cambiato(input);
                }
            }

            function segna() {
                for (const b of ore.children) {
                    b.setAttribute('aria-pressed', +b.dataset.v === ora ? 'true' : 'false');
                }
                for (const b of minuti.children) {
                    b.setAttribute('aria-pressed', +b.dataset.v === minuto ? 'true' : 'false');
                }
            }

            for (let h = 0; h < 24; h++) {
                const b = pulsante('orario-cella', due(h));
                b.dataset.v = h;
                b.addEventListener('click', function () {
                    ora = h;
                    if (minuto === null) {
                        minuto = 0;
                    }
                    segna();
                    salva();
                });
                ore.appendChild(b);
            }
            for (let m = 0; m < 60; m += passo) {
                const b = pulsante('orario-cella', ':' + due(m));
                b.dataset.v = m;
                b.addEventListener('click', function () {
                    minuto = m;
                    if (ora === null) {
                        ora = 0;
                    }
                    segna();
                    salva();
                });
                minuti.appendChild(b);
            }
            campoVisibile.addEventListener('click', function () {
                if (!popup.hidden) {
                    chiudiPopup();
                    return;
                }
                const m = /^(\d{2}):(\d{2})/.exec(input.value);
                ora = m ? +m[1] : null;
                minuto = m ? +m[2] : null;
                segna();
                apriPopup(campoVisibile, popup);
            });
            togli.addEventListener('click', function () {
                input.value = '';
                ora = null;
                minuto = null;
                scrivi();
                cambiato(input);
                chiudiPopup();
            });
            fatto.addEventListener('click', function () {
                chiudiPopup();
                campoVisibile.focus({ preventScroll: true });
            });
            nascondi(input);
            input.after(avvolto);
            input.npFuoco = () => campoVisibile.focus();
            scrivi();
        }

        function contatore(campo) {
            const c = el('span', 'contatore');
            c.setAttribute('aria-live', 'polite');
            const aggiorna = function () {
                c.textContent = campo.value.length + ' / ' + campo.maxLength;
                c.classList.toggle('al-limite', campo.value.length >= campo.maxLength);
            };
            campo.addEventListener('input', aggiorna);
            const box = contenitore(campo);
            const sotto = box.querySelector('.campo-nota') || null;
            if (sotto) {
                sotto.appendChild(c);
            } else {
                const riga = el('div', 'campo-nota');
                riga.appendChild(c);
                campo.after(riga);
            }
            aggiorna();
        }

        function messaggio(campo) {
            if (campo.type === 'radio' || campo.tagName === 'SELECT') {
                return campo.dataset.persona !== undefined ? 'Scegli un nome dall\'elenco.' : 'Scegli una delle voci.';
            }
            if (campo.type === 'date') {
                return 'Scegli la data.';
            }
            return 'Campo obbligatorio.';
        }

        let primoErrore = null;

        doc.addEventListener('invalid', function (e) {
            const campo = e.target;
            e.preventDefault();
            const box = contenitore(campo);
            if (!box) {
                return;
            }
            box.classList.add('in-errore');
            let avviso = box.querySelector('.campo-errore');
            if (!avviso) {
                avviso = el('p', 'campo-errore');
                avviso.id = (campo.id || campo.name) + '-errore';
                avviso.setAttribute('role', 'alert');
                const etichetta = box.querySelector('label, .etichetta');
                if (etichetta) {
                    etichetta.after(avviso);
                } else {
                    box.prepend(avviso);
                }
            }
            avviso.textContent = messaggio(campo);
            if (!primoErrore) {
                primoErrore = campo;
                win.setTimeout(function () {
                    const c = primoErrore;
                    primoErrore = null;
                    contenitore(c).scrollIntoView({ block: 'center' });
                    if (c.npFuoco) {
                        c.npFuoco();
                    } else {
                        c.focus({ preventScroll: true });
                    }
                }, 0);
            }
        }, true);

        function pulisci(e) {
            const box = e.target.closest && e.target.closest('.campo.in-errore');
            if (box) {
                box.classList.remove('in-errore');
                const avviso = box.querySelector('.campo-errore');
                if (avviso) {
                    avviso.remove();
                }
            }
        }
        doc.addEventListener('input', pulisci);
        doc.addEventListener('change', pulisci);

        for (const s of doc.querySelectorAll('select[data-persona]')) {
            persona(s);
        }
        for (const s of doc.querySelectorAll('select[data-scelte]')) {
            scelte(s);
        }
        for (const i of doc.querySelectorAll('input[data-calendario]')) {
            calendario(i);
        }
        for (const i of doc.querySelectorAll('input[data-orario]')) {
            orario(i);
        }
        for (const c of doc.querySelectorAll('[data-contatore]')) {
            contatore(c);
        }
        doc.documentElement.classList.add('moduli-pronti');
    }

    return { normalizza, filtraPersone, isoData, leggiData, dataLeggibile, grigliaMese, monta };
});
