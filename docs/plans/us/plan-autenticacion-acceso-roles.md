# Plan de Implementación – Autenticación, Control de Acceso y Gestión de Roles

**Rama:** `us/autenticacion-acceso-roles`

**User Story:** Como miembro del equipo de desarrollo, quiero implementar el sistema de autenticación de usuarios y diferenciación de roles (Pasajero, Administrador, Empleado de Mostrador), de forma que el sistema garantice el acceso seguro y restringido a las funcionalidades según el tipo de perfil.

**Presupuesto total:** 16 horas

---

## Decisiones de diseño

### Arquitectura
Se sigue el patrón de puertos y adaptadores (hexagonal) establecido en el proyecto. El módulo `auth` se agrega como un nuevo servicio bajo `services/auth/` con las capas habituales: `domain/`, `use-cases/`, `adapters/`. Los middlewares de autenticación y autorización se colocan en `infra/` como infraestructura transversal del servidor Express.

### Estrategia de autenticación
- **JWT (JSON Web Tokens)** como mecanismo de tokens stateless. Se usa la librería `jsonwebtoken` (estándar de facto en Node.js).
- **bcrypt** para hashing de contraseñas (librería `bcryptjs`, sin dependencias nativas).
- Los tokens se emiten en el login y se validan en cada request protegida mediante un middleware Express.
- **No se implementa refresh tokens** en esta iteración para evitar overkill. El token tiene una expiración configurable (ej: 8h) suficiente para el contexto académico.

### Modelo de roles
- Tres roles fijos como constantes: `PASSENGER`, `ADMIN`, `COUNTER_AGENT` (Empleado de Mostrador).
- El rol se asigna al momento del registro y se incluye en el payload del JWT.
- Por defecto, un usuario registrado es `PASSENGER`.
- Los roles `ADMIN` y `COUNTER_AGENT` se asignan manualmente (seed de datos o endpoint protegido futuro).

### Módulos y ubicación

```
/services
  /auth                   ← Nuevo: módulo de autenticación
    /domain
      User.js                       (entidad)
      Roles.js                      (constantes de roles)
      PasswordHasher.js             (puerto)
      TokenService.js               (puerto)
    /use-cases
      RegisterUser.js               (caso de uso)
      LoginUser.js                  (caso de uso)
    /adapters
      BcryptPasswordHasher.js       (adaptador)
      JwtTokenService.js            (adaptador)
      InMemoryUserRepository.js     (adaptador)
      PostgresUserRepository.js     (adaptador)
      AuthController.js             (controlador HTTP)
/infra
  auth-router.js                    ← Nuevo: rutas de login/registro
  auth-middleware.js                ← Nuevo: middleware de autenticación JWT
  role-middleware.js                ← Nuevo: middleware de autorización por rol
/tests
  /auth
    User.test.js
    Roles.test.js
    RegisterUser.test.js
    LoginUser.test.js
    BcryptPasswordHasher.test.js
    JwtTokenService.test.js
    auth-middleware.test.js
    role-middleware.test.js
    AuthIntegration.test.js
/frontend
  /src
    /hooks
      useAuth.js                    ← Nuevo: hook de autenticación
    /pages
      LoginPage.jsx                 ← Nuevo: pantalla de login
      RegisterPage.jsx              ← Nuevo: pantalla de registro
    /components
      /auth
        LoginForm.jsx               ← Nuevo
        RegisterForm.jsx            ← Nuevo
```

### Dependencias entre módulos
- `RegisterUser` depende de: `UserRepository` (puerto), `PasswordHasher` (puerto).
- `LoginUser` depende de: `UserRepository` (puerto), `PasswordHasher` (puerto), `TokenService` (puerto).
- `auth-middleware` depende de: `TokenService` (para verificar JWT).
- `role-middleware` depende de: `Roles` (constantes).
- Todas las dependencias se inyectan por constructor → facilita testing con mocks/stubs.

### Principios aplicados
- **SRP:** Cada clase tiene una sola responsabilidad (hashear passwords ≠ generar tokens ≠ validar roles).
- **OCP:** Cambiar de bcrypt a argon2 → nuevo adaptador, sin tocar el caso de uso.
- **DIP:** Los casos de uso dependen de abstracciones (puertos), no de `bcryptjs` o `jsonwebtoken` directamente.
- **Value Objects inmutables:** `User` usa `Object.freeze`. `Roles` son constantes congeladas.
- **Test:** Todos los tests deben seguir el modelo establecido en el proyecto (mock de dependencias externas, tests de integración con mocks de servicios externos) y deben pasar para que el commit esté terminado.
- **Commits:** Se debe seguir el formato establecido en el proyecto (feat(service): description). Al completarse un commit este debe marcarse como terminado. El commit no se realiza automáticamente, al estar finalizado se solicita autorización del usuario.
- **Documentation:** Al final de cada commit se debe documentar los cambios realizados en el archivo `docs/commits.md`.

