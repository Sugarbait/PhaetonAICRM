// IMMEDIATE FIX: Correct Pierre's role to super_user
// Run this in browser console: copy and paste this entire script

console.log('🔧 Fixing Pierre role to Super User...');

// Fix in users array
const usersData = localStorage.getItem('users');
if (usersData) {
  try {
    const users = JSON.parse(usersData);
    let fixed = false;

    users.forEach(user => {
      if (user.email && user.email.toLowerCase() === 'pierre@phaetonai.com') {
        if (user.role !== 'super_user') {
          console.log(`🔧 Fixing Pierre's role from "${user.role}" to "super_user"`);
          user.role = 'super_user';
          user.name = 'Pierre PhaetonAI';
          user.id = 'pierre-user-789';
          fixed = true;
        }
      }
    });

    if (fixed) {
      localStorage.setItem('users', JSON.stringify(users));
      console.log('✅ Pierre role fixed in users array');
    }
  } catch (e) {
    console.error('Failed to fix users array:', e);
  }
}

// Fix in systemUsers
const systemUsersData = localStorage.getItem('systemUsers');
if (systemUsersData) {
  try {
    const systemUsers = JSON.parse(systemUsersData);
    let fixed = false;

    systemUsers.forEach(user => {
      if (user.email && user.email.toLowerCase() === 'pierre@phaetonai.com') {
        if (user.role !== 'super_user') {
          console.log(`🔧 Fixing Pierre's role from "${user.role}" to "super_user" in systemUsers`);
          user.role = 'super_user';
          user.name = 'Pierre PhaetonAI';
          user.id = 'pierre-user-789';
          fixed = true;
        }
      }
    });

    if (fixed) {
      localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
      console.log('✅ Pierre role fixed in systemUsers array');
    }
  } catch (e) {
    console.error('Failed to fix systemUsers array:', e);
  }
}

// Fix currentUser if it's Pierre
const currentUserData = localStorage.getItem('currentUser');
if (currentUserData) {
  try {
    const currentUser = JSON.parse(currentUserData);
    if (currentUser.email && currentUser.email.toLowerCase() === 'pierre@phaetonai.com') {
      if (currentUser.role !== 'super_user') {
        console.log(`🔧 Fixing current user Pierre's role from "${currentUser.role}" to "super_user"`);
        currentUser.role = 'super_user';
        currentUser.name = 'Pierre PhaetonAI';
        currentUser.id = 'pierre-user-789';
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        console.log('✅ Current user Pierre role fixed');
      }
    }
  } catch (e) {
    console.error('Failed to fix current user:', e);
  }
}

console.log('🎉 Pierre role fix complete! Refresh the page to see changes.');
console.log('📍 Pierre should now show as "Super User" in User Management page.');