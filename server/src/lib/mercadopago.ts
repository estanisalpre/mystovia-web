import {
  MercadoPagoConfig,
  Payment,
  Preference,
  MerchantOrder,
} from "mercadopago";

// Initialize the client
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
  options: { timeout: 5000 },
});

// Initialize the API object
const pref = new Preference(client);

type CreatePrefOptions = {
  productName: string;
  productDescription: string;
  productId: string;
  productPrice: number;
  userEmail: string;
  orderId: string;
};

/**
 * Create a MercadoPago preference for a single product
 * Returns the preference with init_point URL for payment
 */
export async function createSingleProductPreference(
  options: CreatePrefOptions
) {
  // Documentation: https://www.mercadopago.com.ar/developers/es/reference/preferences/_checkout_preferences/post

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

  console.log('🔧 Creating MercadoPago preference with:');
  console.log('  Frontend URL:', frontendUrl);
  console.log('  Backend URL (webhook):', backendUrl);
  console.log('  Notification URL:', `${backendUrl}/api/marketplace/mp/webhook`);

  const preferenceBody: any = {
    items: [
      {
        id: options.productId,
        title: options.productName,
        description: options.productDescription,
        quantity: 1,
        currency_id: "ARS",
        unit_price: options.productPrice,
      },
    ],
    payer: {
      email: options.userEmail,
    },
    // This is the order ID to link the payment with our order
    external_reference: options.orderId,
    // Webhook notification URL
    notification_url: `${backendUrl}/api/marketplace/mp/webhook`,
  };

  // Only add back_urls and auto_return if we're NOT in localhost
  // MercadoPago doesn't accept localhost for back_urls with auto_return
  if (!frontendUrl.includes('localhost')) {
    preferenceBody.back_urls = {
      success: `${frontendUrl}/marketplace?payment=success`,
      failure: `${frontendUrl}/marketplace?payment=failure`,
      pending: `${frontendUrl}/marketplace?payment=pending`,
    };
    preferenceBody.auto_return = 'approved';
  } else {
    // For localhost testing, use manual return without auto_return
    preferenceBody.back_urls = {
      success: `${frontendUrl}/marketplace?payment=success`,
      failure: `${frontendUrl}/marketplace?payment=failure`,
      pending: `${frontendUrl}/marketplace?payment=pending`,
    };
  }

  return pref.create({
    body: preferenceBody,
  });
}

/**
 * Get payment details by ID
 */
export async function getPaymentById(id: string) {
  const payment = new Payment(client);
  return payment.get({ id });
}

/**
 * Get preference by merchant order ID
 */
export async function getPrefByOrderId(id: number) {
  const order = new MerchantOrder(client);
  const result = await order.get({ merchantOrderId: id });
  return pref.get({ preferenceId: result.preference_id! });
}

/**
 * Webhook payload type from MercadoPago
 */
export type WebhookPayload = {
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: string;
  user_id: string;
};
