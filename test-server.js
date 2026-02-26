try {
  const express = require('express');
  console.log('✓ express loaded');
  
  const nodemailer = require('nodemailer');
  console.log('✓ nodemailer loaded');
  
  const cors = require('cors');
  console.log('✓ cors loaded');
  
  const bodyParser = require('body-parser');
  console.log('✓ bodyParser loaded');
  
  const fs = require('fs');
  console.log('✓ fs loaded');
  
  const path = require('path');
  console.log('✓ path loaded');
  
  const multer = require('multer');
  console.log('✓ multer loaded');
  
  require('dotenv').config();
  console.log('✓ dotenv loaded');
  
  console.log('✓ All modules loaded successfully');
  
  // Try loading the server
  const app = express();
  console.log('✓ Express app created');
  
} catch (error) {
  console.error('ERROR:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
