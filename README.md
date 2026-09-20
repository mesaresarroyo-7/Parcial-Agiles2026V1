> **Estado del repositorio:** versión legada conservada como historial académico. La versión principal mantenida es [gestion-proyectos-agiles-app](https://github.com/mesaresarroyo-7/gestion-proyectos-agiles-app). No publiques archivos `.env` ni credenciales reales en este repositorio.

# DollarCity Mejorado - Proyecto para clase

Sistema web de gestion para DollarCity Santa Anita.

## Tecnologias

- Frontend: React + Vite
- Backend: Node.js + Express
- Base de datos: PostgreSQL / Supabase

## Requisitos

- Node.js 18 o superior
- Git, si vas a clonar el repositorio
- Credenciales de base de datos configuradas en `backend/.env`

## Instalacion

### 1. Clonar el repositorio

```bash
git clone https://github.com/mesaresarroyo-7/Parcial-Agiles2026V1.git
cd Parcial-Agiles2026V1
```

### 2. Configurar variables de entorno

Copia los archivos de ejemplo y completa los valores necesarios:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

En `backend/.env` configura la conexion a PostgreSQL/Supabase y el `JWT_SECRET`.
En `frontend/.env` configura la URL del backend, por ejemplo:

```text
VITE_API_URL=http://localhost:4000/api
```

### 3. Instalar backend

```bash
cd backend
npm install
```

### 4. Instalar frontend

```bash
cd ../frontend
npm install
```

### 5. Ejecutar backend

En una terminal:

```bash
cd backend
npm start
```

Backend:

```text
http://localhost:4000
```

Prueba de backend:

```text
http://localhost:4000/api/health
```

### 6. Ejecutar frontend

En otra terminal:

```bash
cd frontend
npm run dev
```

Frontend:

```text
http://localhost:5173/
```

## Credenciales de prueba

| Rol | Correo | Clave |
| --- | --- | --- |
| Admin | admin@dollarcity.pe | Admin123! |
| Vendedor | vendedor@dollarcity.pe | Vendedor123! |
| Almacenero | almacen@dollarcity.pe | Almacen123! |

## Archivos importantes

- `backend/.env.example`: plantilla de configuracion del backend.
- `frontend/.env.example`: plantilla de configuracion del frontend.
- `backend/database/schema.sql`: estructura de la base de datos.
- `backend/database/seed.sql`: datos iniciales y usuarios de prueba.

## Nota

No se sube la carpeta `node_modules` porque se genera automaticamente con `npm install` y pesa demasiado.
Tampoco se suben archivos `.env` reales para evitar publicar credenciales o configuraciones privadas.
