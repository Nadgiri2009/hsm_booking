import Link from 'next/link';

export default function Header() {
  return (
    <header style={{ borderBottom: '1px solid #eee', background: '#fff' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#123' }}>
          <img src="/assets/logo.png" alt="HSM" style={{ width: 40, height: 40, borderRadius: 8 }} onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}} />
          <div>
            <strong>Hutatma Smruti Mandir</strong>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Online Booking</div>
          </div>
        </Link>

        <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link href="/book">Book</Link>
        </nav>
      </div>
    </header>
  );
}
