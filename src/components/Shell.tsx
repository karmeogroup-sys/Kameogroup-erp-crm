import Link from "next/link";

const nav = [
  ["/", "Dashboard"], ["/crm", "CRM"], ["/commercial", "Commercial"],
  ["/clients", "Clients"], ["/chantiers", "Chantiers"], ["/finance", "Finance"],
  ["/achats", "Achats"], ["/documents", "Documents"], ["/rapports", "Rapports"],
  ["/academy", "Academy"], ["/administration", "Administration"],
];

export default function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">KARMEO<small>ERP / CRM</small></div>
        <nav className="nav">
          {nav.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <Link className="logout" href="/login">Déconnexion</Link>
      </aside>
      <main className="main">
        <header className="top"><div><span className="eyebrow">KARMEO GROUP</span><h1>{title}</h1></div></header>
        {children}
      </main>
    </div>
  );
}