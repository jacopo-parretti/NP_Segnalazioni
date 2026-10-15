(function () {
    'use strict';

    const C = window.NPCifra;
    const contenitore = document.getElementById('segnalazioneForm');
    const invia = document.getElementById('invia');
    const errore = document.getElementById('errore');
    const fornire = document.getElementById('fornireDati');
    const datiPersonali = document.getElementById('datiPersonali');
    const matricola = document.getElementById('matricolaSelect');
    const pubblica = contenitore.dataset.chiave;

    function valore(id) {
        return document.getElementById(id).value;
    }

    function aggiornaDatiPersonali() {
        const mostra = fornire.value === 'SI';
        datiPersonali.classList.toggle('hidden', !mostra);
        matricola.required = mostra;
    }

    function controlli() {
        return [
            document.getElementById('tipologia'),
            document.getElementById('descrizione'),
            document.getElementById('luogo'),
            document.getElementById('data'),
            document.getElementById('ora'),
            document.getElementById('coinv1'),
            document.getElementById('prove'),
            document.getElementById('giaSegnalato'),
            fornire,
            matricola
        ];
    }

    function valido() {
        for (const c of controlli()) {
            if (!c.reportValidity()) {
                return false;
            }
        }
        if (valore('descrizione').trim() === '' || valore('luogo').trim() === '') {
            document.getElementById(valore('descrizione').trim() === '' ? 'descrizione' : 'luogo').focus();
            return false;
        }
        return true;
    }

    function record() {
        const scelta = document.querySelector('input[name="coinvolgimento"]:checked');
        return {
            tipologia: valore('tipologia'),
            descrizione: valore('descrizione').trim(),
            luogo: valore('luogo').trim(),
            data_evento: valore('data'),
            ora_evento: valore('ora') || null,
            coinvolgimento: scelta ? scelta.value : null,
            prove: valore('prove'),
            segnalato: valore('giaSegnalato'),
            matricola: fornire.value === 'SI' && matricola.value ? matricola.value : null
        };
    }

    function spedisci(campi) {
        const modulo = document.createElement('form');
        modulo.method = 'post';
        modulo.action = 'Pagine/insert_segnalazioni.php';
        for (const nome of Object.keys(campi)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = nome;
            input.value = campi[nome];
            modulo.appendChild(input);
        }
        document.body.appendChild(modulo);
        modulo.submit();
    }

    fornire.addEventListener('change', aggiornaDatiPersonali);

    invia.addEventListener('click', function () {
        errore.classList.add('hidden');
        if (!valido()) {
            return;
        }
        invia.disabled = true;
        try {
            spedisci(C.campiInvio(record(), pubblica));
        } catch (e) {
            errore.textContent = 'Impossibile cifrare la segnalazione: nessun dato è stato inviato.';
            errore.classList.remove('hidden');
            invia.disabled = false;
        }
    });

    if (C && pubblica) {
        invia.disabled = false;
    }
})();
