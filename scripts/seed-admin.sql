-- ─────────────────────────────────────────────────────────────────────────────
-- ADMIN PORTAL TEST SEED
-- Password for all users: Admin@123
-- Hash generated with bcrypt cost factor 12
-- Run this after running your schema migrations
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Seed permissions (mirrors the Permission enum)
INSERT INTO permissions (id, key, "group") VALUES
  (gen_random_uuid(), 'CREATE_USER',           'User'),
  (gen_random_uuid(), 'VIEW_USER',             'User'),
  (gen_random_uuid(), 'UPDATE_USER',           'User'),
  (gen_random_uuid(), 'DELETE_USER',           'User'),
  (gen_random_uuid(), 'CREATE_ROLE',           'Role'),
  (gen_random_uuid(), 'VIEW_ROLE',             'Role'),
  (gen_random_uuid(), 'UPDATE_ROLE',           'Role'),
  (gen_random_uuid(), 'DELETE_ROLE',           'Role'),
  (gen_random_uuid(), 'CREATE_SYSTEM_USER',    'SystemUser'),
  (gen_random_uuid(), 'VIEW_SYSTEM_USER',      'SystemUser'),
  (gen_random_uuid(), 'UPDATE_SYSTEM_USER',    'SystemUser'),
  (gen_random_uuid(), 'DELETE_SYSTEM_USER',    'SystemUser'),
  (gen_random_uuid(), 'CREATE_TURF',           'Turf'),
  (gen_random_uuid(), 'VIEW_TURF',             'Turf'),
  (gen_random_uuid(), 'UPDATE_TURF',           'Turf'),
  (gen_random_uuid(), 'DELETE_TURF',           'Turf'),
  (gen_random_uuid(), 'CREATE_TEAM',           'Team'),
  (gen_random_uuid(), 'VIEW_TEAM',             'Team'),
  (gen_random_uuid(), 'UPDATE_TEAM',           'Team'),
  (gen_random_uuid(), 'DELETE_TEAM',           'Team'),
  (gen_random_uuid(), 'CREATE_TOURNAMENT',     'Tournament'),
  (gen_random_uuid(), 'VIEW_TOURNAMENT',       'Tournament'),
  (gen_random_uuid(), 'UPDATE_TOURNAMENT',     'Tournament'),
  (gen_random_uuid(), 'DELETE_TOURNAMENT',     'Tournament'),
  (gen_random_uuid(), 'CREATE_MATCH',          'Match'),
  (gen_random_uuid(), 'VIEW_MATCH',            'Match'),
  (gen_random_uuid(), 'UPDATE_MATCH',          'Match'),
  (gen_random_uuid(), 'DELETE_MATCH',          'Match'),
  (gen_random_uuid(), 'VIEW_PAYMENT',          'Payment'),
  (gen_random_uuid(), 'REFUND_PAYMENT',        'Payment'),
  (gen_random_uuid(), 'EXPORT_PAYMENT',        'Payment'),
  (gen_random_uuid(), 'VIEW_CHALLENGE',        'Challenge'),
  (gen_random_uuid(), 'UPDATE_CHALLENGE',      'Challenge'),
  (gen_random_uuid(), 'CREATE_REPORT',         'Report'),
  (gen_random_uuid(), 'VIEW_REPORT',           'Report'),
  (gen_random_uuid(), 'UPDATE_REPORT',         'Report'),
  (gen_random_uuid(), 'DASHBOARD_CLIENTS',     'Dashboard'),
  (gen_random_uuid(), 'DASHBOARD_TRANSACTIONS','Dashboard'),
  (gen_random_uuid(), 'DASHBOARD_ANALYTICS',  'Dashboard'),
  (gen_random_uuid(), 'VIEW_SYSTEM_LOG',       'SystemLog'),
  (gen_random_uuid(), 'SUPER_ADMIN',           'Admin')
ON CONFLICT (key) DO NOTHING;


-- 2. Seed system roles
INSERT INTO system_roles (id, name, description, is_default) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Super Admin',      'Full unrestricted access to all system features.', false),
  ('00000000-0000-0000-0000-000000000002', 'Match Manager',    'Can create and manage matches, turfs, and tournaments.', false),
  ('00000000-0000-0000-0000-000000000003', 'Finance Officer',  'Read-only access to payments and financial reports.', false),
  ('00000000-0000-0000-0000-000000000004', 'Content Manager',  'Manages turfs, teams, and public-facing content.', false),
  ('00000000-0000-0000-0000-000000000005', 'Read Only',        'View-only access across all modules.', true)
ON CONFLICT (name) DO NOTHING;


-- 3. Assign SUPER_ADMIN permission to the Super Admin role
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id
FROM permissions p
WHERE p.key = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- Assign all dashboard + match + tournament + turf + challenge permissions to Match Manager
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000002', p.id
FROM permissions p
WHERE p.key IN (
  'CREATE_MATCH','VIEW_MATCH','UPDATE_MATCH','DELETE_MATCH',
  'CREATE_TOURNAMENT','VIEW_TOURNAMENT','UPDATE_TOURNAMENT',
  'VIEW_TURF','UPDATE_TURF',
  'DASHBOARD_ANALYTICS',
  'VIEW_CHALLENGE','UPDATE_CHALLENGE'
)
ON CONFLICT DO NOTHING;

-- Finance Officer
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000003', p.id
FROM permissions p
WHERE p.key IN (
  'VIEW_PAYMENT','REFUND_PAYMENT','EXPORT_PAYMENT',
  'VIEW_REPORT','DASHBOARD_TRANSACTIONS'
)
ON CONFLICT DO NOTHING;

-- Content Manager
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000004', p.id
FROM permissions p
WHERE p.key IN (
  'CREATE_TURF','VIEW_TURF','UPDATE_TURF',
  'VIEW_TEAM','UPDATE_TEAM',
  'VIEW_TOURNAMENT','VIEW_MATCH',
  'DASHBOARD_CLIENTS'
)
ON CONFLICT DO NOTHING;

-- Read Only
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000005', p.id
FROM permissions p
WHERE p.key IN (
  'VIEW_USER','VIEW_TURF','VIEW_TEAM','VIEW_TOURNAMENT',
  'VIEW_MATCH','VIEW_PAYMENT','VIEW_REPORT',
  'DASHBOARD_CLIENTS','DASHBOARD_TRANSACTIONS'
)
ON CONFLICT DO NOTHING;


-- 4. Seed test system users
-- Password for all: Admin@123
-- Hash: $2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- (standard bcrypt test hash — replace with your own generated hash in production)

INSERT INTO system_users (id, name, email, password, status, role_id) VALUES
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Super Admin',
    'superadmin@mkrsports.com',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'active',
    '00000000-0000-0000-0000-000000000001'  -- Super Admin role
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    'Match Manager',
    'matchmanager@mkrsports.com',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'active',
    '00000000-0000-0000-0000-000000000002'  -- Match Manager role
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000003',
    'Finance Officer',
    'finance@mkrsports.com',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'active',
    '00000000-0000-0000-0000-000000000003'  -- Finance Officer role
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000004',
    'Read Only User',
    'readonly@mkrsports.com',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'active',
    '00000000-0000-0000-0000-000000000005'  -- Read Only role
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000005',
    'Suspended User',
    'suspended@mkrsports.com',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'suspended',  -- should be blocked at login
    '00000000-0000-0000-0000-000000000005'
  )
ON CONFLICT (email) DO NOTHING;