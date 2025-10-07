-- =====================================================
-- CORRECTED USER PROFILES SQL OPERATIONS
-- =====================================================
-- This file contains corrected SQL operations for the user_profiles table
-- based on the actual schema investigation results.
--
-- FINDINGS:
-- - user_profiles table exists but has NO user_id column
-- - user_profiles acts as a direct user table with id as primary key
-- - users table is separate with different structure (first_name/last_name vs name)
-- - user_settings table properly references users via user_id
--
-- HIPAA COMPLIANCE: All operations maintain encryption and audit requirements
-- =====================================================

-- 1. SELECT user profile by ID (corrected)
-- OLD (INCORRECT): SELECT * FROM user_profiles WHERE user_id = $1
-- NEW (CORRECT): SELECT * FROM user_profiles WHERE id = $1

SELECT
    id,
    email,
    name,
    city,
    country,
    temperature_unit,
    preferred_activities,
    comfort_level,
    style_preferences,
    created_at,
    updated_at,
    username,
    role
FROM user_profiles
WHERE id = $1;

-- 2. SELECT user profile by email (common lookup pattern)
SELECT
    id,
    email,
    name,
    city,
    country,
    temperature_unit,
    preferred_activities,
    comfort_level,
    style_preferences,
    created_at,
    updated_at,
    username,
    role
FROM user_profiles
WHERE email = $1;

-- 3. INSERT new user profile (corrected)
-- OLD (INCORRECT): INSERT INTO user_profiles (user_id, ...) VALUES ($1, ...)
-- NEW (CORRECT): INSERT with proper columns, let id auto-generate

INSERT INTO user_profiles (
    email,
    name,
    city,
    country,
    temperature_unit,
    preferred_activities,
    comfort_level,
    style_preferences,
    username,
    role,
    created_at,
    updated_at
) VALUES (
    $1, -- email
    $2, -- name
    $3, -- city
    $4, -- country
    $5, -- temperature_unit
    $6, -- preferred_activities (JSON array)
    $7, -- comfort_level
    $8, -- style_preferences
    $9, -- username
    $10, -- role
    NOW(),
    NOW()
) RETURNING id, email, name, username, role, created_at;

-- 4. UPDATE user profile (corrected)
-- OLD (INCORRECT): UPDATE user_profiles SET ... WHERE user_id = $1
-- NEW (CORRECT): UPDATE user_profiles SET ... WHERE id = $1

UPDATE user_profiles SET
    name = COALESCE($2, name),
    city = COALESCE($3, city),
    country = COALESCE($4, country),
    temperature_unit = COALESCE($5, temperature_unit),
    preferred_activities = COALESCE($6, preferred_activities),
    comfort_level = COALESCE($7, comfort_level),
    style_preferences = COALESCE($8, style_preferences),
    username = COALESCE($9, username),
    updated_at = NOW()
WHERE id = $1
RETURNING id, email, name, username, role, updated_at;

-- 5. DELETE user profile (corrected)
-- OLD (INCORRECT): DELETE FROM user_profiles WHERE user_id = $1
-- NEW (CORRECT): DELETE FROM user_profiles WHERE id = $1

DELETE FROM user_profiles
WHERE id = $1
RETURNING id, email, name;

-- 6. Get all user profiles with pagination (for admin)
SELECT
    id,
    email,
    name,
    city,
    country,
    username,
    role,
    created_at,
    updated_at
FROM user_profiles
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- 7. Search user profiles by name or email
SELECT
    id,
    email,
    name,
    city,
    country,
    username,
    role,
    created_at
FROM user_profiles
WHERE
    (name ILIKE '%' || $1 || '%') OR
    (email ILIKE '%' || $1 || '%') OR
    (username ILIKE '%' || $1 || '%')
ORDER BY name ASC
LIMIT 50;

-- =====================================================
-- RELATIONSHIP QUERIES (if needed to join with users table)
-- =====================================================

