-- Ejecutar en Supabase SQL Editor
CREATE TABLE orden_notas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id    UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  texto       TEXT NOT NULL,
  autor_nombre TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orden_notas_orden_id ON orden_notas(orden_id);

ALTER TABLE orden_notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver notas"
  ON orden_notas FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden insertar notas"
  ON orden_notas FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
