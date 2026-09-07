import type { Payment } from "../types";

// ======================================================
// ## PAYMENT API TEMPLATE ##
//
// Midtrans:
// const snap = new MidtransSnap({ clientKey: process.env.MIDTRANS_CLIENT_KEY })
// const token = await fetch('/api/payment/midtrans', { method: 'POST', body: ... })
// snap.pay(token)
//
// Xendit:
// const response = await fetch('/api/payment/xendit/invoice', { method: 'POST', body: ... })
//
// Stripe:
// const stripe = Stripe(process.env.STRIPE_PUBLISHABLE_KEY)
// const { paymentIntent } = await fetch('/api/payment/stripe/intent', ...)
// stripe.confirmCardPayment(paymentIntent.client_secret, { payment_method: { card } })
//
// ======================================================

const KEY = "hearme_payments";

function all(): Payment[] {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}
function save(p: Payment[]) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export const paymentAPI = {
  create: async (consultationId: string, amount: number, method: Payment["method"]): Promise<Payment> => {
    // ======================================================
    // ## DATABASE TEMPLATE IF CONNECTED ##
    // payments table: id, consultation_id, amount, method, status, created_at
    // INSERT INTO payments (...) VALUES (...)
    //
    // ## PAYMENT API TEMPLATE ##
    // const externalTransaction = await midtrans.createTransaction({ ... })
    // ======================================================
    const payment: Payment = {
      id: `pay_${Date.now()}`,
      consultationId,
      amount,
      method,
      status: "pending",
      createdAt: new Date().toISOString(),
      externalId: `EXT_${Date.now()}`,
    };
    save([...all(), payment]);
    return payment;
  },

  confirm: async (paymentId: string): Promise<Payment> => {
    // ## DATABASE TEMPLATE IF CONNECTED ## → UPDATE payments SET status = 'paid', paid_at = NOW() WHERE id = ?
    // ## PAYMENT API TEMPLATE ## → await midtrans.verifyTransaction(externalId)
    const updated = all().map((p) =>
      p.id === paymentId ? { ...p, status: "paid" as const, paidAt: new Date().toISOString() } : p
    );
    save(updated);
    return updated.find((p) => p.id === paymentId)!;
  },

  getByConsultation: async (consultationId: string): Promise<Payment | null> => {
    return all().find((p) => p.consultationId === consultationId) || null;
  },

  getAll: async (): Promise<Payment[]> => all(),
};
