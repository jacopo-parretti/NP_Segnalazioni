'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const RADICE = path.join(__dirname, '..');
const PHP = process.env.PHP_BIN || path.join(process.env.LOCALAPPDATA || '', 'php82', 'php.exe');
const QUESTO = path.relative(RADICE, __filename).split(path.sep).join('/');
const CARTELLE = ['NPmonitor', 'NPevo_nearmiss'];
const BINARI = /\.(png|jpg|jpeg|gif|ico|pdf)$/i;

const errori = [];
const esiti = [];

function controllo(nome, fn) {
    const prima = errori.length;
    try {
        fn();
    } catch (e) {
        errori.push(nome + ': ' + e.message);
    }
    esiti.push((errori.length === prima ? 'OK   ' : 'FALLITO ') + nome);
}

function leggi(f) {
    return fs.readFileSync(path.join(RADICE, f), 'utf8');
}

function tracciabili() {
    const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: RADICE, encoding: 'utf8' });
    return out.split('\n').map((s) => s.trim()).filter(Boolean);
}

function vendor(f) {
    return /(^|\/)js\/vendor\//.test(f);
}

function riga(t, i) {
    return t.slice(0, i).split('\n').length;
}

function saltaStringa(t, i, q) {
    let j = i + 1;
    while (j < t.length) {
        if (t[j] === '\\') {
            j += 2;
        } else if (t[j] === q) {
            return j + 1;
        } else {
            j++;
        }
    }
    return j;
}

function saltaRegex(t, i) {
    let j = i + 1;
    let classe = false;
    while (j < t.length && t[j] !== '\n') {
        if (t[j] === '\\') {
            j += 2;
            continue;
        }
        if (t[j] === '[') {
            classe = true;
        } else if (t[j] === ']') {
            classe = false;
        } else if (t[j] === '/' && !classe) {
            j++;
            while (/[a-z]/.test(t[j] || '')) {
                j++;
            }
            return j;
        }
        j++;
    }
    return j;
}

function commentiJs(t) {
    let prec = '';
    let i = 0;
    while (i < t.length) {
        const c = t[i];
        const d = t[i + 1];
        if (c === '/' && (d === '/' || d === '*')) {
            return riga(t, i);
        }
        if (c === '\'' || c === '"' || c === '`') {
            i = saltaStringa(t, i, c);
            prec = 'a';
            continue;
        }
        if (c === '/' && (prec === '' || '(,=:[!&|?{};+-*%<>~^'.includes(prec) || /\b(return|typeof|case)\s*$/.test(t.slice(Math.max(0, i - 8), i)))) {
            i = saltaRegex(t, i);
            prec = 'a';
            continue;
        }
        if (!/\s/.test(c)) {
            prec = c;
        }
        i++;
    }
    return 0;
}

function commentiCss(t) {
    let i = 0;
    while (i < t.length) {
        if (t[i] === '\'' || t[i] === '"') {
            i = saltaStringa(t, i, t[i]);
            continue;
        }
        if (t[i] === '/' && t[i + 1] === '*') {
            return riga(t, i);
        }
        i++;
    }
    return 0;
}

function commentiPs1(t) {
    let i = 0;
    while (i < t.length) {
        const c = t[i];
        if (c === '\'') {
            let j = i + 1;
            while (j < t.length && !(t[j] === '\'' && t[j + 1] !== '\'')) {
                j += t[j] === '\'' ? 2 : 1;
            }
            i = j + 1;
            continue;
        }
        if (c === '"') {
            let j = i + 1;
            while (j < t.length && t[j] !== '"') {
                j += t[j] === '`' ? 2 : 1;
            }
            i = j + 1;
            continue;
        }
        if (c === '#') {
            return riga(t, i);
        }
        i++;
    }
    return 0;
}

function commentiSql(t) {
    let i = 0;
    while (i < t.length) {
        if (t[i] === '\'') {
            i = saltaStringa(t, i, '\'');
            continue;
        }
        if ((t[i] === '-' && t[i + 1] === '-') || (t[i] === '/' && t[i + 1] === '*')) {
            return riga(t, i);
        }
        i++;
    }
    return 0;
}

function commentiCmd(t) {
    const righe = t.split(/\r?\n/);
    const k = righe.findIndex((r) => /^\s*@?\s*(rem\b|::)/i.test(r));
    return k + 1;
}

