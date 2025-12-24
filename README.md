# StopParty

Juego multijugador en tiempo real de Stop/Basta/Tuttifrutti con enfoque latino, mobile-first.

## Stack Tecnológico

- **Frontend:** SvelteKit (Svelte 5 con runes)
- **Backend en tiempo real:** PartyKit
- **Lenguaje:** TypeScript estricto
- **Estilos:** Tailwind CSS (mobile-first)
- **i18n:** svelte-i18n (español por defecto)
- **PWA:** Service Worker + Web App Manifest

## Desarrollo Local

### Requisitos

- Node.js 18+
- npm

### Instalación

```bash
npm install
```

### Ejecutar en desarrollo

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: PartyKit server
npm run dev:party

# O ambos juntos:
npm run dev:all
```

El frontend estará disponible en `http://localhost:5173` y el servidor PartyKit en `http://localhost:1999`.

### Construir para producción

```bash
npm run build
npm run build:party
```

## Despliegue

### PartyKit

```bash
npm run deploy:party
```

Después de desplegar, actualiza `PUBLIC_PARTYKIT_HOST` en tu archivo `.env` con la URL de tu servidor PartyKit.

### Frontend (Vercel)

```bash
npm run deploy:app
```

O conecta el repositorio a Vercel para despliegues automáticos.

## Estructura del Proyecto

```
stopparty/
├── src/                    # Frontend (SvelteKit)
│   ├── lib/
│   │   ├── components/     # Componentes Svelte
│   │   ├── stores/         # Estado con Svelte 5 runes
│   │   ├── utils/          # Utilidades
│   │   └── i18n/           # Traducciones
│   └── routes/             # Rutas de SvelteKit
├── party/                  # Backend (PartyKit)
├── shared/                 # Código compartido
└── static/                 # Assets estáticos
```

## Características

- **Multijugador en tiempo real** - Juega con 2-12 jugadores
- **Mobile-first** - Diseñado para dispositivos móviles
- **Bilingüe** - Español e inglés
- **PWA** - Instalable como aplicación
- **Reconexión** - Recupera tu partida si te desconectas
- **Presets de categorías** - Clásico, Geografía, Fiesta, Infantil
- **Sistema de votación** - Valida las respuestas entre jugadores

## Licencia

MIT
