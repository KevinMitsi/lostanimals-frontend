import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const FIREBASE_SDK_VERSION = '12.18.0';

const outputPath = resolve('public/runtime-config.js');
const serviceWorkerPath = resolve('public/firebase-messaging-sw.js');
const token = process.env.MAPBOX_PUBLIC_TOKEN?.trim() ?? '';

if (token && !token.startsWith('pk.')) {
  throw new Error(
    'MAPBOX_PUBLIC_TOKEN must be a public Mapbox token (pk.*). Secret tokens (sk.*) must never be bundled in a browser application.',
  );
}

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY?.trim() ?? '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN?.trim() ?? '',
  projectId: process.env.FIREBASE_PROJECT_ID?.trim() ?? '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET?.trim() ?? '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID?.trim() ?? '',
  appId: process.env.FIREBASE_APP_ID?.trim() ?? '',
};
const firebaseVapidKey = process.env.FIREBASE_VAPID_KEY?.trim() ?? '';

const config = JSON.stringify({
  mapboxPublicToken: token,
  firebaseConfig,
  firebaseVapidKey,
}).replaceAll('<', '\\u003c');
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `/** Generated at build time. Do not edit. */\nwindow.__LOST_ANIMALS_CONFIG__ = Object.freeze(${config});\n`,
  'utf8',
);

/*
 * El service worker de Firebase Messaging corre en su propio contexto global (no `window`),
 * así que no puede leer runtime-config.js: necesita su propia copia de la config, generada
 * aquí con las mismas variables de entorno para no duplicar el mantenimiento a mano.
 */
const firebaseConfigLiteral = JSON.stringify(firebaseConfig).replaceAll('<', '\\u003c');
await writeFile(
  serviceWorkerPath,
  `/** Generated at build time. Do not edit. */
importScripts('https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-messaging-compat.js');

firebase.initializeApp(${firebaseConfigLiteral});
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'LostAnimals';
  const body = payload.notification?.body ?? '';
  self.registration.showNotification(title, { body, icon: '/favicon.png' });
});
`,
  'utf8',
);
