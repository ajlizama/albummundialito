-- ============================================================================
-- Seed: usuario LauraTanAndres + colección
-- Pegar en el SQL Editor de Supabase (corre como service_role: bypass RLS).
-- Idempotente: si ya existe el email, sólo refresca username/display_name
-- y reinserta la colección. Se ejecuta dentro de un DO block (una transacción).
-- ============================================================================

-- Asegura que pgcrypto exista (Supabase ya lo trae, esto es no-op si ya está).
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $seed$
DECLARE
  v_email         text := 'lauratanandres.dummy@gmail.com';
  v_password      text := 'LauraTanAndres2026!';
  v_username      text := 'LauraTanAndres';
  v_display_name  text := 'LauraTanAndres';
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
    ('FWC-0', 1), ('FWC-2', 1), ('FWC-3', 1), ('FWC-5', 1), ('FWC-6', 1), ('FWC-7', 1), ('FWC-8', 1), ('FWC-9', 1),
    ('FWC-12', 1), ('FWC-17', 1), ('FWC-18', 1), ('FWC-19', 1),
    ('FWC-11', 2), ('FWC-14', 2), ('FWC-15', 2), ('FWC-16', 2),
    ('FWC-10', 3),

    -- ===== MEX =====
    ('MEX-3', 1), ('MEX-5', 1), ('MEX-7', 1), ('MEX-9', 1), ('MEX-11', 1), ('MEX-13', 1), ('MEX-14', 1), ('MEX-16', 1),
    ('MEX-18', 1), ('MEX-20', 1),

    -- ===== RSA =====
    ('RSA-1', 1), ('RSA-3', 1), ('RSA-4', 1), ('RSA-5', 1), ('RSA-6', 1), ('RSA-8', 1), ('RSA-9', 1), ('RSA-10', 1),
    ('RSA-12', 1), ('RSA-13', 1), ('RSA-14', 1), ('RSA-15', 1), ('RSA-17', 1), ('RSA-18', 1), ('RSA-19', 1), ('RSA-20', 1),
    ('RSA-2', 2), ('RSA-7', 2), ('RSA-11', 2), ('RSA-16', 2),

    -- ===== KOR =====
    ('KOR-2', 1), ('KOR-4', 1), ('KOR-6', 1), ('KOR-9', 1), ('KOR-10', 1), ('KOR-14', 1), ('KOR-15', 1), ('KOR-19', 1),
    ('KOR-20', 1),
    ('KOR-16', 2),

    -- ===== CZE =====
    ('CZE-6', 1), ('CZE-7', 1), ('CZE-8', 1), ('CZE-10', 1), ('CZE-14', 1), ('CZE-15', 1), ('CZE-18', 1), ('CZE-19', 1),
    ('CZE-20', 1),
    ('CZE-4', 2), ('CZE-11', 2), ('CZE-12', 2), ('CZE-13', 2),
    ('CZE-5', 3), ('CZE-9', 3),

    -- ===== CAN =====
    ('CAN-2', 1), ('CAN-3', 1), ('CAN-4', 1), ('CAN-8', 1), ('CAN-10', 1), ('CAN-11', 1), ('CAN-12', 1), ('CAN-13', 1),
    ('CAN-15', 1), ('CAN-18', 1), ('CAN-19', 1),

    -- ===== BIH =====
    ('BIH-1', 1), ('BIH-3', 1), ('BIH-4', 1), ('BIH-5', 1), ('BIH-7', 1), ('BIH-9', 1), ('BIH-11', 1), ('BIH-12', 1),
    ('BIH-13', 1), ('BIH-15', 1), ('BIH-19', 1), ('BIH-20', 1),
    ('BIH-8', 2), ('BIH-14', 2), ('BIH-18', 2),
    ('BIH-16', 3),
    ('BIH-10', 4),

    -- ===== QAT =====
    ('QAT-3', 1), ('QAT-7', 1), ('QAT-9', 1), ('QAT-11', 1), ('QAT-14', 1), ('QAT-18', 1),
    ('QAT-5', 2), ('QAT-13', 2), ('QAT-16', 2), ('QAT-20', 2),

    -- ===== SUI =====
    ('SUI-2', 1), ('SUI-3', 1), ('SUI-4', 1), ('SUI-6', 1), ('SUI-7', 1), ('SUI-10', 1), ('SUI-14', 1), ('SUI-15', 1),
    ('SUI-17', 1), ('SUI-18', 1), ('SUI-20', 1),
    ('SUI-5', 2), ('SUI-8', 2), ('SUI-9', 2), ('SUI-12', 2), ('SUI-16', 2),
    ('SUI-11', 5),

    -- ===== BRA =====
    ('BRA-3', 1), ('BRA-4', 1), ('BRA-6', 1), ('BRA-8', 1), ('BRA-9', 1), ('BRA-10', 1), ('BRA-15', 1), ('BRA-17', 1),
    ('BRA-18', 1),
    ('BRA-5', 2), ('BRA-7', 2), ('BRA-13', 2), ('BRA-19', 2),

    -- ===== MAR =====
    ('MAR-1', 1), ('MAR-4', 1), ('MAR-7', 1), ('MAR-8', 1), ('MAR-9', 1), ('MAR-11', 1), ('MAR-14', 1), ('MAR-16', 1),
    ('MAR-18', 1), ('MAR-20', 1),
    ('MAR-3', 2),

    -- ===== HAI =====
    ('HAI-1', 1), ('HAI-2', 1), ('HAI-3', 1), ('HAI-4', 1), ('HAI-5', 1), ('HAI-8', 1), ('HAI-9', 1), ('HAI-14', 1),
    ('HAI-17', 1), ('HAI-18', 1), ('HAI-19', 1), ('HAI-20', 1),

    -- ===== SCO =====
    ('SCO-2', 1), ('SCO-5', 1), ('SCO-6', 1), ('SCO-7', 1), ('SCO-8', 1), ('SCO-9', 1), ('SCO-10', 1), ('SCO-11', 1),
    ('SCO-12', 1), ('SCO-13', 1), ('SCO-14', 1), ('SCO-16', 1), ('SCO-17', 1), ('SCO-18', 1),
    ('SCO-3', 2),

    -- ===== USA =====
    ('USA-2', 1), ('USA-3', 1), ('USA-4', 1), ('USA-5', 1), ('USA-6', 1), ('USA-9', 1), ('USA-10', 1), ('USA-12', 1),
    ('USA-14', 1), ('USA-15', 1), ('USA-18', 1), ('USA-19', 1),
    ('USA-7', 2), ('USA-11', 2), ('USA-16', 2), ('USA-17', 2), ('USA-20', 2),

    -- ===== PAR =====
    ('PAR-4', 1), ('PAR-6', 1), ('PAR-7', 1), ('PAR-9', 1), ('PAR-10', 1), ('PAR-11', 1), ('PAR-14', 1), ('PAR-16', 1),
    ('PAR-20', 1),
    ('PAR-3', 2), ('PAR-5', 2), ('PAR-13', 2),

    -- ===== AUS =====
    ('AUS-1', 1), ('AUS-2', 1), ('AUS-8', 1), ('AUS-10', 1), ('AUS-11', 1), ('AUS-13', 1), ('AUS-15', 1), ('AUS-16', 1),
    ('AUS-17', 1), ('AUS-19', 1), ('AUS-20', 1),

    -- ===== TUR =====
    ('TUR-1', 1), ('TUR-3', 1), ('TUR-4', 1), ('TUR-5', 1), ('TUR-7', 1), ('TUR-8', 1), ('TUR-9', 1), ('TUR-12', 1),
    ('TUR-20', 1),
    ('TUR-2', 2), ('TUR-6', 2), ('TUR-13', 2), ('TUR-14', 2), ('TUR-15', 2), ('TUR-16', 2), ('TUR-17', 2),
    ('TUR-10', 3), ('TUR-11', 3), ('TUR-18', 3),

    -- ===== GER =====
    ('GER-2', 1), ('GER-5', 1), ('GER-6', 1), ('GER-7', 1), ('GER-9', 1), ('GER-11', 1), ('GER-14', 1), ('GER-16', 1),
    ('GER-18', 1), ('GER-19', 1), ('GER-20', 1),
    ('GER-3', 2), ('GER-8', 2), ('GER-10', 2),

    -- ===== CUW =====
    ('CUW-1', 1), ('CUW-6', 1), ('CUW-12', 1), ('CUW-13', 1),
    ('CUW-5', 2), ('CUW-7', 2), ('CUW-9', 2), ('CUW-14', 2), ('CUW-15', 2), ('CUW-16', 2), ('CUW-18', 2),

    -- ===== CIV =====
    ('CIV-1', 1), ('CIV-4', 1), ('CIV-7', 1), ('CIV-8', 1), ('CIV-9', 1), ('CIV-12', 1), ('CIV-14', 1),

    -- ===== ECU =====
    ('ECU-2', 1), ('ECU-3', 1), ('ECU-5', 1), ('ECU-7', 1), ('ECU-8', 1), ('ECU-10', 1), ('ECU-11', 1), ('ECU-12', 1),
    ('ECU-13', 1), ('ECU-15', 1), ('ECU-16', 1), ('ECU-17', 1), ('ECU-18', 1), ('ECU-20', 1),
    ('ECU-6', 2),
    ('ECU-19', 3),

    -- ===== NED =====
    ('NED-5', 1), ('NED-9', 1), ('NED-11', 1), ('NED-13', 1), ('NED-14', 1), ('NED-17', 1), ('NED-18', 1),
    ('NED-20', 2),

    -- ===== JPN =====
    ('JPN-2', 1), ('JPN-7', 1),
    ('JPN-3', 2), ('JPN-5', 2), ('JPN-6', 2), ('JPN-9', 2), ('JPN-10', 2),
    ('JPN-14', 2), ('JPN-15', 2), ('JPN-18', 2), ('JPN-19', 2),

    -- ===== SWE =====
    ('SWE-4', 1), ('SWE-6', 1), ('SWE-7', 1), ('SWE-9', 1), ('SWE-11', 1), ('SWE-13', 1), ('SWE-16', 1), ('SWE-17', 1),
    ('SWE-19', 1), ('SWE-20', 1),
    ('SWE-2', 2),
    ('SWE-3', 3),
    ('SWE-5', 4),

    -- ===== TUN =====
    ('TUN-2', 1), ('TUN-5', 1), ('TUN-9', 1), ('TUN-10', 1), ('TUN-12', 1), ('TUN-15', 1), ('TUN-17', 1), ('TUN-19', 1),
    ('TUN-20', 1),
    ('TUN-14', 3), ('TUN-16', 3), ('TUN-18', 3),
    ('TUN-11', 4),

    -- ===== BEL =====
    ('BEL-4', 1), ('BEL-8', 1), ('BEL-9', 1), ('BEL-10', 1), ('BEL-11', 1), ('BEL-13', 1), ('BEL-14', 1),
    ('BEL-6', 2), ('BEL-15', 2), ('BEL-16', 2), ('BEL-19', 2), ('BEL-20', 2),

    -- ===== EGY =====
    ('EGY-1', 1), ('EGY-2', 1), ('EGY-5', 1), ('EGY-6', 1), ('EGY-8', 1), ('EGY-9', 1), ('EGY-10', 1), ('EGY-12', 1),
    ('EGY-13', 1), ('EGY-14', 1), ('EGY-15', 1), ('EGY-18', 1),
    ('EGY-4', 2),

    -- ===== IRN =====
    ('IRN-3', 1), ('IRN-5', 1), ('IRN-9', 1), ('IRN-15', 1), ('IRN-16', 1), ('IRN-17', 1), ('IRN-20', 1),
    ('IRN-14', 2),

    -- ===== NZL =====
    ('NZL-1', 1), ('NZL-2', 1), ('NZL-3', 1), ('NZL-4', 1), ('NZL-6', 1), ('NZL-7', 1), ('NZL-8', 1), ('NZL-9', 1),
    ('NZL-10', 1), ('NZL-12', 1), ('NZL-13', 1), ('NZL-14', 1), ('NZL-16', 1), ('NZL-19', 1), ('NZL-20', 1),
    ('NZL-5', 2), ('NZL-11', 2),

    -- ===== ESP =====
    ('ESP-3', 1), ('ESP-4', 1), ('ESP-10', 1), ('ESP-16', 1), ('ESP-17', 1),
    ('ESP-12', 2), ('ESP-14', 2), ('ESP-18', 2),
    ('ESP-11', 3),

    -- ===== CPV =====
    ('CPV-1', 1), ('CPV-2', 1), ('CPV-3', 1), ('CPV-6', 1), ('CPV-10', 1), ('CPV-11', 1), ('CPV-13', 1), ('CPV-15', 1),
    ('CPV-17', 1), ('CPV-20', 1),
    ('CPV-4', 2), ('CPV-7', 2), ('CPV-8', 2), ('CPV-12', 2), ('CPV-16', 2),

    -- ===== KSA =====
    ('KSA-1', 1), ('KSA-3', 1), ('KSA-4', 1), ('KSA-5', 1), ('KSA-7', 1), ('KSA-8', 1), ('KSA-9', 1), ('KSA-10', 1),
    ('KSA-15', 1), ('KSA-19', 1),
    ('KSA-13', 2), ('KSA-14', 2), ('KSA-18', 2),

    -- ===== URU =====
    ('URU-2', 1), ('URU-3', 1), ('URU-4', 1), ('URU-5', 1), ('URU-6', 1), ('URU-7', 1), ('URU-9', 1), ('URU-11', 1),
    ('URU-12', 1), ('URU-15', 1), ('URU-19', 1),
    ('URU-14', 2), ('URU-18', 2),
    ('URU-16', 3),
    ('URU-20', 4),

    -- ===== FRA =====
    ('FRA-1', 1), ('FRA-3', 1), ('FRA-4', 1), ('FRA-5', 1), ('FRA-6', 1), ('FRA-10', 1), ('FRA-13', 1), ('FRA-15', 1),
    ('FRA-16', 1), ('FRA-17', 1), ('FRA-20', 1),
    ('FRA-2', 2), ('FRA-7', 2), ('FRA-9', 2), ('FRA-11', 2), ('FRA-14', 2),

    -- ===== SEN =====
    ('SEN-4', 1), ('SEN-5', 1), ('SEN-8', 1), ('SEN-9', 1), ('SEN-12', 1), ('SEN-13', 1), ('SEN-14', 1), ('SEN-15', 1),
    ('SEN-18', 1),
    ('SEN-3', 2), ('SEN-7', 2), ('SEN-11', 2), ('SEN-16', 2), ('SEN-17', 2), ('SEN-19', 2), ('SEN-20', 2),

    -- ===== IRQ =====
    ('IRQ-3', 1), ('IRQ-4', 1), ('IRQ-5', 1), ('IRQ-7', 1), ('IRQ-8', 1), ('IRQ-11', 1), ('IRQ-16', 1), ('IRQ-17', 1),
    ('IRQ-18', 1), ('IRQ-19', 1), ('IRQ-20', 1),
    ('IRQ-1', 2), ('IRQ-10', 2), ('IRQ-13', 2), ('IRQ-15', 2),
    ('IRQ-6', 3),

    -- ===== NOR =====
    ('NOR-1', 1), ('NOR-2', 1), ('NOR-3', 1), ('NOR-4', 1), ('NOR-6', 1), ('NOR-7', 1), ('NOR-8', 1), ('NOR-10', 1),
    ('NOR-11', 1), ('NOR-16', 1), ('NOR-19', 1),
    ('NOR-5', 2), ('NOR-9', 2), ('NOR-13', 2), ('NOR-14', 2), ('NOR-15', 2), ('NOR-18', 2), ('NOR-20', 2),

    -- ===== ARG =====
    ('ARG-2', 1), ('ARG-4', 1), ('ARG-7', 1), ('ARG-8', 1), ('ARG-9', 1), ('ARG-12', 1), ('ARG-14', 1), ('ARG-17', 1),
    ('ARG-18', 1), ('ARG-19', 1),
    ('ARG-13', 2),

    -- ===== ALG =====
    ('ALG-4', 1), ('ALG-7', 1), ('ALG-11', 1), ('ALG-12', 1), ('ALG-13', 1), ('ALG-14', 1), ('ALG-16', 1), ('ALG-17', 1),
    ('ALG-20', 1),
    ('ALG-8', 2),

    -- ===== AUT =====
    ('AUT-2', 1), ('AUT-4', 1), ('AUT-5', 1), ('AUT-7', 1), ('AUT-10', 1), ('AUT-12', 1), ('AUT-13', 1), ('AUT-19', 1),
    ('AUT-8', 2),

    -- ===== JOR =====
    ('JOR-5', 1), ('JOR-8', 1), ('JOR-10', 1), ('JOR-11', 1), ('JOR-14', 1), ('JOR-15', 1), ('JOR-16', 1), ('JOR-18', 1),
    ('JOR-20', 1),
    ('JOR-12', 2), ('JOR-17', 2),
    ('JOR-3', 3),

    -- ===== POR =====
    ('POR-3', 1), ('POR-5', 1), ('POR-6', 1), ('POR-7', 1), ('POR-9', 1), ('POR-10', 1), ('POR-11', 1), ('POR-12', 1),
    ('POR-14', 1), ('POR-15', 1), ('POR-17', 1), ('POR-18', 1), ('POR-19', 1), ('POR-20', 1),

    -- ===== COD =====
    ('COD-4', 1), ('COD-5', 1), ('COD-7', 1), ('COD-8', 1), ('COD-10', 1), ('COD-11', 1), ('COD-13', 1), ('COD-14', 1),
    ('COD-15', 1), ('COD-16', 1), ('COD-18', 1), ('COD-19', 1), ('COD-20', 1),
    ('COD-3', 2), ('COD-6', 2),

    -- ===== UZB =====
    ('UZB-2', 1), ('UZB-3', 1), ('UZB-6', 1), ('UZB-7', 1), ('UZB-10', 1), ('UZB-11', 1), ('UZB-12', 1), ('UZB-15', 1),
    ('UZB-16', 1), ('UZB-18', 1), ('UZB-19', 1),
    ('UZB-1', 2), ('UZB-5', 2), ('UZB-9', 2), ('UZB-14', 2), ('UZB-20', 2),
    ('UZB-17', 3),

    -- ===== COL =====
    ('COL-3', 1), ('COL-10', 1), ('COL-13', 1), ('COL-15', 1), ('COL-16', 1),
    ('COL-19', 2),

    -- ===== ENG =====
    ('ENG-2', 1), ('ENG-3', 1), ('ENG-4', 1), ('ENG-5', 1), ('ENG-6', 1), ('ENG-7', 1), ('ENG-8', 1), ('ENG-10', 1),
    ('ENG-15', 1), ('ENG-18', 1), ('ENG-19', 1), ('ENG-20', 1),
    ('ENG-13', 2),

    -- ===== CRO =====
    ('CRO-2', 1), ('CRO-3', 1), ('CRO-5', 1), ('CRO-6', 1), ('CRO-7', 1), ('CRO-10', 1), ('CRO-11', 1), ('CRO-12', 1),
    ('CRO-14', 1), ('CRO-16', 1), ('CRO-18', 1),
    ('CRO-13', 2), ('CRO-15', 2), ('CRO-19', 2), ('CRO-20', 2),

    -- ===== GHA =====
    ('GHA-1', 1), ('GHA-2', 1), ('GHA-6', 1), ('GHA-7', 1), ('GHA-8', 1), ('GHA-11', 1), ('GHA-12', 1), ('GHA-14', 1),
    ('GHA-15', 1), ('GHA-16', 1), ('GHA-17', 1), ('GHA-18', 1), ('GHA-19', 1), ('GHA-20', 1),
    ('GHA-3', 2), ('GHA-5', 2),

    -- ===== PAN =====
    ('PAN-7', 1), ('PAN-11', 1), ('PAN-13', 1), ('PAN-15', 1), ('PAN-16', 1), ('PAN-18', 1), ('PAN-19', 1),
    ('PAN-3', 2),
    ('PAN-5', 3), ('PAN-14', 3),
    ('PAN-9', 4)
  ) AS s(sticker_id, count);

  RAISE NOTICE 'LauraTanAndres listo. user_id=%, email=%, password=%', v_uid, v_email, v_password;
END $seed$;
