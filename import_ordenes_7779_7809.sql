-- ============================================================
-- IMPORTAR ÓRDENES 7779 – 7809
-- Ejecutar en Supabase SQL Editor
-- ============================================================
DO $$
DECLARE
  oid_7779 UUID; oid_7780 UUID; oid_7781 UUID; oid_7782 UUID; oid_7783 UUID;
  oid_7784 UUID; oid_7785 UUID; oid_7786 UUID; oid_7787 UUID; oid_7788 UUID;
  oid_7789 UUID; oid_7790 UUID; oid_7791 UUID; oid_7792 UUID; oid_7793 UUID;
  oid_7794 UUID; oid_7795 UUID; oid_7796 UUID; oid_7797 UUID; oid_7798 UUID;
  oid_7799 UUID; oid_7800 UUID; oid_7801 UUID; oid_7802 UUID; oid_7803 UUID;
  oid_7804 UUID; oid_7805 UUID; oid_7806 UUID; oid_7807 UUID; oid_7808 UUID;
  oid_7809 UUID;
  cid UUID;
BEGIN

  -- 7779 - TEJOS JC - JHON JAIRO CATOLICO
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%TEJOS JC%' OR nombre ILIKE '%JHON JAIRO%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7779,'2026-06-13','12:12',cid,'TEJOS JC - JHON JAIRO CATOLICO','O.S.','UNIDAD',0,2756,262,722000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1MsVr9cyFGGjXAoTK0KkpY4ClrCW38ZU1/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7779;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7779,1,50,'TEJOS GRANDES','1020','MAXIMA',NULL,3500,175000),
  (oid_7779,2,82,'TEJOS GRANDES','1045','MAXIMA',NULL,3500,287000),
  (oid_7779,3,130,'PONY TEJOS','1045','MAXIMA',NULL,2000,260000);

  -- 7780 - JULIO CESAR PACHECO
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%JULIO CESAR PACHECO%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7780,'2026-06-13','13:02',cid,'JULIO CESAR PACHECO','O.S.','KG',326,6500,0,2119000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1XvxhMAgMbhhcgS84vTQmMyDutjXbeCsY/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7780;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7780,1,34,'CUCHILLAS','HARDOX 450','62 - 63 HRC.',NULL,0,0);

  -- 7781 - ALEJANDRO PULIDO
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%ALEJANDRO PULIDO%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7781,'2026-06-16','10:22',cid,'ALEJANDRO PULIDO','O.S.','KG',20,8000,0,160000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1VHPkxxdbkCqLU-1e8TRCgDrDnYGGj2wF/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7781;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7781,1,12,'PASADORES','1020','MAXIMA',NULL,0,0);

  -- 7782 - TEJOS - ISMAEL ALFONSO
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%ISMAEL ALFONSO%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7782,'2026-06-16','10:24',cid,'TEJOS - ISMAEL ALFONSO','O.S.','UNIDAD',0,8000,9,72000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1fqU5-Iq9_z8QIF3zCe7FTnD4kBIroPAb/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7782;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7782,1,9,'TEJOS GRANDES','709','MAXIMA',NULL,8000,72000);

  -- 7783 - CONDECORAR
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%CONDECORAR%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7783,'2026-06-16','10:26',cid,'CONDECORAR','O.S.','KG',8.5,12000,0,102000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1dgXixJ8bNc9FqXS9Fzs7-OL_zJAq9I4w/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7783;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7783,1,2,'TROQUELES (ANVERSO Y REVERSO)','2510','58 - 60 HRC.',NULL,0,0);

  -- 7784 - INGENIERIA HB
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%INGENIERIA HB%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7784,'2026-06-16','10:30',cid,'INGENIERIA HB','O.S.','KG',4,12000,0,48000,0,'RECIBIDA',NULL,'REMISION MANUAL No. 0457','https://drive.google.com/file/d/1GFYgPg9Xm_qv8lh3KI_dCuAOOSdwMknf/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7784;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7784,1,1,'PIEZA','8620','NEGREAR',NULL,0,0);

  -- 7785 - JAIRO CORONADO
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%JAIRO CORONADO%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7785,'2026-06-16','10:32',cid,'JAIRO CORONADO','O.S.','KG',224,5500,0,1232000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1IMSxnqIOnBeJvbM69LN4dpw6BggB2rAK/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7785;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7785,1,6,'CAMISAS EN BARRA PERFORADA','1518','MAXIMA',NULL,0,0);

  -- 7786 - FERREIMPORTACIONES
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%FERREIMPORTACIONES%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7786,'2026-06-16','10:33',cid,'FERREIMPORTACIONES','O.S.','KG',7,12000,0,84000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1R1zWGlDyC3nZjGOpSeyQyDXfgb8t65Jh/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7786;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7786,1,4,'BUJES EN BARRA PERFORADA','1518','MAXIMA',NULL,0,0);

  -- 7787 - UNIEXPRES SILICONA
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%UNIEXPRES%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7787,'2026-06-16','10:35',cid,'UNIEXPRES SILICONA','O.S.','KG',138,5000,0,690000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/113cbuyX6q76kv9Rhg-xM5s2tkOxx3qqq/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7787;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7787,1,1380,'PLATINAS PARA OLLA EXPRES','HR','40 - 42 HRC.',NULL,0,0);

  -- 7788 - TEJOS OLIMPICA
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%TEJOS OLIMPICA%' OR nombre ILIKE '%OLIMPICA%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7788,'2026-06-16','10:37',cid,'TEJOS OLIMPICA','O.S.','KG',67,1000,0,67000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1LgM9y1AS1bgLkLn7qJawJKJ-2aFA8OnJ/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7788;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7788,1,2,'EJES','1045','RECOCER',NULL,0,0),
  (oid_7788,2,13,'TRAMOS DE EJE CORTADOS','1045','RECOCER',NULL,0,0);

  -- 7789 - PEDRO PINILLA
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%PEDRO PINILLA%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7789,'2026-06-16','12:21',cid,'PEDRO PINILLA','O.S.','KG',1,20000,0,20000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1TapmJPPTMETI8m-zcnRgkNOUlk8J1L4q/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7789;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7789,1,3,'PUNZONES','D2','56 - 58 HRC.',NULL,0,0);

  -- 7790 - JAIRO SANCHEZ
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%JAIRO SANCHEZ%' OR nombre ILIKE '%JAIRO SÁNCHEZ%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7790,'2026-06-16','12:24',cid,'JAIRO SANCHEZ','O.S.','KG',1,20000,0,20000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1Mx6lNvsaJ04X1KDnCWf6f9WhWXOvh0Qn/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7790;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7790,1,2,'PIEZAS','DF2','58 - 60 HRC.',NULL,0,0);

  -- 7791 - DARMAPACK
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%DARMAPACK%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7791,'2026-06-16','17:16',cid,'DARMAPACK','O.S.','KG',1,20000,0,20000,0,'RECIBIDA',NULL,'REMISION MANUAL No. 0459','https://drive.google.com/file/d/1DgWgGv0A2yPvjeHXevJ8PqBNh4l95CVt/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7791;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7791,1,1,'BUJE','D2','54 - 56 HRC.',NULL,0,0),
  (oid_7791,2,3,'BUJES','4140','54 - 56 HRC.',NULL,0,0);

  -- 7792 - DISFAIND S.A.S.
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%DISFAIND%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7792,'2026-06-17','7:45',cid,'DISFAIND S.A.S.','F.E.','KG',1,20000,0,20000,3800,'FE REGISTRADA','FE-797','REMISION MANUAL No. 0460','https://drive.google.com/file/d/1D3o_rZLL_FKn4QM6mEboqfk8yKJxsQ-K/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7792;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7792,1,20,'PUNZONES','ACERO PLATA','MAXIMA',NULL,0,0);

  -- 7793 - MV RECONSTRUCCIONES S.A.S.
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%MV RECONSTRUCCIONES%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7793,'2026-06-17','7:46',cid,'MV RECONSTRUCCIONES S.A.S.','O.S.','KG',2.5,8000,0,20000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/10miyagk5BS7W35HtXbihnUipV5VWs86-/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7793;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7793,1,1,'PASADOR','1020','MAXIMA',NULL,0,0);

  -- 7794 - CYMA
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%CYMA%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7794,'2026-06-17','7:47',cid,'CYMA','O.S.','KG',5.5,12000,0,66000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/15ffEZ0qrDr1qGeSRiDx90-rdd6l7kzCh/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7794;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7794,1,9,'PIEZAS','P20','52 - 54 HRC.',NULL,0,0);

  -- 7795 - TECNIENGRANAJES
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%TECNIENGRANAJES%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7795,'2026-06-17','7:50',cid,'TECNIENGRANAJES','O.S.','KG',2.5,12000,0,30000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/13pzvOdmkJvpg60E5QV3pQ_SdAP9XWSRd/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7795;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7795,1,2,'PIÑONES','8620','54 - 56 HRC.',NULL,0,0);

  -- 7796 - ROBERTO BUITRAGO
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%ROBERTO BUITRAGO%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7796,'2026-06-17','17:36',cid,'ROBERTO BUITRAGO','O.S.','KG',9,12000,0,108000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1Qa-3SWkvlPCqpZqtZFpPrInxhF8haw8z/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7796;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7796,1,1,'CREMALLERA','7210','55 HRC.',NULL,0,0),
  (oid_7796,2,1,'EJE PIÑON','7210','55 HRC.',NULL,0,0);

  -- 7797 - TEJOS - ISMAEL ALFONSO
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%ISMAEL ALFONSO%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7797,'2026-06-17','17:38',cid,'TEJOS - ISMAEL ALFONSO','O.S.','UNIDAD',0,6667,6,40000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1jN1oUt5CVMsGVx2v0-d3EoRozp7EKzzM/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7797;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7797,1,4,'TEJOS GRANDES','709','MAXIMA',NULL,8000,32000),
  (oid_7797,2,2,'PONY TEJOS','709','MAXIMA',NULL,4000,8000);

  -- 7798 - CONDECORAR
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%CONDECORAR%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7798,'2026-06-17','17:40',cid,'CONDECORAR','O.S.','KG',2,12000,0,24000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1l0pKWsbCfoLq9HQ463yDiWOe6DCMVsRa/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7798;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7798,1,1,'MATRIZ','2379','58 - 60 HRC.',NULL,0,0);

  -- 7799 - TEJOS OLIMPICA
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%TEJOS OLIMPICA%' OR nombre ILIKE '%OLIMPICA%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7799,'2026-06-17','17:42',cid,'TEJOS OLIMPICA','O.S.','UNIDAD',0,2786,500,1393000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1gm3vUwxoax93d_hACcS-wUGSB_x91Na_/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7799;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7799,1,290,'TEJOS','1020','MAXIMA',NULL,3500,1015000),
  (oid_7799,2,210,'PONY TEJOS','1020','MAXIMA',NULL,1800,378000);

  -- 7800 - INDUSTRIAS BIMAQ
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%BIMAQ%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7800,'2026-06-17','17:43',cid,'INDUSTRIAS BIMAQ','O.S.','KG',1,20000,0,20000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1YsibCmrEcfhky8HLEu6fcjDrcUrHBnxy/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7800;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7800,1,1,'BUJE','1518','MAXIMA',NULL,0,0);

  -- 7801 - GUSTAVO DIAZ
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%GUSTAVO DIAZ%' OR nombre ILIKE '%GUSTAVO DÍAZ%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7801,'2026-06-17','17:44',cid,'GUSTAVO DIAZ','O.S.','KG',1,20000,0,20000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1hG8avq5OYf5DKo08xakBhL-xsEhQIP2F/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7801;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7801,1,2,'PIEZAS MEDIALUNAS','NO SABE','RECOCER',NULL,0,0);

  -- 7802 - INDUSTRIAS ALVAN SAS
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%ALVAN%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7802,'2026-06-17','17:46',cid,'INDUSTRIAS ALVAN SAS','F.E.','KG',1,20000,0,20000,3800,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1d_sCUNjcC7COLA5O53tjbgLIHohudBNb/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7802;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7802,1,1,'ANILLO','HR','58 - 60 HRC.',NULL,0,0),
  (oid_7802,2,1,'MACHO','NO SABE','58 - 60 HRC.',NULL,0,0);

  -- 7803 - OSCAR LOPEZ
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%OSCAR LOPEZ%' OR nombre ILIKE '%OSCAR LÓPEZ%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7803,'2026-06-17','17:47',cid,'OSCAR LOPEZ','O.S.','KG',3,12000,0,36000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1zEsBdlbH1Zd1tN6Gg4s7lqU0OiVzQdm5/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7803;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7803,1,44,'TUERCAS','1020','48 - 50 HRC.',NULL,0,0),
  (oid_7803,2,26,'TORNILLOS','1020','48 - 50 HRC.',NULL,0,0);

  -- 7804 - FABRITEC R G
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%FABRITEC%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7804,'2026-06-17','17:48',cid,'FABRITEC R G','F.E.','KG',5,10000,0,50000,9500,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/133EPaYWDEyaplbqV2sUdK7YXFQfvSadv/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7804;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7804,1,4,'BUJES','8620','56 - 58 HRC.',NULL,0,0);

  -- 7805 - SAMIR
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%SAMIR%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7805,'2026-06-17','17:52',cid,'SAMIR','O.S.','KG',86,6500,0,559000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1iHo6kfiY0xtVESuBH8eDCiHk1mDgkqyj/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7805;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7805,1,11,'PASADORES','1020','MAXIMA',NULL,0,0),
  (oid_7805,2,13,'BUJES EN BARRA PERFORADA','1518','MAXIMA',NULL,0,0);

  -- 7806 - MECANIZADOS EL PRIMO
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%EL PRIMO%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7806,'2026-06-17','17:54',cid,'MECANIZADOS EL PRIMO','O.S.','KG',158,5000,0,790000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1a7fgoTKfEOcE_41prm1jsy9g1D8umT-r/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7806;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7806,1,2,'CAMISAS DE RETEMPLE','1518','MAXIMA',NULL,0,0),
  (oid_7806,2,2,'CAMISAS NUEVAS','1518','MAXIMA',NULL,0,0),
  (oid_7806,3,1,'CAMBRIAMALLAS','HR','MAXIMA',NULL,0,0);

  -- 7807 - ISMAEL LERMA
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%ISMAEL LERMA%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7807,'2026-06-17','17:56',cid,'ISMAEL LERMA','O.S.','KG',13,12000,0,156000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1vqrBD_bE5txYshzk5ONiVhf1vWGWSc_l/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7807;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7807,1,4,'PIEZAS','709','58 - 60 HRC.',NULL,0,0),
  (oid_7807,2,2,'PIEZAS (anillos)','HR','54 HRC.',NULL,0,0);

  -- 7808 - HYF AUTOPARTES
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%HYF%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7808,'2026-06-17','17:57',cid,'HYF AUTOPARTES','O.S.','KG',3,12000,0,36000,0,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1r_0DZ_gVozQ5gddwXEUCjQTC9jj0TfkN/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7808;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7808,1,2,'PIEZAS DE EMBUTIDOR','4140','58 - 60 HRC.',NULL,0,0);

  -- 7809 - SETEMEC S.A.S.
  SELECT id INTO cid FROM clientes WHERE nombre ILIKE '%SETEMEC%' LIMIT 1;
  INSERT INTO ordenes (no_doc,fecha,hora,cliente_id,cliente_nombre,tipo_doc,modo_cobro,kg_total,tarifa_kg,cant_total,valor,iva,estado,no_factura,observacion,pdf_url,fecha_entrega,fecha_pago,forma_pago,motivo_anulacion,created_by)
  VALUES (7809,'2026-06-17','18:00',cid,'SETEMEC S.A.S.','F.E.','KG',2.5,10000,0,25000,4750,'RECIBIDA',NULL,NULL,'https://drive.google.com/file/d/1DQpOWvNs5qMvH_8EdqNNmh752zZ4h5UE/view?usp=drivesdk',NULL,NULL,NULL,NULL,NULL)
  RETURNING id INTO oid_7809;
  INSERT INTO orden_items (orden_id,posicion,cantidad,descripcion,referencia,dureza,categoria,tarifa_unit,subtotal) VALUES
  (oid_7809,1,2,'pasadores','8620','54 - 56 hrc.',NULL,0,0);

END $$;