---

## Commits

### Commit 1 — `feat(auth): add User entity and Roles constants` *(2 h)* — ✅ COMPLETADO

**Qué se hace:**
- Crear `services/auth/domain/Roles.js`: constantes inmutables de roles del sistema. Exporta `ROLES` como objeto congelado con las claves `PASSENGER`, `ADMIN`, `COUNTER_AGENT`. Exporta `ALL_ROLES` como array congelado para validaciones. Incluye función `isValidRole(role)`.
- Crear `services/auth/domain/User.js`: entidad inmutable que representa un usuario del sistema. Campos: `id` (UUID autogenerado), `email`, `passwordHash`, `name`, `role` (default `PASSENGER`), `createdAt` (autogenerado). Validaciones: email con regex, name no vacío, role válido (debe pertenecer a `ALL_ROLES`), `passwordHash` requerido. `Object.freeze(this)`.

**Tests:** `tests/auth/User.test.js`, `tests/auth/Roles.test.js`
- **Roles.test.js:**
  - Verifica que `ROLES` contiene las tres claves (`PASSENGER`, `ADMIN`, `COUNTER_AGENT`).
  - Verifica que `ROLES` es inmutable (no se puede mutar ni agregar propiedades).
  - Verifica que `isValidRole` retorna `true` para roles válidos y `false` para strings arbitrarios.
- **User.test.js:**
  - Crea un `User` válido y verifica todos los campos.
  - Verifica que el rol por defecto es `PASSENGER`.
  - Falla si `email` tiene formato inválido.
  - Falla si `name` está vacío.
  - Falla si `role` no es válido.
  - Falla si `passwordHash` no se provee.
  - Verifica inmutabilidad (`Object.freeze`).
  - Verifica que `id` se autogenera como UUID si no se provee.
  - Verifica que `createdAt` se autogenera si no se provee.

---

### Commit 2 — `feat(auth): add PasswordHasher port and BcryptPasswordHasher adapter` *(2 h)* — ✅ COMPLETADO

**Qué se hace:**
- Crear `services/auth/domain/PasswordHasher.js`: puerto (clase abstracta) con métodos `async hash(plainPassword) → Promise<string>` y `async compare(plainPassword, hashedPassword) → Promise<boolean>`. Ambos lanzan `Error('Method not implemented.')`.
- Crear `services/auth/adapters/BcryptPasswordHasher.js`: adaptador que implementa `PasswordHasher` usando `bcryptjs`. Configura un número de salt rounds por constructor (default 10). `hash()` retorna el hash bcrypt. `compare()` retorna `true/false`.
- Agregar `bcryptjs` como dependencia en `package.json`.

**Tests:** `tests/auth/BcryptPasswordHasher.test.js`
- Verifica que `hash()` retorna un string distinto al password original.
- Verifica que `compare()` retorna `true` cuando el password coincide con el hash.
- Verifica que `compare()` retorna `false` para un password incorrecto.
- Verifica que dos llamadas a `hash()` con el mismo password producen hashes distintos (salts diferentes).
- Verifica el contrato del puerto: instancia de `PasswordHasher` sin implementar lanza `Method not implemented`.

---

### Commit 3 — `feat(auth): add TokenService port and JwtTokenService adapter` *(2 h)* — ✅ COMPLETADO

**Qué se hace:**
- Crear `services/auth/domain/TokenService.js`: puerto (clase abstracta) con métodos `sign(payload) → string` y `verify(token) → payload`. Ambos lanzan `Error('Method not implemented.')`.
- Crear `services/auth/adapters/JwtTokenService.js`: adaptador que implementa `TokenService` usando `jsonwebtoken`. Recibe `secret` y `expiresIn` (default `'8h'`) por constructor. `sign()` firma el payload con el secret y devuelve el token JWT. `verify()` verifica y decodifica el token; si es inválido o expirado, lanza un error descriptivo.
- Agregar `jsonwebtoken` como dependencia en `package.json`.
- Agregar variables `JWT_SECRET` y `JWT_EXPIRES_IN` a `.env.example`.

