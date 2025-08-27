import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/client';
import { Tenant } from '@/lib/rbac/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

// const PLAN_PRICES = {
//   free: 'price_free', // Free plan - no Stripe price ID needed
//   basic: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic',
//   pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
//   enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
// };

export async function createCustomer(email: string, tenantId: string): Promise<string> {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        tenantId,
      },
    });

    const supabase = createClient();
    await supabase
      .from('billing')
      .insert({
        tenant_id: tenantId,
        stripe_customer_id: customer.id,
        plan: 'free',
        amount: 0,
        status: 'active',
      });

    return customer.id;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

export async function createSubscription(
  customerId: string,
  priceId: string,
  tenantId: string
): Promise<string> {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: {
        tenantId,
      },
    });

    const supabase = createClient();
    // If subscription is a Response<Subscription>, use .data; otherwise, use as Subscription
    const sub = (subscription as any).data ? (subscription as any).data : subscription;
    await supabase
      .from('billing')
      .update({
        stripe_subscription_id: sub.id,
        plan: sub.items.data[0].price.nickname || 'basic',
        amount: sub.items.data[0].price.unit_amount || 0,
        status: sub.status,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId);

    return subscription.id;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string
): Promise<void> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  try {
    await stripe.subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  tenantId: string
): Promise<string> {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`,
      metadata: {
        tenantId,
      },
    });

    return session.url || '';
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function handleSubscriptionChange(
  subscriptionId: string,
  status: string
): Promise<void> {
  const supabase = createClient();
  
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const { tenantId } = subscription.metadata;

    await supabase
      .from('billing')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId);

    // Update tenant features based on plan
    const plan = subscription.items.data[0].price.nickname || 'basic';
    await updateTenantFeatures(tenantId, plan as Tenant['plan']);
  } catch (error) {
    console.error('Error handling subscription change:', error);
    throw error;
  }
}

export async function updateTenantFeatures(
  tenantId: string,
  plan: Tenant['plan']
): Promise<void> {
  const planFeatures = {
    free: {
      maxUsers: 5,
      maxAssets: 100,
      features: {
        qrCodes: true,
        analytics: false,
        api: false,
        customBranding: false,
        multipleLocations: false,
        advancedReports: false,
      },
    },
    basic: {
      maxUsers: 10,
      maxAssets: 500,
      features: {
        qrCodes: true,
        analytics: true,
        api: false,
        customBranding: false,
        multipleLocations: false,
        advancedReports: false,
      },
    },
    pro: {
      maxUsers: 50,
      maxAssets: 5000,
      features: {
        qrCodes: true,
        analytics: true,
        api: true,
        customBranding: true,
        multipleLocations: true,
        advancedReports: false,
      },
    },
    enterprise: {
      maxUsers: 1000,
      maxAssets: 100000,
      features: {
        qrCodes: true,
        analytics: true,
        api: true,
        customBranding: true,
        multipleLocations: true,
        advancedReports: true,
      },
    },
  };

  const supabase = createClient();
  await supabase
    .from('tenants')
    .update({
      plan,
      max_users: planFeatures[plan].maxUsers,
      max_assets: planFeatures[plan].maxAssets,
      features: planFeatures[plan].features,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenantId);
} 