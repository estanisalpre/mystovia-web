# Mystovia Web

<div align="center">

![Mystovia](https://img.shields.io/badge/Mystovia-MMORPG%20Server-gold?style=for-the-badge)
![Astro](https://img.shields.io/badge/Astro-5.15.3-BC52EE?style=for-the-badge&logo=astro)
![Express](https://img.shields.io/badge/Express-5.1.0-000000?style=for-the-badge&logo=express)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=for-the-badge&logo=typescript)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql)

**Plataforma web completa para servidor privado de Tibia MMORPG**

[Características](#-características) • [Tecnologías](#-stack-tecnológico) • [Instalación](#-instalación) • [Estructura](#-estructura-del-proyecto) • [API](#-api-endpoints) • [Contribuir](#-contribuir)

</div>

---

## Descripción

Mystovia Web es un monorepo que contiene tanto el frontend como el backend de una plataforma web completa para un servidor privado de Tibia. Incluye sistema de cuentas, gestión de personajes, marketplace, foro, wiki, noticias, y panel de administración.

---

## Características

### Sistema de Usuarios
- Registro con verificación de email
- Login/logout con sesiones basadas en cookies
- Recuperación de cuenta vía email
- Restablecimiento de contraseña
- Generación de claves de recuperación (códigos alfanuméricos de 16 caracteres)
- Gestión de días premium

### Gestión de Personajes
- Creación de personajes
- Visualización de información del personaje
- Seguimiento de habilidades, experiencia y salud
- Personalización de apariencia

### Comunidad

#### Foro
- Categorías con temas
- Comentarios y respuestas
- Sistema de votación (upvote/downvote)
- Bloqueo y fijación de temas (admin)
- Eliminación de temas

#### Noticias
- Crear/editar/eliminar noticias (admin)
- Categorías de noticias
- Paginación
- Sistema de likes
- Páginas de detalle de artículos

#### Wiki
- Organización de base de conocimientos
- Categorías y artículos
- URLs basadas en slug
- Funcionalidad de búsqueda

#### FAQ
- Categorías de FAQ
- Búsqueda de FAQ
- Gestión de administrador

#### Guilds
- Creación de guilds
- Perfiles de guild con detalles
- Listado de guilds
- Miembros de guild

### Información del Juego
- Tabla de clasificación (highscores globales)
- Registro de muertes recientes
- Lista de jugadores online
- Estado del servidor
- Reglas del juego
- Guías y estrategias

### Marketplace/Tienda
- Catálogo de items con categorías (knight, paladin, sorcerer, druid, items)
- Sistema de carrito de compras
- Entrega de items específicos por personaje
- Integración de pagos con MercadoPago
- Seguimiento de órdenes y estado
- Items destacados
- Selección/personalización de armas
- Gestión de stock
- Gestión de inventario para admin

### Soporte y Recursos
- Sistema de tickets de soporte
- Seguimiento de estado de tickets (pendiente, procesando, aprobado, etc.)
- Respuestas de soporte
- Página de descargas (para cliente del juego)
- Analíticas de descargas

### Panel de Administración
- Gestión de usuarios (búsqueda, asignación de roles, permisos)
- Bloqueo/desbloqueo de usuarios
- Asignación de días premium
- Moderación del foro (bloquear/fijar/eliminar temas)
- Gestión de noticias (crear/editar/eliminar)
- Gestión de items del marketplace (agregar/editar/eliminar)
- Gestión de tickets de soporte
- Sistema de permisos (acceso basado en roles granular)
- Dashboard de estadísticas

### Internacionalización
- 3 idiomas: Español (por defecto), Inglés, Portugués
- Detección de idioma por navegador
- Preferencia de idioma guardada en localStorage
- Integración con i18next

### UI/UX
- Tema medieval/fantasía con acentos dorados
- Efectos de partículas en el fondo
- Transiciones de página con Astro ViewTransitions
- Componente de reproductor de música (opcional)
- Estética de modo oscuro
- Diseño responsive (mobile-friendly)
- Funcionalidad de barra de búsqueda
- Diálogos modales (descarga, checkout, formularios)

---

## Stack Tecnológico

### Frontend
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| **Astro** | 5.15.3 | Framework principal con SSR (Node.js adapter) |
| **React** | 19.2.0 | Componentes interactivos |
| **Vue** | 3.5.22 | Componentes opcionales |
| **Tailwind CSS** | 4.1.16 | Framework de estilos con PostCSS |
| **Lucide** | 0.552.0 | Librería de iconos (React & Astro) |
| **i18next** | 25.7.2 | Internacionalización con detección de idioma |
| **tsParticles** | 3.9.1 | Efectos de partículas |

### Backend
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| **Node.js** | - | Runtime |
| **Express** | 5.1.0 | Framework web |
| **TypeScript** | 5.9.3 | Lenguaje tipado |
| **MySQL** | 3.15.3 | Base de datos (mysql2/promise) |
| **bcryptjs** | 3.0.3 | Hash de contraseñas |
| **cookie-parser** | 1.4.7 | Manejo de cookies |
| **cors** | 2.8.5 | Control de acceso HTTP |

### Servicios Externos
| Servicio | Descripción |
|----------|-------------|
| **MercadoPago SDK** | Pasarela de pagos (Pesos Argentinos) |
| **Resend** | Servicio de emails |

### Herramientas de Desarrollo
| Herramienta | Versión | Descripción |
|-------------|---------|-------------|
| **pnpm** | 10.17.0 | Gestor de paquetes |
| **concurrently** | 9.2.1 | Desarrollo concurrente |
| **nodemon** | 3.1.10 | Watch mode |
| **tsx** | 4.20.6 | Ejecución de TypeScript |

---

## Instalación

### Requisitos Previos
- Node.js 18+
- pnpm 10+
- MySQL 8+

### Pasos

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd mystovia-web
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Configurar variables de entorno**

Crear archivo `.env` en la raíz:
```env
# Backend
BACKEND_URL=http://localhost:3301
FRONTEND_URL=http://localhost:4321
PUBLIC_API_URL=http://localhost:3301
NODE_ENV=development
PORT=3301

# Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=otserver

# Email (Resend)
API_KEY_EMAIL_SERVICE=re_xxxxxxxxxxxxx

# Pagos (MercadoPago)
MP_ACCESS_TOKEN=TEST-xxxxxxxxxxxxx
MP_PUBLIC_KEY=TEST-xxxxxxxxxxxxx
PUBLIC_MP_PUBLIC_KEY=TEST-xxxxxxxxxxxxx
```

4. **Configurar base de datos**

Ejecutar los scripts SQL en orden:
```bash
mysql -u root -p otserver < database/schema.sql
mysql -u root -p otserver < database/marketplace.sql
mysql -u root -p otserver < database/permission_forum_schemas.sql
```

5. **Iniciar en desarrollo**
```bash
pnpm dev
```

El frontend estará en `http://localhost:4321` y el backend en `http://localhost:3301`.

---

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Inicia frontend y backend concurrentemente |
| `pnpm dev:astro` | Solo frontend (Astro) |
| `pnpm dev:server` | Solo backend (Express con nodemon) |
| `pnpm build` | Compila frontend y backend para producción |
| `pnpm preview` | Preview del build de Astro |
| `pnpm server:prod` | Inicia servidor de producción |
| `pnpm start` | Alias de server:prod |

---

## Estructura del Proyecto

```
mystovia-web/
├── src/                              # Frontend (Astro)
│   ├── assets/                       # Recursos estáticos
│   │   ├── backgrounds/              # Imágenes de fondo
│   │   ├── characters/               # Imágenes de personajes
│   │   └── logos/                    # Logos y branding
│   │
│   ├── components/                   # Componentes reutilizables
│   │   ├── account/                  # Gestión de cuenta
│   │   │   └── AccountManagement.tsx
│   │   ├── admin/                    # Panel de administración
│   │   │   ├── AdminMarketplace.tsx
│   │   │   ├── ItemFormModal.tsx
│   │   │   ├── ModalButton.astro
│   │   │   └── StatsCard.astro
│   │   ├── forum/                    # Componentes del foro
│   │   │   └── TopicCards.astro
│   │   ├── landing/                  # Página principal
│   │   │   ├── HeroSection.astro
│   │   │   ├── layouts/
│   │   │   └── store/
│   │   ├── marketplace/              # Tienda
│   │   │   ├── CheckoutModal.tsx
│   │   │   ├── ItemCard.tsx
│   │   │   ├── MarketplaceView.tsx
│   │   │   ├── MercadoPagoCardForm.tsx
│   │   │   ├── ShoppingCartSidebar.tsx
│   │   │   └── WeaponSelectionModal.tsx
│   │   ├── CartButton.tsx
│   │   ├── DownloadModal.tsx
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   ├── HeaderAuth.tsx
│   │   ├── HeaderNav.tsx
│   │   ├── I18nProvider.tsx
│   │   ├── LanguageSelector.tsx
│   │   ├── MobileNav.tsx
│   │   └── Pagination.astro
│   │
│   ├── hooks/                        # React hooks
│   │   ├── useAuth.ts                # Hook de autenticación
│   │   └── useServerStats.ts         # Hook de estadísticas
│   │
│   ├── i18n/                         # Internacionalización
│   │   ├── index.ts                  # Configuración i18next
│   │   ├── locales/                  # Archivos de traducción
│   │   │   ├── es.json               # Español
│   │   │   ├── en.json               # Inglés
│   │   │   └── pt.json               # Portugués
│   │   └── translations.ts
│   │
│   ├── layouts/                      # Layouts de Astro
│   │   ├── Layout.astro              # Layout principal
│   │   └── AdminLayout.astro         # Layout de admin
│   │
│   ├── lib/                          # Librerías
│   │   ├── api.ts                    # Cliente API centralizado
│   │   └── components/               # Componentes compartidos
│   │       ├── PageTransition.astro
│   │       ├── Particles.astro
│   │       ├── MusicPlayer.astro
│   │       ├── shared/
│   │       │   ├── WarnErrorSuccessMessage.astro
│   │       │   └── HeaderComponent.astro
│   │       └── ui/                   # Componentes base UI
│   │           ├── ErrorMessage.astro
│   │           ├── SubmitBtn.astro
│   │           └── Input.astro
│   │
│   ├── pages/                        # Rutas de páginas
│   │   ├── index.astro               # Inicio
│   │   ├── 404.astro                 # Página no encontrada
│   │   ├── login.astro               # Login
│   │   ├── register.astro            # Registro
│   │   ├── characters.astro          # Personajes
│   │   ├── create-character.astro    # Crear personaje
│   │   ├── character-information.astro
│   │   ├── account-management.astro
│   │   ├── account-recovery.astro
│   │   ├── recovery-verify.astro
│   │   ├── forgot-password.astro
│   │   ├── lost-account.astro
│   │   ├── reset-password.astro
│   │   ├── highscores.astro          # Clasificación
│   │   ├── latest-deaths.astro       # Muertes recientes
│   │   ├── online.astro              # Jugadores online
│   │   ├── marketplace.astro         # Tienda
│   │   ├── terms.astro               # Términos de servicio
│   │   ├── privacy.astro             # Política de privacidad
│   │   ├── rules.astro               # Reglas del juego
│   │   │
│   │   ├── forum/                    # Foro
│   │   │   ├── index.astro
│   │   │   ├── new-topic.astro
│   │   │   ├── category/[id].astro
│   │   │   └── topic/[id].astro
│   │   │
│   │   ├── news/                     # Noticias
│   │   │   ├── index.astro
│   │   │   └── [id].astro
│   │   │
│   │   ├── wiki/                     # Wiki
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   │
│   │   ├── guilds/                   # Guilds
│   │   │   ├── index.astro
│   │   │   ├── [id].astro
│   │   │   └── create.astro
│   │   │
│   │   └── admin/                    # Panel de admin
│   │       ├── index.astro
│   │       ├── users.astro
│   │       ├── forum.astro
│   │       ├── news.astro
│   │       └── marketplace.astro
│   │
│   ├── styles/
│   │   └── global.css                # Estilos globales Tailwind
│   │
│   └── utils/                        # Utilidades
│
├── server/                           # Backend (Express)
│   └── src/
│       ├── config/
│       │   └── database.ts           # Pool de conexión MySQL
│       │
│       ├── controllers/              # Manejadores de requests
│       │   ├── authController.ts
│       │   ├── accountController.ts
│       │   ├── characterController.ts
│       │   ├── marketplaceController.ts
│       │   ├── adminMarketplaceController.ts
│       │   ├── forumController.ts
│       │   ├── newsController.ts
│       │   ├── wikiController.ts
│       │   ├── faqController.ts
│       │   ├── downloadsController.ts
│       │   ├── rulesController.ts
│       │   ├── supportController.ts
│       │   ├── userManagementController.ts
│       │   ├── highscoresController.ts
│       │   ├── deathsController.ts
│       │   ├── guildController.ts
│       │   └── serverController.ts
│       │
│       ├── routes/                   # Definición de rutas
│       │   ├── authRoutes.ts
│       │   ├── accountRoutes.ts
│       │   ├── characterRoutes.ts
│       │   ├── marketplaceRoutes.ts
│       │   ├── adminMarketplaceRoutes.ts
│       │   ├── forumRoutes.ts
│       │   ├── newsRoutes.ts
│       │   ├── wikiRoutes.ts
│       │   ├── faqRoutes.ts
│       │   ├── downloadsRoutes.ts
│       │   ├── rulesRoutes.ts
│       │   ├── supportRoutes.ts
│       │   ├── userManagementRoutes.ts
│       │   ├── highscoresRoutes.ts
│       │   ├── deathsRoutes.ts
│       │   ├── guildRoutes.ts
│       │   └── serverRoutes.ts
│       │
│       ├── middleware/               # Middlewares
│       │   ├── authMiddleware.ts     # Autenticación por cookies
│       │   ├── adminMiddleware.ts    # Verificación de admin
│       │   └── permissions.ts        # Gestión de permisos
│       │
│       ├── services/                 # Servicios
│       │   ├── emailService.ts       # Envío de emails (Resend)
│       │   └── itemDeliveryService.ts
│       │
│       ├── lib/
│       │   └── mercadopago.ts        # Integración de pagos
│       │
│       ├── types/                    # Definiciones TypeScript
│       │
│       └── index.ts                  # Entry point de Express
│
├── database/                         # Scripts de base de datos
│   ├── schema.sql                    # Esquema base (accounts, players)
│   ├── marketplace.sql               # Tablas del marketplace
│   ├── marketplace_fresh_install.sql
│   ├── marketplace_migration.sql
│   ├── permission_forum_schemas.sql
│   ├── 001_add_payment_fields.sql
│   └── 002_create_refresh_tokens.sql
│
├── public/                           # Archivos públicos
│   ├── assets/
│   ├── downloads/                    # Descargas del cliente
│   └── favicon.ico
│
├── dist/                             # Build output
│   ├── client/                       # Assets estáticos
│   └── server/                       # Entry point del servidor
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Pipeline CI/CD
│       └── keep-alive.yml            # Tarea programada
│
├── astro.config.mjs                  # Configuración de Astro
├── tsconfig.json                     # Configuración TypeScript
├── tailwind.config.ts                # Configuración Tailwind
├── package.json                      # Dependencias y scripts
└── pnpm-lock.yaml                    # Lockfile de pnpm
```

---

## API Endpoints

### Autenticación (`/api/auth`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/register` | Registro de usuario |
| POST | `/login` | Iniciar sesión |
| POST | `/logout` | Cerrar sesión |
| POST | `/forgot-password` | Solicitar recuperación |
| POST | `/reset-password` | Restablecer contraseña |
| GET | `/me` | Obtener usuario actual |

### Cuenta (`/api/account`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Obtener información de cuenta |
| PUT | `/` | Actualizar cuenta |
| POST | `/recovery-key` | Generar clave de recuperación |

### Personajes (`/api/characters`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar personajes |
| GET | `/:id` | Obtener personaje |
| POST | `/` | Crear personaje |

### Servidor (`/api/server`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/status` | Estado del servidor |
| GET | `/online` | Jugadores online |

### Marketplace (`/api/marketplace`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/items` | Listar items |
| GET | `/items/:id` | Detalle de item |
| GET | `/cart` | Ver carrito |
| POST | `/cart` | Agregar al carrito |
| DELETE | `/cart/:id` | Eliminar del carrito |
| POST | `/checkout` | Procesar compra |
| GET | `/orders` | Ver órdenes |

### Admin Marketplace (`/api/admin/marketplace`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/items` | Listar items (admin) |
| POST | `/items` | Crear item |
| PUT | `/items/:id` | Actualizar item |
| DELETE | `/items/:id` | Eliminar item |

### Foro (`/api/forum`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/categories` | Listar categorías |
| GET | `/topics` | Listar temas |
| GET | `/topics/:id` | Ver tema |
| POST | `/topics` | Crear tema |
| POST | `/topics/:id/comments` | Comentar |
| POST | `/topics/:id/vote` | Votar |

### Noticias (`/api/news`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar noticias |
| GET | `/:id` | Ver noticia |
| POST | `/` | Crear noticia (admin) |
| PUT | `/:id` | Editar noticia (admin) |
| DELETE | `/:id` | Eliminar noticia (admin) |
| POST | `/:id/like` | Dar like |

### Wiki (`/api/wiki`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/categories` | Listar categorías |
| GET | `/articles` | Listar artículos |
| GET | `/articles/:slug` | Ver artículo |
| GET | `/search` | Buscar |

### Guilds (`/api/guilds`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar guilds |
| GET | `/:id` | Ver guild |
| POST | `/` | Crear guild |

### Highscores (`/api/highscores`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Clasificación global |

### Deaths (`/api/deaths`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Muertes recientes |

### Admin Users (`/api/admin/users`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar usuarios |
| GET | `/:id` | Ver usuario |
| PUT | `/:id` | Editar usuario |
| PUT | `/:id/block` | Bloquear usuario |
| PUT | `/:id/permissions` | Editar permisos |

---

## Esquema de Base de Datos

### Tablas Principales

#### `accounts`
```sql
- id (INT, PK)
- name (VARCHAR)
- email (VARCHAR, UNIQUE)
- password (VARCHAR)
- premdays (INT)
- group_id (INT)
- creation (TIMESTAMP)
- recovery_key (VARCHAR)
```

#### `players`
```sql
- id (INT, PK)
- account_id (INT, FK)
- name (VARCHAR, UNIQUE)
- level (INT)
- vocation (INT)
- health (INT)
- healthmax (INT)
- mana (INT)
- manamax (INT)
- experience (BIGINT)
- lookbody (INT)
- lookfeet (INT)
- lookhead (INT)
- looklegs (INT)
- looktype (INT)
- posx (INT)
- posy (INT)
- posz (INT)
```

#### `market_items`
```sql
- id (INT, PK)
- name (VARCHAR)
- description (TEXT)
- price (DECIMAL)
- category (VARCHAR)
- image_url (VARCHAR)
- stock (INT)
- featured (BOOLEAN)
- active (BOOLEAN)
```

#### `orders`
```sql
- id (INT, PK)
- account_id (INT, FK)
- character_id (INT, FK)
- total (DECIMAL)
- status (ENUM)
- payment_id (VARCHAR)
- created_at (TIMESTAMP)
```

---

## Configuración de Producción

### Build
```bash
pnpm build
```

### Iniciar Servidor
```bash
pnpm start
```

### Variables de Entorno (Producción)
```env
NODE_ENV=production
BACKEND_URL=https://api.tudominio.com
FRONTEND_URL=https://tudominio.com
PUBLIC_API_URL=https://api.tudominio.com

# Usar tokens de producción de MercadoPago
MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxx
MP_PUBLIC_KEY=APP_USR-xxxxxxxxxxxxx
PUBLIC_MP_PUBLIC_KEY=APP_USR-xxxxxxxxxxxxx
```

---

## Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Astro SSR    │────▶│   Express API   │────▶│     MySQL       │
│   (Frontend)    │     │   (Backend)     │     │   (Database)    │
│   Port: 4321    │     │   Port: 3301    │     │                 │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│   MercadoPago   │     │     Resend      │
│   (Payments)    │     │    (Emails)     │
│                 │     │                 │
└─────────────────┘     └─────────────────┘
```

---

## Flujo de Autenticación

```
┌────────────┐    ┌────────────┐    ┌────────────┐
│   Client   │───▶│   Server   │───▶│  Database  │
│            │    │            │    │            │
│ 1. Login   │    │ 2. Verify  │    │ 3. Query   │
│    Form    │    │    Creds   │    │   Account  │
│            │    │            │    │            │
│ 6. Receive │◀───│ 5. Set     │◀───│ 4. Return  │
│    Cookie  │    │    Cookie  │    │    Data    │
└────────────┘    └────────────┘    └────────────┘
```

---

## Integraciones

### MercadoPago
- Creación de preferencias de pago
- Procesamiento de pagos con tarjeta
- Manejo de webhooks para notificaciones
- Moneda: ARS (Pesos Argentinos)
- Ambientes de prueba y producción

### Resend (Email)
- Emails de restablecimiento de contraseña
- Plantillas HTML de email
- Branding personalizado
- Links con expiración (1 hora)

---

## CI/CD

El proyecto incluye workflows de GitHub Actions:

- **ci.yml**: Pipeline de integración continua
- **keep-alive.yml**: Tarea programada para mantener servicios activos

---

## Contribuir

1. Fork el repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

---

## Licencia

Este proyecto es privado y de uso exclusivo para Mystovia.

---

<div align="center">

**Desarrollado para Mystovia MMORPG Server**

</div>
