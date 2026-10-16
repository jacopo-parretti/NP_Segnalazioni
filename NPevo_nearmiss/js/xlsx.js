(function (radice, fabbrica) {
    const api = fabbrica();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else {
        radice.NPXlsx = api;
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const TABELLA_CRC = (function () {
        const t = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) {
                c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
            }
            t[n] = c >>> 0;
        }
        return t;
    })();

    function crc32(u8) {
        let c = 0xFFFFFFFF;
        for (let i = 0; i < u8.length; i++) {
            c = TABELLA_CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
        }
        return (c ^ 0xFFFFFFFF) >>> 0;
    }

    function utf8(s) {
        return new TextEncoder().encode(s);
    }

    function zip(file) {
        const parti = [];
        const centrale = [];
        let posizione = 0;
        for (const f of file) {
            const nome = utf8(f.nome);
            const dati = utf8(f.testo);
            const crc = crc32(dati);
            const locale = new Uint8Array(30 + nome.length);
            const v = new DataView(locale.buffer);
            v.setUint32(0, 0x04034b50, true);
            v.setUint16(4, 20, true);
            v.setUint16(6, 0x0800, true);
            v.setUint16(8, 0, true);
            v.setUint16(10, 0, true);
            v.setUint16(12, 0x21, true);
            v.setUint32(14, crc, true);
            v.setUint32(18, dati.length, true);
            v.setUint32(22, dati.length, true);
            v.setUint16(26, nome.length, true);
            v.setUint16(28, 0, true);
            locale.set(nome, 30);
            const voce = new Uint8Array(46 + nome.length);
            const w = new DataView(voce.buffer);
            w.setUint32(0, 0x02014b50, true);
            w.setUint16(4, 20, true);
            w.setUint16(6, 20, true);
            w.setUint16(8, 0x0800, true);
            w.setUint16(10, 0, true);
            w.setUint16(12, 0, true);
            w.setUint16(14, 0x21, true);
            w.setUint32(16, crc, true);
            w.setUint32(20, dati.length, true);
            w.setUint32(24, dati.length, true);
            w.setUint16(28, nome.length, true);
            w.setUint32(42, posizione, true);
            voce.set(nome, 46);
            parti.push(locale, dati);
            centrale.push(voce);
            posizione += locale.length + dati.length;
        }
        const lunghezzaCentrale = centrale.reduce((s, c) => s + c.length, 0);
        const fine = new Uint8Array(22);
        const e = new DataView(fine.buffer);
        e.setUint32(0, 0x06054b50, true);
        e.setUint16(8, file.length, true);
        e.setUint16(10, file.length, true);
        e.setUint32(12, lunghezzaCentrale, true);
        e.setUint32(16, posizione, true);
        const tutto = parti.concat(centrale, [fine]);
        const out = new Uint8Array(tutto.reduce((s, p) => s + p.length, 0));
        let i = 0;
        for (const p of tutto) {
            out.set(p, i);
            i += p.length;
        }
        return out;
    }

    function xml(s) {
        return String(s === null || s === undefined ? '' : s)
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function colonna(n) {
        let s = '';
        for (n += 1; n > 0; n = Math.floor((n - 1) / 26)) {
            s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
        }
        return s;
    }

    function larghezza(intestazione, valori) {
        const piu = valori.reduce((m, v) => Math.max(m, String(v === null || v === undefined ? '' : v).length), String(intestazione).length);
        return Math.min(Math.max(piu + 2, 10), 60);
    }

    function foglio(intestazioni, righe) {
        const ultima = colonna(intestazioni.length - 1) + (righe.length + 1);
        const cols = intestazioni.map((t, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + larghezza(t, righe.map((r) => r[i])) + '" customWidth="1"/>').join('');
        const cella = (v, r, c, stile) => '<c r="' + colonna(c) + r + '" s="' + stile + '" t="inlineStr"><is><t xml:space="preserve">' + xml(v) + '</t></is></c>';
        let dati = '<row r="1">' + intestazioni.map((t, c) => cella(t, 1, c, 1)).join('') + '</row>';
        righe.forEach((riga, i) => {
            dati += '<row r="' + (i + 2) + '">' + intestazioni.map((_, c) => cella(riga[c], i + 2, c, 2)).join('') + '</row>';
        });
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            + '<dimension ref="A1:' + ultima + '"/>'
            + '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
            + '<cols>' + cols + '</cols>'
            + '<sheetData>' + dati + '</sheetData>'
            + '<autoFilter ref="A1:' + ultima + '"/>'
            + '</worksheet>';
    }

    const STILI = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        + '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>'
        + '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2E3E6A"/><bgColor indexed="64"/></patternFill></fill></fills>'
        + '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>'
        + '<border><left style="thin"><color rgb="FF000000"/></left><right style="thin"><color rgb="FF000000"/></right><top style="thin"><color rgb="FF000000"/></top><bottom style="thin"><color rgb="FF000000"/></bottom><diagonal/></border></borders>'
        + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
        + '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
        + '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>'
        + '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs>'
        + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
        + '</styleSheet>';

    function creaXlsx(intestazioni, righe, nomeFoglio) {
        const foglioNome = xml(String(nomeFoglio || 'Foglio1').replace(/[\\/?*[\]:]/g, ' ').slice(0, 31));
        return zip([
            { nome: '[Content_Types].xml', testo: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>' },
            { nome: '_rels/.rels', testo: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
            { nome: 'xl/workbook.xml', testo: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="' + foglioNome + '" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">\'' + foglioNome.replace(/'/g, '\'\'') + '\'!$A$1:$' + colonna(intestazioni.length - 1) + '$' + (righe.length + 1) + '</definedName></definedNames></workbook>' },
            { nome: 'xl/_rels/workbook.xml.rels', testo: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
            { nome: 'xl/worksheets/sheet1.xml', testo: foglio(intestazioni, righe) },
            { nome: 'xl/styles.xml', testo: STILI }
        ]);
    }

    function nomeFile(prefisso, d) {
        const due = (n) => String(n).padStart(2, '0');
        return prefisso + '_' + d.getFullYear() + due(d.getMonth() + 1) + due(d.getDate()) + '_' + due(d.getHours()) + due(d.getMinutes()) + due(d.getSeconds()) + '.xlsx';
    }

    function scarica(doc, nome, byte) {
        const blob = new Blob([byte], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const a = doc.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = nome;
        doc.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    }

    return { crc32, zip, colonna, creaXlsx, nomeFile, scarica };
});
