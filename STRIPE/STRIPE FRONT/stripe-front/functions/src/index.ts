/**
 * Stripe Connect Cloud Functions
 * Handles Stripe account onboarding, webhooks, and product management
 */

import {setGlobalOptions} from "firebase-functions";
import {onCall} from "firebase-functions/v2/https";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as stripe from "stripe";

// Initialize Firebase
admin.initializeApp();
const db = admin.firestore();

// Get Stripe client with proper configuration
function getStripeClient() {
  // For Firebase Functions v2, use defineSecret or directly from env
  // First try the standard env var from functions:config:set
  let apiKey = process.env.STRIPE_SECRET_KEY;

  // If not found, it might be prefixed
  if (!apiKey) {
    apiKey = process.env["stripe.secret_key"];
  }

  // Fallback to a hardcoded key if absolutely necessary (for debugging)
  // This should be removed and only use env vars in production
  if (!apiKey && process.env.NODE_ENV === "development") {
    logger.warn("WARNING: No Stripe API key found in environment variables.");
  }

  if (!apiKey) {
    const errorMsg = "Stripe API key not configured. Set via: firebase functions:config:set stripe.secret_key='YOUR_KEY'";
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  return new stripe.default(apiKey);
}

setGlobalOptions({maxInstances: 10});

// ============== STRIPE ACCOUNT ONBOARDING ==============

/**
 * Create a Stripe onboarding link for a franchisee
 * Called by frontend when franchisee initiates Stripe Connect setup
 */
export const createOnboardingLink = onCall(
  {enforceAppCheck: false},
  async (request) => {
    try {
      const franchiseeId = request.data.franchiseeId;

      // Get franchisee data
      const franchiseeRef = db.collection("franchisees").doc(franchiseeId);
      const franchiseeSnap = await franchiseeRef.get();

      if (!franchiseeSnap.exists) {
        throw new Error("Franchisee not found");
      }

      const franchiseeData = franchiseeSnap.data();

      // Check if Stripe account exists
      const stripeAccountRef = franchiseeRef
        .collection("stripe_account")
        .doc("account");
      const stripeAccountSnap = await stripeAccountRef.get();

      let stripeAccountId: string;

      if (!stripeAccountSnap.exists) {
        // Create new Stripe Express account
        logger.info(`Creating Stripe account for franchisee: ${franchiseeId}`);

        const stripeClient = getStripeClient();
        const account = await stripeClient.accounts.create({
          type: "express",
          country: "US",
          email: franchiseeData?.email || `franchisee-${franchiseeId}@example.com`,
          business_type: "individual",
          settings: {
            payouts: {
              debit_negative_balances: true,
              schedule: {
                interval: "daily",
              },
            },
          },
        });

        stripeAccountId = account.id;

        // Save to Firestore
        await stripeAccountRef.set({
          accountId: stripeAccountId,
          chargesEnabled: false,
          payoutsEnabled: false,
          verificationStatus: "pending",
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        });
      } else {
        stripeAccountId = stripeAccountSnap.data()?.accountId;
      }

      // Create account link for onboarding
      const stripeClient = getStripeClient();
      const accountLink = await stripeClient.accountLinks.create({
        account: stripeAccountId,
        type: "account_onboarding",
        refresh_url: `${process.env.FRONTEND_URL || "https://stripe-connect-1029120000.web.app"}/dashboard`,
        return_url: `${process.env.FRONTEND_URL || "https://stripe-connect-1029120000.web.app"}/dashboard?stripe_success=true`,
      });

      logger.info(`Created onboarding link for account: ${stripeAccountId}`);

      return {url: accountLink.url};
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("Error creating onboarding link:", error);
      throw new Error(`Failed to create onboarding link: ${errorMessage}`);
    }
  }
);

// ============== STRIPE WEBHOOKS ==============

/**
 * Handle Stripe webhooks
 * Updates Firestore based on Stripe events
 */
export const handleStripeWebhook = onRequest(
  {cors: ["*"]},
  async (request, response) => {
    const sig = request.headers["stripe-signature"] as string;
    const secret = process.env.STRIPE_WEBHOOK_SECRET || "";

    try {
      const stripeClient = getStripeClient();
      const event = stripeClient.webhooks.constructEvent(
        request.rawBody || "",
        sig,
        secret
      );

      logger.info(`Received Stripe event: ${event.type}`, {event_id: event.id});

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eventData: any = event.data.object;

      switch (event.type) {
        case "account.updated":
          await handleAccountUpdated(eventData);
          break;
        case "account.external_account.created":
          await handleExternalAccountCreated(eventData);
          break;
        case "charge.succeeded":
          await handleChargeSucceeded(eventData);
          break;
        case "charge.failed":
          await handleChargeFailed(eventData);
          break;
        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      response.json({received: true});
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("Webhook error:", error);
      response.status(400).send(`Webhook Error: ${errorMessage}`);
    }
  }
);

/**
 * Handle account.updated events
 * Update Firestore with account verification status
 * @param account The Stripe account object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleAccountUpdated(account: any) {
  try {
    // Find franchisee with this Stripe account
    const snapshot = await db
      .collectionGroup("stripe_account")
      .where("accountId", "==", account.id)
      .limit(1)
      .get();

    if (snapshot.empty) {
      logger.warn(`No franchisee found for account: ${account.id}`);
      return;
    }

    const stripeAccountRef = snapshot.docs[0].ref;
    const franchiseeRef = stripeAccountRef.parent.parent;

    if (!franchiseeRef) {
      return;
    }

    // Update Stripe account info
    await stripeAccountRef.update({
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      verificationStatus: account.verification?.status || "pending",
      updatedAt: admin.firestore.Timestamp.now(),
    });

    // Update franchisee status if fully verified
    if (account.charges_enabled && account.payouts_enabled) {
      await franchiseeRef.update({
        status: "active",
        updatedAt: admin.firestore.Timestamp.now(),
      });
      logger.info(`Franchisee ${franchiseeRef.id} activated`);
    }
  } catch (error) {
    logger.error("Error handling account update:", error);
  }
}

/**
 * Handle account.external_account.created events
 * Triggered when payout method is added
 * @param externalAccount The external account object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleExternalAccountCreated(externalAccount: any) {
  try {
    logger.info("External account created for account:", {
      account_id: externalAccount.account,
    });
    // Could add additional logic here to notify franchisee
  } catch (error) {
    logger.error("Error handling external account creation:", error);
  }
}

/**
 * Handle charge.succeeded events
 * Record transaction in Firestore
 * @param charge The Stripe charge object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleChargeSucceeded(charge: any) {
  try {
    const franchiseeId = charge.metadata?.franchisee_id;
    if (!franchiseeId) {
      logger.warn("Charge succeeded but no franchisee_id in metadata");
      return;
    }

    // Record transaction
    const franchiseeRef = db.collection("franchisees").doc(franchiseeId);
    const platformFeePercent = parseFloat(
      process.env.PLATFORM_FEE_PERCENT || "2.9"
    );
    const platformFeeAmount = Math.round(charge.amount * (platformFeePercent / 100));

    await franchiseeRef.collection("transactions").add({
      franchiseeId: franchiseeId,
      stripeChargeId: charge.id,
      amount: charge.amount,
      currency: charge.currency,
      status: "succeeded",
      customerId: charge.customer || "unknown",
      platformFee: platformFeeAmount,
      franchiseeAmount: charge.amount - platformFeeAmount,
      createdAt: admin.firestore.Timestamp.now(),
    });

    logger.info(`Recorded transaction for franchisee: ${franchiseeId}`);
  } catch (error) {
    logger.error("Error handling charge succeeded:", error);
  }
}

/**
 * Handle charge.failed events
 * Record failed transaction in Firestore
 * @param charge The Stripe charge object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleChargeFailed(charge: any) {
  try {
    const franchiseeId = charge.metadata?.franchisee_id;
    if (!franchiseeId) {
      logger.warn("Charge failed but no franchisee_id in metadata");
      return;
    }

    // Record failed transaction
    const franchiseeRef = db.collection("franchisees").doc(franchiseeId);
    await franchiseeRef.collection("transactions").add({
      franchiseeId: franchiseeId,
      stripeChargeId: charge.id,
      amount: charge.amount,
      currency: charge.currency,
      status: "failed",
      failureCode: charge.failure_code,
      failureMessage: charge.failure_message,
      customerId: charge.customer || "unknown",
      createdAt: admin.firestore.Timestamp.now(),
    });

    logger.info(`Recorded failed transaction for franchisee: ${franchiseeId}`);
  } catch (error) {
    logger.error("Error handling charge failed:", error);
  }
}
