# Cacao's Klaus — Sitio Estático

Landing en español inspirada en simplychocolate.dk.
Stack: HTML/CSS/JS vanilla. Sin dependencias de build.

## Desarrollo local
Abrir `index.html` en el navegador directamente, o usar un servidor local:
```bash
# Python 3
python -m http.server 8080
# Node.js (npx)
npx serve .
```

## Deploy en GitHub Pages

```bash
git init
git add .
git commit -m "feat: landing inicial Cacao's Klaus"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/mi-chocolate.git
git push -u origin main
```
Luego en GitHub → Settings → Pages → Source: `main / (root)` → Save.

URL resultante: `https://TU_USUARIO.github.io/mi-chocolate`

## Dominio personalizado + Cloudflare

Ver la guía completa en el plan de implementación.

Registros DNS en Cloudflare (modo Proxied 🟠):
```
A    @    185.199.108.153
A    @    185.199.109.153
A    @    185.199.110.153
A    @    185.199.111.153
CNAME www  TU_USUARIO.github.io
```

Añadir el dominio en `CNAME` y en GitHub Pages → Custom domain.
