import LocalSeoLayout from "@/components/site/LocalSeoLayout";

export default function BureauEtudeThermiqueIDFPage() {
  return (
    <LocalSeoLayout
      eyebrow="Bureau d'étude thermique IDF"
      h1="Bureau d'étude thermique en Île-de-France"
      intro="Kilowater est un bureau d'étude thermique implanté à Paris, intervenant sur l'ensemble de l'Île-de-France. Nous accompagnons promoteurs, architectes, maîtres d'ouvrage publics et copropriétés sur leurs études RE2020, simulations thermiques dynamiques, ACV et audits réglementaires."
      zone="Île-de-France"
      zoneDescription="L'Île-de-France concentre les chantiers les plus exigeants : ZAC du Grand Paris, projets tertiaires HQE/BREEAM, copropriétés contraintes, patrimoine ABF. Notre équipe maîtrise les référentiels RE2020, RT Existant, BBC Effinergie, et travaille avec les principaux logiciels du marché (Pleiades, Climawin, Perrenoud)."
      serviceName="Bureau d'étude thermique"
      canonical="https://www.kilowater.fr/bureau-etude-thermique-ile-de-france"
      keyPoints={[
        {
          title: "Études RE2020 neuf et tertiaire",
          description: "Calculs Bbio, Cep, DH, IcEnergie, IcConstruction. Attestations PC1 et PC2. Optimisation sobriété et carbone.",
        },
        {
          title: "Simulations thermiques dynamiques",
          description: "STD horaires sous Pleiades / EnergyPlus pour valider confort d'été, surchauffes et stratégies passives.",
        },
        {
          title: "Toute l'Île-de-France",
          description: "Paris (75), Hauts-de-Seine (92), Seine-Saint-Denis (93), Val-de-Marne (94), Essonne (91), Yvelines (78), Val-d'Oise (95), Seine-et-Marne (77).",
        },
      ]}
      contentSections={[
        {
          title: "Nos missions de bureau d'étude thermique",
          body: (
            <>
              <p>
                En tant que bureau d&apos;étude thermique, nous couvrons l&apos;ensemble du cycle de conception et
                de rénovation des bâtiments&nbsp;:
              </p>
              <ul style={{ listStyle: "disc", paddingLeft: "1.25rem", margin: "0.75rem 0" }}>
                <li><strong>Études RE2020</strong> : attestations PC, optimisation Bbio, vérification Cep,nr et IcConstruction.</li>
                <li><strong>RT Existant</strong> : étude thermique pour rénovations soumises à la RT par éléments ou globale.</li>
                <li><strong>ACV bâtiment</strong> : analyses du cycle de vie, FDES, fiche carbone projet.</li>
                <li><strong>STD</strong> : simulations dynamiques pour confort d&apos;été et besoins de chauffage/climatisation.</li>
                <li><strong>Étude solaire et bioclimatique</strong> : héliodons, masques, exploitation des apports gratuits.</li>
                <li><strong>Audit énergétique</strong> : copropriété, tertiaire, réglementaire, incitatif.</li>
              </ul>
            </>
          ),
        },
        {
          title: "Pourquoi choisir Kilowater en Île-de-France ?",
          body: (
            <>
              <p>
                <strong>Proximité.</strong> Notre équipe est basée à Paris 7e. Nous nous déplaçons sur site dans
                toute l&apos;Île-de-France sans surcoût de déplacement déraisonnable.
              </p>
              <p>
                <strong>Réactivité.</strong> Pré-études thermiques en moins de 5 jours ouvrés sur projets neufs.
                Audits énergétiques copropriété rendus en 6 à 10 semaines.
              </p>
              <p>
                <strong>Connaissance du contexte local.</strong> ZAC du Grand Paris, ABF parisiens, plan climat de
                la Ville de Paris, schéma directeur de la Région — autant de contraintes que nous intégrons
                nativement dans nos études.
              </p>
            </>
          ),
        },
        {
          title: "Avec qui travaillons-nous ?",
          body: (
            <>
              <p>
                Nos clients réguliers en Île-de-France&nbsp;:
              </p>
              <ul style={{ listStyle: "disc", paddingLeft: "1.25rem", margin: "0.75rem 0" }}>
                <li>Architectes et agences d&apos;architecture (Paris, Boulogne, Saint-Denis)</li>
                <li>Promoteurs immobiliers tertiaires et résidentiels</li>
                <li>Bailleurs sociaux et offices HLM franciliens</li>
                <li>Syndics de copropriété (Foncia, Citya, indépendants)</li>
                <li>Collectivités et établissements publics (mairies, EPT, SEM)</li>
                <li>Maîtres d&apos;ouvrage privés (foncières, family offices)</li>
              </ul>
            </>
          ),
        },
      ]}
      faq={[
        {
          question: "Quelle est la différence entre un bureau d'étude thermique et un thermicien ?",
          answer:
            "Un thermicien est l'ingénieur qui réalise les calculs thermiques. Un bureau d'étude thermique regroupe une équipe de thermiciens, ingénieurs énergéticiens et techniciens, avec des outils logiciels et des qualifications collectives (RGE, OPQIBI). Pour un projet d'envergure, un bureau d'étude apporte la profondeur d'expertise et la continuité de service.",
        },
        {
          question: "Combien coûte une étude thermique RE2020 en Île-de-France ?",
          answer:
            "Pour une maison individuelle neuve : entre 1 200 € et 2 500 € selon la complexité. Pour un logement collectif : à partir de 4 000 € HT. Pour un bâtiment tertiaire : à partir de 8 000 € HT. Le coût dépend du nombre de zones thermiques, de la complexité géométrique et des prestations associées (ACV, STD, optimisation).",
        },
        {
          question: "Êtes-vous qualifiés RGE ?",
          answer:
            "Oui, Kilowater détient les qualifications RGE Études (audits énergétiques) et OPQIBI 1905 (audit énergétique tertiaire). Ces qualifications sont indispensables pour faire bénéficier nos clients des aides MaPrimeRénov' et CEE.",
        },
        {
          question: "Travaillez-vous avec les architectes en phase APS ?",
          answer:
            "Oui, nous intervenons dès l'esquisse / APS pour orienter les choix architecturaux (orientation, ratios vitrés, inertie, enveloppe) selon une logique bioclimatique. Plus l'intervention est précoce, plus l'optimisation thermique et carbone est efficace.",
        },
      ]}
      related={[
        { href: "/bureau-d-etude-thermique", label: "Bureau d'étude thermique (page complète)" },
        { href: "/audit-energetique-paris", label: "Audit énergétique à Paris" },
        { href: "/renovation-energetique-paris", label: "Rénovation énergétique à Paris" },
        { href: "/audit-energetique", label: "Audit énergétique" },
        { href: "/nos-prestations", label: "Toutes nos prestations" },
        { href: "/contactez-nous", label: "Demander un devis" },
      ]}
    />
  );
}
