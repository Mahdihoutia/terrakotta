import LocalSeoLayout from "@/components/site/LocalSeoLayout";

export default function AuditEnergetiqueParisPage() {
  return (
    <LocalSeoLayout
      eyebrow="Audit énergétique Paris"
      h1="Audit énergétique à Paris : copropriétés, tertiaire et particuliers"
      intro="Kilowater est un bureau d'étude basé dans le 7e arrondissement de Paris. Nous réalisons des audits énergétiques réglementaires et stratégiques pour les copropriétés haussmanniennes, le parc tertiaire francilien et les maîtres d'ouvrage publics. Intervention rapide partout dans Paris intra-muros et la petite couronne."
      zone="Paris & Île-de-France"
      zoneDescription="Une ville de bâti ancien — 80 % des immeubles parisiens sont antérieurs à 1975. C'est aussi un terrain réglementaire dense : décret tertiaire, loi Climat & Résilience, plan climat de la Ville de Paris. Nos audits transforment ces obligations en plan d'action concret."
      serviceName="Audit énergétique"
      canonical="https://www.kilowater.fr/audit-energetique-paris"
      keyPoints={[
        {
          title: "Bureau d'étude implanté à Paris 7e",
          description: "115 rue Saint-Dominique. Une équipe locale, disponible pour visite sur site sous 5 jours ouvrés.",
        },
        {
          title: "Toutes typologies de bâtiments",
          description: "Copropriété, tertiaire, ERP, logement social, patrimoine haussmannien — chaque audit s'adapte au contexte.",
        },
        {
          title: "Conformité réglementaire",
          description: "Décret tertiaire (OPERAT), audit énergétique loi Climat 2024, audit incitatif MaPrimeRénov' Copropriété.",
        },
      ]}
      contentSections={[
        {
          title: "Pourquoi faire auditer son bâtiment à Paris ?",
          body: (
            <>
              <p>
                Paris concentre une part importante du parc immobilier énergivore français : immeubles haussmanniens
                aux performances thermiques modestes (étiquette E à G fréquente), bureaux assujettis au décret
                tertiaire, copropriétés sous obligation d&apos;audit énergétique tous les 10 ans depuis le 1<sup>er</sup> janvier 2024.
              </p>
              <p>
                L&apos;audit énergétique est <strong>l&apos;étape préalable indispensable</strong> avant tout projet
                de rénovation. Il dresse l&apos;état des lieux thermique du bâti, hiérarchise les leviers
                d&apos;économies d&apos;énergie et chiffre les scénarios de travaux avec leurs aides associées
                (MaPrimeRénov&apos;, CEE, Éco-PTZ collectif).
              </p>
            </>
          ),
        },
        {
          title: "Notre méthodologie d'audit énergétique",
          body: (
            <>
              <p>
                Chaque mission Kilowater suit une démarche en 4 phases conforme aux référentiels OPQIBI et RGE Études&nbsp;:
              </p>
              <ol style={{ listStyle: "decimal", paddingLeft: "1.25rem", margin: "0.75rem 0" }}>
                <li><strong>Visite sur site et collecte</strong> : relevés, factures énergétiques, plans, entretiens occupants.</li>
                <li><strong>Modélisation thermique</strong> sous logiciel certifié (méthode TH-CE-Ex / RT Existant).</li>
                <li><strong>Scénarios de rénovation</strong> chiffrés (BBC Rénovation, niveau réglementaire, scénario optimisé).</li>
                <li><strong>Rapport et restitution</strong> : présentation orale en assemblée générale ou comité de pilotage.</li>
              </ol>
            </>
          ),
        },
        {
          title: "Audit énergétique copropriété à Paris",
          body: (
            <>
              <p>
                Depuis le 1<sup>er</sup> janvier 2024, toute copropriété de plus de 50 lots ou dont le permis de construire
                a été déposé avant le 1<sup>er</sup> juin 2001 doit réaliser un audit énergétique. Cette obligation
                s&apos;élargit progressivement à toutes les copropriétés.
              </p>
              <p>
                Nous accompagnons les conseils syndicaux et syndics parisiens (Foncia, Citya, Loiselet & Daigremont,
                cabinets indépendants) dans la préparation, la réalisation et la restitution en AG. Notre équipe
                connaît finement les contraintes du bâti haussmannien (ITE impossible, ITI maîtrisée, fenêtres bois
                d&apos;origine, planchers bas sur cave).
              </p>
            </>
          ),
        },
      ]}
      faq={[
        {
          question: "Combien coûte un audit énergétique à Paris ?",
          answer:
            "Le coût d'un audit énergétique varie selon la typologie : entre 800 € et 1 500 € pour une maison individuelle, entre 5 000 € et 15 000 € pour une copropriété selon sa taille, et de 8 000 € à 30 000 € pour un bâtiment tertiaire. Une partie est financée par MaPrimeRénov' Copropriété ou les CEE selon les cas.",
        },
        {
          question: "L'audit énergétique est-il obligatoire pour ma copropriété parisienne ?",
          answer:
            "Depuis 2024, toute copropriété de plus de 50 lots est soumise à l'obligation d'audit énergétique tous les 10 ans. À partir de 2025, ce seuil descend à 200 lots et tend vers une généralisation. À Paris, la majorité des copropriétés haussmanniennes sont concernées.",
        },
        {
          question: "Quels arrondissements de Paris couvrez-vous ?",
          answer:
            "Tous les arrondissements de Paris (1er au 20e) ainsi que la petite couronne (92, 93, 94). Notre bureau est situé rue Saint-Dominique dans le 7e arrondissement, ce qui nous permet d'intervenir rapidement sur l'ensemble de l'agglomération parisienne.",
        },
        {
          question: "Quelle est la différence entre un audit énergétique et un DPE ?",
          answer:
            "Le DPE est une simple étiquette informative produite à partir d'une visite courte. L'audit énergétique est une étude approfondie : modélisation thermique du bâtiment, scénarios chiffrés de travaux, hiérarchisation des priorités, plan de financement. C'est un document opérationnel destiné à décider des travaux.",
        },
        {
          question: "Combien de temps prend un audit énergétique ?",
          answer:
            "Pour une copropriété parisienne classique : 6 à 10 semaines entre la visite sur site et la remise du rapport final. Nous adaptons le planning aux échéances d'AG. Pour un bâtiment tertiaire complexe, prévoir 2 à 4 mois.",
        },
      ]}
      related={[
        { href: "/audit-energetique", label: "Audit énergétique (page complète)" },
        { href: "/bureau-etude-thermique-ile-de-france", label: "Bureau d'étude thermique Île-de-France" },
        { href: "/renovation-energetique-paris", label: "Rénovation énergétique à Paris" },
        { href: "/accompagnement-cee", label: "Accompagnement CEE" },
        { href: "/nos-references", label: "Nos références" },
        { href: "/contactez-nous", label: "Demander un devis" },
      ]}
    />
  );
}
