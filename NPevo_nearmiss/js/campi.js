(function (radice, fabbrica) {
    const api = fabbrica();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else {
        radice.NPCampi = api;
        if (typeof document !== 'undefined') {
            api.avvia(document);
        }
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const LIMITE_BYTE = 7000;

    function ora(d) {
        return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }

    function corpoTroppoGrande(corpo) {
        return new TextEncoder().encode(corpo).length > LIMITE_BYTE;
    }

    function collega(campo, salva) {
        const stato = campo.parentElement.querySelector('.campo-stato');
        let salvato = campo.value;
        let inCorso = null;

        function scrivi(testo, errore) {
            if (stato) {
                stato.textContent = testo;
                stato.classList.toggle('errore', !!errore);
            }
        }

        async function invia() {
            const valore = campo.value;
            if (valore === salvato) {
                return;
            }
            scrivi('Salvataggio', false);
            try {
                await salva(valore);
                salvato = valore;
                scrivi('Salvato alle ' + ora(new Date()), false);
            } catch (e) {
                scrivi('Non salvato: ' + e.message, true);
            }
        }

        campo.addEventListener('change', function () {
            inCorso = (inCorso || Promise.resolve()).then(invia);
        });
        return { salvato: () => salvato };
    }

    function avvia(doc) {
        const csrf = doc.body.dataset.csrf;
        for (const campo of doc.querySelectorAll('textarea[data-tipo][data-campo]')) {
            collega(campo, async function (valore) {
                const corpo = new URLSearchParams({ csrf: csrf, tipo: campo.dataset.tipo, id: campo.dataset.id, campo: campo.dataset.campo, valore: valore }).toString();
                if (corpoTroppoGrande(corpo)) {
                    throw new Error('testo troppo lungo');
                }
                const r = await fetch(campo.dataset.url, {
                    method: 'POST',
                    credentials: 'same-origin',
                    cache: 'no-store',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: corpo
                });
                const j = await r.json().catch(() => null);
                if (!r.ok || !j) {
                    throw new Error((j && j.errore) || 'risposta non valida (HTTP ' + r.status + ')');
                }
            });
        }
    }

    return { LIMITE_BYTE, corpoTroppoGrande, collega, avvia };
});
