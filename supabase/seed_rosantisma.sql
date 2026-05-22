-- ============================================================================
-- Seed: usuario RoSantIsma + colección
-- Pegar en el SQL Editor de Supabase (corre como service_role: bypass RLS).
-- Idempotente: si ya existe el email, sólo refresca username/display_name
-- y reinserta la colección. Se ejecuta dentro de un DO block (una transacción).
-- ============================================================================

-- Asegura que pgcrypto exista (Supabase ya lo trae, esto es no-op si ya está).
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $seed$
DECLARE
  v_email         text := 'rosantisma.dummy@gmail.com';
  v_password      text := 'RoSantIsma2026!';
  v_username      text := 'RoSantIsma';
  v_display_name  text := 'RoSantIsma';
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
    -- ===== FWC (especiales) =====
    ('FWC-0', 1), ('FWC-1', 1), ('FWC-7', 1), ('FWC-11', 1), ('FWC-13', 1), ('FWC-17', 1),
    ('FWC-9', 2), ('FWC-12', 2), ('FWC-14', 2), ('FWC-18', 2),

    -- ===== MEX =====
    ('MEX-2', 1), ('MEX-3', 1), ('MEX-4', 1), ('MEX-5', 1), ('MEX-6', 1),
    ('MEX-7', 1), ('MEX-10', 1), ('MEX-11', 1), ('MEX-17', 1),
    ('MEX-8', 2), ('MEX-12', 2),

    -- ===== RSA =====
    ('RSA-3', 1), ('RSA-4', 1), ('RSA-6', 1), ('RSA-7', 1), ('RSA-9', 1),
    ('RSA-10', 1), ('RSA-12', 1), ('RSA-14', 1), ('RSA-15', 1), ('RSA-18', 1), ('RSA-20', 1),
    ('RSA-1', 2), ('RSA-5', 2), ('RSA-19', 2),

    -- ===== KOR =====
    ('KOR-3', 1), ('KOR-9', 1), ('KOR-16', 1),
    ('KOR-2', 2), ('KOR-4', 2), ('KOR-5', 2), ('KOR-6', 2), ('KOR-14', 2), ('KOR-18', 2),

    -- ===== CZE =====
    ('CZE-10', 1), ('CZE-11', 1), ('CZE-14', 1), ('CZE-20', 1),
    ('CZE-4', 2), ('CZE-6', 2), ('CZE-8', 2), ('CZE-9', 2),
    ('CZE-12', 2), ('CZE-13', 2), ('CZE-15', 2), ('CZE-17', 2),

    -- ===== CAN =====
    ('CAN-1', 1), ('CAN-3', 1), ('CAN-4', 1), ('CAN-7', 1),
    ('CAN-13', 1), ('CAN-15', 1), ('CAN-18', 1), ('CAN-19', 1),
    ('CAN-11', 2), ('CAN-17', 2),

    -- ===== BIH =====
    ('BIH-4', 1), ('BIH-9', 1), ('BIH-11', 1), ('BIH-12', 1),
    ('BIH-13', 1), ('BIH-16', 1), ('BIH-17', 1), ('BIH-18', 1),
    ('BIH-2', 2), ('BIH-3', 2), ('BIH-6', 2), ('BIH-7', 2),
    ('BIH-8', 2), ('BIH-10', 2), ('BIH-14', 2), ('BIH-15', 2), ('BIH-19', 2),

    -- ===== QAT =====
    ('QAT-1', 1), ('QAT-8', 1), ('QAT-11', 1), ('QAT-12', 1),
    ('QAT-16', 1), ('QAT-17', 1), ('QAT-19', 1), ('QAT-20', 1),
    ('QAT-13', 2),

    -- ===== SUI =====
    ('SUI-5', 1), ('SUI-8', 1), ('SUI-13', 1), ('SUI-14', 1),
    ('SUI-17', 1), ('SUI-18', 1), ('SUI-19', 1),
    ('SUI-4', 2), ('SUI-10', 2), ('SUI-11', 2), ('SUI-12', 2), ('SUI-16', 2),

    -- ===== BRA =====
    ('BRA-4', 1), ('BRA-6', 1), ('BRA-7', 1), ('BRA-14', 1), ('BRA-18', 1),
    ('BRA-13', 2),

    -- ===== MAR =====
    ('MAR-1', 1), ('MAR-2', 1), ('MAR-6', 1), ('MAR-11', 1), ('MAR-12', 1),
    ('MAR-14', 1), ('MAR-15', 1), ('MAR-17', 1), ('MAR-18', 1),
    ('MAR-10', 2),

    -- ===== HAI =====
    ('HAI-3', 1), ('HAI-6', 1), ('HAI-8', 1), ('HAI-10', 1),
    ('HAI-12', 1), ('HAI-13', 1), ('HAI-16', 1), ('HAI-19', 1),
    ('HAI-2', 2), ('HAI-15', 2), ('HAI-20', 2),

    -- ===== SCO =====
    ('SCO-2', 1), ('SCO-5', 1), ('SCO-6', 1), ('SCO-9', 1), ('SCO-14', 1),
    ('SCO-3', 2), ('SCO-13', 2), ('SCO-17', 2),

    -- ===== USA =====
    ('USA-1', 1), ('USA-3', 1), ('USA-6', 1), ('USA-7', 1), ('USA-11', 1),
    ('USA-13', 1), ('USA-16', 1), ('USA-17', 1), ('USA-18', 1), ('USA-19', 1), ('USA-20', 1),

    -- ===== PAR =====
    ('PAR-1', 1), ('PAR-3', 1), ('PAR-5', 1), ('PAR-13', 1), ('PAR-18', 1), ('PAR-20', 1),
    ('PAR-2', 2), ('PAR-9', 2), ('PAR-14', 2),

    -- ===== AUS =====
    ('AUS-1', 1), ('AUS-2', 1), ('AUS-4', 1), ('AUS-5', 1), ('AUS-6', 1),
    ('AUS-7', 1), ('AUS-8', 1), ('AUS-9', 1), ('AUS-11', 1),
    ('AUS-14', 1), ('AUS-16', 1), ('AUS-18', 1), ('AUS-20', 1),

    -- ===== TUR =====
    ('TUR-1', 1), ('TUR-2', 1), ('TUR-9', 1), ('TUR-17', 1), ('TUR-18', 1), ('TUR-19', 1),
    ('TUR-6', 2), ('TUR-10', 2), ('TUR-12', 2), ('TUR-13', 2),
    ('TUR-14', 2), ('TUR-15', 2), ('TUR-16', 2),

    -- ===== GER =====
    ('GER-5', 1), ('GER-9', 1), ('GER-11', 1), ('GER-14', 1),
    ('GER-15', 1), ('GER-17', 1), ('GER-18', 1), ('GER-19', 1),
    ('GER-2', 2), ('GER-4', 2), ('GER-6', 2), ('GER-7', 2), ('GER-8', 2), ('GER-10', 2),

    -- ===== CUW =====
    ('CUW-2', 1), ('CUW-5', 1), ('CUW-9', 1), ('CUW-13', 1),
    ('CUW-14', 1), ('CUW-15', 1), ('CUW-16', 1), ('CUW-18', 1),
    ('CUW-6', 2), ('CUW-10', 2), ('CUW-12', 2),

    -- ===== CIV =====
    ('CIV-4', 1), ('CIV-5', 1), ('CIV-7', 1), ('CIV-8', 1),
    ('CIV-10', 1), ('CIV-11', 1), ('CIV-12', 1), ('CIV-15', 1),
    ('CIV-2', 2), ('CIV-6', 2), ('CIV-17', 2), ('CIV-18', 2), ('CIV-19', 2),

    -- ===== ECU =====
    ('ECU-3', 1), ('ECU-4', 1), ('ECU-6', 1), ('ECU-8', 1), ('ECU-10', 1),
    ('ECU-11', 1), ('ECU-16', 1), ('ECU-17', 1), ('ECU-18', 1), ('ECU-19', 1),
    ('ECU-7', 2), ('ECU-12', 2), ('ECU-20', 2),

    -- ===== NED =====
    ('NED-2', 1), ('NED-5', 1), ('NED-6', 1), ('NED-9', 1), ('NED-10', 1),
    ('NED-13', 1), ('NED-14', 1), ('NED-15', 1), ('NED-19', 1),
    ('NED-20', 2),

    -- ===== JPN =====
    ('JPN-2', 1), ('JPN-6', 1), ('JPN-11', 1), ('JPN-12', 1),
    ('JPN-17', 1), ('JPN-18', 1), ('JPN-19', 1), ('JPN-20', 1),
    ('JPN-4', 2), ('JPN-8', 2), ('JPN-9', 2), ('JPN-10', 2),
    ('JPN-13', 2), ('JPN-15', 2), ('JPN-16', 2),

    -- ===== SWE =====
    ('SWE-1', 1), ('SWE-9', 1), ('SWE-13', 1), ('SWE-14', 1),
    ('SWE-15', 1), ('SWE-16', 1), ('SWE-17', 1), ('SWE-18', 1),
    ('SWE-2', 2), ('SWE-3', 2), ('SWE-4', 2), ('SWE-5', 2), ('SWE-7', 2),

    -- ===== TUN =====
    ('TUN-3', 1), ('TUN-4', 1), ('TUN-7', 1), ('TUN-13', 1), ('TUN-14', 1),
    ('TUN-15', 1), ('TUN-17', 1), ('TUN-18', 1), ('TUN-19', 1), ('TUN-20', 1),
    ('TUN-11', 2),

    -- ===== BEL =====
    ('BEL-2', 1), ('BEL-3', 1), ('BEL-4', 1), ('BEL-5', 1), ('BEL-7', 1),
    ('BEL-9', 1), ('BEL-12', 1), ('BEL-16', 1), ('BEL-18', 1), ('BEL-19', 1),
    ('BEL-13', 2),

    -- ===== EGY =====
    ('EGY-1', 1), ('EGY-4', 1), ('EGY-6', 1), ('EGY-8', 1),
    ('EGY-9', 1), ('EGY-13', 1), ('EGY-15', 1),
    ('EGY-5', 2), ('EGY-16', 2), ('EGY-19', 2),

    -- ===== IRN =====
    ('IRN-2', 1), ('IRN-3', 1), ('IRN-8', 1), ('IRN-10', 1),
    ('IRN-12', 1), ('IRN-17', 1), ('IRN-19', 1), ('IRN-20', 1),
    ('IRN-4', 2), ('IRN-6', 2), ('IRN-15', 2),

    -- ===== NZL =====
    ('NZL-1', 1), ('NZL-4', 1), ('NZL-5', 1), ('NZL-9', 1),
    ('NZL-13', 1), ('NZL-14', 1), ('NZL-15', 1), ('NZL-17', 1),
    ('NZL-12', 2), ('NZL-18', 2),

    -- ===== ESP =====
    ('ESP-2', 1), ('ESP-6', 1), ('ESP-7', 1), ('ESP-9', 1), ('ESP-10', 1),
    ('ESP-11', 1), ('ESP-12', 1), ('ESP-13', 1), ('ESP-16', 1), ('ESP-17', 1),
    ('ESP-5', 2), ('ESP-15', 2), ('ESP-19', 2),

    -- ===== CPV =====
    ('CPV-2', 1), ('CPV-4', 1), ('CPV-6', 1), ('CPV-7', 1), ('CPV-8', 1),
    ('CPV-10', 1), ('CPV-11', 1), ('CPV-13', 1), ('CPV-14', 1), ('CPV-15', 1),
    ('CPV-17', 1), ('CPV-18', 1), ('CPV-19', 1),
    ('CPV-5', 2), ('CPV-9', 2), ('CPV-20', 2),

    -- ===== KSA =====
    ('KSA-1', 1), ('KSA-5', 1), ('KSA-9', 1), ('KSA-12', 1), ('KSA-18', 1), ('KSA-19', 1),
    ('KSA-3', 2), ('KSA-7', 2), ('KSA-13', 2), ('KSA-17', 2),

    -- ===== URU =====
    ('URU-2', 1), ('URU-3', 1), ('URU-7', 1), ('URU-11', 1), ('URU-12', 1),
    ('URU-14', 1), ('URU-15', 1), ('URU-17', 1), ('URU-18', 1), ('URU-20', 1),
    ('URU-4', 2), ('URU-13', 2), ('URU-19', 2),

    -- ===== FRA =====
    ('FRA-1', 1), ('FRA-6', 1), ('FRA-17', 1),
    ('FRA-5', 2), ('FRA-8', 2), ('FRA-10', 2), ('FRA-12', 2),
    ('FRA-15', 2), ('FRA-16', 2), ('FRA-19', 2),

    -- ===== SEN =====
    ('SEN-1', 1), ('SEN-2', 1), ('SEN-8', 1), ('SEN-10', 1),
    ('SEN-12', 1), ('SEN-13', 1), ('SEN-14', 1), ('SEN-17', 1),
    ('SEN-6', 2), ('SEN-15', 2), ('SEN-16', 2), ('SEN-20', 2),

    -- ===== IRQ =====
    ('IRQ-1', 1), ('IRQ-5', 1), ('IRQ-11', 1), ('IRQ-14', 1),
    ('IRQ-17', 1), ('IRQ-18', 1), ('IRQ-19', 1), ('IRQ-20', 1),
    ('IRQ-2', 2), ('IRQ-3', 2), ('IRQ-6', 2), ('IRQ-10', 2), ('IRQ-15', 2),

    -- ===== NOR =====
    ('NOR-2', 1), ('NOR-4', 1), ('NOR-6', 1), ('NOR-8', 1), ('NOR-9', 1),
    ('NOR-10', 1), ('NOR-14', 1), ('NOR-15', 1), ('NOR-16', 1),
    ('NOR-17', 1), ('NOR-19', 1), ('NOR-20', 1),
    ('NOR-5', 2), ('NOR-12', 2), ('NOR-13', 2), ('NOR-18', 2),

    -- ===== ARG =====
    ('ARG-4', 1), ('ARG-5', 1), ('ARG-14', 1), ('ARG-15', 1), ('ARG-18', 1), ('ARG-19', 1),
    ('ARG-13', 2),

    -- ===== ALG =====
    ('ALG-3', 1), ('ALG-7', 1), ('ALG-9', 1), ('ALG-11', 1),
    ('ALG-14', 1), ('ALG-16', 1), ('ALG-20', 1),
    ('ALG-13', 2),

    -- ===== AUT =====
    ('AUT-4', 1), ('AUT-8', 1), ('AUT-9', 1), ('AUT-10', 1),
    ('AUT-12', 1), ('AUT-15', 1), ('AUT-19', 1), ('AUT-20', 1),
    ('AUT-3', 2), ('AUT-5', 2), ('AUT-13', 2), ('AUT-16', 2),

    -- ===== JOR =====
    ('JOR-1', 1), ('JOR-3', 1), ('JOR-5', 1), ('JOR-6', 1), ('JOR-11', 1),
    ('JOR-12', 1), ('JOR-13', 1), ('JOR-14', 1), ('JOR-15', 1),
    ('JOR-2', 2), ('JOR-10', 2), ('JOR-20', 2),

    -- ===== POR =====
    ('POR-3', 1), ('POR-4', 1), ('POR-10', 1), ('POR-11', 1),
    ('POR-12', 1), ('POR-13', 1), ('POR-15', 1),
    ('POR-7', 2),

    -- ===== COD =====
    ('COD-2', 1), ('COD-4', 1), ('COD-5', 1), ('COD-10', 1), ('COD-13', 1),
    ('COD-15', 1), ('COD-16', 1), ('COD-17', 1), ('COD-19', 1),
    ('COD-1', 2), ('COD-6', 2), ('COD-7', 2), ('COD-8', 2), ('COD-20', 2),

    -- ===== UZB =====
    ('UZB-1', 1), ('UZB-4', 1), ('UZB-12', 1),
    ('UZB-2', 2), ('UZB-5', 2), ('UZB-8', 2), ('UZB-17', 2), ('UZB-18', 2),

    -- ===== COL =====
    ('COL-3', 1), ('COL-4', 1), ('COL-5', 1), ('COL-11', 1), ('COL-14', 1),
    ('COL-15', 1), ('COL-16', 1), ('COL-18', 1), ('COL-19', 1), ('COL-20', 1),
    ('COL-2', 2), ('COL-6', 2), ('COL-7', 2), ('COL-10', 2), ('COL-13', 2),

    -- ===== ENG =====
    ('ENG-1', 1), ('ENG-3', 1), ('ENG-5', 1), ('ENG-6', 1), ('ENG-7', 1),
    ('ENG-11', 1), ('ENG-14', 1), ('ENG-17', 1), ('ENG-18', 1),
    ('ENG-19', 1), ('ENG-20', 1),
    ('ENG-9', 2), ('ENG-13', 2),

    -- ===== CRO =====
    ('CRO-3', 1), ('CRO-4', 1), ('CRO-7', 1), ('CRO-11', 1), ('CRO-12', 1),
    ('CRO-13', 1), ('CRO-15', 1), ('CRO-16', 1), ('CRO-17', 1), ('CRO-20', 1),
    ('CRO-8', 2),

    -- ===== GHA =====
    ('GHA-2', 1), ('GHA-3', 1), ('GHA-8', 1), ('GHA-10', 1),
    ('GHA-11', 1), ('GHA-12', 1), ('GHA-14', 1), ('GHA-16', 1), ('GHA-19', 1),
    ('GHA-4', 2), ('GHA-7', 2), ('GHA-9', 2), ('GHA-15', 2),

    -- ===== PAN =====
    ('PAN-1', 1), ('PAN-3', 1), ('PAN-4', 1), ('PAN-7', 1), ('PAN-8', 1),
    ('PAN-9', 1), ('PAN-11', 1), ('PAN-12', 1), ('PAN-16', 1), ('PAN-20', 1),
    ('PAN-17', 2)
  ) AS s(sticker_id, count);

  RAISE NOTICE 'RoSantIsma listo. user_id=%, email=%, password=%', v_uid, v_email, v_password;
END $seed$;