**Tests:** `tests/auth/JwtTokenService.test.js`
- Firma un payload y verifica que retorna un string JWT válido (formato `xxx.xxx.xxx`).
- Firma un payload y lo verifica correctamente, recuperando el contenido original (`userId`, `role`).
- Verifica que un token manipulado (corrupto) lanza error.
- Verifica que un token expirado lanza error (usar `expiresIn: '0s'` para forzar expiración inmediata).
- Verifica el contrato del puerto: instancia de `TokenService` sin implementar lanza `Method not implemented`.

---

### Commit 4 — `feat(auth): implement RegisterUser use case` *(2 h)* — ✅ COMPLETADO

**Qué se hace:**
- Crear `services/auth/adapters/InMemoryUserRepository.js`: repositorio en memoria con métodos `async findByEmail(email)`, `async create(user)`, `async findById(id)`. Almacena usuarios en un `Map` interno.
- Crear `services/auth/use-cases/RegisterUser.js`: caso de uso. Recibe `userRepository` y `passwordHasher` por constructor. Método `async execute({ email, name, password, role? })`:
  1. Valida que no exista un usuario con el mismo email (llama a `userRepository.findByEmail(email)`). Si existe, lanza error `'email already registered'`.
  2. Hashea el password con `passwordHasher.hash(password)`.
  3. Crea una instancia de `User` con el hash y el role (default `PASSENGER`).
  4. Persiste con `userRepository.create(user)`.
  5. Retorna el usuario creado (sin el passwordHash en la respuesta — se crea un objeto limpio).

**Tests:** `tests/auth/RegisterUser.test.js`
- Registra un usuario válido y verifica que se persiste en el repositorio.
- Verifica que el passwordHash almacenado no es el password original (fue hasheado).
- Verifica que el role por defecto es `PASSENGER`.
- Permite registrar con role `ADMIN` o `COUNTER_AGENT` explícitamente.
- Falla si el email ya está registrado (`'email already registered'`).
- Falla si el password está vacío o es muy corto (menos de 6 caracteres).
- Falla si el email tiene formato inválido (delegado a la entidad `User`).

---

### Commit 5 — `feat(auth): implement LoginUser use case` *(2 h)* — ✅ COMPLETADO

**Qué se hace:**
- Crear `services/auth/use-cases/LoginUser.js`: caso de uso. Recibe `userRepository`, `passwordHasher` y `tokenService` por constructor. Método `async execute({ email, password })`:
  1. Busca usuario por email con `userRepository.findByEmail(email)`.
  2. Si no existe, lanza error `'invalid credentials'` (no revelar si el email existe o no).
  3. Compara el password con `passwordHasher.compare(password, user.passwordHash)`.
  4. Si no coincide, lanza error `'invalid credentials'`.
  5. Genera un JWT con `tokenService.sign({ userId: user.id, email: user.email, role: user.role })`.
  6. Retorna `{ token, user: { id, email, name, role } }` (sin exponer el hash).

**Tests:** `tests/auth/LoginUser.test.js`
- Login exitoso con credenciales válidas: retorna un objeto con `token` (string no vacío) y `user` con los campos correctos (sin `passwordHash`).
- Falla con email inexistente: lanza `'invalid credentials'`.
- Falla con password incorrecto: lanza `'invalid credentials'` (mismo mensaje que email inexistente).
- Verifica que el token contiene el payload esperado (decodificándolo manualmente o usando el `tokenService.verify`).
- Verifica que el `role` en el token coincide con el rol del usuario registrado.

---

### Commit 6 — `feat(auth): add authentication and authorization middlewares` *(3 h)* — ✅ COMPLETADO

**Qué se hace:**
- Crear `infra/auth-middleware.js`: middleware Express de autenticación. Recibe `tokenService` por factory function. Extrae el token del header `Authorization: Bearer <token>`, lo verifica con `tokenService.verify()`, y adjunta `req.user = { userId, email, role }` al request. Si no hay token o es inválido, responde `401 Unauthorized` con `{ error: 'authentication required' }`.
- Crear `infra/role-middleware.js`: factory function `requireRole(...allowedRoles)` que retorna un middleware Express. Verifica que `req.user.role` está en `allowedRoles`. Si no, responde `403 Forbidden` con `{ error: 'insufficient permissions' }`. Requiere que `auth-middleware` se haya ejecutado antes (si `req.user` no existe, responde 401).

**Subtareas:**
1. Implementar `auth-middleware.js` con la lógica de extracción y verificación de JWT.
2. Implementar `role-middleware.js` con la lógica de verificación de roles.
3. Escribir tests para ambos middlewares simulando objetos `req/res/next` de Express.