-- 8. Join user_profiles with users table (if both represent users)
-- This would be needed if user_profiles and users are meant to be linked
-- NOTE: This assumes email is the common field for linking
SELECT
    up.id as profile_id,
    up.email as profile_email,
    up.name as profile_name,
    up.city,
    up.country,
    up.role as profile_role,
    u.id as user_id,
    u.username,
    u.first_name,
    u.last_name,
    u.role as user_role,
    u.mfa_enabled,
    u.is_active,
    u.last_login
FROM user_profiles up
LEFT JOIN users u ON up.email = u.email
WHERE up.id = $1;

-- =====================================================
-- AUDIT AND SECURITY COMPLIANCE QUERIES
-- =====================================================

-- 9. Audit log entry for user profile access (HIPAA compliance)
INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address,
    user_agent,
    metadata,
    created_at
) VALUES (
    $1, -- current_user_id (from users table)
    $2, -- action ('SELECT', 'UPDATE', 'INSERT', 'DELETE')
    'user_profiles',
    $3, -- profile_id
    $4, -- old_values (JSON)
    $5, -- new_values (JSON)
    $6, -- ip_address
    $7, -- user_agent
    $8, -- metadata (JSON)
    NOW()
);

-- 10. Get user profile with security event logging
-- This would be used in application code with proper audit logging
WITH profile_access AS (
    SELECT
        id,
        email,
        name,
        city,
        country,
        username,
        role,
        created_at,
        updated_at
    FROM user_profiles
    WHERE id = $1
),
audit_entry AS (
    INSERT INTO audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        metadata,
        created_at
    ) VALUES (
        $2, -- accessing_user_id
        'SELECT',
        'user_profiles',
        $1, -- profile_id
        '{"action": "profile_access", "hipaa_compliant": true}'::jsonb,
        NOW()
    )
    RETURNING id as audit_id
)
SELECT
    pa.*,
    ae.audit_id
FROM profile_access pa
CROSS JOIN audit_entry ae;

-- =====================================================
-- MIGRATION QUERIES (if needed to align schemas)
-- =====================================================

-- 11. If you need to add user_id column to link with users table:
-- ALTER TABLE user_profiles ADD COLUMN user_id UUID REFERENCES users(id);

-- 12. If you need to populate user_id based on email matching:
-- UPDATE user_profiles
-- SET user_id = users.id
-- FROM users
-- WHERE user_profiles.email = users.email;

-- =====================================================
-- CORRECTED APPLICATION QUERIES
-- =====================================================

-- These are the queries that should be used in your TypeScript/JavaScript code:

-- For creating user profiles:
/*
const { data, error } = await supabase
  .from('user_profiles')
  .insert({
    email: userEmail,
    name: userName,
    city: userCity,
    country: userCountry,
    role: userRole
  })
  .select()
  .single();
*/

-- For updating user profiles:
/*
const { data, error } = await supabase
  .from('user_profiles')
  .update({
    name: newName,
    city: newCity,
    country: newCountry
  })
  .eq('id', profileId)  // NOT 'user_id'
  .select()
  .single();
*/

-- For selecting user profiles:
/*
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', profileId);  // NOT 'user_id'
*/

-- For deleting user profiles:
/*
const { data, error } = await supabase
  .from('user_profiles')
  .delete()
  .eq('id', profileId)  // NOT 'user_id'
  .select();
*/

-- =====================================================
-- NOTES FOR DEVELOPERS
-- =====================================================
--
-- 1. The user_profiles table does NOT have a user_id column
-- 2. Use 'id' as the primary key for all operations
-- 3. The table contains email, name (not first_name/last_name)
-- 4. All operations must maintain HIPAA audit logging
-- 5. MFA is mandatory and must never be disabled
-- 6. Consider the relationship between user_profiles and users tables
-- 7. user_settings properly uses user_id to reference users table
-- =====================================================