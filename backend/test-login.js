fetch('http://localhost:5050/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'accountant@vaibhav.com', password: 'password123' })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
