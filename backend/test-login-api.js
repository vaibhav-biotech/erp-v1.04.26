const fetch = require('node-fetch');

async function testLogin() {
  const apiUrl = 'http://localhost:5050/api/auth/login';
  
  const payload = {
    email: 'piyushmagar4p@gmail.com',
    password: 'Pm@22442232'
  };

  console.log('Testing login API...');
  console.log('URL:', apiUrl);
  console.log('Email:', payload.email);
  console.log('Password:', payload.password);
  console.log('');

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Store-Name': 'Plants in Garden',
      },
      body: JSON.stringify(payload),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();
