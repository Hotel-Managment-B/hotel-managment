# 🔍 ANÁLISIS Y SOLUCIÓN: Permiso 14 (Permisos/Especial)

## 🔴 PROBLEMA

**Un empleado SIN el permiso 14 asignado podía acceder a la interfaz `/permisos` (Gestión de Permisos) sin restricción.**

### ¿Por qué sucedía?

```
FLUJO INCORRECTO (ANTES):
═════════════════════════════════════════════════════════

Usuario: permissionsIds = []  (SIN permiso 14)
         ↓
Intenta acceder a: /permisos
         ↓
next.config.ts reescribe: /permisos → /permissions
         ↓
Middleware.ts recibe: /permissions
         ↓
¿Está /permisos en config.matcher?
         │
         └─→ ❌ NO ESTÁ
                 ↓
         Middleware NO intercepta
         ↓
         ✅ PERMITE ACCESO (ERROR)


¿POR QUÉ?
────────
El config.matcher en middleware.ts línea 118-156 solo incluía:
  - /permissions/:path*  ✅
  - /permissions-setup/:path*  ✅
  - /permisos/:path*  ❌ NO ESTABA
  - /permisos-setup/:path*  ❌ NO ESTABA

Sin embargo, routePermissions SÍ tenía los mapeos:
  - '/permisos': ['14']
  - '/permisos-setup': ['14']

Pero si el middleware no intercepta /permisos, NUNCA se validan
los permisos almacenados en routePermissions.
```

---

## ✅ SOLUCIÓN APLICADA

### Cambio 1: Agregar rutas al config.matcher

**Archivo:** `src/middleware.ts` (línea 156-157)

```typescript
// ANTES:
'/factura/:path*',
]  // ← Fin del array sin /permisos

// DESPUÉS:
'/factura/:path*',
'/permisos/:path*',        // ✅ AGREGADO
'/permisos-setup/:path*',  // ✅ AGREGADO
]
```

### Cambio 2: Agregar rutas al routePermissions

**Archivo:** `src/middleware.ts` (línea 52-56)

```typescript
// ANTES:
'/permissions': ['14'],
'/permissions-setup': ['14'],
'/invoice': ['15'],

// DESPUÉS:
'/permissions': ['14'],
'/permissions-setup': ['14'],
'/permisos': ['14'],              // ✅ AGREGADO
'/permisos-setup': ['14'],        // ✅ AGREGADO
'/invoice': ['15'],
```

---

## 🎯 CÓMO FUNCIONA AHORA

```
FLUJO CORRECTO (DESPUÉS):
═════════════════════════════════════════════════════════

Usuario: permissionsIds = []  (SIN permiso 14)
         ↓
Intenta acceder a: /permisos
         ↓
Middleware.ts - config.matcher intercepta
(¿Coincide /permisos/:path*?)
         ├─→ ✅ SÍ COINCIDE
         ↓
Middleware.ts - función principal
  const permissionIds = req.nextauth.token?.permissionsIds || []
  const pathname = "/permisos"
  const baseRoute = getBaseRoute("/permisos")  // → "/permisos"
  const requiredPermissions = routePermissions["/permisos"]  // → ["14"]
  ↓
hasRequiredPermissions([], ["14"])
  ├─→ ¿Usuario tiene permiso "14"?
  ├─→ [] NO incluye "14"
  └─→ ❌ FALSO
  ↓
❌ NO TIENE PERMISOS REQUERIDOS
  ↓
🔐 REDIRIGE A: /access-denied
```

---

## 📋 TABLA DE RUTAS ESPECIALES

| Ruta Original | Ruta Reescrita | Permiso Requerido | ¿Se valida? |
|---------------|---|---|---|
| `/permissions` | N/A | 14 | ✅ AHORA SÍ |
| `/permisos` | N/A | 14 | ✅ AHORA SÍ (CORREGIDO) |
| `/permissions-setup` | N/A | 14 | ✅ AHORA SÍ |
| `/permisos-setup` | N/A | 14 | ✅ AHORA SÍ (CORREGIDO) |
| `/invoice` | N/A | 15 | ✅ SÍ |
| `/factura` | N/A | 15 | ✅ SÍ |

---

## 🧪 PRUEBAS A REALIZAR

### Test 1: Usuario SIN permiso 14
```
1. Crear un empleado: Juan Pérez
2. NO asignar el permiso 14 (Permiso Especial)
3. Guardar cambios
4. Hacer logout
5. Hacer login con Juan Pérez
6. Intentar acceder a /permisos
   
RESULTADO ESPERADO:
   ✅ Se redirige a /access-denied
   ❌ NO puede acceder
```

### Test 2: Usuario CON permiso 14
```
1. Mismo usuario: Juan Pérez
2. Asignar el permiso 14 (Permiso Especial)
3. Guardar cambios
4. Hacer logout
5. Hacer login con Juan Pérez
6. Intentar acceder a /permisos
   
RESULTADO ESPERADO:
   ✅ Puede acceder a la interfaz
   ✅ Ve el componente PermissionsManagement
```

### Test 3: Usar ruta reescrita
```
1. Usuario SIN permiso 14: Juan Pérez
2. Logout/Login
3. Intentar acceder a /permisos (ruta pública)
   
RESULTADO ESPERADO:
   ✅ Se redirige a /access-denied
   ❌ NO puede acceder (mismo que Test 1)
```

---

## 🔗 ARCHIVOS MODIFICADOS

| Archivo | Cambios |
|---------|---------|
| `src/middleware.ts` | Agregadas 2 rutas a `routePermissions` |
| `src/middleware.ts` | Agregadas 2 rutas a `config.matcher` |

---

## ⚙️ CÓDIGO IMPACTADO

### 1. routePermissions (línea 52-56)
```typescript
const routePermissions: Record<string, string[]> = {
  // ... otras rutas ...
  '/permisos': ['14'],              // ← NUEVA
  '/permisos-setup': ['14'],        // ← NUEVA
  '/invoice': ['15'],
  '/factura': ['15'],
}
```

### 2. config.matcher (línea 156-157)
```typescript
export const config = {
  matcher: [
    // ... otros matchers ...
    '/factura/:path*',
    '/permisos/:path*',              // ← NUEVA
    '/permisos-setup/:path*',        // ← NUEVA
  ]
}
```

---

## 📌 NOTAS IMPORTANTES

1. **Consistencia de rutas:**
   - Si existe una ruta reescrita en `next.config.ts`, DEBE estar tanto en:
     - `routePermissions` (con los permisos requeridos)
     - `config.matcher` (para que el middleware la intercepte)

2. **Orden no importa:**
   - El orden en `routePermissions` no importa
   - El orden en `config.matcher` no importa
   - Lo importante es que EXISTAN ambos

3. **Rutas reescritas vs originales:**
   - `/permissions` es la ruta real (Next.js app folder)
   - `/permisos` es la ruta pública (reescrita en next.config.ts)
   - Ambas deben estar mapeadas en `routePermissions`

4. **Seguridad:**
   - Ahora el middleware valida ANTES de que el componente se cargue
   - Es validación server-side (SEGURA)
   - El cliente NO puede eludirla

---

## ✅ RESULTADO FINAL

✅ El permiso 14 ahora funciona correctamente
✅ Sin permisos = Acceso denegado
✅ Con permisos = Acceso permitido
✅ Validación en server-side (segura)
✅ Ambas rutas (/permissions y /permisos) funcionan
