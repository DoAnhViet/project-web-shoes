// Test API response format
async function testAPI() {
  try {
    const response = await fetch('http://localhost:5240/api/products/1');
    const data = await response.json();
    console.log('API Response for product 1:', data);
    console.log('Response keys:', Object.keys(data));
    console.log('Size field:', data.size);
    console.log('Stock field:', data.stock);

    if (data.data) {
      console.log('Nested data:', data.data);
      console.log('Nested size:', data.data.size);
    }
  } catch (error) {
    console.error('API test failed:', error);
  }
}

testAPI();