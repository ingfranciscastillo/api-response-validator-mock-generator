# API Response Validator & Mock Generator

[![Live Demo](https://img.shields.io/badge/Live-Demo-1e3a8a?style=for-the-badge&logo=terminal)](https://portfolio-code-workspace.vercel.app/)
[![behance](https://img.shields.io/badge/behance-1769FF?style=for-the-badge&logo=behance&logoColor=white)](https://www.behance.net/ingfranciscastillo)
[![github_stars](https://img.shields.io/github/stars/ingfranciscastillo/api-response-validator-mock-generator?style=for-the-badge)](https://github.com/ingfranciscastillo/api-response-validator-mock-generator/stargazers)
[![license](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
[![linkedin](https://img.shields.io/badge/linkedin-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/ingfranciscastillo)
[![last_commit](https://img.shields.io/github/last-commit/ingfranciscastillo/api-response-validator-mock-generator?style=for-the-badge)](https://github.com/ingfranciscastillo/api-response-validator-mock-generator/commits/main)

<!-- README-I18N:START -->

[English](./README.md) | **Español**

<!-- README-I18N:END -->

Plataforma SaaS full-stack para equipos de API que necesitan validar respuestas contra especificaciones OpenAPI, generar datos mock realistas y detectar desviaciones de contrato.

## Características

- **Validación de Respuestas** — Envía peticiones a tu API y valida las respuestas contra especificaciones OpenAPI/Swagger (2.0, 3.0, 3.1) con reportes estructurados de violaciones.
- **Generación de Mocks** — Genera payloads realistas a partir de definiciones de esquema usando plantillas basadas en faker, incluyendo variantes de casos límite y error.
- **Detección de Desviaciones** — Trabajos programados en segundo plano que consultan tus endpoints y comparan las respuestas en vivo contra tus especificaciones, revelando cambios disruptivos y diferencias.
- **Gestión de Especificaciones** — Importa especificaciones mediante carga de archivos, pegado de texto o desde una URL. Examina endpoints con un visor interactivo de árbol de esquemas. Compara versiones lado a lado.
- **Exportación de Reportes** — Exporta resultados de validación como HTML, PDF o JSON.
- **Multiinquilino por Espacio de Trabajo** — Equipos organizacionales con control de acceso basado en roles (propietario, administrador, miembro).
- **Modo Oscuro** — Soporte integrado de modo oscuro con alternancia según la preferencia del sistema.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Framework** | [TanStack Start](https://tanstack.com/start) (SSR, funciones de servidor, enrutamiento basado en archivos) |
| **Enrutamiento** | [TanStack Router](https://tanstack.com/router) (type-safe) |
| **Estado** | [TanStack Query](https://tanstack.com/query), [TanStack Form](https://tanstack.com/form), [TanStack Table](https://tanstack.com/table) |
| **UI** | React 19, Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com/), Radix UI, Lucide icons |
| **Gráficos** | Recharts |
| **Base de Datos** | Neon (Postgres serverless) + [Drizzle ORM](https://orm.drizzle.team) |
| **Autenticación** | [Better Auth](https://www.better-auth.com) (email/contraseña, OAuth GitHub/Google, organizaciones) |
| **Validación** | AJV, ajv-formats, @apidevtools/swagger-parser |
| **Datos Mock** | json-schema-faker + @faker-js/faker |
| **Tareas Programadas** | Inngest (cron de detección de desviaciones, alertas) |
| **Almacenamiento** | Cloudflare R2 (compatible S3 para especificaciones grandes, exportaciones) |
| **Linting** | Biome |
| **Pruebas** | Vitest |

## Primeros Pasos

### Requisitos Previos

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9
- Una base de datos [Neon](https://neon.tech) Postgres (o cualquier base compatible con Postgres)

### Instalación

```bash
pnpm install
```

### Variables de Entorno

Copia `.env.local.example` a `.env.local` y completa los valores:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Cadena de conexión a Neon Postgres |
| `BETTER_AUTH_SECRET` | Secreto de autenticación (genera con `pnpm dlx @better-auth/cli secret`) |
| `BETTER_AUTH_URL` | URL de la aplicación para callbacks de autenticación |
| `R2_*` | Credenciales de Cloudflare R2 (opcional, para archivos grandes) |
| `INNGEST_*` | Event key y signing key de Inngest (opcional, para detección de desviaciones) |

### Base de Datos

```bash
pnpm db:generate    # Genera migraciones SQL
pnpm db:migrate     # Aplica migraciones a la base de datos
pnpm db:push        # Aplica cambios de esquema directamente (solo desarrollo)
```

### Desarrollo

```bash
pnpm dev
```

Abre en [http://localhost:3000](http://localhost:3000).

### Producción

```bash
pnpm build
pnpm preview
```

### Pruebas

```bash
pnpm test
```

## Uso

### 1. Importar una Especificación OpenAPI

Navega a **Specs** → **New Spec**. Sube un archivo JSON/YAML, pega el contenido o obténlo desde una URL. El parser soporta OpenAPI 2.0, 3.0 y 3.1.

### 2. Validar Respuestas

Ve al **Validation Workspace**, selecciona una especificación y un endpoint, luego configura tu petición:

- Establece el método HTTP y la URL base
- Completa los parámetros de ruta/consulta y cabeceras
- Proporciona un cuerpo de petición (para POST/PUT/PATCH)
- Haz clic en **Send Request**

El motor ejecuta la respuesta a través de AJV contra el esquema de tu especificación y devuelve un resultado estructurado con violaciones agrupadas por severidad.

### 3. Generar Mocks

Desde la página **Mocks**, selecciona una versión de la especificación y el código de estado de respuesta objetivo. El generador construye payloads a partir de las propiedades del esquema — primero los campos requeridos, luego los opcionales, más variantes de error y casos límite.

### 4. Monitorear Desviaciones

Configura **Monitored Specs** para que Inngest consulte tus endpoints periódicamente. Cuando una respuesta en vivo difiere de la especificación, recibirás una alerta de desviación con un diff detallado.

## Estructura del Proyecto

```
src/
├── routes/              # Enrutamiento basado en archivos
│   ├── dashboard/       # Dashboard protegido (specs, validación, mocks, desviaciones, reportes, equipo, ajustes)
│   ├── login.tsx        # Páginas de autenticación
│   └── ...
├── components/          # Componentes UI
│   ├── ui/              # Primitivas shadcn/ui
│   ├── validation/      # ValidationRequestBuilder, ValidationResultCard, DiffViewer
│   ├── specs/           # EndpointExplorer, SchemaTreeViewer
│   ├── mocks/           # Visor de payloads mock, reglas de generación
│   ├── dashboard/       # Tarjetas de estadísticas, gráficos, tablas
│   └── landing/         # Páginas de marketing
├── db/
│   ├── schema/          # Esquemas Drizzle por dominio (auth, spec, validation, mocks, drift, report, audit)
│   └── index.ts         # Cliente de base de datos
├── lib/
│   ├── specs/           # Importación, análisis y CRUD de especificaciones (funciones de servidor)
│   ├── validation/      # Motor de validación, lógica de diff (funciones de servidor)
│   ├── mocks/           # Generación de mocks (funciones de servidor)
│   └── auth/            # Helpers de autenticación del lado del servidor
└── integrations/        # Cliente de autenticación, proveedor de TanStack Query
```

## Documentación

La documentación completa de diseño y arquitectura está disponible en el directorio [`docs/`](./docs/):

- [Arquitectura](./docs/architecture.md)
- [Esquema de Base de Datos](./docs/database.md)
- [Autenticación y Permisos](./docs/auth_and_permissions.md)
- [Referencia de API](./docs/api_spec.md)
- [Librería de Componentes](./docs/components.md)
- [Sistema de Diseño](./docs/design_system.md)
- [Hoja de Ruta](./docs/roadmap.md)

## Contribuir

¡Las contribuciones son bienvenidas! Por favor abre un issue o pull request.

### Configuración de Desarrollo

```bash
git clone https://github.com/ingfranciscastillo/api-response-validator-mock-generator.git
cd api-response-validator-mock-generator
pnpm install
cp .env.local.example .env.local
# Completa tu DATABASE_URL y el secreto de autenticación
pnpm db:push
pnpm dev
```

### Lint y Formato

```bash
pnpm lint
pnpm format
pnpm check
```

## Licencia

[MIT](./LICENSE) © Francis Castillo.
