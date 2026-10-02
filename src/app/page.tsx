import Link from "next/link";
import Shell from "@/components/Shell";

const modules = [
  ["CRM", "Prospects, relances et pipeline", "/crm", "◎"],
  ["Commercial", "Devis, ventes et objectifs", "/commercial", "↗"],
  ["Clients", "Base clients et historique", "/clients", "♙"],
  ["Chantiers", "Suivi des projets et travaux", "/chantiers", "⌂"],
  ["Finance", "Encaissements et trésorerie", "/finance", "₣"],
  ["Achats", "Fournisseurs et dépenses", "/achats", "▣"],
  ["Documents", "Contrats, devis et fichiers", "/documents", "□"],
  ["Rapports", "KPI et pilotage", "/rapports", "▥"],
];

export default function Page() {
  return (
    <Shell title="Tableau de bord">
      <section className="heroDash">
        <div><span className="dashBadge">CENTRE DE PILOTAGE</span><h2>Bonjour, bienvenue sur KARMEO ERP/CRM</h2><p>Vue consolidée de votre activité commerciale, financière et opérationnelle.</p></div>
        <div className="heroDate">KARMEO GROUP<br/><small>Abidjan · Côte d’Ivoire</small></div>
      </section>

      <section className="kpiGrid">
        <article className="kpi"><span>Chiffre d’affaires</span><strong>0 FCFA</strong><small>Données à alimenter</small></article>
        <article className="kpi"><span>Prospects actifs</span><strong>0</strong><small>Pipeline CRM</small></article>
        <article className="kpi"><span>Clients</span><strong>0</strong><small>Base clients</small></article>
        <article className="kpi"><span>Chantiers actifs</span><strong>0</strong><small>Suivi opérationnel</small></article>
      </section>

      <div className="dashHeading"><div><h3>Modules de gestion</h3><p>Accès rapide aux fonctions de KARMEO.</p></div><span>V1 · Production</span></div>
      <section className="moduleGrid">
        {modules.map(([name, desc, href, icon]) => (
          <Link className="moduleCard" href={href} key={href}>
            <div className="moduleIcon">{icon}</div><div><strong>{name}</strong><p>{desc}</p></div><b>›</b>
          </Link>
        ))}
      </section>

      <section className="dashBottom">
        <article><span className="dashBadge">ACTIVITÉ</span><h3>Activité récente</h3><p>Les prochaines opérations CRM, ventes, paiements et chantiers apparaîtront ici automatiquement.</p></article>
        <article><span className="dashBadge">DIRECTION</span><h3>Priorités</h3><p>Centraliser les prospects, suivre les devis et piloter les chantiers depuis une seule interface.</p></article>
      </section>
    </Shell>
  );
}