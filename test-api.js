// Test script to check API response
fetch('http://localhost:5240/api/products')
  .then(res => res.json())
  .then(data => {
    console.log('API Response:', data);
    if (data.data && data.data.items) {
      console.log('First product:', data.data.items[0]);
      console.log('Size field:', data.data.items[0]?.size);
    }
  })
  .catch(err => console.error('Error:', err));