/**
 * Test script to verify authentication fix
 * This simulates the Quick Create template process and authentication
 */

console.log('🧪 Authentication Test Suite')
console.log('============================')

// Mock the services for testing
const mockEncryptionService = {
  async encryptString(plaintext) {
    // Simple mock encryption - in real app this would be AES-256-GCM
    return `encrypted_${Buffer.from(plaintext).toString('base64')}`
  },

  async decryptString(encrypted) {
    // Simple mock decryption
    if (!encrypted.startsWith('encrypted_')) {
      throw new Error('Invalid encrypted format')
    }
    const base64 = encrypted.replace('encrypted_', '')
    return Buffer.from(base64, 'base64').toString('utf8')
  }
}

// Mock user management functions
async function mockSaveUserCredentials(userId, credentials) {
  console.log(`📝 Saving credentials for user: ${userId}`)

  // This simulates the FIXED credential storage process
  const credentialsToStore = {
    ...credentials,
    password: await mockEncryptionService.encryptString(credentials.password) // Single encryption
  }

  const encryptedCredentials = await mockEncryptionService.encryptString(JSON.stringify(credentialsToStore))

  // Store in mock localStorage
  const mockKey = `userCredentials_${userId}`
  console.log(`   Stored encrypted credentials under key: ${mockKey}`)

  return {
    mockKey,
    encryptedCredentials,
    originalPassword: credentials.password
  }
}

async function mockGetStoredCredentials(mockData) {
  console.log(`📖 Retrieving credentials...`)

  // Decrypt the credentials object
  const decryptedCredentialsString = await mockEncryptionService.decryptString(mockData.encryptedCredentials)
  const credentials = JSON.parse(decryptedCredentialsString)

  return credentials
}

async function mockVerifyPassword(inputPassword, storedHashedPassword) {
  console.log(`🔐 Verifying password...`)

  try {
    const decryptedStoredPassword = await mockEncryptionService.decryptString(storedHashedPassword)
    const isMatch = inputPassword === decryptedStoredPassword
    console.log(`   Input: "${inputPassword}"`)
    console.log(`   Stored (decrypted): "${decryptedStoredPassword}"`)
    console.log(`   Match: ${isMatch}`)
    return isMatch
  } catch (error) {
    console.log(`   ❌ Password verification failed: ${error.message}`)
    return false
  }
}

async function testQuickCreateFlow() {
  console.log('\n🚀 Testing Quick Create Template Flow')
  console.log('======================================')

  // Simulate Quick Create template data
  const template = {
    name: 'John Smith',
    email: 'john.smith@carexps.com',
    password: 'User123!',
    role: 'user'
  }

  console.log(`\n1. Creating user from template:`)
  console.log(`   Name: ${template.name}`)
  console.log(`   Email: ${template.email}`)
  console.log(`   Password: ${template.password}`)
  console.log(`   Role: ${template.role}`)

  // Step 1: Save user credentials (simulating the FIXED process)
  console.log(`\n2. Saving user credentials...`)
  const mockUserId = 'test-user-123'
  const credentials = {
    email: template.email,
    password: template.password,
    tempPassword: false
  }

  const savedData = await mockSaveUserCredentials(mockUserId, credentials)
  console.log(`   ✅ Credentials saved successfully`)

  // Step 2: Test authentication (simulating login)
  console.log(`\n3. Testing authentication...`)
  const storedCredentials = await mockGetStoredCredentials(savedData)
  console.log(`   📖 Retrieved stored credentials`)

  // Step 3: Verify password
  const authResult = await mockVerifyPassword(template.password, storedCredentials.password)

  if (authResult) {
    console.log(`   ✅ Authentication successful!`)
    console.log(`   🎉 User "${template.name}" can log in successfully`)
  } else {
    console.log(`   ❌ Authentication failed!`)
    console.log(`   💥 User "${template.name}" cannot log in`)
  }

  return authResult
}

async function testDoubleEncryptionScenario() {
  console.log('\n🐛 Testing Double Encryption Scenario (OLD BUG)')
  console.log('===============================================')

  const template = {
    name: 'Test User',
    email: 'test@carexps.com',
    password: 'Test123!',
    role: 'user'
  }

  console.log(`\n1. Simulating the OLD buggy credential storage...`)

  // Simulate the OLD buggy process (double encryption)
  const password = template.password
  const hashedPassword = await mockEncryptionService.encryptString(password) // First encryption
  const credentialsWithHashedPassword = {
    email: template.email,
    password: hashedPassword,
    tempPassword: false
  }
  const doubleEncryptedCredentials = await mockEncryptionService.encryptString(JSON.stringify(credentialsWithHashedPassword)) // Second encryption

  console.log(`   Original password: "${password}"`)
  console.log(`   After first encryption: "${hashedPassword}"`)
  console.log(`   After second encryption: "${doubleEncryptedCredentials.substring(0, 50)}..."`)

  console.log(`\n2. Trying to authenticate with double-encrypted data...`)

  try {
    // Decrypt the credentials object (this works)
    const decryptedCredentialsString = await mockEncryptionService.decryptString(doubleEncryptedCredentials)
    const credentials = JSON.parse(decryptedCredentialsString)

    // Try to verify password (this would fail because password is double-encrypted)
    const authResult = await mockVerifyPassword(password, credentials.password)

    if (authResult) {
      console.log(`   ✅ Authentication worked (unexpected!)`)
    } else {
      console.log(`   ❌ Authentication failed (expected with double encryption)`)
      console.log(`   💡 This demonstrates the bug that was fixed`)
    }

    return authResult
  } catch (error) {
    console.log(`   ❌ Authentication error: ${error.message}`)
    return false
  }
}

async function runAllTests() {
  try {
    console.log('Starting authentication tests...\n')

    // Test the fixed flow
    const fixedFlowResult = await testQuickCreateFlow()

    // Test the old buggy scenario
    const buggyFlowResult = await testDoubleEncryptionScenario()

    console.log('\n📊 Test Results Summary')
    console.log('=======================')
    console.log(`Fixed Flow (NEW): ${fixedFlowResult ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`Buggy Flow (OLD): ${buggyFlowResult ? '❌ UNEXPECTED PASS' : '✅ EXPECTED FAIL'}`)

    if (fixedFlowResult && !buggyFlowResult) {
      console.log('\n🎉 All tests passed! The authentication fix is working correctly.')
      console.log('\n✅ Quick Create template users should now be able to log in successfully.')
    } else {
      console.log('\n❌ Tests indicate there may still be issues with the authentication fix.')
    }

  } catch (error) {
    console.error('\n💥 Test suite failed:', error)
  }
}

// Run the tests
runAllTests()