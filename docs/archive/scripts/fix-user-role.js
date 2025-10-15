// Fix User Role to Super User - Run in Console
console.log('🔧 Fixing user role from Admin to Super User...')

const currentUser = localStorage.getItem('currentUser')
if (currentUser) {
  const userData = JSON.parse(currentUser)

  console.log('📋 Current role:', userData.role)

  // Update to Super User
  userData.role = 'Super User'

  // Update currentUser in localStorage
  localStorage.setItem('currentUser', JSON.stringify(userData))
  console.log('✅ Updated currentUser role to Super User')

  // Update systemUsers array
  const systemUsers = localStorage.getItem('systemUsers')
  if (systemUsers) {
    const users = JSON.parse(systemUsers)
    const userIndex = users.findIndex(u => u.id === userData.id)
    if (userIndex !== -1) {
      users[userIndex].role = 'Super User'
      localStorage.setItem('systemUsers', JSON.stringify(users))
      console.log('✅ Updated systemUsers role to Super User')
    }
  }

  // Update allUserProfiles
  const allProfiles = localStorage.getItem('allUserProfiles')
  if (allProfiles) {
    const profiles = JSON.parse(allProfiles)
    if (profiles[userData.id]) {
      profiles[userData.id].role = 'Super User'
      localStorage.setItem('allUserProfiles', JSON.stringify(profiles))
      console.log('✅ Updated allUserProfiles role to Super User')
    }
  }

  console.log('🎉 Role fixed! Refresh the page to see Super User role.')
  console.log('📌 Your role is now: Super User')

} else {
  console.error('❌ No currentUser found')
}

console.log('\n💡 After running this script:')
console.log('1. Refresh the page')
console.log('2. Check Settings > Profile Information')
console.log('3. Your role should now show "Super User"')