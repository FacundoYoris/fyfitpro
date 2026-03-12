# FY FitPro - Aplicación de Gestión de Gimnasio

## Requisitos Previos

- Node.js 20.x o superior
- MySQL 8.x
- npm o yarn

## Configuración Inicial

### 1. Base de Datos MySQL

1. Crear una base de datos en MySQL:
```sql
CREATE DATABASE gimnasio_db;
```

2. Copiar el archivo de configuración:
```bash
cd backend
cp .env.example .env
```

3. Editar `.env` con tus datos de MySQL:
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gimnasio_db
DB_USER=root
DB_PASSWORD=tu_password
JWT_SECRET=tu_secret_jwt
```

### 2. Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

## Ejecutar la Aplicación

### Backend (Puerto 3001)
```bash
cd backend
npm run dev
```

El backend creará automáticamente las tablas y种子 con:
- Usuario admin por defecto: `admin@gimnasio.com` / `admin123`
- 34 ejercicios base
- 4 planes de ejemplo

### Frontend (Puerto 3000)
```bash
cd frontend
npm run dev
```

## Estructura del Proyecto

```
gimnasio/
├── backend/           # API REST con Express
│   ├── src/
│   │   ├── config/    # Configuración (DB, JWT)
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/    # Modelos Sequelize
│   │   ├── routes/
│   │   ├── services/
│   │   └── seeders/
│   └── package.json
│
└── frontend/          # React con Vite
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── pages/
    │   ├── services/
    │   ├── types/
    │   └── styles/
    └── package.json
```

## Funcionalidades Implementadas

### Admin
- ✅ Login y autenticación JWT
- ✅ CRUD de usuarios
- ✅ CRUD de planes
- ✅ Control de pagos mensuales
- ✅ Catálogo de ejercicios
- ✅ Gestión de rutinas
- ✅ Dashboard con métricas

### Usuario
- ✅ Ver su plan asignado
- ✅ Ver su rutina asignada
- ✅ Aviso de pago pendiente

## Tecnologías

- **Backend**: Express, Sequelize, MySQL, JWT
- **Frontend**: React 18, Vite, React Router, Axios
