try {
  const express = require('express');
  const cors = require('cors');
  const bodyParser = require('body-parser');
  const fs = require('fs');
  const path = require('path');
  
  const app = express();
  const PORT = 3000;
  
  const usersFilePath = path.join(__dirname, 'users.json');
  const ordersFilePath = path.join(__dirname, 'orders.json');
  const notificationsFilePath = path.join(__dirname, 'notifications.json');
  
  console.log('✓ All requires successful');
  
  // Test file paths
  console.log('users file exists:', fs.existsSync(usersFilePath));
  console.log('orders file exists:', fs.existsSync(ordersFilePath));
  console.log('notifications file exists:', fs.existsSync(notificationsFilePath));
  
  // Try reading orders
  const ordersData = JSON.parse(fs.readFileSync(ordersFilePath, 'utf-8'));
  console.log('✓ Orders file readable, found', ordersData.orders.length, 'orders');
  
  // Middleware
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static('.'));
  
  console.log('✓ Middleware configured');
  
  // Test endpoint
  app.get('/api/test', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  console.log('✓ Test route configured');
  
  // Try to start
  app.listen(PORT, () => {
    console.log(`✓ Server started on port ${PORT}`);
  });
  
  // Exit after 2 seconds
  setTimeout(() => {
    console.log('✓ Test successful, shutting down');
    process.exit(0);
  }, 2000);
  
} catch (error) {
  console.error('ERROR:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
