const puppeteer = require('puppeteer');
const fs = require('fs');
const { Parser } = require('json2csv');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

const URL = 'https://hacks.mozilla.org/';

(async () => {
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('li.list-item.row.listing', { timeout: 60000 });

    let articulos = [];
    let haySiguiente = true;
    let urlAnterior = '';

    while (haySiguiente) {
        const nuevosArticulos = await page.evaluate(() => {
            const data = [];
            const elementos = document.querySelectorAll('li.list-item.row.listing');

            elementos.forEach(item => {
                const titulo = item.querySelector('h3 a')?.innerText || "Sin título";
                const resumen = item.querySelector('p')?.innerText || "Sin resumen";
                const enlace = item.querySelector('h3 a')?.href || "";
                const fecha = item.innerText.match(/Posted on\s(.+)/i)?.[1]?.trim() || "Sin fecha";
                const imagen = item.querySelector('img')?.src || "Sin imagen";
                data.push({ titulo, resumen, enlace, fecha, imagen });
            });

            return data;
        });

        // Extraer autor real desde cada enlace
        for (let articulo of nuevosArticulos) {
            try {
                const articlePage = await browser.newPage();
                await articlePage.goto(articulo.enlace, {
                    waitUntil: 'domcontentloaded',
                    timeout: 60000 // aumentamos el timeout a 60 segundos
                });

                // Intentar extraer el autor, si existe
                const autor = await articlePage.evaluate(() => {
                    const autorElemento = document.querySelector('.byline .url');
                    return autorElemento ? autorElemento.textContent.trim() : 'Autor no disponible';
                });

                articulo.autor = autor;
                await articlePage.close();
            } catch (err) {
                articulo.autor = 'Autor no disponible';
                console.error(`❌ Error al acceder a: ${articulo.enlace}\n${err.message}`);
            }
        }

        articulos = articulos.concat(nuevosArticulos);

        // Detectar el botón siguiente (Read more en página 1, Older en las demás)
        const siguiente = await page.$('h3.read-more a') || await page.$('nav.nav-paging a');
        if (siguiente) {
            const urlSiguiente = await page.evaluate(el => el.href, siguiente);
            const urlActual = page.url();

            // Evitar bucle en última página
            if (urlSiguiente === urlAnterior || urlSiguiente === urlActual) {
                console.log('⛔ Última página alcanzada.');
                haySiguiente = false;
                break;
            }

            urlAnterior = urlActual;

            await Promise.all([
                page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
                siguiente.click()
            ]);

            await page.waitForSelector('li.list-item.row.listing', { timeout: 60000 });
        } else {
            haySiguiente = false;
        }
    }

    // Exportar a JSON
    fs.writeFileSync('articulos.json', JSON.stringify(articulos, null, 2), 'utf-8');

    // Exportar a CSV
    const fields = ['titulo', 'resumen', 'autor', 'fecha', 'imagen', 'enlace'];
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(articulos);
    fs.writeFileSync('articulos.csv', csv, 'utf-8');

    // Exportar a Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(articulos);
    XLSX.utils.book_append_sheet(wb, ws, 'Artículos');
    XLSX.writeFile(wb, 'articulos.xlsx');

    // Exportar a TXT
    let txt = '';
    articulos.forEach((a, i) => {
        txt += `Artículo ${i + 1}\n`;
        txt += `Título: ${a.titulo}\nResumen: ${a.resumen}\nAutor: ${a.autor}\nFecha: ${a.fecha}\nImagen: ${a.imagen}\nEnlace: ${a.enlace}\n`;
        txt += `-----------------------------\n\n`;
    });
    fs.writeFileSync('articulos.txt', txt, 'utf-8');

    // Exportar a PDF
    const pdf = new PDFDocument();
    pdf.pipe(fs.createWriteStream('articulos.pdf'));

    articulos.forEach((a, i) => {
        pdf.fontSize(14).text(`Artículo ${i + 1}`, { underline: true });
        pdf.fontSize(12).text(`Título: ${a.titulo}`);
        pdf.text(`Resumen: ${a.resumen}`);
        pdf.text(`Autor: ${a.autor}`);
        pdf.text(`Fecha: ${a.fecha}`);
        pdf.text(`Imagen: ${a.imagen}`);
        pdf.text(`Enlace: ${a.enlace}`);
        pdf.moveDown(1);
        pdf.text('----------------------------------------');
        pdf.moveDown(1);
    });

    pdf.end();

    console.log(`✅ Archivos generados correctamente. Total de artículos: ${articulos.length}`);
    await browser.close();
})();