**Tests:** `tests/auth/auth-middleware.test.js`, `tests/auth/role-middleware.test.js`
- **auth-middleware.test.js:**
  - Request con token válido: adjunta `req.user` y llama a `next()`.
  - Request sin header `Authorization`: responde 401 con `'authentication required'`.
  - Request con token inválido/corrupto: responde 401.
  - Request con token expirado: responde 401.
  - Request con header `Authorization` sin prefijo `Bearer`: responde 401.
- **role-middleware.test.js:**
  - `req.user.role` está en la lista de roles permitidos: llama a `next()`.
  - `req.user.role` no está en la lista: responde 403 con `'insufficient permissions'`.
  - `req.user` no existe (middleware de auth no se ejecutó): responde 401.
  - `requireRole(ROLES.ADMIN, ROLES.COUNTER_AGENT)`: permite ambos, rechaza `PASSENGER`.
  - `requireRole(ROLES.PASSENGER)`: permite pasajero, rechaza admin.

---

### Commit 7 — `feat(auth): add auth endpoints and protect existing routes` *(2 h)* — ✅ COMPLETADO

**Qué se hace:**
- Crear `services/auth/adapters/AuthController.js`: controlador HTTP con métodos `register(req, res)` y `login(req, res)`. Delega a los casos de uso `RegisterUser` y `LoginUser`. Maneja errores con códigos HTTP apropiados (400 para validación, 409 para email duplicado, 401 para credenciales inválidas).
- Crear `infra/auth-router.js`: router Express con las rutas:
  - `POST /api/auth/register` → `controller.register`
  - `POST /api/auth/login` → `controller.login`
- Modificar `server.js`:
  - Instanciar las dependencias del módulo auth (repository, hasher, tokenService, use cases, controller).
  - Montar `auth-router` en `/api/auth`.
  - Aplicar `auth-middleware` a las rutas existentes que lo requieran (ej: `POST /api/bookings` requiere autenticación).
  - Aplicar `role-middleware` donde corresponda (ej: rutas de administración de vuelos solo para `ADMIN`).

**Subtareas:**
1. Crear `AuthController` y `auth-router`.
2. Integrar en `server.js` con inyección de dependencias.
3. Proteger rutas existentes con los middlewares.

**Tests:** `tests/auth/AuthIntegration.test.js`
- **POST /api/auth/register:** body válido → 201 con `{ user: { id, email, name, role } }`.
- **POST /api/auth/register:** email duplicado → 409 con mensaje de error.
- **POST /api/auth/register:** datos inválidos (sin email, sin password) → 400.
- **POST /api/auth/login:** credenciales válidas → 200 con `{ token, user }`.
- **POST /api/auth/login:** credenciales inválidas → 401.
- **Ruta protegida sin token:** → 401.
- **Ruta protegida con token válido y rol correcto:** → respuesta normal.
- **Ruta protegida con token válido pero rol insuficiente:** → 403.

---

### Commit 8 — `feat(auth): add login and register pages to frontend` *(1 h)* — ✅ COMPLETADO

**Qué se hace:**
- Crear `frontend/src/hooks/useAuth.js`: hook de React que maneja el estado de autenticación. Almacena el token y los datos del usuario en `localStorage`. Expone `{ user, token, login, register, logout, isAuthenticated }`. Incluye lógica para hidratar el estado desde `localStorage` al montar.
- Crear `frontend/src/components/auth/LoginForm.jsx`: formulario de login con campos email y password. Valida campos no vacíos. Muestra errores del servidor. Emite `onSubmit({ email, password })`.
- Crear `frontend/src/components/auth/RegisterForm.jsx`: formulario de registro con campos name, email, password y confirmación de password. Valida que las contraseñas coincidan y campos requeridos. Emite `onSubmit({ name, email, password })`.
- Crear `frontend/src/pages/LoginPage.jsx`: página de login que usa `LoginForm` y `useAuth`. Al loguearse exitosamente, redirige a la vista correspondiente según el rol.
- Crear `frontend/src/pages/RegisterPage.jsx`: página de registro que usa `RegisterForm` y `useAuth`. Al registrarse, redirige al login o loguea automáticamente.
- Modificar `frontend/src/main.jsx`: agregar enrutamiento básico (se puede usar state simple o hash routing) para mostrar `LoginPage`, `RegisterPage`, `PassengerSearchPage` o `AdminFlightsPage` según el estado de autenticación y el rol del usuario. Por defecto (sin login) se muestra `PassengerSearchPage` como vista pública.
- Agregar estilos para las páginas de login/registro en `frontend/src/styles.css` o archivo CSS dedicado.