function commentiRighe(t) {
    const righe = t.split(/\r?\n/);
    const k = righe.findIndex((r) => /^\s*#/.test(r));
    return k + 1;
}

function segretiReali() {
    const valori = new Set();
    for (const f of ['NPmonitor/config.php', 'NPevo_nearmiss/config.php', 'prova/config.php']) {
        if (!fs.existsSync(path.join(RADICE, f))) {
            continue;
        }
        const r = spawnSync(PHP, ['-r', '$c = require $argv[1]; echo json_encode([$c["db"]["password"] ?? "", $c["power_automate"]["url"] ?? ""]);', path.join(RADICE, f)], { encoding: 'utf8' });
        if (r.status === 0) {
            for (const v of JSON.parse(r.stdout)) {
                valori.add(v);
            }
        }
    }
    const legacy = path.join(RADICE, '..');
    const fonti = [
        [path.join(legacy, 'NPevo_nearmiss', 'confirm.php'), /"PWD"\s*=>\s*"([^"]+)"/],
        [path.join(legacy, 'NPmonitor', 'nearmiss', 'insert_nearmiss.php'), /\$endpoint\s*=\s*"([^"]+)"/]
    ];
    for (const [file, regola] of fonti) {
        if (fs.existsSync(file)) {
            const m = fs.readFileSync(file, 'utf8').match(regola);
            if (m) {
                valori.add(m[1]);
            }
        }
    }
    return [...valori].filter((v) => v.length >= 6);
}

const tutti = tracciabili();
const testuali = tutti.filter((f) => !BINARI.test(f));
const nostri = testuali.filter((f) => !vendor(f) && !f.endsWith('.md') && !f.endsWith('.json'));

controllo('nessun config.php tracciabile da git', () => {
    const presenti = tutti.filter((f) => /(^|\/)config\.php$/.test(f));
    if (presenti.length) {
        throw new Error(presenti.join(', '));
    }
    for (const f of ['NPmonitor/config.php', 'NPevo_nearmiss/config.php', 'prova/config.php']) {
        if (fs.existsSync(path.join(RADICE, f)) && spawnSync('git', ['check-ignore', '-q', f], { cwd: RADICE }).status !== 0) {
            throw new Error(f + ' non ignorato');
        }
    }
});

