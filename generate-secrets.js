#!/usr/bin/env node

/**
 * Generate secure JWT secrets for production
 * Usage: node generate-secrets.js
 */

import crypto from 'crypto';

console.log('\n🔐 Generating Secure JWT Secrets\n');
console.log('Add these to your .env file:\n');
console.log('-----------------------------------');
console.log(`JWT_SECRET=${crypto.randomBytes(64).toString('hex')}`);
console.log(`JWT_REFRESH_SECRET=${crypto.randomBytes(64).toString('hex')}`);
console.log('-----------------------------------\n');
console.log('⚠️  IMPORTANT:');
console.log('1. Never commit these secrets to version control');
console.log('2. Use different secrets for development and production');
console.log('3. Keep these secrets safe and secure\n');
