# LostanimalsFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Mapbox: configuración segura

La aplicación web **sólo acepta un token público de Mapbox que comience por `pk.`**. Aunque se guarda como variable protegida durante el build, este token será visible para el navegador por diseño. Nunca uses un token secreto `sk.`: el script de build lo rechaza para impedir que se publique accidentalmente.

En Mapbox:

1. Abre **Account → Access tokens → Create a token**.
2. Concede únicamente los scopes públicos necesarios para mapas (`styles:read` y `fonts:read`).
3. Añade restricciones de URL para producción y previews, por ejemplo `https://tu-dominio.com/*` y `https://*.vercel.app/*`. Para desarrollo agrega `http://localhost:4200/*`.
4. Copia el token `pk...`; no lo escribas en `environment.ts`, commits, logs ni capturas.

En Vercel:

1. En el proyecto abre **Settings → Environment Variables**.
2. Crea `MAPBOX_PUBLIC_TOKEN`, pega el token `pk...` y selecciónalo para Production, Preview y Development según corresponda.
3. Guarda y ejecuta **Redeploy**. `npm run build` genera `runtime-config.js` durante el build, sin almacenar el valor en Git.

En GitHub Actions:

1. Abre **Settings → Secrets and variables → Actions → New repository secret**.
2. Crea el secret `MAPBOX_PUBLIC_TOKEN` y pega el token público restringido.
3. Expón el secret sólo en el paso de build:

```yaml
- name: Build frontend
  run: npm ci && npm run build
  env:
    MAPBOX_PUBLIC_TOKEN: ${{ secrets.MAPBOX_PUBLIC_TOKEN }}
```

Para desarrollo local en PowerShell:

```powershell
$env:MAPBOX_PUBLIC_TOKEN='pk.TU_TOKEN_PUBLICO_RESTRINGIDO'
npm.cmd start
```

La geolocalización del navegador requiere HTTPS (salvo `localhost`). El backend recibe la coordenada exacta al crear un avistamiento, pero los listados públicos retornan coordenadas aproximadas a tres decimales para reducir el riesgo de triangulación.
