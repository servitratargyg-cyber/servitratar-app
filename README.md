# Servitratar G&G S.A.S. — Sistema de Gestión Interna

Sistema web de gestión empresarial diseñado para **Servitratar G&G S.A.S.**, empresa colombiana especializada en tratamiento térmico de metales (temple, revenido, cementación, nitruración).

---

## Tabla de contenido

- [Descripción general](#descripción-general)
- [Stack tecnológico](#stack-tecnológico)
- [Instalación y configuración](#instalación-y-configuración)
- [Tipos de usuario y permisos](#tipos-de-usuario-y-permisos)
- [Cómo crear usuarios](#cómo-crear-usuarios)
- [Flujos de trabajo](#flujos-de-trabajo)
- [Módulos del sistema](#módulos-del-sistema)
- [Configuración de la empresa](#configuración-de-la-empresa)

---

## Descripción general

El sistema centraliza la operación diaria de la empresa: recepción de materiales, generación de órdenes de servicio, facturación electrónica, gestión de cartera, nómina de empleados, control de inventario y reportes gerenciales. Reemplaza el flujo manual en papel y hojas de cálculo.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Estilos | Tailwind CSS v4 |
| Base de datos / Auth | Supabase (PostgreSQL) |
| Estado del servidor | TanStack Query v5 |
| Enrutamiento | React Router v7 |
| Formularios | React Hook Form + Zod |
| PDFs | @react-pdf/renderer |
| Gráficas | Recharts |
| Notificaciones | Sonner |

---

## Instalación y configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

Crea el archivo `.env.local` en la raíz del proyecto con las credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Base de datos

Ejecuta el script SQL del esquema en el editor SQL de Supabase para crear todas las tablas. Adicionalmente, para funcionalidades específicas:

```sql
-- Campo de motivo de anulación en órdenes
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT;

-- Campo de estado activo en perfiles de usuario
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
```

### 4. Storage (PDFs)

Crea el bucket `documentos` en Supabase Storage y aplica las siguientes políticas:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documentos', 'documentos', true, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Autenticados pueden subir PDFs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "PDFs son públicos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'documentos');
```

### 5. Logo de la empresa

Coloca el archivo `logo.png` en la carpeta `public/` del proyecto. Este logo aparece en todos los PDFs generados.

### 6. Ejecutar en desarrollo

```bash
npm run dev
```

---

## Tipos de usuario y permisos

El sistema tiene tres roles con acceso diferenciado:

### Administrador (`admin`)
Acceso total al sistema. Puede realizar todas las operaciones, incluyendo:
- Crear, editar y anular órdenes de servicio
- Registrar y anular facturas electrónicas
- Gestionar clientes y cotizaciones
- Liquidar nómina
- Ver todos los reportes
- Acceder a Configuración (datos de empresa, usuarios, contraseña)
- Activar/desactivar usuarios y cambiar roles

### Operario (`operario`)
Perfil para personal de planta. Acceso limitado a:
- Ver y crear órdenes de servicio
- Actualizar el estado de las órdenes (RECIBIDA → EN PROCESO → ENTREGADA)
- Ver clientes
- No puede acceder a facturación, nómina, reportes ni configuración

### Contador (`contador`)
Perfil para el área contable. Acceso a:
- Ver órdenes de servicio (sin crear ni modificar)
- Facturación electrónica y cartera
- Nómina (liquidación y comprobantes)
- Reportes completos
- No puede modificar clientes, órdenes ni configuración

---

## Cómo crear usuarios

Los usuarios se crean en dos pasos: primero en Supabase Auth y luego se les asigna rol en el sistema.

### Paso 1 — Crear la cuenta en Supabase

1. En el panel de Supabase, ve a **Authentication → Users**
2. Haz clic en **Add user → Create new user**
3. Ingresa el correo electrónico y una contraseña temporal
4. Marca la opción **Auto Confirm User**

### Paso 2 — Asignar rol desde el sistema

1. Inicia sesión en la aplicación con una cuenta de **administrador**
2. Ve a **Configuración → Usuarios**
3. El nuevo usuario aparecerá en la lista
4. Haz clic en el botón de rol (Operario / Contador / Admin) para asignarlo
5. Activa el usuario con el botón de estado si aparece inactivo

### Paso 3 — Notificar al usuario

Envíale al usuario su correo y contraseña temporal. La primera vez que ingrese podrá cambiarla desde **Configuración → Seguridad**.

> **Nota:** Un administrador no puede modificar su propio rol ni desactivarse a sí mismo desde el panel de usuarios.

---

## Flujos de trabajo

### Flujo principal: Orden de servicio

```
Cliente trae material
        ↓
  Nueva Orden de Servicio
  (tipo: O.S. o F.E., modo cobro: KG o Unidad)
        ↓
   Estado: RECIBIDA
        ↓
  Entra a proceso en planta
        ↓
   Estado: EN PROCESO
        ↓
  Material tratado y entregado
        ↓
   Estado: ENTREGADA
        ↓
  Si tipo = O.S. → Pago directo → PAGADA
  Si tipo = F.E. → Facturación electrónica → FE REGISTRADA → PAGADA
```

**Estados posibles de una orden:**

| Estado | Descripción |
|--------|-------------|
| RECIBIDA | Material ingresado, pendiente de proceso |
| EN PROCESO | En el horno / proceso de tratamiento |
| ENTREGADA | Material devuelto al cliente |
| FE REGISTRADA | Factura electrónica emitida |
| PAGADA | Cobro registrado |
| ANULADA | Cancelada (requiere motivo obligatorio) |

---

### Flujo de cotización

```
Crear cotización (BORRADOR)
        ↓
  Enviar al cliente (ENVIADA)
        ↓
    ┌───┴───┐
  Aprobar  Rechazar
    ↓
  Aprobar y crear OS
  (convierte automáticamente a Orden de Servicio)
  (si la cotización tiene IVA → tipo F.E., si no → O.S.)
```

---

### Flujo de facturación electrónica

Solo aplica para órdenes con tipo **F.E.** que estén en estado **ENTREGADA**.

```
Ir a Facturación → Nueva F.E.
        ↓
  Seleccionar cliente (filtro)
        ↓
  Seleccionar una o varias órdenes del mismo cliente
        ↓
  El sistema calcula automáticamente:
  - Base gravable
  - IVA (19%)
  - Retenciones (si base > $199.999):
      · Rete Fuente: 4%
      · Rete ICA: 0.966%
        ↓
  Ingresar número de factura, fecha y cuenta bancaria
        ↓
  Registrar → Órdenes pasan a FE REGISTRADA
        ↓
  Cuando el cliente paga → Registrar cobro → PAGADA
```

---

### Flujo de nómina

```
Ir a Nómina → Nueva liquidación
        ↓
  Seleccionar empleado y período (mes/año)
        ↓
  Ingresar días trabajados, horas extras, otros ingresos
        ↓
  El sistema calcula automáticamente:
  - Salud y pensión empleado (4% c/u)
  - Devengado total
  - Deducciones
  - Neto a pagar
  - Aportes del empleador (salud, pensión, ARL, SENA, ICBF, caja)
  - Provisiones (cesantías, intereses, prima, vacaciones)
        ↓
  Guardar como BORRADOR o marcar como PAGADA
        ↓
  Descargar comprobante de nómina en PDF
```

---

## Módulos del sistema

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Dashboard | `/` | KPIs del mes: órdenes, ventas, cartera, inventario crítico |
| Clientes | `/clientes` | Directorio de clientes con tarifas y configuración de cobro |
| Órdenes | `/ordenes` | Gestión completa de órdenes de servicio |
| Cotizaciones | `/cotizaciones` | Propuestas comerciales con conversión a OS |
| Facturación | `/facturacion` | Facturas electrónicas y cartera por cobrar |
| Empleados | `/empleados` | Directorio de personal activo y retirado |
| Nómina | `/nomina` | Liquidación mensual y comprobantes PDF |
| Inventario | `/inventario` | Catálogo de materiales con entradas, salidas y ajustes |
| Reportes | `/reportes` | Análisis de ventas, cartera, nómina e inventario (exporta CSV) |
| Configuración | `/configuracion` | Solo administradores |

---

## Configuración de la empresa

Desde **Configuración → Empresa** (solo administradores) se pueden actualizar los datos que aparecen en todos los PDFs generados:

- Nombre de la empresa
- NIT
- Dirección
- Teléfonos de contacto
- Prefijo de órdenes (ej. `TT` → genera `TT6001`)
- Valor mínimo de orden de servicio

Estos datos se guardan localmente en el navegador. Si se usa el sistema desde múltiples computadores, cada uno debe configurarlo por separado o se puede dejar con los valores por defecto definidos en el código.
