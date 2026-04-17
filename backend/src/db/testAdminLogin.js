import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const testAdminLogin = async () => {
  console.log('🧪 Testing Admin Login Endpoint\n');
  
  const credentials = {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD
  };
  
  console.log('Credentials:');
  console.log('- Email:', credentials.email);
  console.log('- Password:', credentials.password);
  console.log('\nSending POST request to: http://localhost:3000/auth/admin-login\n');
  
  try {
    const response = await fetch('http://localhost:3000/auth/admin-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:');
    console.log(JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Login successful!');
      console.log('User:', data.user);
      console.log('Has access token:', !!data.accessToken);
      console.log('Has refresh token:', !!data.refreshToken);
    } else {
      console.log('\n❌ Login failed!');
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('\n❌ Request error:', error.message);
  }
  
  process.exit(0);
};

testAdminLogin();
