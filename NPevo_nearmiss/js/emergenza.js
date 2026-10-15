(function () {
    'use strict';

    const C = window.NPCifra;
    const csrf = document.body.dataset.csrf;
    const stato = document.getElementById('stato');
    const campo = document.getElementById('chiave');
    const vecchiaPassword = document.getElementById('vecchia');
    const pulsante = document.getElementById('apri');

    function messaggio(t, errore) {
        stato.textContent = t;
        stato.classList.toggle('errore', !!errore);
        stato.classList.remove('hidden');
    }

    async function richiesta(url, dati) {
        const opzioni = { credentials: 'same-origin', cache: 'no-store' };
        if (dati) {
            opzioni.method = 'POST';
            opzioni.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            opzioni.body = new URLSearchParams(Object.assign({ csrf: csrf }, dati));
        }
        const r = await fetch(url, opzioni);
        const j = await r.json().catch(() => null);
        if (!r.ok || !j) {
            throw new Error((j && j.errore) || 'Risposta non valida dal server.');
        }
        return j;
    }

    pulsante.addEventListener('click', async function () {
        const chiaveSessione = C.daBase64(sessionStorage.getItem('npseg.chiave') || '');
        if (!chiaveSessione || chiaveSessione.length !== 32) {
            messaggio('La chiave della password non è in questa sessione del browser: esci e accedi di nuovo.', true);
            return;
        }
        const vecchia = vecchiaPassword.value;
        const conEmergenza = campo.value.trim() !== '';
        if (conEmergenza === (vecchia !== '')) {
            messaggio('Compila uno solo dei due campi: la chiave di emergenza oppure la vecchia password.', true);
            return;
        }
        const emergenza = conEmergenza ? C.emergenzaDaTesto(campo.value) : null;
        if (conEmergenza && !emergenza) {
            messaggio('La chiave di emergenza deve avere 64 caratteri (16 gruppi da 4).', true);
            return;
        }
        pulsante.disabled = true;
        try {
            const k = await richiesta('api_chiave.php?emergenza=1');
            if (!k.esiste) {
                throw new Error('la chiave delle segnalazioni non è ancora impostata.');
            }
            if (k.sale !== sessionStorage.getItem('npseg.sale') || k.parametri !== sessionStorage.getItem('npseg.parametri')) {
                throw new Error('esci e accedi di nuovo, poi riprova.');
            }
            const segreta = conEmergenza
                ? C.apri(k.privata_emergenza, emergenza)
                : C.apri(k.privata_password, await C.derivaChiave(vecchia, k.sale, k.parametri));
            if (!segreta || !C.coppiaValida(segreta, k.pubblica)) {
                throw new Error(conEmergenza ? 'la chiave di emergenza non è corretta.' : 'la vecchia password non apre la chiave delle segnalazioni.');
            }
            await richiesta('api_chiave.php', { azione: 'reincapsula', privata_password: C.incapsula(segreta, chiaveSessione) });
            segreta.fill(0);
            campo.value = '';
            vecchiaPassword.value = '';
            messaggio('Fatto: le segnalazioni si aprono di nuovo con la password attuale.', false);
            const a = document.createElement('a');
            a.href = 'segnalazionilist.php';
            a.className = 'btn';
            a.textContent = 'Vai alla lista';
            stato.appendChild(document.createTextNode(' '));
            stato.appendChild(a);
        } catch (e) {
            pulsante.disabled = false;
            messaggio('Operazione non riuscita: ' + e.message, true);
        }
    });
})();
