#!/usr/bin/env node
/**
 * MetroPower Dashboard - Credential Management Tool
 * 
 * This script helps you change login credentials for the MetroPower Dashboard
 * and automatically tests the new credentials.
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

async function updateDemoServiceCredentials() {
  console.log('🔐 MetroPower Dashboard - Credential Management Tool');
  console.log('='.repeat(55));
  
  // Get current credentials
  console.log('\n📋 Current Manager Credentials:');
  console.log('   Email: manager@metropower.com');
  console.log('   Username: manager');
  console.log('   Password: NewPassword123!');
  
  console.log('\n🔧 What would you like to change?');
  console.log('   1. Password only');
  console.log('   2. Email address only');
  console.log('   3. Username only');
  console.log('   4. All credentials (email, username, password)');
  console.log('   5. Reset to original (antione.harrell@metropower.com)');
  
  const choice = await question('\nEnter your choice (1-5): ');
  
  let newEmail = 'manager@metropower.com';
  let newUsername = 'manager';
  let newPassword = 'NewPassword123!';
  let newFirstName = 'Antione';
  let newLastName = 'Harrell';
  
  switch (choice) {
    case '1':
      newPassword = await question('Enter new password: ');
      break;
      
    case '2':
      newEmail = await question('Enter new email address: ');
      break;
      
    case '3':
      newUsername = await question('Enter new username: ');
      break;
      
    case '4':
      newEmail = await question('Enter new email address: ');
      newUsername = await question('Enter new username: ');
      newPassword = await question('Enter new password: ');
      newFirstName = await question('Enter first name: ');
      newLastName = await question('Enter last name: ');
      break;
      
    case '5':
      newEmail = 'antione.harrell@metropower.com';
      newUsername = 'antione.harrell';
      newPassword = 'MetroPower2025!';
      newFirstName = 'Antione';
      newLastName = 'Harrell';
      console.log('✅ Resetting to original credentials...');
      break;
      
    default:
      console.log('❌ Invalid choice. Exiting...');
      rl.close();
      return;
  }
  
  console.log('\n🔄 Updating credentials...');
  
  // Read the demo service file
  const demoServicePath = path.join(__dirname, 'backend/src/services/demoService.js');
  let content = fs.readFileSync(demoServicePath, 'utf8');
  
  // Update password in the password generation section
  const passwordRegex = /const managerPassword = '[^']*';/;
  content = content.replace(passwordRegex, `const managerPassword = '${newPassword}';`);
  
  // Update user object
  const userObjectRegex = /{\s*user_id: 2,[\s\S]*?}/;
  const newUserObject = `{
        user_id: 2,
        username: '${newUsername}',
        email: '${newEmail}',
        password_hash: managerPasswordHash,
        first_name: '${newFirstName}',
        last_name: '${newLastName}',
        role: 'Project Manager',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null
      }`;
  
  content = content.replace(userObjectRegex, newUserObject);
  
  // Write the updated file
  fs.writeFileSync(demoServicePath, content);
  
  console.log('✅ Credentials updated successfully!');
  console.log('\n📋 New Manager Credentials:');
  console.log(`   Email: ${newEmail}`);
  console.log(`   Username: ${newUsername}`);
  console.log(`   Password: ${newPassword}`);
  console.log(`   Name: ${newFirstName} ${newLastName}`);
  
  console.log('\n⚠️  IMPORTANT: You need to restart the server for changes to take effect!');
  console.log('   Run: npm start');
  
  const testNow = await question('\nWould you like to test the new credentials? (y/n): ');
  
  if (testNow.toLowerCase() === 'y') {
    console.log('\n🧪 Testing new credentials...');
    console.log('Please restart the server first, then run:');
    console.log(`   node test-login.js`);
    console.log('\nOr test manually at: http://localhost:3001');
  }
  
  rl.close();
}

// Method 2: Create a new user management API endpoint
function generateUserManagementEndpoint() {
  const endpointCode = `
/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', authMiddleware, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Invalid input data', errors.array());
  }

  const { currentPassword, newPassword } = req.body;
  const userId = req.user.user_id;

  // Verify current password
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: 'User account not found'
    });
  }

  const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValidPassword) {
    return res.status(401).json({
      error: 'Invalid password',
      message: 'Current password is incorrect'
    });
  }

  // Update password
  await User.updatePassword(userId, newPassword, userId);

  logger.info('Password changed successfully', {
    userId,
    username: user.username
  });

  res.json({
    message: 'Password changed successfully'
  });
}));
`;

  console.log('\n🔧 User Management API Endpoint Code:');
  console.log('Add this to backend/src/routes/auth.js:');
  console.log(endpointCode);
}

// Run the tool
if (require.main === module) {
  updateDemoServiceCredentials().catch(console.error);
}
