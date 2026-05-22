-- ============================================================================
-- Seed: usuario DominJaci + colección
-- Pegar en el SQL Editor de Supabase (corre como service_role: bypass RLS).
-- Idempotente: si ya existe el email, sólo refresca username/display_name
-- y reinserta la colección. Se ejecuta dentro de un DO block (una transacción).
--
-- Input recibido: "láminas que faltan" → este script inserta el OPUESTO
-- (todas las del álbum MENOS las faltantes). No se reportaron repetidas,
-- así que todo va con count=1. CC (coca-cola) no existe en el dataset → se ignora.
-- ============================================================================

-- Asegura que pgcrypto exista (Supabase ya lo trae, esto es no-op si ya está).
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $seed$
DECLARE
  v_email         text := 'dominjaci.dummy@gmail.com';
  v_password      text := 'DominJaci2026!';
  v_username      text := 'DominJaci';
  v_display_name  text := 'DominJaci';
  v_uid           uuid;
BEGIN
  -- 1) Crear el auth.user si no existe; si existe, reutilizar su id.
  SELECT id INTO v_uid FROM auth.users WHERE email = v_email;

  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_uid,
      'authenticated', 'authenticated',
      v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(),
      jsonb_build_object('provider','email','providers', jsonb_build_array('email')),
      jsonb_build_object('display_name', v_display_name),
      now(), now(),
      '', '', '', ''
    );

    -- Identity (requerido para login con email en Supabase moderno)
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
      'email',
      v_email,
      now(), now(), now()
    );
  END IF;

  -- 2) Forzar username/display_name del profile (el trigger ya creó la fila).
  --    Si el profile no existe por alguna razón, lo creamos.
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (v_uid, v_username, v_display_name)
  ON CONFLICT (id) DO UPDATE
    SET username = excluded.username,
        display_name = excluded.display_name;

  -- 3) Limpiar y sembrar colección.
  DELETE FROM public.collection WHERE user_id = v_uid;

  INSERT INTO public.collection (user_id, sticker_id, count)
  SELECT v_uid, s.sticker_id, s.count
  FROM (VALUES
    -- ===== FWC (especiales) — faltan: 0,5,6,8,10,17,18 =====
    ('FWC-1', 1), ('FWC-2', 1), ('FWC-3', 1), ('FWC-4', 1), ('FWC-7', 1),
    ('FWC-9', 1), ('FWC-11', 1), ('FWC-12', 1), ('FWC-13', 1), ('FWC-14', 1),
    ('FWC-15', 1), ('FWC-16', 1), ('FWC-19', 1),

    -- ===== MEX — faltan: 2,4,6,8,9,12,14,16,17,20 =====
    ('MEX-1', 1), ('MEX-3', 1), ('MEX-5', 1), ('MEX-7', 1), ('MEX-10', 1),
    ('MEX-11', 1), ('MEX-13', 1), ('MEX-15', 1), ('MEX-18', 1), ('MEX-19', 1),

    -- ===== RSA — faltan: 1,6,7,10,15 =====
    ('RSA-2', 1), ('RSA-3', 1), ('RSA-4', 1), ('RSA-5', 1), ('RSA-8', 1),
    ('RSA-9', 1), ('RSA-11', 1), ('RSA-12', 1), ('RSA-13', 1), ('RSA-14', 1),
    ('RSA-16', 1), ('RSA-17', 1), ('RSA-18', 1), ('RSA-19', 1), ('RSA-20', 1),

    -- ===== KOR — faltan: 1,6,10,15,16,17 =====
    ('KOR-2', 1), ('KOR-3', 1), ('KOR-4', 1), ('KOR-5', 1), ('KOR-7', 1),
    ('KOR-8', 1), ('KOR-9', 1), ('KOR-11', 1), ('KOR-12', 1), ('KOR-13', 1),
    ('KOR-14', 1), ('KOR-18', 1), ('KOR-19', 1), ('KOR-20', 1),

    -- ===== CZE — faltan: 3,9,14,17 =====
    ('CZE-1', 1), ('CZE-2', 1), ('CZE-4', 1), ('CZE-5', 1), ('CZE-6', 1),
    ('CZE-7', 1), ('CZE-8', 1), ('CZE-10', 1), ('CZE-11', 1), ('CZE-12', 1),
    ('CZE-13', 1), ('CZE-15', 1), ('CZE-16', 1), ('CZE-18', 1), ('CZE-19', 1),
    ('CZE-20', 1),

    -- ===== CAN — faltan: 2,4,5,6,8,12,15,16,19 =====
    ('CAN-1', 1), ('CAN-3', 1), ('CAN-7', 1), ('CAN-9', 1), ('CAN-10', 1),
    ('CAN-11', 1), ('CAN-13', 1), ('CAN-14', 1), ('CAN-17', 1), ('CAN-18', 1),
    ('CAN-20', 1),

    -- ===== BIH — faltan: 2,4,5,6,13,17,18,19 =====
    ('BIH-1', 1), ('BIH-3', 1), ('BIH-7', 1), ('BIH-8', 1), ('BIH-9', 1),
    ('BIH-10', 1), ('BIH-11', 1), ('BIH-12', 1), ('BIH-14', 1), ('BIH-15', 1),
    ('BIH-16', 1), ('BIH-20', 1),

    -- ===== QAT — faltan: 1,5,6,8,10,20 =====
    ('QAT-2', 1), ('QAT-3', 1), ('QAT-4', 1), ('QAT-7', 1), ('QAT-9', 1),
    ('QAT-11', 1), ('QAT-12', 1), ('QAT-13', 1), ('QAT-14', 1), ('QAT-15', 1),
    ('QAT-16', 1), ('QAT-17', 1), ('QAT-18', 1), ('QAT-19', 1),

    -- ===== SUI — falta: 1 =====
    ('SUI-2', 1), ('SUI-3', 1), ('SUI-4', 1), ('SUI-5', 1), ('SUI-6', 1),
    ('SUI-7', 1), ('SUI-8', 1), ('SUI-9', 1), ('SUI-10', 1), ('SUI-11', 1),
    ('SUI-12', 1), ('SUI-13', 1), ('SUI-14', 1), ('SUI-15', 1), ('SUI-16', 1),
    ('SUI-17', 1), ('SUI-18', 1), ('SUI-19', 1), ('SUI-20', 1),

    -- ===== BRA — faltan: 4,5,8,11,12,15,17 =====
    ('BRA-1', 1), ('BRA-2', 1), ('BRA-3', 1), ('BRA-6', 1), ('BRA-7', 1),
    ('BRA-9', 1), ('BRA-10', 1), ('BRA-13', 1), ('BRA-14', 1), ('BRA-16', 1),
    ('BRA-18', 1), ('BRA-19', 1), ('BRA-20', 1),

    -- ===== MAR — faltan: 3,6,10,11,13,14 =====
    ('MAR-1', 1), ('MAR-2', 1), ('MAR-4', 1), ('MAR-5', 1), ('MAR-7', 1),
    ('MAR-8', 1), ('MAR-9', 1), ('MAR-12', 1), ('MAR-15', 1), ('MAR-16', 1),
    ('MAR-17', 1), ('MAR-18', 1), ('MAR-19', 1), ('MAR-20', 1),

    -- ===== HAI — faltan: 9,13,14 =====
    ('HAI-1', 1), ('HAI-2', 1), ('HAI-3', 1), ('HAI-4', 1), ('HAI-5', 1),
    ('HAI-6', 1), ('HAI-7', 1), ('HAI-8', 1), ('HAI-10', 1), ('HAI-11', 1),
    ('HAI-12', 1), ('HAI-15', 1), ('HAI-16', 1), ('HAI-17', 1), ('HAI-18', 1),
    ('HAI-19', 1), ('HAI-20', 1),

    -- ===== SCO — faltan: 1,6,10,14,15,16,17,18,19 =====
    ('SCO-2', 1), ('SCO-3', 1), ('SCO-4', 1), ('SCO-5', 1), ('SCO-7', 1),
    ('SCO-8', 1), ('SCO-9', 1), ('SCO-11', 1), ('SCO-12', 1), ('SCO-13', 1),
    ('SCO-20', 1),

    -- ===== USA — faltan: 3,5,7,8,9,13,14 =====
    ('USA-1', 1), ('USA-2', 1), ('USA-4', 1), ('USA-6', 1), ('USA-10', 1),
    ('USA-11', 1), ('USA-12', 1), ('USA-15', 1), ('USA-16', 1), ('USA-17', 1),
    ('USA-18', 1), ('USA-19', 1), ('USA-20', 1),

    -- ===== PAR — faltan: 1,2,7,13,14,15,18 =====
    ('PAR-3', 1), ('PAR-4', 1), ('PAR-5', 1), ('PAR-6', 1), ('PAR-8', 1),
    ('PAR-9', 1), ('PAR-10', 1), ('PAR-11', 1), ('PAR-12', 1), ('PAR-16', 1),
    ('PAR-17', 1), ('PAR-19', 1), ('PAR-20', 1),

    -- ===== AUS — faltan: 2,3,6,12,17 =====
    ('AUS-1', 1), ('AUS-4', 1), ('AUS-5', 1), ('AUS-7', 1), ('AUS-8', 1),
    ('AUS-9', 1), ('AUS-10', 1), ('AUS-11', 1), ('AUS-13', 1), ('AUS-14', 1),
    ('AUS-15', 1), ('AUS-16', 1), ('AUS-18', 1), ('AUS-19', 1), ('AUS-20', 1),

    -- ===== TUR — faltan: 2,5,6,19 =====
    ('TUR-1', 1), ('TUR-3', 1), ('TUR-4', 1), ('TUR-7', 1), ('TUR-8', 1),
    ('TUR-9', 1), ('TUR-10', 1), ('TUR-11', 1), ('TUR-12', 1), ('TUR-13', 1),
    ('TUR-14', 1), ('TUR-15', 1), ('TUR-16', 1), ('TUR-17', 1), ('TUR-18', 1),
    ('TUR-20', 1),

    -- ===== GER — faltan: 1,2,3,5,6,7,9,10,15 =====
    ('GER-4', 1), ('GER-8', 1), ('GER-11', 1), ('GER-12', 1), ('GER-13', 1),
    ('GER-14', 1), ('GER-16', 1), ('GER-17', 1), ('GER-18', 1), ('GER-19', 1),
    ('GER-20', 1),

    -- ===== CUW — faltan: 4,5,6,8,9,10,14,15,17,19 =====
    ('CUW-1', 1), ('CUW-2', 1), ('CUW-3', 1), ('CUW-7', 1), ('CUW-11', 1),
    ('CUW-12', 1), ('CUW-13', 1), ('CUW-16', 1), ('CUW-18', 1), ('CUW-20', 1),

    -- ===== CIV — faltan: 1,4,5,6,15,20 =====
    ('CIV-2', 1), ('CIV-3', 1), ('CIV-7', 1), ('CIV-8', 1), ('CIV-9', 1),
    ('CIV-10', 1), ('CIV-11', 1), ('CIV-12', 1), ('CIV-13', 1), ('CIV-14', 1),
    ('CIV-16', 1), ('CIV-17', 1), ('CIV-18', 1), ('CIV-19', 1),

    -- ===== ECU — faltan: 2,3,4,5,12,17 =====
    ('ECU-1', 1), ('ECU-6', 1), ('ECU-7', 1), ('ECU-8', 1), ('ECU-9', 1),
    ('ECU-10', 1), ('ECU-11', 1), ('ECU-13', 1), ('ECU-14', 1), ('ECU-15', 1),
    ('ECU-16', 1), ('ECU-18', 1), ('ECU-19', 1), ('ECU-20', 1),

    -- ===== NED — faltan: 1,2,5,6,9,10,14,19 =====
    ('NED-3', 1), ('NED-4', 1), ('NED-7', 1), ('NED-8', 1), ('NED-11', 1),
    ('NED-12', 1), ('NED-13', 1), ('NED-15', 1), ('NED-16', 1), ('NED-17', 1),
    ('NED-18', 1), ('NED-20', 1),

    -- ===== JPN — faltan: 2,3,5,9,12,14,16,17,18,20 =====
    ('JPN-1', 1), ('JPN-4', 1), ('JPN-6', 1), ('JPN-7', 1), ('JPN-8', 1),
    ('JPN-10', 1), ('JPN-11', 1), ('JPN-13', 1), ('JPN-15', 1), ('JPN-19', 1),

    -- ===== SWE — faltan: 17,20 =====
    ('SWE-1', 1), ('SWE-2', 1), ('SWE-3', 1), ('SWE-4', 1), ('SWE-5', 1),
    ('SWE-6', 1), ('SWE-7', 1), ('SWE-8', 1), ('SWE-9', 1), ('SWE-10', 1),
    ('SWE-11', 1), ('SWE-12', 1), ('SWE-13', 1), ('SWE-14', 1), ('SWE-15', 1),
    ('SWE-16', 1), ('SWE-18', 1), ('SWE-19', 1),

    -- ===== TUN — faltan: 2,9,13,19,20 =====
    ('TUN-1', 1), ('TUN-3', 1), ('TUN-4', 1), ('TUN-5', 1), ('TUN-6', 1),
    ('TUN-7', 1), ('TUN-8', 1), ('TUN-10', 1), ('TUN-11', 1), ('TUN-12', 1),
    ('TUN-14', 1), ('TUN-15', 1), ('TUN-16', 1), ('TUN-17', 1), ('TUN-18', 1),

    -- ===== BEL — faltan: 2,3,10,17,20 =====
    ('BEL-1', 1), ('BEL-4', 1), ('BEL-5', 1), ('BEL-6', 1), ('BEL-7', 1),
    ('BEL-8', 1), ('BEL-9', 1), ('BEL-11', 1), ('BEL-12', 1), ('BEL-13', 1),
    ('BEL-14', 1), ('BEL-15', 1), ('BEL-16', 1), ('BEL-18', 1), ('BEL-19', 1),

    -- ===== EGY — faltan: 6,9,18 =====
    ('EGY-1', 1), ('EGY-2', 1), ('EGY-3', 1), ('EGY-4', 1), ('EGY-5', 1),
    ('EGY-7', 1), ('EGY-8', 1), ('EGY-10', 1), ('EGY-11', 1), ('EGY-12', 1),
    ('EGY-13', 1), ('EGY-14', 1), ('EGY-15', 1), ('EGY-16', 1), ('EGY-17', 1),
    ('EGY-19', 1), ('EGY-20', 1),

    -- ===== IRN — faltan: 8,9,12,14,15,18,19,20 =====
    ('IRN-1', 1), ('IRN-2', 1), ('IRN-3', 1), ('IRN-4', 1), ('IRN-5', 1),
    ('IRN-6', 1), ('IRN-7', 1), ('IRN-10', 1), ('IRN-11', 1), ('IRN-13', 1),
    ('IRN-16', 1), ('IRN-17', 1),

    -- ===== NZL — faltan: 10,19 =====
    ('NZL-1', 1), ('NZL-2', 1), ('NZL-3', 1), ('NZL-4', 1), ('NZL-5', 1),
    ('NZL-6', 1), ('NZL-7', 1), ('NZL-8', 1), ('NZL-9', 1), ('NZL-11', 1),
    ('NZL-12', 1), ('NZL-13', 1), ('NZL-14', 1), ('NZL-15', 1), ('NZL-16', 1),
    ('NZL-17', 1), ('NZL-18', 1), ('NZL-20', 1),

    -- ===== ESP — faltan: 3,5,8,9,11,14 =====
    ('ESP-1', 1), ('ESP-2', 1), ('ESP-4', 1), ('ESP-6', 1), ('ESP-7', 1),
    ('ESP-10', 1), ('ESP-12', 1), ('ESP-13', 1), ('ESP-15', 1), ('ESP-16', 1),
    ('ESP-17', 1), ('ESP-18', 1), ('ESP-19', 1), ('ESP-20', 1),

    -- ===== CPV — faltan: 4,12,13,18 =====
    ('CPV-1', 1), ('CPV-2', 1), ('CPV-3', 1), ('CPV-5', 1), ('CPV-6', 1),
    ('CPV-7', 1), ('CPV-8', 1), ('CPV-9', 1), ('CPV-10', 1), ('CPV-11', 1),
    ('CPV-14', 1), ('CPV-15', 1), ('CPV-16', 1), ('CPV-17', 1), ('CPV-19', 1),
    ('CPV-20', 1),

    -- ===== KSA — faltan: 10,11,12,15,19 =====
    ('KSA-1', 1), ('KSA-2', 1), ('KSA-3', 1), ('KSA-4', 1), ('KSA-5', 1),
    ('KSA-6', 1), ('KSA-7', 1), ('KSA-8', 1), ('KSA-9', 1), ('KSA-13', 1),
    ('KSA-14', 1), ('KSA-16', 1), ('KSA-17', 1), ('KSA-18', 1), ('KSA-20', 1),

    -- ===== URU — faltan: 2,4,6,7,8,10,11 =====
    ('URU-1', 1), ('URU-3', 1), ('URU-5', 1), ('URU-9', 1), ('URU-12', 1),
    ('URU-13', 1), ('URU-14', 1), ('URU-15', 1), ('URU-16', 1), ('URU-17', 1),
    ('URU-18', 1), ('URU-19', 1), ('URU-20', 1),

    -- ===== FRA — falta: 18 =====
    ('FRA-1', 1), ('FRA-2', 1), ('FRA-3', 1), ('FRA-4', 1), ('FRA-5', 1),
    ('FRA-6', 1), ('FRA-7', 1), ('FRA-8', 1), ('FRA-9', 1), ('FRA-10', 1),
    ('FRA-11', 1), ('FRA-12', 1), ('FRA-13', 1), ('FRA-14', 1), ('FRA-15', 1),
    ('FRA-16', 1), ('FRA-17', 1), ('FRA-19', 1), ('FRA-20', 1),

    -- ===== SEN — no faltan (tiene todas) =====
    ('SEN-1', 1), ('SEN-2', 1), ('SEN-3', 1), ('SEN-4', 1), ('SEN-5', 1),
    ('SEN-6', 1), ('SEN-7', 1), ('SEN-8', 1), ('SEN-9', 1), ('SEN-10', 1),
    ('SEN-11', 1), ('SEN-12', 1), ('SEN-13', 1), ('SEN-14', 1), ('SEN-15', 1),
    ('SEN-16', 1), ('SEN-17', 1), ('SEN-18', 1), ('SEN-19', 1), ('SEN-20', 1),

    -- ===== IRQ — faltan: 4,7,11 =====
    ('IRQ-1', 1), ('IRQ-2', 1), ('IRQ-3', 1), ('IRQ-5', 1), ('IRQ-6', 1),
    ('IRQ-8', 1), ('IRQ-9', 1), ('IRQ-10', 1), ('IRQ-12', 1), ('IRQ-13', 1),
    ('IRQ-14', 1), ('IRQ-15', 1), ('IRQ-16', 1), ('IRQ-17', 1), ('IRQ-18', 1),
    ('IRQ-19', 1), ('IRQ-20', 1),

    -- ===== NOR — faltan: 4,5,8,12,14,17 =====
    ('NOR-1', 1), ('NOR-2', 1), ('NOR-3', 1), ('NOR-6', 1), ('NOR-7', 1),
    ('NOR-9', 1), ('NOR-10', 1), ('NOR-11', 1), ('NOR-13', 1), ('NOR-15', 1),
    ('NOR-16', 1), ('NOR-18', 1), ('NOR-19', 1), ('NOR-20', 1),

    -- ===== ARG — faltan: 4,7,8,19,20 =====
    ('ARG-1', 1), ('ARG-2', 1), ('ARG-3', 1), ('ARG-5', 1), ('ARG-6', 1),
    ('ARG-9', 1), ('ARG-10', 1), ('ARG-11', 1), ('ARG-12', 1), ('ARG-13', 1),
    ('ARG-14', 1), ('ARG-15', 1), ('ARG-16', 1), ('ARG-17', 1), ('ARG-18', 1),

    -- ===== ALG — faltan: 2,4,18,20 =====
    ('ALG-1', 1), ('ALG-3', 1), ('ALG-5', 1), ('ALG-6', 1), ('ALG-7', 1),
    ('ALG-8', 1), ('ALG-9', 1), ('ALG-10', 1), ('ALG-11', 1), ('ALG-12', 1),
    ('ALG-13', 1), ('ALG-14', 1), ('ALG-15', 1), ('ALG-16', 1), ('ALG-17', 1),
    ('ALG-19', 1),

    -- ===== AUT — faltan: 2,4,6,8,9,12,15,17,18 =====
    ('AUT-1', 1), ('AUT-3', 1), ('AUT-5', 1), ('AUT-7', 1), ('AUT-10', 1),
    ('AUT-11', 1), ('AUT-13', 1), ('AUT-14', 1), ('AUT-16', 1), ('AUT-19', 1),
    ('AUT-20', 1),

    -- ===== JOR — faltan: 1,5,9,12,14,15,17,18,19 =====
    ('JOR-2', 1), ('JOR-3', 1), ('JOR-4', 1), ('JOR-6', 1), ('JOR-7', 1),
    ('JOR-8', 1), ('JOR-10', 1), ('JOR-11', 1), ('JOR-13', 1), ('JOR-16', 1),
    ('JOR-20', 1),

    -- ===== POR — faltan: 1,3,20 =====
    ('POR-2', 1), ('POR-4', 1), ('POR-5', 1), ('POR-6', 1), ('POR-7', 1),
    ('POR-8', 1), ('POR-9', 1), ('POR-10', 1), ('POR-11', 1), ('POR-12', 1),
    ('POR-13', 1), ('POR-14', 1), ('POR-15', 1), ('POR-16', 1), ('POR-17', 1),
    ('POR-18', 1), ('POR-19', 1),

    -- ===== COD — faltan: 10,12,15,18,19,20 =====
    ('COD-1', 1), ('COD-2', 1), ('COD-3', 1), ('COD-4', 1), ('COD-5', 1),
    ('COD-6', 1), ('COD-7', 1), ('COD-8', 1), ('COD-9', 1), ('COD-11', 1),
    ('COD-13', 1), ('COD-14', 1), ('COD-16', 1), ('COD-17', 1),

    -- ===== UZB — faltan: 1,6,15 =====
    ('UZB-2', 1), ('UZB-3', 1), ('UZB-4', 1), ('UZB-5', 1), ('UZB-7', 1),
    ('UZB-8', 1), ('UZB-9', 1), ('UZB-10', 1), ('UZB-11', 1), ('UZB-12', 1),
    ('UZB-13', 1), ('UZB-14', 1), ('UZB-16', 1), ('UZB-17', 1), ('UZB-18', 1),
    ('UZB-19', 1), ('UZB-20', 1),

    -- ===== COL — faltan: 2,6,7,10 =====
    ('COL-1', 1), ('COL-3', 1), ('COL-4', 1), ('COL-5', 1), ('COL-8', 1),
    ('COL-9', 1), ('COL-11', 1), ('COL-12', 1), ('COL-13', 1), ('COL-14', 1),
    ('COL-15', 1), ('COL-16', 1), ('COL-17', 1), ('COL-18', 1), ('COL-19', 1),
    ('COL-20', 1),

    -- ===== ENG — faltan: 1,8,10,11,15,19 =====
    ('ENG-2', 1), ('ENG-3', 1), ('ENG-4', 1), ('ENG-5', 1), ('ENG-6', 1),
    ('ENG-7', 1), ('ENG-9', 1), ('ENG-12', 1), ('ENG-13', 1), ('ENG-14', 1),
    ('ENG-16', 1), ('ENG-17', 1), ('ENG-18', 1), ('ENG-20', 1),

    -- ===== CRO — faltan: 2,6,7,8,10,13,16 =====
    ('CRO-1', 1), ('CRO-3', 1), ('CRO-4', 1), ('CRO-5', 1), ('CRO-9', 1),
    ('CRO-11', 1), ('CRO-12', 1), ('CRO-14', 1), ('CRO-15', 1), ('CRO-17', 1),
    ('CRO-18', 1), ('CRO-19', 1), ('CRO-20', 1),

    -- ===== GHA — faltan: 2,4,12,20 =====
    ('GHA-1', 1), ('GHA-3', 1), ('GHA-5', 1), ('GHA-6', 1), ('GHA-7', 1),
    ('GHA-8', 1), ('GHA-9', 1), ('GHA-10', 1), ('GHA-11', 1), ('GHA-13', 1),
    ('GHA-14', 1), ('GHA-15', 1), ('GHA-16', 1), ('GHA-17', 1), ('GHA-18', 1),
    ('GHA-19', 1),

    -- ===== PAN — faltan: 8,12,17,18 =====
    ('PAN-1', 1), ('PAN-2', 1), ('PAN-3', 1), ('PAN-4', 1), ('PAN-5', 1),
    ('PAN-6', 1), ('PAN-7', 1), ('PAN-9', 1), ('PAN-10', 1), ('PAN-11', 1),
    ('PAN-13', 1), ('PAN-14', 1), ('PAN-15', 1), ('PAN-16', 1), ('PAN-19', 1),
    ('PAN-20', 1)
  ) AS s(sticker_id, count);

  RAISE NOTICE 'DominJaci listo. user_id=%, email=%, password=%', v_uid, v_email, v_password;
END $seed$;