**Tests:** Manuales de frontend (la lógica de autenticación backend ya está cubierta en commit 7).

---

## Resumen de archivos por commit

| # | Estado | Commit | Archivos nuevos / modificados | Tests |
|---|---|---|---|---|
| 1 | ✅ Completado | `feat(auth): add User entity and Roles constants` | `services/auth/domain/User.js`, `services/auth/domain/Roles.js` | `tests/auth/User.test.js`, `tests/auth/Roles.test.js` |
| 2 | ✅ Completado | `feat(auth): add PasswordHasher port and BcryptPasswordHasher adapter` | `services/auth/domain/PasswordHasher.js`, `services/auth/adapters/BcryptPasswordHasher.js`, `package.json` (+bcryptjs) | `tests/auth/BcryptPasswordHasher.test.js` |
| 3 | ✅ Completado | `feat(auth): add TokenService port and JwtTokenService adapter` | `services/auth/domain/TokenService.js`, `services/auth/adapters/JwtTokenService.js`, `package.json` (+jsonwebtoken), `.env.example` | `tests/auth/JwtTokenService.test.js` |
| 4 | ✅ Completado | `feat(auth): implement RegisterUser use case` | `services/auth/adapters/InMemoryUserRepository.js`, `services/auth/use-cases/RegisterUser.js` | `tests/auth/RegisterUser.test.js` |
| 5 | ✅ Completado | `feat(auth): implement LoginUser use case` | `services/auth/use-cases/LoginUser.js` | `tests/auth/LoginUser.test.js` |
| 6 | ✅ Completado | `feat(auth): add authentication and authorization middlewares` | `infra/auth-middleware.js`, `infra/role-middleware.js` | `tests/auth/auth-middleware.test.js`, `tests/auth/role-middleware.test.js` |
| 7 | ✅ Completado | `feat(auth): add auth endpoints and protect existing routes` | `services/auth/adapters/AuthController.js`, `infra/auth-router.js`, `server.js` (mod) | `tests/auth/AuthIntegration.test.js` |
| 8 | ✅ Completado | `feat(auth): add login and register pages to frontend` | `frontend/src/hooks/useAuth.js`, `frontend/src/components/auth/LoginForm.jsx`, `frontend/src/components/auth/RegisterForm.jsx`, `frontend/src/pages/LoginPage.jsx`, `frontend/src/pages/RegisterPage.jsx`, `frontend/src/main.jsx` (mod), `frontend/src/components/auth/auth.css` | Tests manuales de UI |

---

## Distribución horaria por tarea del enunciado

| Tarea del enunciado | Commits | Horas |
|---|---|---|
| Diseñar el esquema de seguridad backend y modelo de usuarios con roles | 1 | 2 h |
| Desarrollar endpoints backend para login, registro y validación de tokens | 2, 3, 4, 5 | 8 h |
| Configurar los middleware de autorización/permisos según rol | 6, 7 | 5 h |
| Implementar las pantallas web de Login / Registro y gestión de sesión | 8 | 1 h |
| **Total** | | **16 h** |

---

## Verificación de criterios de aceptación

| Criterio | Verificado en |
|---|---|
| Los usuarios pueden iniciar sesión con sus credenciales y recibir el rol asignado | Commit 5: `LoginUser` retorna token JWT con rol incluido. Commit 7: endpoint `POST /api/auth/login` expone esta funcionalidad. Tests de integración validan el flujo completo. |
| Por defecto se carga la vista para el público general (los pasajeros) | Commit 8: `main.jsx` renderiza `PassengerSearchPage` como vista por defecto sin autenticación. El registro asigna `PASSENGER` por defecto. |
| Las rutas del backend y secciones del frontend quedan estrictamente protegidas según el tipo de usuario | Commit 6: middlewares `auth-middleware` (autenticación) y `role-middleware` (autorización) con tests exhaustivos. Commit 7: integración en `server.js` protegiendo rutas existentes. Commit 8: frontend condiciona las vistas según rol del usuario autenticado. |

---

## Dependencias externas nuevas

| Paquete | Propósito | Justificación |
|---|---|---|
| `bcryptjs` | Hashing de contraseñas | Implementación JS pura de bcrypt, sin dependencias nativas (evita problemas de compilación). Estándar para hashing de passwords en Node.js. |
| `jsonwebtoken` | Generación y verificación de JWT | Estándar de facto para JWT en Node.js. Tokens stateless que evitan la necesidad de sesiones del lado del servidor. |
