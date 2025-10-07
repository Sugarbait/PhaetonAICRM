import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function resetGuestLockout() {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'guest@guest.com')
      .eq('tenant_id', 'artlee')
      .single();

    if (!user) {
      console.error('Guest user not found');
      return;
    }

    console.log('Resetting lockout for:', user.email);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        login_attempts: 0,
        last_login_attempt: null
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error:', updateError);
    } else {
      console.log('✅ Database lockout cleared!');
    }

    console.log('');
    console.log('Now login with: guest@guest.com / Guest123');
    console.log('Also clear browser localStorage using the test page!');

  } catch (error) {
    console.error('Error:', error);
  }
}

resetGuestLockout();
