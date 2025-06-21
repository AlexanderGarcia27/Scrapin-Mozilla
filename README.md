# 📰 Scraper de Artículos - Mozilla Hacks

Este proyecto es un **scraper web automatizado** desarrollado en **Node.js** usando **Puppeteer**. Se encarga de recorrer el blog oficial de Mozilla Hacks y extraer información de todos los artículos disponibles en múltiples páginas.

---

## ✨ Descripción del Proyecto

El scraper visita [hacks.mozilla.org](https://hacks.mozilla.org/), navega por todas las páginas de artículos disponibles y extrae para cada artículo:

- 📝 Título del artículo  
- 📄 Resumen (primer párrafo del listado)  
- ✍️ Autor del artículo (obtenido desde la página individual del artículo)  
- 📅 Fecha de publicación  
- 🌐 Enlace al artículo completo  
- 🖼️ Imagen destacada

Una vez recolectados todos los artículos, el script genera los siguientes archivos con la información:

- `articulos.json`
- `articulos.csv`
- `articulos.xlsx`
- `articulos.txt`
- `articulos.pdf`

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/AlexanderGarcia27/Scrapin-Mozilla.git
cd Scrapin-Mozilla
npm start
