import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testConductorLogin() {
  try {
    console.log('=== Testing Conductor Login ===');
    
    // Step 1: Login as conductor
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'conductor@busticket.com',
        password: 'conductor123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginData.token) {
      console.error('Login failed - no token received');
      return;
    }
    
    // Step 2: Get conductor's assigned routes
    const routesResponse = await fetch(`${API_BASE}/routes/conductor/assigned`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const routesData = await routesResponse.json();
    console.log('=== Conductor Routes Response ===');
    console.log('Status:', routesResponse.status);
    console.log('Data:', routesData);
    
    if (routesData.success && routesData.routes.length > 0) {
      console.log('✅ Success! Conductor has assigned routes:');
      routesData.routes.forEach(route => {
        console.log(`- ${route.routeNumber}: ${route.routeName}`);
      });
    } else {
      console.log('❌ No routes assigned to conductor');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testConductorLogin();
