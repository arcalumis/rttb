import type { FastifyInstance, FastifyRequest } from "fastify";
import rawBody from "fastify-raw-body";
import type Stripe from "stripe";
import { getDb } from "../db";
import {
	STRIPE_WEBHOOK_SECRET,
	getProductByStripePriceId,
	getUserIdFromStripeCustomer,
	isStripeConfigured,
	recordPayment,
	recordRevenueEvent,
	stripe,
	updateUserMetrics,
	updateUserSubscription,
} from "../services/stripe";

export async function stripeWebhookRoutes(fastify: FastifyInstance): Promise<void> {
	if (!isStripeConfigured()) {
		console.log("Stripe not configured - webhook routes disabled");
		return;
	}

	// Register raw body plugin for webhook signature verification
	await fastify.register(rawBody, {
		field: "rawBody",
		global: false,
		runFirst: true,
		routes: ["/api/webhooks/stripe"],
	});

	fastify.post(
		"/api/webhooks/stripe",
		{
			config: {
				rawBody: true,
			},
		},
		async (request: FastifyRequest, reply) => {
			if (!stripe || !STRIPE_WEBHOOK_SECRET) {
				return reply.status(500).send({ error: "Stripe not configured" });
			}

			const sig = request.headers["stripe-signature"] as string;
			const body = (request as FastifyRequest & { rawBody: Buffer }).rawBody;

			let event: Stripe.Event;

			try {
				event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
			} catch (err) {
				const message = err instanceof Error ? err.message : "Unknown error";
				console.error("Webhook signature verification failed:", message);
				return reply.status(400).send({ error: `Webhook Error: ${message}` });
			}

			// Handle the event
			try {
				switch (event.type) {
					case "invoice.paid":
						await handleInvoicePaid(event.data.object as Stripe.Invoice);
						break;

					case "invoice.payment_failed":
						await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
						break;

					case "customer.subscription.created":
					case "customer.subscription.updated":
						await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
						break;

					case "customer.subscription.deleted":
						await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
						break;

					case "checkout.session.completed":
						await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
						break;

					default:
						console.log(`Unhandled event type: ${event.type}`);
				}
			} catch (error) {
				console.error(`Error handling ${event.type}:`, error);
				// Don't return error - we still received the webhook
			}

			return { received: true };
		},
	);
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
	if (!invoice.customer || typeof invoice.customer !== "string") return;

	const userId = getUserIdFromStripeCustomer(invoice.customer);
	if (!userId) {
		console.error("No user found for Stripe customer:", invoice.customer);
		return;
	}

	const amountCents = invoice.amount_paid;
	const paymentIntentId =
		typeof invoice.payment_intent === "string" ? invoice.payment_intent : null;

	// Determine payment type
	let paymentType = "subscription";
	if (invoice.billing_reason === "subscription_create") {
		paymentType = "subscription";
	} else if (invoice.billing_reason === "subscription_cycle") {
		paymentType = "subscription";
	} else if (invoice.billing_reason === "manual") {
		paymentType = "credit_purchase";
	}

	// Record the payment
	const paymentId = recordPayment(
		userId,
		paymentIntentId,
		invoice.id,
		amountCents,
		"succeeded",
		paymentType,
		invoice.description || `Invoice ${invoice.number}`,
		{ billing_reason: invoice.billing_reason },
	);

	// Record revenue event
	recordRevenueEvent(userId, paymentType, amountCents, {
		paymentId,
		description: `Invoice ${invoice.number}`,
		periodStart: invoice.period_start
			? new Date(invoice.period_start * 1000).toISOString().split("T")[0]
			: undefined,
		periodEnd: invoice.period_end
			? new Date(invoice.period_end * 1000).toISOString().split("T")[0]
			: undefined,
	});

	// Update user metrics
	updateUserMetrics(userId, amountCents);

	console.log(`Recorded payment of ${amountCents} cents for user ${userId}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
	if (!invoice.customer || typeof invoice.customer !== "string") return;

	const userId = getUserIdFromStripeCustomer(invoice.customer);
	if (!userId) return;

	const paymentIntentId =
		typeof invoice.payment_intent === "string" ? invoice.payment_intent : null;

	// Record failed payment
	recordPayment(
		userId,
		paymentIntentId,
		invoice.id,
		invoice.amount_due,
		"failed",
		"subscription",
		`Failed: Invoice ${invoice.number}`,
	);

	// Update subscription status
	const db = getDb();
	db.prepare(`
		UPDATE user_subscriptions
		SET status = 'past_due'
		WHERE user_id = ? AND status = 'active'
	`).run(userId);

	console.log(`Payment failed for user ${userId}, invoice ${invoice.id}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
	if (!subscription.customer || typeof subscription.customer !== "string") return;

	const userId = getUserIdFromStripeCustomer(subscription.customer);
	if (!userId) {
		console.error("No user found for Stripe customer:", subscription.customer);
		return;
	}

	// Get the price ID from the subscription
	const priceId = subscription.items.data[0]?.price.id;
	if (!priceId) return;

	// Find our product
	const product = getProductByStripePriceId(priceId);
	if (!product) {
		console.error("No product found for Stripe price:", priceId);
		return;
	}

	// Update subscription in our database
	updateUserSubscription(
		userId,
		product.id,
		subscription.id,
		subscription.status,
		new Date(subscription.current_period_start * 1000),
		new Date(subscription.current_period_end * 1000),
	);

	console.log(`Updated subscription for user ${userId}: ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
	if (!subscription.customer || typeof subscription.customer !== "string") return;

	const userId = getUserIdFromStripeCustomer(subscription.customer);
	if (!userId) return;

	const db = getDb();

	// Mark subscription as canceled
	db.prepare(`
		UPDATE user_subscriptions
		SET status = 'canceled', ends_at = datetime('now')
		WHERE stripe_subscription_id = ?
	`).run(subscription.id);

	// Update user metrics for churn tracking
	db.prepare(`
		UPDATE user_metrics
		SET churned_at = datetime('now')
		WHERE user_id = ?
	`).run(userId);

	console.log(`Subscription canceled for user ${userId}`);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
	// This is mainly for logging - actual subscription creation is handled by subscription.created
	console.log(`Checkout completed: ${session.id}`);

	if (session.metadata?.user_id) {
		console.log(`User ${session.metadata.user_id} completed checkout`);
	}
}
