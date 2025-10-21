import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export interface CreatePaymentIntentParams {
  amount: number; // in cents
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

// Create payment intent
export const createPaymentIntent = async (params: CreatePaymentIntentParams): Promise<Stripe.PaymentIntent> => {
  const { amount, currency = 'usd', customerId, metadata } = params;

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return paymentIntent;
};

// Confirm payment intent
export const confirmPaymentIntent = async (paymentIntentId: string): Promise<Stripe.PaymentIntent> => {
  const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
  return paymentIntent;
};

// Create customer
export const createCustomer = async (email: string, name?: string): Promise<Stripe.Customer> => {
  const customer = await stripe.customers.create({
    email,
    name,
  });

  return customer;
};

// Attach payment method to customer
export const attachPaymentMethod = async (
  paymentMethodId: string,
  customerId: string
): Promise<Stripe.PaymentMethod> => {
  const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  return paymentMethod;
};

// Create refund
export const createRefund = async (paymentIntentId: string, amount?: number): Promise<Stripe.Refund> => {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount, // Optional, refunds full amount if not specified
  });

  return refund;
};

// Verify webhook signature
export const constructWebhookEvent = (
  payload: string | Buffer,
  signature: string
): Stripe.Event => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

  return event;
};

// List customer payment methods
export const listPaymentMethods = async (customerId: string): Promise<Stripe.PaymentMethod[]> => {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });

  return paymentMethods.data;
};

// Detach payment method
export const detachPaymentMethod = async (paymentMethodId: string): Promise<Stripe.PaymentMethod> => {
  const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
  return paymentMethod;
};

export default stripe;
