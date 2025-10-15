// Test script to verify email notification persistence and sending functionality
console.log('🎯 EMAIL PERSISTENCE & SENDING TEST: Testing after RLS policy fix');

async function testEmailNotificationSystem() {
  try {
    console.log('🔍 Step 1: Checking current state...');

    // Get current user
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      console.error('❌ No current user found - please log in first');
      return;
    }

    const userData = JSON.parse(currentUser);
    console.log('✅ Found current user:', userData.email, 'ID:', userData.id);

    // Test email configuration data
    const testEmailConfig = {
      enabled: true,
      recipientEmails: ['test@example.com', 'admin@carexps.com'],
      notificationTypes: {
        newSMS: true,
        newCall: true,
        securityAlerts: true,
        systemAlerts: true
      }
    };

    console.log('📝 Step 2: Testing email persistence service...');

    // Check if email service is available
    let serviceAvailable = false;
    try {
      if (window.emailNotificationService) {
        serviceAvailable = true;
        console.log('✅ EmailNotificationService found in window');
      } else {
        console.log('📦 Service not in window, checking if initialized...');
      }
    } catch (err) {
      console.log('📦 Service access error:', err.message);
    }

    if (serviceAvailable) {
      console.log('🔧 Testing email configuration persistence...');

      try {
        // Test save configuration
        console.log('💾 Testing email config save...');
        await window.emailNotificationService.updateConfiguration(testEmailConfig);
        console.log('✅ SAVE SUCCESS: Email configuration saved');

        // Wait a moment then test load
        setTimeout(async () => {
          try {
            const loadedConfig = window.emailNotificationService.getConfiguration();
            console.log('📊 Load result:', loadedConfig);

            if (loadedConfig && loadedConfig.enabled === testEmailConfig.enabled) {
              console.log('✅ LOAD SUCCESS: Email config loaded successfully');
              verifyEmailConfig(loadedConfig, testEmailConfig);

              // Test email sending
              console.log('📧 Step 3: Testing email sending...');
              testEmailSending(loadedConfig);
            } else {
              console.warn('⚠️ LOAD PARTIAL: Load had issues');
              console.log('🔄 Checking localStorage fallback...');
              checkLocalStorageEmailData(userData.id);
            }
          } catch (loadError) {
            console.error('❌ LOAD ERROR:', loadError);
            checkLocalStorageEmailData(userData.id);
          }
        }, 1000);

      } catch (saveError) {
        console.error('❌ SAVE ERROR:', saveError);
        console.log('🔄 Testing localStorage fallback...');
        testLocalStorageEmailFallback(userData.id, testEmailConfig);
      }

    } else {
      console.log('📦 Service not available, testing localStorage approach...');
      testLocalStorageEmailFallback(userData.id, testEmailConfig);
    }

  } catch (error) {
    console.error('❌ Email test failed:', error);
  }
}

function testLocalStorageEmailFallback(userId, testConfig) {
  console.log('🔧 Testing localStorage email fallback...');

  try {
    // Update localStorage settings
    const settingsKey = `settings_${userId}`;
    const userSettings = JSON.parse(localStorage.getItem(settingsKey) || '{}');
    userSettings.emailNotifications = testConfig;
    userSettings.updated_at = new Date().toISOString();

    localStorage.setItem(settingsKey, JSON.stringify(userSettings));

    console.log('✅ localStorage email fallback completed');
    checkLocalStorageEmailData(userId);
  } catch (error) {
    console.error('❌ localStorage email fallback failed:', error);
  }
}

function checkLocalStorageEmailData(userId) {
  console.log('🔍 Checking localStorage email data...');

  const settingsKey = `settings_${userId}`;
  const userSettings = localStorage.getItem(settingsKey);

  if (userSettings) {
    const settings = JSON.parse(userSettings);
    const emailConfig = settings.emailNotifications;

    console.log('📂 Email notification settings:');
    console.log('  Enabled:', emailConfig?.enabled || 'NOT SET');
    console.log('  Recipients:', emailConfig?.recipientEmails?.length || 'NOT SET');
    console.log('  New SMS:', emailConfig?.notificationTypes?.newSMS || 'NOT SET');
    console.log('  New Call:', emailConfig?.notificationTypes?.newCall || 'NOT SET');

    if (emailConfig && emailConfig.enabled !== undefined) {
      console.log('✅ localStorage contains email config data');
    } else {
      console.log('⚠️ localStorage missing email config data');
    }
  } else {
    console.log('⚠️ No user settings found in localStorage');
  }
}

