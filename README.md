# Administrador de Inversiones - Firebase

Aplicación React + Vite conectada a Firebase para almacenamiento de datos en Firestore y archivos en Cloud Storage.

## Requisitos

- Node.js 18+
- npm
- Proyecto de Firebase creado

## Configuración local

1. Instala dependencias:

```sh
npm install
```

2. Crea tu archivo de entorno local:

```sh
cp .env.example .env.local
```

3. Completa en `.env.local` tus variables `VITE_FIREBASE_*` del proyecto Firebase.

4. Inicia la app:

```sh
npm run dev
```

## Estructura Firebase

- Firestore:
  - `investors`
  - `contracts`
  - `payments`
- Storage:
  - `comprobantes/`
  - `recibos/`

## Despliegue en Firebase Hosting

1. Inicia sesión:

```sh
npm run firebase:login
```

2. Configura el proyecto en `.firebaserc` reemplazando `your-firebase-project-id`.

3. Despliega:

```sh
npm run deploy:firebase
```

## Reglas de seguridad

- `firestore.rules` y `storage.rules` están configuradas temporalmente en modo abierto (`allow read, write: if true;`) para esta primera fase sin autenticación.
- Antes de pasar a producción, endurece reglas por colección/ruta y agrega autenticación.
