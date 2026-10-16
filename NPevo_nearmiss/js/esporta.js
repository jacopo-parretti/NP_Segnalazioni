(function () {
    'use strict';

    const X = window.NPXlsx;

    for (const b of document.querySelectorAll('[data-export]')) {
        const etichetta = b.textContent;
        b.addEventListener('click', async function () {
            b.disabled = true;
            b.textContent = 'Preparazione del file';
            try {
                const r = await fetch(b.dataset.export, { credentials: 'same-origin', cache: 'no-store' });
                const j = await r.json().catch(() => null);
                if (!r.ok || !j || !Array.isArray(j.righe)) {
                    throw new Error((j && j.errore) || 'risposta non valida');
                }
                X.scarica(document, X.nomeFile(j.prefisso, new Date()), X.creaXlsx(j.intestazioni, j.righe, j.foglio));
                b.textContent = etichetta;
            } catch (e) {
                b.textContent = 'Esportazione non riuscita: ' + e.message;
                setTimeout(() => { b.textContent = etichetta; }, 4000);
            } finally {
                b.disabled = false;
            }
        });
    }
})();