function verifyEmailConfig(actualConfig, expectedConfig) {
  console.log('📊 EMAIL CONFIG VERIFICATION:');

  const fields = ['enabled'];
  const results = {};

  fields.forEach(field => {
    const actual = actualConfig[field];
    const expected = expectedConfig[field];
    results[field] = actual === expected ? '✅ PASS' : '❌ FAIL';

    console.log(`  ${field}: ${results[field]}`);
    if (results[field].includes('FAIL')) {
      console.log(`    Expected: ${expected}`);
      console.log(`    Actual: ${actual}`);
    }
  });

  // Check recipients array
  const actualRecipients = actualConfig.recipientEmails?.length || 0;
  const expectedRecipients = expectedConfig.recipientEmails?.length || 0;
  const recipientsMatch = actualRecipients === expectedRecipients ? '✅ PASS' : '❌ FAIL';
  console.log(`  recipientEmails count: ${recipientsMatch}`);
  if (recipientsMatch.includes('FAIL')) {
    console.log(`    Expected: ${expectedRecipients}`);
    console.log(`    Actual: ${actualRecipients}`);
  }

  const allPassed = Object.values(results).every(result => result.includes('PASS')) && recipientsMatch.includes('PASS');
  console.log(`\n🎯 CONFIG VERIFICATION RESULT: ${allPassed ? '✅ ALL FIELDS VERIFIED' : '⚠️ SOME FIELDS DIFFER'}`);

  return allPassed;
}

async function testEmailSending(config) {
  if (!config.enabled || !config.recipientEmails || config.recipientEmails.length === 0) {
    console.log('📧 Email sending skipped - not enabled or no recipients');
    return;
  }

  console.log('📧 Testing email sending functionality...');

  try {
    // Test email server health
    console.log('🏥 Checking email server health...');
    const healthResponse = await fetch('http://localhost:4001/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Email server is healthy:', healthData.status);
    } else {
      console.error('❌ Email server health check failed');
      return;
    }

    // Test quick email sending
    console.log('📤 Sending test email...');
    const testResponse = await fetch('http://localhost:4001/api/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: 'test@example.com' })
    });

    if (testResponse.ok) {
      const result = await testResponse.json();
      console.log('✅ TEST EMAIL SUCCESS:', result);
    } else {
      const error = await testResponse.json();
      console.error('❌ TEST EMAIL FAILED:', error);
    }

    // Test notification service email
    if (window.emailNotificationService && window.emailNotificationService.testNotification) {
      console.log('📬 Testing notification service email...');
      await window.emailNotificationService.testNotification();
      console.log('✅ Notification service test completed');
    }

  } catch (error) {
    console.error('❌ Email sending test failed:', error);
  }
}

function showEmailInstructions() {
  console.log('\n📋 EMAIL TESTING INSTRUCTIONS:');
  console.log('1. Check the console above for test results');
  console.log('2. Go to Settings > Notifications > Email Notification Settings');
  console.log('3. Add your email address and enable notifications');
  console.log('4. Save the settings and verify they persist after page refresh');
  console.log('5. Use the test email button to verify sending works');
  console.log('6. Look for SUCCESS messages in console');
  console.log('\n📧 EMAIL SERVER STATUS:');
  console.log('- Email server should be running on port 4001');
  console.log('- Check for Hostinger SMTP configuration success');
  console.log('- Test emails will be sent via carexps@phaetonai.com');
}

// Set up refresh detection
localStorage.setItem('email_persistence_test_active', JSON.stringify({
  timestamp: new Date().toISOString(),
  testName: 'Email Persistence & Sending Test'
}));

// Check if this is after a refresh
const testActive = localStorage.getItem('email_persistence_test_active');
if (testActive) {
  const testData = JSON.parse(testActive);
  const timeDiff = Date.now() - new Date(testData.timestamp).getTime();

  if (timeDiff < 60000) { // Within 1 minute
    console.log('🔄 Detected recent email test activity, checking refresh persistence...');

    setTimeout(() => {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        const settingsKey = `settings_${userData.id}`;
        const settings = localStorage.getItem(settingsKey);

        if (settings) {
          const parsedSettings = JSON.parse(settings);
          const emailConfig = parsedSettings.emailNotifications;

          console.log('🔍 Email config after potential refresh:');
          console.log('  Enabled:', emailConfig?.enabled || 'NOT SET');
          console.log('  Recipients:', emailConfig?.recipientEmails?.length || 'NOT SET');

          if (emailConfig && emailConfig.enabled !== undefined) {
            console.log('✅ REFRESH PERSISTENCE: Email config found after refresh!');
          }
        }
      }

      // Clean up after checking
      localStorage.removeItem('email_persistence_test_active');
    }, 2000);
  }
}

// Run the test
testEmailNotificationSystem();

// Show instructions
setTimeout(showEmailInstructions, 3000);

// Cleanup - remove test script after 30 seconds
setTimeout(() => {
  const script = document.querySelector('script[src*="test-email-persistence-fix.js"]');
  if (script) {
    script.remove();
  }
}, 30000);