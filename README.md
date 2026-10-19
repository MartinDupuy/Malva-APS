# Sistema Integral Web y Móvil para Aerolínea Nacional

## 📋 Descripción del Proyecto
Este proyecto consiste en el desarrollo de un sistema integral web y de una aplicación móvil para una aerolínea nacional. El objetivo principal es modernizar y digitalizar su gestión operativa, optimizar el proceso de venta de pasajes y mejorar significativamente la experiencia de los pasajeros.

La plataforma centraliza la administración de vuelos, la gestión de pasajes, el procesamiento de pagos y el control de ocupación, ofreciendo interfaces de usuario adaptadas a diferentes roles con una experiencia visual unificada.

---

## 👥 Tipos de Usuarios y Roles
La plataforma cuenta con interfaces específicas y diferenciadas para tres tipos de usuarios:
* **Administradores:** Encargados de la gestión operativa global, creación y modificación de vuelos, control de capacidad y reportes de ocupación.
* **Empleados de Mostrador:** Personal de atención que interactúa con las operaciones presenciales y de asistencia en tierra.
* **Pasajeros:** Usuarios finales que utilizan tanto la plataforma web como la **aplicación móvil** para buscar vuelos, realizar compras, recibir notificaciones y descargar tickets.

---

## 🚀 Funcionalidades Principales

### 1. Administración de Vuelos
* **Gestión Operativa:** Los administradores pueden crear, modificar y cancelar vuelos.
* **Definición de Rutas y Horarios:** Configuración de los días de la semana en que opera cada vuelo, horarios de partida y llegada, y aeropuertos de origen y destino.
* **Disponibilidad y Capacidad:** Establecimiento del período del año en que el vuelo está disponible para la venta y la capacidad total del avión (diferenciada por asientos en *Economy* y *Primera Clase*).
* **Tarifas:** Configuración de los precios de los pasajes diferenciados por clase.

### 2. Gestión y Compra de Pasajes
* **Búsqueda Avanzada:** Los pasajeros pueden buscar vuelos indicando origen, destino, fechas y horarios disponibles.
* **Compra por Transacción:** Permite adquirir hasta un **máximo de 9 pasajes por transacción**, seleccionando la clase correspondiente (*Economy* o *Primera Clase*).
* **Gestión de Pagos y Facturación:** Ingreso de información de pago, registro de la transacción y envío automatizado por correo electrónico de los pasajes electrónicos y la factura correspondiente.

### 3. Control Operativo y Notificaciones
* **Reportes de Ocupación:** Herramienta para que los administradores consulten reportes detallados de ocupación por vuelo, clase y fecha.
* **Sistema de Alertas:** Envío automático de notificaciones por email a los pasajeros ante cambios de horario o cancelaciones.

---

## 📱 Aplicación Móvil para Pasajeros
Complementando la plataforma web, se incluye una app móvil exclusiva para pasajeros que permite:
* Buscar vuelos de forma rápida y sencilla.
* Comprar pasajes desde dispositivos móviles.
* Recibir notificaciones en tiempo real.
* Descargar tickets electrónicos.

---

## 🛠️ Tecnologías y Arquitectura

El sistema está diseñado bajo una arquitectura de **Monolito Modular Stateless**, estructurado con límites claros entre dominios (vuelos, reservas, pagos, notificaciones) y preparado para alta concurrencia.

### Stack Tecnológico Principal
* **Backend:** Node.js (CommonJS)
* **Testing:** Jest

### Infraestructura y Despliegue
* **Balanceador de Carga:** Distribuye el tráfico hacia las instancias de la API.
* **Autoescalado Horizontal:** Instancias de backend stateless que escalan según demanda.
* **Base de Datos Transaccional (Relacional):** Única fuente de verdad con réplicas de lectura para optimizar las búsquedas intensivas.
* **Caché (ej. Redis):** Para acelerar consultas frecuentes de disponibilidad.
* **Cola de Mensajes Asíncrona:** Para procesamiento en segundo plano (emails, notificaciones, etc.).
* **CDN:** Distribución de assets estáticos de las interfaces web.

---

## ⚙️ Instalación y Configuración

### Requisitos

- Node.js y npm instalados.
- PostgreSQL es necesario para ejecutar el backend con persistencia.

### Instalación

Desde la raíz del proyecto:

```bash
npm install
```

Las variables de SMTP del archivo `.env.example` solo son necesarias para los módulos de notificaciones. Para ejecutar el backend con PostgreSQL, también es necesario definir `DATABASE_URL`.

### Levantar el backend

#### Con repositorios en memoria

Esta opción no requiere PostgreSQL y es suficiente para probar la API localmente. Los vuelos y las reservas se pierden al reiniciar el backend.

En una terminal:

```bash
BOOKING_REPOSITORY=memory npm start
```

#### Con PostgreSQL

Definir la cadena de conexión antes de iniciar el backend:

```bash
export DATABASE_URL='postgresql://usuario:password@localhost:5432/malva'
npm start
```

También puede indicarse `DATABASE_URL` en la misma línea:

```bash
DATABASE_URL='postgresql://usuario:password@localhost:5432/malva' npm start
```

La base de datos y el servidor PostgreSQL deben existir y estar disponibles. Si no se define `BOOKING_REPOSITORY`, el backend utiliza PostgreSQL por defecto.

La API Express queda disponible en `http://localhost:3000`.

### Levantar el frontend

En una segunda terminal:

```bash
npm run dev
```

La interfaz Vite queda disponible en `http://localhost:5173` y redirige las llamadas `/api` al backend.

### Endpoints principales

```text
POST   /api/flights
GET    /api/flights
GET    /api/flights/search
PUT    /api/flights/:id
DELETE /api/flights/:id
```

Ejemplo de búsqueda:

```bash
curl "http://localhost:3000/api/flights/search?origin=EZE&destination=COR&date=2099-01-01&passengers=2&cabinClass=economy&tariff=100000"
```

Para listar todos los vuelos activos sin filtros:

```bash
curl "http://localhost:3000/api/flights/search"
```

### Pruebas y build

Ejecutar las pruebas:

```bash
npm test -- --runInBand
```

Generar el build de producción del frontend:

```bash
npm run build
```

Previsualizar el build:

```bash
npm run preview
```

Con `BOOKING_REPOSITORY=memory`, la persistencia es temporal: los vuelos y las reservas se pierden al reiniciar el backend. Con PostgreSQL, las reservas y los bloqueos de asientos se almacenan en la base de datos.
