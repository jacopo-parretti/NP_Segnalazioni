(function (radice, fabbrica) {
    if (typeof module === 'object' && module.exports) {
        module.exports = fabbrica(require('./cifra.js'));
    } else {
        fabbrica(radice.NPCifra).avvia(radice.document, radice.sessionStorage);
    }
})(typeof self !== 'undefined' ? self : this, function (C) {
    'use strict';

    const STILE_TABELLA = 'border-collapse:collapse; table-layout:fixed; width:100%;';
    const STILE_TH = 'background:#2e3e6a; color:#ffffff; font-weight:bold; border:1px solid #000000; padding:6px; text-align:center;';
    const STILE_TD = 'border:1px solid #000000; padding:6px; text-align:center;';
    const INTESTAZIONI = ['ID', 'DATA INSERIMENTO', 'TIPOLOGIA', 'LUOGO', 'DATA EVENTO', 'ORA EVENTO', 'DESCRIZIONE', 'COINVOLGIMENTO', 'PROVE', 'SEGNALATO', 'MATRICOLA'];

    function data(t) {
        if (typeof t !== 'string' || t.length < 10) {
            return '';
        }
        const p = t.slice(0, 10).split('-');
        return p[2] + '/' + p[1] + '/' + p[0];
    }

    function istante(t) {
        if (typeof t !== 'string' || t.length < 19) {
            return data(t);
        }
        return data(t) + ' ' + t.slice(11, 19);
    }

    function ora(t) {
        return typeof t === 'string' ? t.slice(0, 5) : '';
    }

    function testo(v) {
        return v === null || v === undefined ? '' : String(v);
    }

    function recordDi(riga, segreta) {
        if (riga.chiaro) {
            return riga.chiaro;
        }
        if (riga.cifrato) {
            return C.decifraSegnalazione(riga.cifrato, segreta);
        }
        return {};
    }

    function colonne(riga, record) {
        if (!record) {
            return ['S' + riga.id, data(riga.data_inserimento), '', '', '', '', 'Non decifrabile con questa chiave', '', '', '', ''];
        }
        return [
            'S' + riga.id,
            record.data_inserimento ? istante(record.data_inserimento) : data(riga.data_inserimento),
            testo(record.tipologia),
            testo(record.luogo),
            data(record.data_evento),
            ora(record.ora_evento),
            testo(record.descrizione),
            testo(record.coinvolgimento),
            record.prove === 'SI' ? 'SI' : 'NO',
            record.segnalato === 'SI' ? 'SI' : 'NO',
            testo(record.matricola)
        ];
    }

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function htmlExcel(tabella) {
        let html = '<table style=\'' + STILE_TABELLA + '\'><thead><tr>';
        for (const t of INTESTAZIONI) {
            html += '<th style=\'' + STILE_TH + '\'>' + esc(t) + '</th>';
        }
        html += '</tr></thead><tbody>';
        for (const r of tabella) {
            html += '<tr>';
            for (const c of r) {
                html += '<td style=\'' + STILE_TD + '\'>' + esc(c) + '</td>';
            }
            html += '</tr>';
        }
        return html + '</tbody></table>';
    }

    function nomeFile(d) {
        const due = (n) => String(n).padStart(2, '0');
        return 'segnalazioni_' + d.getFullYear() + due(d.getMonth() + 1) + due(d.getDate()) + '_' + due(d.getHours()) + due(d.getMinutes()) + due(d.getSeconds()) + '.xls';
    }

    function avvia(doc, archivio) {
        const csrf = doc.body.dataset.csrf;
        const stato = doc.getElementById('stato');
        const lista = doc.getElementById('lista');
        const corpo = doc.getElementById('righe');
        let tabella = [];

        if (!stato) {
            return;
        }

        function messaggio(t, errore) {
            stato.textContent = t;
            stato.classList.toggle('errore', !!errore);
            stato.classList.remove('hidden');
        }

        function messaggioConLink(t, href, etichetta) {
            messaggio(t, true);
            const a = doc.createElement('a');
            a.href = href;
            a.className = 'btn';
            a.textContent = etichetta;
            stato.appendChild(doc.createTextNode(' '));
            stato.appendChild(a);
        }

        async function richiesta(url, dati) {
            const opzioni = { credentials: 'same-origin', cache: 'no-store' };
            if (dati) {
                opzioni.method = 'POST';
                opzioni.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
                opzioni.body = new URLSearchParams(Object.assign({ csrf: csrf }, dati));
            }
            const r = await fetch(url, opzioni);
            let j = null;
            try {
                j = await r.json();
            } catch (e) {
                j = null;
            }
            if (!r.ok || !j) {
                const err = new Error((j && j.errore) || 'Risposta non valida dal server.');
                err.dati = j;
                err.codice = r.status;
                throw err;
            }
            return j;
        }

        const api = {
            leggi: () => richiesta('api_righe.php'),
            salva: (id, cifrato, precedente) => richiesta('api_salva_cifrato.php', { id: String(id), cifrato: cifrato, precedente: precedente || '' }),
            svuota: (elenco) => richiesta('api_svuota_chiaro.php', { righe: JSON.stringify(elenco) })
        };

        function mostraImpronta(pubblica, appenaCreata) {
            const impronta = C.impronta(pubblica);
            doc.getElementById('improntaLista').textContent = 'Impronta della chiave del gestore (da mettere in NPmonitor/config.php): ' + impronta;
            if (appenaCreata) {
                doc.getElementById('impronta').textContent = impronta;
                doc.getElementById('improntaComando').textContent = impronta;
                doc.getElementById('pannelloImpronta').classList.remove('hidden');
            }
        }

        function disegna(righe, segreta) {
            tabella = righe.map((r) => colonne(r, recordDi(r, segreta)));
            corpo.textContent = '';
            for (const r of tabella) {
                const tr = doc.createElement('tr');
                for (const c of r) {
                    const td = doc.createElement('td');
                    td.textContent = c;
                    tr.appendChild(td);
                }
                corpo.appendChild(tr);
            }
            lista.classList.remove('hidden');
        }

        async function apriLista(pubblica, segreta) {
            let avviso = '';
            let errore = false;
            try {
                const esito = await C.migraStorico(api, pubblica, segreta);
                if (esito.esito === 'svuotate') {
                    avviso = 'Storico cifrato: ' + esito.svuotate + ' segnalazioni verificate e svuotate in chiaro. Righe in tabella prima ' + esito.totalePrima + ', dopo ' + esito.totaleDopo + '.';
                } else if (esito.esito === 'diverso') {
                    errore = true;
                    avviso = 'La segnalazione S' + esito.id + ' non coincide dopo la cifratura (' + esito.campi.join(', ') + '): nessun campo in chiaro è stato svuotato. Righe in tabella prima ' + esito.totalePrima + ', dopo ' + esito.totaleDopo + '.';
                }
            } catch (e) {
                errore = true;
                avviso = 'Cifratura dello storico non completata: ' + e.message;
            }
            const dati = await api.leggi();
            disegna(dati.righe, segreta);
            if (avviso) {
                messaggio(avviso, errore);
            } else {
                stato.classList.add('hidden');
            }
        }

        function impostaChiave(chiaveSessione) {
            const pannello = doc.getElementById('impostazione');
            const passo = doc.getElementById('passoEmergenza');
            const conferma = doc.getElementById('conferma');
            const genera = doc.getElementById('genera');
            const attiva = doc.getElementById('attiva');
            let nuova = null;
            pannello.classList.remove('hidden');
            messaggio('La chiave delle segnalazioni non è ancora impostata.', false);

            function scarta(motivo) {
                nuova = null;
                for (const id of ['emergenza', 'emergenzaStampa', 'dataStampa']) {
                    doc.getElementById(id).textContent = '';
                }
                pannello.classList.add('hidden');
                messaggio(motivo + ' La pagina si ricarica tra pochi secondi.', true);
                setTimeout(() => window.location.reload(), 8000);
            }

            async function giaImpostata() {
                const k = await richiesta('api_chiave.php');
                return k.esiste ? k : null;
            }

            genera.addEventListener('click', async function () {
                if (nuova) {
                    return;
                }
                genera.disabled = true;
                try {
                    if (await giaImpostata()) {
                        scarta('Un\'altra sessione ha già impostato la chiave delle segnalazioni: qui non ne viene creata un\'altra.');
                        return;
                    }
                } catch (e) {
                    genera.disabled = false;
                    messaggio('Impossibile controllare la chiave esistente: ' + e.message, true);
                    return;
                }
                nuova = C.generaChiaveGestore(chiaveSessione);
                doc.getElementById('emergenza').textContent = nuova.emergenza.split('-').join(' ');
                doc.getElementById('emergenzaStampa').textContent = nuova.emergenza.split('-').join(' ');
                doc.getElementById('dataStampa').textContent = 'Creata il ' + new Date().toLocaleDateString('it-IT');
                passo.classList.remove('hidden');
            });
            doc.getElementById('stampa').addEventListener('click', () => window.print());
            attiva.addEventListener('click', async function () {
                if (!nuova) {
                    return;
                }
                if (conferma.value.trim().toUpperCase() !== C.ultimoGruppo(nuova.emergenza)) {
                    messaggio('L\'ultimo gruppo non coincide: controlla la chiave stampata.', true);
                    return;
                }
                attiva.disabled = true;
                try {
                    await richiesta('api_chiave.php', {
                        azione: 'crea',
                        pubblica: nuova.pubblica,
                        privata_password: nuova.privataDaPassword,
                        privata_emergenza: nuova.privataDaEmergenza,
                        sale: archivio.getItem('npseg.sale'),
                        parametri: archivio.getItem('npseg.parametri')
                    });
                } catch (e) {
                    let esistente = null;
                    try {
                        esistente = await giaImpostata();
                    } catch (e2) {
                        esistente = null;
                    }
                    if (!esistente || esistente.pubblica !== nuova.pubblica) {
                        if (esistente || e.codice === 409) {
                            scarta('Un\'altra sessione ha impostato la chiave nel frattempo: la chiave di emergenza mostrata qui NON vale, distruggi l\'eventuale stampa.');
                        } else {
                            attiva.disabled = false;
                            messaggio('Chiave non salvata: ' + e.message + '. Riprova: la chiave di emergenza mostrata resta quella da usare.', true);
                        }
                        return;
                    }
                }
                doc.getElementById('emergenza').textContent = '';
                doc.getElementById('emergenzaStampa').textContent = '';
                pannello.classList.add('hidden');
                messaggio('Chiave attivata. Cifratura dello storico in corso…', false);
                mostraImpronta(nuova.pubblica, true);
                await apriLista(nuova.pubblica, nuova.segreta);
            });
        }

        async function inizia() {
            const chiaveSessione = C.daBase64(archivio.getItem('npseg.chiave') || '');
            if (!chiaveSessione || chiaveSessione.length !== 32) {
                const errore = archivio.getItem('npseg.errore');
                messaggioConLink(errore
                    ? 'La chiave di decifratura non è stata calcolata al login (' + errore + '). Esci e accedi di nuovo.'
                    : 'La chiave di decifratura non è in questa scheda: si perde aprendo la gestione in una scheda nuova, chiudendo la scheda o uscendo. Esci e accedi di nuovo.', '../../logout.php', 'Esci');
                return;
            }
            let k;
            try {
                k = await richiesta('api_chiave.php');
            } catch (e) {
                messaggio('Impossibile leggere la chiave delle segnalazioni: ' + e.message, true);
                return;
            }
            if (!k.esiste) {
                if (!archivio.getItem('npseg.sale') || !archivio.getItem('npseg.parametri')) {
                    messaggioConLink('Esci e accedi di nuovo prima di impostare la chiave.', '../../logout.php', 'Esci');
                    return;
                }
                impostaChiave(chiaveSessione);
                return;
            }
            const segreta = C.apri(k.privata_password, chiaveSessione);
            if (!segreta || !C.coppiaValida(segreta, k.pubblica)) {
                messaggioConLink('La password attuale non apre la chiave delle segnalazioni.', 'emergenza.php', 'Usa la chiave di emergenza o la vecchia password');
                return;
            }
            mostraImpronta(k.pubblica, false);
            await apriLista(k.pubblica, segreta);
        }

        doc.getElementById('esporta').addEventListener('click', function () {
            const blob = new Blob(['\ufeff' + htmlExcel(tabella)], { type: 'application/vnd.ms-excel;charset=utf-8' });
            const a = doc.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = nomeFile(new Date());
            doc.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(a.href), 10000);
        });

        inizia().catch((e) => messaggio('Errore: ' + e.message, true));
    }

    return { colonne, htmlExcel, nomeFile, recordDi, avvia };
});