controllo('nessun segreto (password ced_db, URL Power Automate) nei file tracciabili', () => {
    const segreti = segretiReali();
    if (segreti.length === 0) {
        throw new Error('nessun valore reale da cercare: genera i config.php con tools/genera-config.js');
    }
    const host = /https?:\/\/[^\s'"]*(logic\.azure|powerautomate|powerplatform)/i;
    for (const f of testuali) {
        const t = leggi(f);
        for (const s of segreti) {
            if (t.includes(s)) {
                throw new Error(f + ' contiene un segreto');
            }
        }
        if (host.test(t)) {
            throw new Error(f + ' contiene un URL di Power Automate');
        }
    }
});

controllo('nessun commento nel codice scritto da noi', () => {
    const php = nostri.filter((f) => f.endsWith('.php'));
    const r = spawnSync(PHP, [path.join(__dirname, 'commenti.php'), ...php.map((f) => path.join(RADICE, f))], { encoding: 'utf8' });
    if (r.status !== 0) {
        throw new Error('analisi PHP non riuscita: ' + r.stderr);
    }
    const trovati = JSON.parse(r.stdout).map((s) => path.relative(RADICE, s));
    const regole = [
        [/\.js$/, commentiJs],
        [/\.css$/, commentiCss],
        [/\.ps1$/, commentiPs1],
        [/\.cmd$/, commentiCmd],
        [/\.sql$/, commentiSql],
        [/(^|\/)\.git(ignore|attributes)$/, commentiRighe]
    ];
    for (const f of nostri) {
        for (const [regola, fn] of regole) {
            if (regola.test(f)) {
                const n = fn(leggi(f));
                if (n) {
                    trovati.push(f + ':' + n);
                }
            }
        }
    }
    if (trovati.length) {
        throw new Error(trovati.join(', '));
    }
});

controllo('vendor, cifra.js e librerie comuni identici nelle due cartelle', () => {
    const comuni = ['js/cifra.js', 'lib/db.php', 'lib/segnalazione.php', 'config.example.php'];
    const v1 = fs.readdirSync(path.join(RADICE, 'NPmonitor', 'js', 'vendor')).sort();
    const v2 = fs.readdirSync(path.join(RADICE, 'NPevo_nearmiss', 'js', 'vendor')).sort();
    if (JSON.stringify(v1) !== JSON.stringify(v2)) {
        throw new Error('js/vendor ha file diversi');
    }
    for (const f of comuni.concat(v1.map((x) => 'js/vendor/' + x))) {
        const a = fs.readFileSync(path.join(RADICE, 'NPmonitor', f));
        const b = fs.readFileSync(path.join(RADICE, 'NPevo_nearmiss', f));
        if (!a.equals(b)) {
            throw new Error(f + ' diverso');
        }
    }
});

controllo('nessun URL esterno nelle pagine', () => {
    for (const f of nostri.filter((x) => CARTELLE.some((c) => x.startsWith(c + '/')))) {
        const t = leggi(f);
        if (/https?:\/\//i.test(t) || /(src|href|action)\s*=\s*["']?\/\//i.test(t) || /@import/i.test(t) || /url\(\s*["']?(https?:)?\/\//i.test(t)) {
            throw new Error(f);
        }
    }
});

controllo('nessun DELETE, DROP o TRUNCATE nel codice che va su srv-web; nessuna scrittura su USERS ovunque', () => {
    for (const f of nostri.filter((x) => CARTELLE.some((c) => x.startsWith(c + '/')))) {
        if (/\b(DELETE|DROP|TRUNCATE)\b/i.test(leggi(f))) {
            throw new Error(f + ' contiene DELETE/DROP/TRUNCATE');
        }
    }
    const users = /\b(UPDATE|INSERT\s+INTO|DELETE\s+FROM|MERGE(\s+INTO)?|DROP\s+TABLE|TRUNCATE\s+TABLE|ALTER\s+TABLE)\s+(dbo\.)?\[?USERS\b/i;
    for (const f of nostri) {
        if (users.test(leggi(f))) {
            throw new Error(f + ' scrive su USERS');
        }
    }
    for (const f of nostri.filter((x) => x.startsWith('prova/'))) {
        if (/\bDROP\b/i.test(leggi(f)) && f !== 'prova/db_prova.php') {
            throw new Error(f + ' contiene DROP');
        }
    }
});

controllo('nessun file del questionario visitatori né dei moduli duplicati', () => {
    const vietati = tutti.filter((f) => /(^|\/)(esterno|quest_grad_it|quest_grad_en)\//i.test(f) || /quest(list|stats|explosion)\.php$|insert_quest\.php$/i.test(f) || /^NPevo_nearmiss\/interno\/(kaizen|nearmiss)\/index\.php$/.test(f));
    if (vietati.length) {
        throw new Error(vietati.join(', '));
    }
});

controllo('un solo documento: README.md', () => {
    const md = tutti.filter((f) => f.toLowerCase().endsWith('.md'));
    if (md.length !== 1 || md[0] !== 'README.md') {
        throw new Error(md.join(', ') || 'README.md mancante');
    }
});

controllo('nessun TODO, FIXME, test saltato o esclusivo', () => {
    for (const f of nostri.filter((x) => x !== QUESTO)) {
        const t = leggi(f);
        if (/\b(TODO|FIXME|XXX|HACK)\b/.test(t) || /\b(test|it|describe)\.(skip|only|todo)\b/.test(t) || /\{\s*(skip|only|todo)\s*:\s*true/.test(t)) {
            throw new Error(f);
        }
    }
});

controllo('file di testo in UTF-8 senza BOM', () => {
    for (const f of testuali) {
        const b = fs.readFileSync(path.join(RADICE, f));
        if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) {
            throw new Error(f + ' ha il BOM');
        }
        if (!vendor(f) && new TextDecoder('utf-8', { fatal: true }).decode(b).includes(String.fromCharCode(0xfeff))) {
            throw new Error(f + ' contiene un carattere BOM invisibile');
        }
    }
});

controllo('php -l su tutti i file PHP', () => {
    for (const f of nostri.filter((x) => x.endsWith('.php'))) {
        const r = spawnSync(PHP, ['-l', path.join(RADICE, f)], { encoding: 'utf8' });
        if (r.status !== 0) {
            throw new Error(f + ': ' + r.stdout + r.stderr);
        }
    }
});

controllo('nessun input HTTP concatenato in una stringa SQL', () => {
    for (const f of nostri.filter((x) => x.endsWith('.php'))) {
        for (const r of leggi(f).split('\n')) {
            if (/\b(SELECT|INSERT|UPDATE|WHERE|VALUES)\b/.test(r) && /\$_(GET|POST|REQUEST|COOKIE|SERVER)/.test(r)) {
                throw new Error(f + ': ' + r.trim());
            }
        }
    }
});

for (const e of esiti) {
    console.log(e);
}
if (errori.length) {
    console.error('\n' + errori.join('\n'));
    process.exit(1);
}
console.log('\nTutti i controlli superati (' + esiti.length + ').');
