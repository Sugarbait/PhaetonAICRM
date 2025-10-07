-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Super users can see all users across devices
CREATE POLICY "super_users_can_see_all_users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users current_user
      WHERE current_user.id = auth.uid()
      AND current_user.role = 'admin'
      AND current_user.is_active = true
    )
  );

-- Policy: Super users can insert new users
CREATE POLICY "super_users_can_insert_users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users current_user
      WHERE current_user.id = auth.uid()
      AND current_user.role = 'admin'
      AND current_user.is_active = true
    )
  );

-- Policy: Super users can update users
CREATE POLICY "super_users_can_update_users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users current_user
      WHERE current_user.id = auth.uid()
      AND current_user.role = 'admin'
      AND current_user.is_active = true
    )
  );

-- Policy: Super users can delete users (except themselves)
CREATE POLICY "super_users_can_delete_users" ON users
  FOR DELETE USING (
    id != auth.uid() -- Cannot delete self
    AND EXISTS (
      SELECT 1 FROM users current_user
      WHERE current_user.id = auth.uid()
      AND current_user.role = 'admin'
      AND current_user.is_active = true
    )
  );

-- Policy: Users can see their own profile
CREATE POLICY "users_can_see_own_profile" ON users
  FOR SELECT USING (id = auth.uid());

-- Policy: Users can update their own profile
CREATE POLICY "users_can_update_own_profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- Enable RLS on user_settings table
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Super users can see all user settings for cross-device sync
CREATE POLICY "super_users_can_see_all_settings" ON user_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users current_user
      WHERE current_user.id = auth.uid()
      AND current_user.role = 'admin'
      AND current_user.is_active = true
    )
  );

-- Policy: Users can manage their own settings
CREATE POLICY "users_can_manage_own_settings" ON user_settings
  FOR ALL USING (user_id = auth.uid());

-- Policy: Super users can manage all user settings
CREATE POLICY "super_users_can_manage_all_settings" ON user_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users current_user
      WHERE current_user.id = auth.uid()
      AND current_user.role = 'admin'
      AND current_user.is_active = true
    )
  );

-- Enable RLS on cross_device_sync_events table
ALTER TABLE cross_device_sync_events ENABLE ROW LEVEL SECURITY;

-- Policy: Super users can see all sync events for monitoring
CREATE POLICY "super_users_can_see_all_sync_events" ON cross_device_sync_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users current_user
      WHERE current_user.id = auth.uid()
      AND current_user.role = 'admin'
      AND current_user.is_active = true
    )
  );

-- Policy: Users can see their own sync events
CREATE POLICY "users_can_see_own_sync_events" ON cross_device_sync_events
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can create sync events for their own actions
CREATE POLICY "users_can_create_own_sync_events" ON cross_device_sync_events
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Comments for documentation
COMMENT ON POLICY "super_users_can_see_all_users" ON users IS 'Allows super users (admins) to view all users across devices for user management';
COMMENT ON POLICY "super_users_can_insert_users" ON users IS 'Allows super users to create new users';
COMMENT ON POLICY "super_users_can_update_users" ON users IS 'Allows super users to update any user profile';
COMMENT ON POLICY "super_users_can_delete_users" ON users IS 'Allows super users to delete users (except themselves)';
COMMENT ON POLICY "users_can_see_own_profile" ON users IS 'Users can view their own profile information';
COMMENT ON POLICY "users_can_update_own_profile" ON users IS 'Users can update their own profile information';