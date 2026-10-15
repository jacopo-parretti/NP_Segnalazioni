(function () {
    'use strict';

    const C = window.NPCifra;
    const modulo = document.getElementById('accesso');
    const utente = document.getElementById('usr');
    const password = document.getElementById('pw');
    const pulsante = document.getElementById('accedi');
    const errore = document.getElementById('errore');
    const loader = document.getElementById('loader');

    function attesa(si) {
        loader.classList.toggle('nascosto', !si);
        pulsante.disabled = si;
    }

    function fallito(messaggio) {
        attesa(false);
        errore.textContent = messaggio;
        errore.hidden = false;
    }

    modulo.addEventListener('submit', async function (e) {
        e.preventDefault();
        errore.hidden = true;
        attesa(true);
        const pw = password.value;
        let risposta;
        try {
            const r = await fetch('confirm.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ usr: utente.value, accesso: C.accessoDaPassword(pw) })
            });
            risposta = await r.json();
        } catch (err) {
            fallito('Servizio non raggiungibile. Riprova più tardi.');
            return;
        }
        if (!risposta || risposta.ok !== true) {
            fallito('Identificazione non riuscita: nome utente o password errati');
            return;
        }
        password.value = '';
        try {
            const sale = risposta.sale || C.nuovoSale();
            const parametri = risposta.parametri || C.testoParametri();
            const chiave = await C.derivaChiave(pw, sale, parametri);
            sessionStorage.setItem('npseg.chiave', C.inBase64(chiave));
            sessionStorage.setItem('npseg.sale', sale);
            sessionStorage.setItem('npseg.parametri', parametri);
        } catch (err) {
            const motivo = (err && err.message) || String(err);
            try {
                sessionStorage.clear();
                sessionStorage.setItem('npseg.errore', motivo);
            } catch (e2) {
                errore.dataset.archivio = 'non disponibile';
            }
            attesa(false);
            pulsante.disabled = true;
            errore.textContent = 'Accesso riuscito, ma il browser non è riuscito a calcolare la chiave delle segnalazioni (' + motivo + '). Kaizen e Near Miss funzionano; le segnalazioni restano chiuse finché non accedi di nuovo da un browser aggiornato. ';
            const avanti = document.createElement('a');
            avanti.href = 'interno/index.php';
            avanti.textContent = 'Continua';
            errore.appendChild(avanti);
            errore.hidden = false;
            return;
        }
        window.location.href = 'interno/index.php';
    });

    try {
        sessionStorage.clear();
    } catch (e) {
        errore.textContent = 'Questo browser non permette di conservare la chiave delle segnalazioni (sessionStorage bloccato): Kaizen e Near Miss funzionano, le segnalazioni no.';
        errore.hidden = false;
    }
    attesa(false);
})();
