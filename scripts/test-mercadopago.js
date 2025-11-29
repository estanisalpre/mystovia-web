/**
 * MercadoPago Configuration Tester
 *
 * Este script verifica que la configuración de MercadoPago esté correcta
 * y prueba la creación de preferencias.
 *
 * Uso:
 *   node scripts/test-mercadopago.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde la raíz del proyecto
dotenv.config({ path: resolve(__dirname, '../.env') });

const REQUIRED_ENV_VARS = [
  'MP_ACCESS_TOKEN',
  'MP_PUBLIC_KEY',
  'FRONTEND_URL',
  'BACKEND_URL',
];

function checkEnvironmentVariables() {
  console.log('\n🔍 Verificando variables de entorno...\n');

  let allPresent = true;

  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    if (!value) {
      console.log(`❌ ${varName}: NO CONFIGURADA`);
      allPresent = false;
    } else {
      // Mostrar solo los primeros caracteres para seguridad
      const maskedValue = varName.includes('TOKEN') || varName.includes('KEY')
        ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
        : value;
      console.log(`✅ ${varName}: ${maskedValue}`);
    }
  }

  console.log('');

  if (!allPresent) {
    console.log('⚠️  Faltan variables de entorno requeridas.');
    console.log('Por favor, configura todas las variables en el archivo .env\n');
    return false;
  }

  return true;
}

function validateAccessToken() {
  console.log('🔑 Validando Access Token...\n');

  const token = process.env.MP_ACCESS_TOKEN;

  if (token.startsWith('TEST-')) {
    console.log('✅ Usando credenciales de PRUEBA (sandbox) - CORRECTO para desarrollo');
  } else if (token.startsWith('APP_USR-')) {
    console.log('⚠️  Usando credenciales de PRODUCCIÓN');
    console.log('   Para testing, deberías usar credenciales de PRUEBA (TEST-...)');
  } else {
    console.log('❌ Formato de token no reconocido');
    return false;
  }

  console.log('');
  return true;
}

async function testMercadoPagoConnection() {
  console.log('🌐 Probando conexión con MercadoPago API...\n');

  try {
    const { MercadoPagoConfig, Preference } = await import('mercadopago');

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
      options: { timeout: 5000 },
    });

    const preference = new Preference(client);

    // Crear una preferencia de prueba
    const testPreference = await preference.create({
      body: {
        items: [
          {
            id: 'test-001',
            title: 'Test Product',
            description: 'Testing MercadoPago integration',
            quantity: 1,
            currency_id: 'ARS',
            unit_price: 100,
          },
        ],
        payer: {
          email: 'test@test.com',
        },
        external_reference: 'test-order-001',
        notification_url: `${process.env.BACKEND_URL}/api/marketplace/mp/webhook`,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/marketplace?payment=success`,
          failure: `${process.env.FRONTEND_URL}/marketplace?payment=failure`,
          pending: `${process.env.FRONTEND_URL}/marketplace?payment=pending`,
        },
      },
    });

    console.log('✅ Conexión exitosa con MercadoPago!');
    console.log('\n📋 Datos de la preferencia de prueba:');
    console.log(`   ID: ${testPreference.id}`);
    console.log(`   Init Point: ${testPreference.init_point}`);
    console.log(`   Sandbox Init Point: ${testPreference.sandbox_init_point}`);

    console.log('\n💡 Puedes probar el pago usando esta URL:');
    if (process.env.MP_ACCESS_TOKEN.startsWith('TEST-')) {
      console.log(`   ${testPreference.sandbox_init_point}`);
    } else {
      console.log(`   ${testPreference.init_point}`);
    }

    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Error al conectar con MercadoPago:');
    console.log(`   ${error.message}`);

    if (error.message.includes('Invalid access token')) {
      console.log('\n💡 Solución:');
      console.log('   1. Verifica que MP_ACCESS_TOKEN sea correcto');
      console.log('   2. Para testing, usa credenciales de PRUEBA de:');
      console.log('      https://www.mercadopago.com.ar/developers/panel/app');
      console.log('   3. Copia el "Access Token" de la sección "Credenciales de prueba"');
    }

    console.log('');
    return false;
  }
}

function printTestCards() {
  console.log('💳 Tarjetas de prueba para MercadoPago (Sandbox):\n');

  console.log('APROBADA:');
  console.log('  Número: 5031 7557 3453 0604');
  console.log('  CVV: 123');
  console.log('  Fecha: 11/25');
  console.log('  Nombre: APRO');
  console.log('  DNI: 12345678\n');

  console.log('RECHAZADA:');
  console.log('  Número: 5031 4332 1540 6351');
  console.log('  CVV: 123');
  console.log('  Fecha: 11/25');
  console.log('  Nombre: OTRE');
  console.log('  DNI: 12345678\n');

  console.log('Más tarjetas: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards\n');
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🧪 MercadoPago Configuration Tester');
  console.log('═══════════════════════════════════════════════════════════');

  // 1. Verificar variables de entorno
  if (!checkEnvironmentVariables()) {
    process.exit(1);
  }

  // 2. Validar token
  if (!validateAccessToken()) {
    process.exit(1);
  }

  // 3. Probar conexión
  const connectionOk = await testMercadoPagoConnection();

  // 4. Mostrar tarjetas de prueba
  if (connectionOk && process.env.MP_ACCESS_TOKEN.startsWith('TEST-')) {
    printTestCards();
  }

  console.log('═══════════════════════════════════════════════════════════');

  if (connectionOk) {
    console.log('✅ Todas las verificaciones pasaron correctamente!');
    console.log('   Tu configuración de MercadoPago está lista.\n');
    process.exit(0);
  } else {
    console.log('❌ Algunas verificaciones fallaron.');
    console.log('   Por favor, revisa los errores arriba.\n');
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('\n❌ Error inesperado:', error);
  process.exit(1);
});
