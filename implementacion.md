# Implementacion en cloud server (nivel cliente real)

Este documento define un plan paso a paso para llevar FY FitPro a produccion y migrar la base de datos de SQLite a MySQL con Prisma.

## 1) Definir alcance de produccion
1. Definir ambiente minimo: `prod` y `staging`.
2. Confirmar volumen esperado (usuarios activos, picos horarios, almacenamiento de adjuntos).
3. Definir SLA con cliente (ej: 99.5%, horario de soporte, RTO/RPO).
4. Definir politicas de seguridad: rotacion de credenciales, acceso por roles, backups.

## 2) Elegir arquitectura de despliegue
1. Backend Express en contenedor Docker.
2. Frontend React (Vite) compilado y servido como estatico por Nginx.
3. Reverse proxy Nginx con HTTPS (Let's Encrypt).
4. Base de datos MySQL preferentemente administrada (no en el mismo server de app para cliente real).
5. Monitoreo basico: uptime checks + logs centralizados.

## 3) Provisionar infraestructura
1. Comprar dominio y configurar DNS (`api.tudominio.com`, `app.tudominio.com`).
2. Crear servidor Linux (Ubuntu 22.04 LTS recomendado).
3. Instalar paquetes base:
   - `docker`, `docker compose plugin`, `ufw`, `fail2ban`, `nginx`, `certbot`.
4. Abrir solo puertos necesarios:
   - `22` (SSH), `80` (HTTP), `443` (HTTPS).
5. Deshabilitar acceso root por password y usar llaves SSH.

## 4) Preparar MySQL para produccion
1. Crear instancia MySQL 8.x (managed recomendado).
2. Crear base `fy_fitpro_prod`.
3. Crear usuario dedicado de app con permisos solo sobre esa base.
4. Habilitar SSL/TLS en la conexion MySQL.
5. Configurar backups automaticos diarios + retencion minima 7/14 dias.

## 5) Migrar proyecto de SQLite a MySQL (Prisma)
1. Editar `backend/prisma/schema.prisma`:
   - cambiar `provider = "sqlite"` por `provider = "mysql"`.
   - cambiar `url` para usar `env("DATABASE_URL")`.
2. Definir `DATABASE_URL` en `backend/.env` y secretos de produccion:
   - `DATABASE_URL="mysql://user:pass@host:3306/fy_fitpro_prod"`
   - `JWT_SECRET` fuerte y largo.
   - `JWT_EXPIRES_IN` segun negocio.
3. Regenerar cliente Prisma:
   - `npx --prefix backend prisma generate`
4. Crear migracion inicial MySQL (desde estado actual del schema):
   - `npx --prefix backend prisma migrate dev --name init_mysql`
5. En produccion aplicar migraciones:
   - `npx --prefix backend prisma migrate deploy`

## 6) Estrategia de datos (si ya hay datos en SQLite)
1. Si el sistema aun no esta en uso real: conviene arrancar limpio en MySQL.
2. Si ya hay datos importantes en SQLite:
   - congelar escrituras temporalmente (ventana de mantenimiento),
   - exportar entidades clave (`User`, `Plan`, `Payment`, `Routine`, etc.),
   - importar respetando orden de dependencias (tablas padre antes de hijas),
   - validar conteos por tabla y muestras funcionales.
3. Recomendado: hacer script ETL de unica ejecucion y versionarlo en `backend/src/utils`.
4. Antes de abrir produccion: test de login, pagos, rutinas y dashboard con datos migrados.

## 7) Ajustes de codigo recomendados para MySQL
1. Actualizar mensajes de conexion en `backend/src/config/database.ts` (hoy dice SQLite).
2. Revisar `README.md` para que no contradiga el estado real.
3. Confirmar que no haya rutas/logica atada a filesystem local para datos persistentes.
4. Revisar indices en Prisma para consultas frecuentes (`email`, `dni`, `createdAt`, filtros por estado).

## 8) Empaquetado y despliegue
1. Crear `Dockerfile` para backend (build TS y ejecutar `dist/app.js`).
2. Crear `Dockerfile` o build estatico para frontend (`npm run build` y servir `dist`).
3. Orquestar con `docker-compose.yml` (app + nginx).
4. Pasar variables por `.env` en server (no commitear secretos).
5. Desplegar por release:
   - pull de codigo,
   - build imagenes,
   - `prisma migrate deploy`,
   - levantar servicios,
   - smoke tests.

## 9) HTTPS, seguridad y hardening
1. Configurar SSL con Certbot y renovacion automatica.
2. Forzar HTTPS y redireccion HTTP -> HTTPS.
3. Activar headers de seguridad en Nginx (HSTS, X-Frame-Options, etc.).
4. Limitar CORS a dominios del cliente.
5. Configurar rate limiting para rutas de auth.
6. Rotar `JWT_SECRET` y credenciales DB ante cualquier incidente.

## 10) CI/CD minimo recomendado
1. Pipeline en cada push/PR:
   - build backend,
   - tests backend,
   - build frontend,
   - tests frontend (al menos smoke en CI).
2. Deploy a staging automatico.
3. Deploy a produccion manual con aprobacion.
4. Bloquear deploy si tests o build fallan.

## 11) Observabilidad y operacion
1. Uptime monitor de `app` y `api` (cada 1 min o 5 min).
2. Centralizar logs (al menos archivos rotados + alertas por errores 5xx).
3. Medir metrica minima:
   - uso CPU/RAM,
   - latencia p95 API,
   - tasa de errores,
   - conexiones DB.
4. Definir runbook de incidentes (que revisar primero y como rollback).

## 12) Backups y recuperacion
1. Backups automaticos MySQL diarios.
2. Snapshot semanal adicional.
3. Test de restauracion mensual (obligatorio para cliente real).
4. Guardar backup en zona/regiones distintas si es posible.

## 13) Checklist antes de go-live
1. `npm --prefix backend run build` OK.
2. `npm --prefix backend run test` OK.
3. `npm --prefix frontend run build` OK.
4. `npm --prefix frontend run test` OK.
5. Migraciones aplicadas (`prisma migrate deploy`).
6. SSL activo y CORS restringido.
7. Backups programados y verificados.
8. Monitoreo y alertas activos.

## 14) MySQL vs alternativa mejor
1. Si tu fuerte es MySQL, esta perfecto para este sistema y Prisma lo soporta excelente.
2. Para este caso, no hay obligacion tecnica fuerte de cambiar a PostgreSQL.
3. PostgreSQL puede ser mejor en escenarios de consultas analiticas complejas, JSON avanzado o crecimiento alto, pero MySQL 8 es totalmente valido para una app de cliente real.
4. Recomendacion practica: seguir con MySQL por velocidad de ejecucion y menor riesgo operativo para vos.

---

## Recomendaciones de costo (barato vs simple)

### Opcion A (recomendada costo/beneficio)
- 1 VPS (2 vCPU, 4 GB RAM) para app + nginx.
- MySQL administrado economico (plan basico).
- Costo estimado: `USD 20-45/mes` total segun proveedor/region.
- Pros: barato, control total, escalable en pasos.
- Contras: requiere ops basica (actualizaciones, monitoreo).

### Opcion B (mas simple, algo mas caro)
- Frontend en Vercel/Netlify.
- Backend en Render/Railway/Fly.
- MySQL administrado externo.
- Costo estimado: `USD 35-90/mes` para uso real sin limites molestos.
- Pros: menos operaciones de servidor.
- Contras: puede subir rapido el costo al crecer trafico.

### Opcion C (minimo costo absoluto al inicio)
- Todo en 1 VPS (incluyendo MySQL local).
- Costo estimado: `USD 8-20/mes`.
- Pros: muy barato para arrancar.
- Contras: riesgo alto (single point of failure), peor backup y recuperacion; no ideal para cliente formal.

## Recomendacion final para cliente real
1. Empezar con Opcion A.
2. Mantener MySQL (alineado con tu experiencia).
3. Implementar staging + backups + monitoreo desde el dia 1.
4. Dejar preparada escalabilidad horizontal de backend para fase 2.
