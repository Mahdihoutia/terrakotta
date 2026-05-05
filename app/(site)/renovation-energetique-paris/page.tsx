import LocalSeoLayout from "@/components/site/LocalSeoLayout";

export default function RenovationEnergetiqueParisPage() {
  return (
    <LocalSeoLayout
      eyebrow="Rénovation énergétique Paris"
      h1="Rénovation énergétique à Paris : copropriétés et bâtiments tertiaires"
      intro="Kilowater accompagne les rénovations énergétiques à Paris depuis l'audit jusqu'au suivi post-travaux. Spécialiste du bâti ancien parisien, nous intégrons les contraintes patrimoniales, ABF et le contexte réglementaire local pour livrer des projets de rénovation cohérents techniquement et financièrement."
      zone="Paris intra-muros"
      zoneDescription="Rénover à Paris demande une lecture fine du bâti : haussmannien, faubourien, années 30, années 60. Chaque typologie a ses leviers et ses pièges. Notre bureau d'étude conçoit des programmes de rénovation respectueux du patrimoine, performants énergétiquement, et alignés avec les financements MaPrimeRénov', CEE, Éco-PTZ collectif."
      serviceName="Rénovation énergétique"
      canonical="https://www.kilowater.fr/renovation-energetique-paris"
      keyPoints={[
        {
          title: "Spécialiste copropriété",
          description: "Nous accompagnons la copropriété de A à Z : audit, choix scénario en AG, maîtrise d'œuvre, suivi des aides.",
        },
        {
          title: "Bâti ancien parisien",
          description: "Haussmannien, immeubles ABF, façades sculptées, planchers bois — nous adaptons les solutions techniques au patrimoine.",
        },
        {
          title: "Maximisation des aides",
          description: "MaPrimeRénov' Copropriété, CEE Coup de pouce, Éco-PTZ collectif, aides Ville de Paris (Éco-rénovons Paris+).",
        },
      ]}
      contentSections={[
        {
          title: "Comprendre le bâti parisien avant de rénover",
          body: (
            <>
              <p>
                Paris possède un parc bâti d&apos;une diversité unique : <strong>40 % d&apos;immeubles
                haussmanniens</strong> ou pré-haussmanniens, des immeubles faubouriens du 19<sup>e</sup>, des
                ensembles HBM des années 1920-30, des barres et tours des années 1960-70, et des constructions
                récentes BBC.
              </p>
              <p>
                Chaque typologie demande des arbitrages spécifiques&nbsp;:
              </p>
              <ul style={{ listStyle: "disc", paddingLeft: "1.25rem", margin: "0.75rem 0" }}>
                <li><strong>Haussmannien</strong> : ITE souvent impossible (façade protégée), ITI maîtrisée, isolation des planchers bas et combles, MTA (menuiseries thermiquement améliorées).</li>
                <li><strong>Faubourien</strong> : potentiel ITE en cour, traitement du pignon, doublage intérieur léger.</li>
                <li><strong>Années 60-70</strong> : ITE généralisée, refonte ventilation, rénovation chaufferie collective.</li>
              </ul>
            </>
          ),
        },
        {
          title: "Notre approche en 5 étapes",
          body: (
            <>
              <ol style={{ listStyle: "decimal", paddingLeft: "1.25rem", margin: "0.75rem 0" }}>
                <li><strong>Audit énergétique</strong> du bâtiment existant et identification des leviers prioritaires.</li>
                <li><strong>Scénarios chiffrés</strong> avec projection des économies, du confort et du financement (aides incluses).</li>
                <li><strong>Présentation en assemblée générale</strong> ou comité de pilotage pour faire voter les travaux.</li>
                <li><strong>Maîtrise d&apos;œuvre</strong> : DCE, consultation entreprises, suivi de chantier, réception.</li>
                <li><strong>Bouclage financier</strong> : montage MaPrimeRénov&apos; Copropriété, dossiers CEE, Éco-PTZ.</li>
              </ol>
            </>
          ),
        },
        {
          title: "Aides à la rénovation énergétique à Paris",
          body: (
            <>
              <p>
                Au-delà des aides nationales, Paris propose des dispositifs spécifiques&nbsp;:
              </p>
              <ul style={{ listStyle: "disc", paddingLeft: "1.25rem", margin: "0.75rem 0" }}>
                <li><strong>Éco-rénovons Paris+</strong> : accompagnement gratuit + subvention complémentaire pour les copropriétés.</li>
                <li><strong>MaPrimeRénov&apos; Copropriété</strong> : jusqu&apos;à 25 % du montant des travaux + bonus.</li>
                <li><strong>CEE Coup de pouce Rénovation globale</strong> : prime majorée sur projets ambitieux.</li>
                <li><strong>Aides ANAH</strong> pour copropriétés en difficulté ou propriétaires modestes.</li>
              </ul>
              <p>
                Notre équipe optimise le cumul des aides pour maximiser le reste-à-charge final des copropriétaires.
              </p>
            </>
          ),
        },
      ]}
      faq={[
        {
          question: "Combien coûte une rénovation énergétique de copropriété à Paris ?",
          answer:
            "Très variable : de 200 €/m² SHAB pour une rénovation par éléments à 800 €/m² pour une rénovation BBC complète. À Paris, les contraintes patrimoniales et l'échafaudage en zone urbaine majorent les prix. Un audit chiffre précisément les scénarios. Avant aides, comptez en moyenne 10 000 à 30 000 € par lot pour une rénovation globale.",
        },
        {
          question: "Combien de temps prend une rénovation énergétique de copropriété ?",
          answer:
            "De la décision d'audit au chantier terminé : 24 à 36 mois en moyenne. Audit (3 mois), votes en AG (6-12 mois selon AG), conception et consultation entreprises (6 mois), travaux (6-12 mois selon ampleur). Nous conseillons d'enchaîner audit et études dès le vote initial pour ne pas perdre de temps.",
        },
        {
          question: "Faut-il l'accord de l'architecte des Bâtiments de France ?",
          answer:
            "Oui, pour la majorité des immeubles parisiens situés en secteur sauvegardé, en abord de monument historique ou inscrits à l'inventaire. Toute modification de façade (ITE, menuiseries, garde-corps) passe par une validation ABF. Nous intégrons cette dimension dès l'esquisse et préparons les pièces graphiques pour l'instruction.",
        },
        {
          question: "Peut-on rénover sans isoler par l'extérieur à Paris ?",
          answer:
            "Oui, et c'est même la règle pour la majorité des immeubles haussmanniens où l'ITE est impossible. On combine alors ITI optimisée (8 à 14 cm selon contraintes), MTA double vitrage performant, isolation des combles et des planchers bas, refonte de la ventilation. Une rénovation BBC est tout à fait atteignable sans toucher à la façade.",
        },
        {
          question: "Comment financer la rénovation sans surcharger les charges de copropriété ?",
          answer:
            "Trois leviers : (1) maximiser les aides cumulables (MaPrimeRénov' Copro + CEE + Éco-rénovons Paris+) qui couvrent 30 à 60 % du coût ; (2) souscrire un Éco-PTZ collectif sur 15 à 20 ans pour étaler le reste à charge ; (3) phaser les travaux sur 3-5 ans en commençant par les leviers à plus fort ROI. Notre équipe optimise ce montage avec votre syndic.",
        },
      ]}
      related={[
        { href: "/audit-energetique-paris", label: "Audit énergétique à Paris" },
        { href: "/bureau-etude-thermique-ile-de-france", label: "Bureau d'étude thermique IDF" },
        { href: "/bureau-d-etude-renovation-energetique", label: "Bureau d'étude rénovation énergétique" },
        { href: "/accompagnement-cee", label: "Accompagnement CEE" },
        { href: "/nos-references", label: "Nos références" },
        { href: "/contactez-nous", label: "Démarrer un projet" },
      ]}
    />
  );
}
