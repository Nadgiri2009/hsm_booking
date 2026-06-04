import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ padding: 20 }}>
      <h1>HSM Booking</h1>
      <p>
        <Link href="/book">Go to booking page</Link>
      </p>
    </main>
  );
}
