export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row:    Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      clientes: {
        Row:    Cliente;
        Insert: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Cliente, 'id' | 'created_at'>>;
      };
      ordenes: {
        Row:    Orden;
        Insert: Omit<Orden, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Orden, 'id' | 'created_at'>>;
      };
      orden_items: {
        Row:    OrdenItem;
        Insert: Omit<OrdenItem, 'id'>;
        Update: Partial<Omit<OrdenItem, 'id'>>;
      };
      facturas: {
        Row:    Factura;
        Insert: Omit<Factura, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Factura, 'id' | 'created_at'>>;
      };
      cotizaciones: {
        Row:    Cotizacion;
        Insert: Omit<Cotizacion, 'id' | 'created_at'>;
        Update: Partial<Omit<Cotizacion, 'id' | 'created_at'>>;
      };
      cotizacion_items: {
        Row:    CotizacionItem;
        Insert: Omit<CotizacionItem, 'id'>;
        Update: Partial<Omit<CotizacionItem, 'id'>>;
      };
      empleados: {
        Row:    Empleado;
        Insert: Omit<Empleado, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Empleado, 'id' | 'created_at'>>;
      };
      nomina: {
        Row:    Nomina;
        Insert: Omit<Nomina, 'id' | 'created_at'>;
        Update: Partial<Omit<Nomina, 'id' | 'created_at'>>;
      };
      inventario: {
        Row:    InventarioItem;
        Insert: Omit<InventarioItem, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<InventarioItem, 'id' | 'created_at'>>;
      };
      inventario_movimientos: {
        Row:    InventarioMovimiento;
        Insert: Omit<InventarioMovimiento, 'id' | 'created_at'>;
        Update: Partial<Omit<InventarioMovimiento, 'id' | 'created_at'>>;
      };
    };
  };
}

export interface Profile {
  id:         string;
  full_name:  string;
  role:       'admin' | 'operario' | 'contador';
  is_active:  boolean;
  created_at: string;
}

export interface Cliente {
  id:             string;
  nombre:         string;
  razon_social:   string | null;
  nit:            string | null;
  direccion:      string | null;
  ciudad:         string | null;
  convenio:       string | null;
  telefono:       string | null;
  email:          string | null;
  tarifa_defecto: number;
  modo_cobro:     'KG' | 'UNIDAD';
  tipo_doc:       'O.S.' | 'F.E.';
  aplica_ret:     boolean;
  estado:         'ACTIVO' | 'INACTIVO';
  created_at:     string;
  updated_at:     string;
}

export interface Orden {
  id:             string;
  no_doc:         number;
  fecha:          string;
  hora:           string | null;
  cliente_id:     string | null;
  cliente_nombre: string;
  tipo_doc:       'O.S.' | 'F.E.';
  modo_cobro:     'KG' | 'UNIDAD';
  kg_total:       number;
  tarifa_kg:      number;
  cant_total:     number;
  valor:          number;
  iva:            number;
  estado:         'RECIBIDA' | 'EN PROCESO' | 'ENTREGADA' | 'FE REGISTRADA' | 'PAGADA' | 'ANULADA';
  fecha_entrega:  string | null;
  fecha_pago:     string | null;
  forma_pago:     string | null;
  no_factura:     string | null;
  observacion:    string | null;
  pdf_url:        string | null;
  created_by:     string | null;
  created_at:     string;
  updated_at:     string;
}

export interface OrdenItem {
  id:          string;
  orden_id:    string;
  posicion:    number;
  cantidad:    number | null;
  descripcion: string | null;
  referencia:  string | null;
  dureza:      string | null;
  tarifa_unit: number;
  subtotal:    number;
}

export interface Factura {
  id:             string;
  numero:         string;
  fecha:          string;
  cliente_id:     string | null;
  cliente_nombre: string;
  base:           number;
  iva:            number;
  rete_fuente:    number;
  rete_ica:       number;
  total_sin_ret:  number;
  total:          number;
  remision:       string | null;
  estado:         'PDTE PAGO' | 'CANCELADA' | 'ANULADA';
  fecha_pago:     string | null;
  cuenta:         string | null;
  observacion:    string | null;
  created_at:     string;
  updated_at:     string;
}

export interface Cotizacion {
  id:             string;
  numero:         string;
  fecha:          string;
  fecha_validez:  string | null;
  cliente_id:     string | null;
  cliente_nombre: string;
  modo_cobro:     'KG' | 'UNIDAD';
  subtotal:       number;
  iva:            number;
  total:          number;
  estado:         'BORRADOR' | 'ENVIADA' | 'APROBADA' | 'RECHAZADA' | 'VENCIDA';
  notas:          string | null;
  orden_id:       string | null;
  created_by:     string | null;
  created_at:     string;
}

export interface CotizacionItem {
  id:            string;
  cotizacion_id: string;
  posicion:      number;
  cantidad:      number | null;
  descripcion:   string | null;
  referencia:    string | null;
  dureza:        string | null;
  tarifa_unit:   number;
  subtotal:      number;
}

export interface Empleado {
  id:                string;
  nombre:            string;
  apellido:          string;
  cedula:            string;
  cargo:             string | null;
  tipo_contrato:     'INDEFINIDO' | 'FIJO' | 'OBRA_LABOR' | 'PRESTACION' | null;
  fecha_ingreso:     string;
  fecha_retiro:      string | null;
  salario_base:      number;
  aux_transporte:    boolean;
  cuenta_bancaria:   string | null;
  banco:             string | null;
  tipo_cuenta:       'AHORROS' | 'CORRIENTE' | null;
  eps:               string | null;
  afp:               string | null;
  arl:               string | null;
  caja_compensacion: string | null;
  estado:            'ACTIVO' | 'INACTIVO' | 'RETIRADO';
  created_at:        string;
  updated_at:        string;
}

export interface Nomina {
  id:                 string;
  empleado_id:        string;
  periodo_mes:        number;
  periodo_anio:       number;
  dias_trabajados:    number;
  salario_base:       number;
  aux_transporte:     number;
  horas_extras:       number;
  otros_ingresos:     number;
  total_devengado:    number;
  salud_empleado:     number;
  pension_empleado:   number;
  retencion_fte:      number;
  otras_deducciones:  number;
  total_deducciones:  number;
  neto_pagar:         number;
  salud_empleador:    number;
  pension_empleador:  number;
  arl:                number;
  caja:               number;
  sena:               number;
  icbf:               number;
  cesantias:          number;
  intereses_ces:      number;
  prima:              number;
  vacaciones:         number;
  estado:             'BORRADOR' | 'PAGADA';
  fecha_pago:         string | null;
  observacion:        string | null;
  created_at:         string;
}

export interface InventarioItem {
  id:              string;
  codigo:          string;
  nombre:          string;
  descripcion:     string | null;
  categoria:       string | null;
  unidad:          string;
  stock_actual:    number;
  stock_minimo:    number;
  precio_unitario: number;
  proveedor:       string | null;
  ubicacion:       string | null;
  activo:          boolean;
  created_at:      string;
  updated_at:      string;
}

export interface InventarioMovimiento {
  id:            string;
  item_id:       string;
  tipo:          'ENTRADA' | 'SALIDA' | 'AJUSTE';
  cantidad:      number;
  stock_antes:   number;
  stock_despues: number;
  referencia:    string | null;
  nota:          string | null;
  created_by:    string | null;
  created_at:    string;
}
