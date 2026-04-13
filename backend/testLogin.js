// Test script to debug customer login issue
const http = require('http');

const API_BASE = 'http://localhost:5050';
const EMAIL = 'mpiyush2777@gmail.com';
const PASSWORD = 'Pass@123';

function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 TESTING CUSTOMER LOGIN API\n');
  console.log(`Email: ${EMAIL}`);
  console.log(`Password: ${PASSWORD}\n`);

  try {
    // Test 1: Check all customers in database
    console.log('📋 Test 1: Fetching all customers from database...');
    const allCustomers = await makeRequest(`${API_BASE}/api/auth/debug/customers`);
    console.log(`Status: ${allCustomers.status}`);
    console.log(`Total customers: ${allCustomers.data.count}`);
    console.log('Customers:');
    allCustomers.data.customers.forEach((c) => {
      console.log(`  - ${c.email} (${c.firstName} ${c.lastName})`);
      console.log(`    Password hash: ${c.passwordHash}`);
    });

    // Check if our customer exists
    const customerExists = allCustomers.data.customers.find((c) => c.email === EMAIL);
    if (!customerExists) {
      console.log(`\n❌ Customer ${EMAIL} NOT FOUND in database!`);
      console.log('⚠️  You need to signup first or use a different email\n');
      return;
    }
    console.log(`✅ Customer found in database!\n`);

    // Test 2: Test password matching
    console.log('🔐 Test 2: Testing password match...');
    const passwordTest = await makeRequest(`${API_BASE}/api/auth/debug/test-password`, 'POST', {
      email: EMAIL,
      password: PASSWORD,
    });
    console.log(`Status: ${passwordTest.status}`);
    console.log(`Customer exists: ${passwordTest.data.customerExists}`);
    console.log(`Password matches: ${passwordTest.data.passwordMatches}`);
    if (!passwordTest.data.passwordMatches) {
      console.log(`❌ Password DOES NOT match!`);
      console.log(`Provided password: ${PASSWORD}`);
      console.log(`Stored hash: ${passwordTest.data.passwordHash}\n`);
      return;
    }
    console.log(`✅ Password matches!\n`);

    // Test 3: Try actual login
    console.log('🔑 Test 3: Attempting login...');
    const login = await makeRequest(`${API_BASE}/api/auth/login`, 'POST', {
      email: EMAIL,
      password: PASSWORD,
    });
    console.log(`Status: ${login.status}`);
    if (login.status === 200) {
      console.log(`✅ LOGIN SUCCESSFUL!`);
      console.log(`Token: ${login.data.data.token.substring(0, 50)}...`);
      console.log(`Customer: ${login.data.data.customer.firstName} ${login.data.data.customer.lastName}`);
    } else {
      console.log(`❌ LOGIN FAILED`);
      console.log(`Message: ${login.data.message}`);
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.log('\n⚠️  Make sure backend is running on http://localhost:5050');
  }
}

runTests();
