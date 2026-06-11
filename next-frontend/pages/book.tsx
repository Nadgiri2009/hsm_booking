import Head from 'next/head';
import { useState } from 'react';

declare global {
  interface Window { Razorpay: any; }
}

export default function Book() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handlePay(e: any) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const createResp = await fetch('http://localhost:3001/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(amount * 100), receipt: `r_${Date.now()}` }),
      });
      const payload = await createResp.json();
      if (!payload.success) throw new Error(payload.error || 'Create order failed');

      const order = payload.order;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || '',
        amount: order.amount,
        currency: order.currency,
        name: 'Hutatma Smruti Mandir',
        description: 'Booking payment',
        order_id: order.id,
        prefill: { name, contact: mobile },
        handler: async (resp: any) => {
          // verify on server
          const verify = await fetch('http://localhost:3001/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            }),
          });
          const v = await verify.json();
          if (v.success) setMessage('Payment verified — booking confirmed');
          else setMessage('Verification failed');
          setLoading(false);
        },
        modal: { ondismiss: () => { setMessage('Payment cancelled'); setLoading(false); } },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setMessage(err.message || 'Payment failed');
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: 18 }}>
      <Head>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </Head>
      <h1>Book venue</h1>
      <form onSubmit={handlePay} className="main">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" value={name} onChange={e => setName(e.target.value)} required aria-required />
        </div>
        <div className="form-group">
          <label htmlFor="mobile">Mobile</label>
          <input id="mobile" name="mobile" value={mobile} onChange={e => setMobile(e.target.value)} required aria-required inputMode="tel" />
        </div>
        <div className="form-group">
          <label htmlFor="amount">Amount (INR)</label>
          <input id="amount" name="amount" type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} />
        </div>
        <button type="submit" disabled={loading}>{loading ? 'Processing...' : 'Pay Now'}</button>
      </form>
      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </div>
  );
}
