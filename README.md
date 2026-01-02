# Mystovia Web

<div align="center">

![Mystovia](https://img.shields.io/badge/Mystovia-MMORPG%20Server-gold?style=for-the-badge)
![Astro](https://img.shields.io/badge/Astro-5.15.3-BC52EE?style=for-the-badge&logo=astro)
![Express](https://img.shields.io/badge/Express-5.1.0-000000?style=for-the-badge&logo=express)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=for-the-badge&logo=typescript)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql)

**Plataforma web completa para servidor privado de Tibia MMORPG**

[Características](#características) • [Tecnologías](#stack-tecnológico) • [Instalación](#instalación) • [Estructura](#estructura-del-proyecto) • [API](#api-endpoints)

</div>

---

## Descripción

Mystovia Web es un monorepo que contiene tanto el frontend como el backend de una plataforma web completa para un servidor privado de Tibia. Incluye sistema de cuentas, gestión de personajes, marketplace con pagos y Boss Points, foro, noticias, integración con Twitch, y panel de administración.

---

## Características

### Sistema de Usuarios
- Registro con verificación de email
- Login/logout con sesiones basadas en cookies
- Recuperación de cuenta vía email
- Restablecimiento de contraseña
- Generación de claves de recuperación
- Gestión de días premium

### Gestión de Personajes
- Creación de personajes con selección de vocación
- Visualización de información del personaje
- Seguimiento de habilidades, experiencia y salud
- Personalización de apariencia

### Boss Points System
- Acumulación automática de puntos al derrotar bosses en el juego
- Visualización del balance de BP en el header del sitio
- Canje de puntos por items exclusivos en el Marketplace
- Historial de canjes en el panel de cuenta
- Filtro de productos canjeables con BP en la tienda
- Panel de administración para gestionar canjes

### Marketplace/Tienda
- Catálogo de items con categorías (Knight, Paladin, Sorcerer, Druid, Items)
- Sistema de carrito de compras persistente
- **Dos métodos de compra:**
  - Pago con dinero real (MercadoPago)
  - Canje con Boss Points
- Entrega de items al personaje seleccionado
- Seguimiento de órdenes y estado
- Items destacados y gestión de stock
- Selección/personalización de armas
- Cards con efecto flip para ver descripción completa

### Integración con Twitch
- Conexión de cuenta Twitch desde gestión de cuenta
- Página de streams en vivo
- Widget de streams en la página principal
- Detección automática cuando estás transmitiendo Mystovia

### Comunidad

#### Foro
- Categorías con temas
- Comentarios y respuestas
- Sistema de votación (upvote/downvote)
- Bloqueo y fijación de temas (admin)

#### Noticias
- Crear/editar/eliminar noticias (admin)
- Categorías de noticias
- Paginación y sistema de likes

#### Guilds
- Creación de guilds
- Perfiles de guild con detalles
- Listado y miembros de guild

### Información del Juego
- Tabla de clasificación (highscores globales)
- Registro de muertes recientes
- Lista de jugadores online
- Estado del servidor
- Reglas del juego
- Changelog de actualizaciones

### Panel de Administración
- Dashboard de estadísticas
- Gestión de usuarios (búsqueda, roles, permisos)
- Bloqueo/desbloqueo de usuarios
- Asignación de días premium
- Moderación del foro
- Gestión de noticias
- **Gestión de Marketplace:**
  - Items (crear/editar/eliminar)
  - Órdenes de pago y canjes de BP unificados
  - Filtro por tipo de orden (Pagos / Boss Points)
  - Estadísticas de ventas y canjes
- Sistema de permisos granular

### Internacionalización
- 3 idiomas: Español (por defecto), Inglés, Portugués
- Detección de idioma por navegador
- Preferencia guardada en localStorage
- Integración con i18next

### UI/UX
- Tema medieval/fantasía con acentos dorados
- Efectos de partículas en el fondo
- Transiciones de página con Astro ViewTransitions
- Estética dark mode
- Diseño responsive (mobile-friendly)

---

## Stack Tecnológico

### Frontend
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| **Astro** | 5.15.3 | Framework principal con SSR |
| **React** | 19.2.0 | Componentes interactivos |
| **Tailwind CSS** | 4.1.16 | Framework de estilos |
| **Lucide** | 0.552.0 | Librería de iconos |
| **i18next** | 25.7.2 | Internacionalización |
| **tsParticles** | 3.9.1 | Efectos de partículas |

### Backend
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| **Node.js** | 18+ | Runtime |
| **Express** | 5.1.0 | Framework web |
| **TypeScript** | 5.9.3 | Lenguaje tipado |
| **MySQL** | 3.15.3 | Base de datos (mysql2/promise) |
| **bcryptjs** | 3.0.3 | Hash de contraseñas |

### Servicios Externos
| Servicio | Descripción |
|----------|-------------|
| **MercadoPago SDK** | Pasarela de pagos (ARS) |
| **Resend** | Servicio de emails |
| **Twitch API** | Integración de streams |

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

# Twitch (opcional)
TWITCH_CLIENT_ID=xxxxxxxxxxxxx
TWITCH_CLIENT_SECRET=xxxxxxxxxxxxx
```

4. **Configurar base de datos**

Ejecutar los scripts SQL:
```bash
mysql -u root -p otserver < database/schema.sql
mysql -u root -p otserver < database/marketplace.sql
mysql -u root -p otserver < server/src/migrations/create_boss_points_shop.sql
```

5. **Iniciar en desarrollo**
```bash
pnpm dev
```

Frontend: `http://localhost:4321`
Backend: `http://localhost:3301`

---

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Inicia frontend y backend concurrentemente |
| `pnpm dev:astro` | Solo frontend (Astro) |
| `pnpm dev:server` | Solo backend (Express con nodemon) |
| `pnpm build` | Compila para producción |
| `pnpm start` | Inicia servidor de producción |

---

## Estructura del Proyecto

```
mystovia-web/
├── src/                              # Frontend (Astro)
│   ├── components/
│   │   ├── account/                  # Gestión de cuenta
│   │   ├── admin/                    # Panel de administración
│   │   │   ├── AdminMarketplace.tsx
│   │   │   ├── AdminOrders.tsx
│   │   │   └── ...
│   │   ├── forum/                    # Foro
│   │   ├── landing/                  # Página principal
│   │   ├── marketplace/              # Tienda
│   │   │   ├── ItemCard.tsx
│   │   │   ├── MarketplaceView.tsx
│   │   │   ├── BossPointsPurchaseModal.tsx
│   │   │   ├── CheckoutModal.tsx
│   │   │   └── ...
│   │   └── twitch/                   # Integración Twitch
│   │
│   ├── data/
│   │   └── changelog.json            # Historial de cambios
│   │
│   ├── i18n/                         # Internacionalización
│   │   └── locales/
│   │       ├── es.json
│   │       ├── en.json
│   │       └── pt.json
│   │
│   ├── pages/
│   │   ├── index.astro               # Inicio
│   │   ├── marketplace.astro         # Tienda
│   │   ├── logs/                     # Changelog
│   │   ├── streams/                  # Streams de Twitch
│   │   ├── forum/
│   │   ├── news/
│   │   ├── guilds/
│   │   └── admin/
│   │
│   └── styles/
│       └── global.css
│
├── server/                           # Backend (Express)
│   └── src/
│       ├── controllers/
│       │   ├── authController.ts
│       │   ├── marketplaceController.ts
│       │   ├── adminMarketplaceController.ts
│       │   ├── bossPointsController.ts
│       │   ├── twitchController.ts
│       │   └── ...
│       │
│       ├── routes/
│       │   ├── marketplaceRoutes.ts
│       │   ├── adminMarketplaceRoutes.ts
│       │   ├── bossPointsRoutes.ts
│       │   ├── twitchRoutes.ts
│       │   └── ...
│       │
│       ├── middleware/
│       │   ├── authMiddleware.ts
│       │   └── adminMiddleware.ts
│       │
│       └── migrations/
│           ├── create_boss_points_shop.sql
│           └── fix_boss_points_purchases.sql
│
├── database/                         # Scripts SQL base
├── public/                           # Archivos públicos
└── package.json
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
| GET | `/` | Información de cuenta |
| PUT | `/` | Actualizar cuenta |
| POST | `/recovery-key` | Generar clave de recuperación |

### Boss Points (`/api/boss-points`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/balance` | Obtener balance de BP |
| POST | `/purchase` | Canjear BP por item |
| GET | `/history` | Historial de canjes |

### Marketplace (`/api/marketplace`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/items` | Listar items |
| GET | `/cart` | Ver carrito |
| POST | `/cart` | Agregar al carrito |
| DELETE | `/cart/:id` | Eliminar del carrito |
| POST | `/checkout` | Procesar compra |
| GET | `/orders` | Ver órdenes |

### Admin Marketplace (`/api/admin/marketplace`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/items` | Listar items |
| POST | `/items` | Crear item |
| PUT | `/items/:id` | Actualizar item |
| DELETE | `/items/:id` | Eliminar item |
| GET | `/orders` | Ver todas las órdenes (pagos + BP) |
| GET | `/orders/:id/items` | Ver items de una orden |
| PATCH | `/orders/:id/status` | Actualizar estado |
| GET | `/stats` | Estadísticas |

### Twitch (`/api/twitch`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/auth` | Iniciar OAuth |
| GET | `/callback` | Callback OAuth |
| GET | `/streams` | Obtener streams activos |
| DELETE | `/disconnect` | Desconectar cuenta |

### Foro (`/api/forum`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/categories` | Listar categorías |
| GET | `/topics` | Listar temas |
| POST | `/topics` | Crear tema |
| POST | `/topics/:id/vote` | Votar |

### Noticias (`/api/news`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar noticias |
| GET | `/:id` | Ver noticia |
| POST | `/` | Crear noticia (admin) |
| PUT | `/:id` | Editar noticia (admin) |
| DELETE | `/:id` | Eliminar noticia (admin) |

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

---

## Esquema de Base de Datos

### Tablas Principales

#### `accounts`
```
id, name, email, password, premdays, group_id, creation, recovery_key
```

#### `players`
```
id, account_id, name, level, vocation, health, mana, experience, look*
```

#### `market_items`
```
id, name, description, price, category, image_url, stock, featured, is_active,
redeemable_with_bp (BOOLEAN), bp_price (INT), items_json, weapon_options
```

#### `orders`
```
id, account_id, player_id, total_amount, status, payment_method, payment_id,
created_at, delivered_at
```

#### `boss_points_purchases`
```
id, account_id, player_name, market_item_id, item_name, points_spent, timestamp
```

---

## Configuración de Producción

### Build
```bash
pnpm build
```

### Variables de Entorno
```env
NODE_ENV=production
BACKEND_URL=https://api.tudominio.com
FRONTEND_URL=https://tudominio.com
PUBLIC_API_URL=https://api.tudominio.com

# Tokens de producción de MercadoPago
MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxx
MP_PUBLIC_KEY=APP_USR-xxxxxxxxxxxxx
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
        ▼                       ▼
┌───────────────────────────────────────────────────────────────┐
│                     Servicios Externos                        │
├─────────────────┬─────────────────┬─────────────────┐         │
│   MercadoPago   │     Resend      │   Twitch API    │         │
│   (Payments)    │    (Emails)     │   (Streams)     │         │
└─────────────────┴─────────────────┴─────────────────┘         │
└───────────────────────────────────────────────────────────────┘
```

---

## Changelog

Ver [changelog.json](src/data/changelog.json) para el historial completo de cambios.

### Versión Actual: 1.2.5
- Sistema de Boss Points
- Canjes de BP en Marketplace
- Panel de administración de canjes

---

## Licencia

Este proyecto es privado y de uso exclusivo para Mystovia.

---

<div align="center">

**Desarrollado para Mystovia MMORPG Server**

</div>
