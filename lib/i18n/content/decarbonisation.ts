import type { Locale } from "../config";

/** Contenu de la page « Conseil en décarbonation » (FR = source). */
const fr = {
  hero: {
    imageAlt: "Trajectoire de décarbonation — paysage et énergie",
    eyebrow: "Pilier 2 — Décarbonation",
    title: "Conseil en",
    titleAccent: "décarbonation",
    intro:
      "Mesurer votre empreinte, structurer une trajectoire de réduction crédible et vous mettre en conformité avec vos obligations. La montée en gamme naturelle après l'audit CEE, à l'échelle d'un bâtiment comme d'un parc immobilier.",
    cta: "Nous contacter",
  },
  offer: {
    eyebrow: "Notre accompagnement",
    title: "De la mesure",
    titleAccent: " à l'action",
    items: {
      footprint: {
        title: "Bilan carbone scopes 1, 2 & 3",
        desc: "Mesure de votre empreinte sur l'ensemble des postes d'émissions — énergie, procédés, achats, mobilité, déchets. Méthodologie ADEME (Bilan Carbone®) et Base Empreinte.",
      },
      pathway: {
        title: "Trajectoire de réduction",
        desc: "Construction d'une trajectoire crédible et chiffrée (référentiel SBTi ou équivalent), priorisation des leviers par coût d'abattement et scénarios de réduction.",
      },
      compliance: {
        title: "Conformité réglementaire",
        desc: "Mise en conformité avec vos obligations : CSRD, décret tertiaire (DEET / OPERAT / BACS), futurs seuils CSDDD. Un cadrage clair de ce qui s'applique à votre organisation.",
      },
      plan: {
        title: "Plan de décarbonation du parc",
        desc: "Déclinaison opérationnelle à l'échelle d'un bâtiment comme d'un patrimoine : plan pluriannuel, budget, jalons et suivi des gains réels dans la durée.",
      },
    },
  },
  method: {
    eyebrow: "Notre méthode",
    title: "Trois temps,",
    titleAccent: "un cap clair",
    steps: [
      {
        title: "Mesurer",
        text: "Collecte des données, calcul du bilan carbone scopes 1, 2 & 3 et identification des postes prioritaires.",
      },
      {
        title: "Structurer",
        text: "Trajectoire de réduction, cadrage réglementaire et hiérarchisation des leviers par impact et coût.",
      },
      {
        title: "Piloter",
        text: "Déploiement du plan d'action, suivi des indicateurs et reporting conforme à vos obligations.",
      },
    ],
  },
  faq: {
    eyebrow: "Questions fréquentes",
    title: "Bien comprendre",
    titleAccent: " la démarche",
    items: [
      {
        q: "Qu'est-ce qu'un bilan carbone scopes 1, 2 et 3 ?",
        a: "Le scope 1 couvre vos émissions directes (combustion sur site, flotte), le scope 2 vos émissions liées à l'énergie achetée (électricité, réseau de chaleur), et le scope 3 l'ensemble des émissions indirectes de votre chaîne de valeur (achats, fret, déplacements, usage des produits). C'est souvent le scope 3 qui pèse le plus — et celui que nous aidons à structurer.",
      },
      {
        q: "Suis-je concerné par la CSRD ?",
        a: "La CSRD s'applique progressivement aux grandes entreprises et aux PME cotées, avec des seuils d'effectif, de bilan et de chiffre d'affaires. Même non assujettie, votre organisation peut être sollicitée par ses donneurs d'ordre au titre de leur propre scope 3. Nous cadrons précisément votre situation et le niveau d'exigence attendu.",
      },
      {
        q: "Quel lien avec le décret tertiaire ?",
        a: "Le décret tertiaire (DEET) impose aux bâtiments de plus de 1 000 m² une trajectoire de réduction des consommations, avec déclaration annuelle sur OPERAT. Le conseil en décarbonation intègre cette obligation dans une stratégie plus large, articulée avec la valorisation CEE de vos travaux.",
      },
      {
        q: "En quoi est-ce complémentaire des CEE ?",
        a: "L'étude de gisement CEE finance et déclenche les actions d'efficacité énergétique ; le conseil en décarbonation élargit la perspective à l'ensemble de vos émissions et à vos obligations extra-financières. Les deux se nourrissent : un client qui réalise un audit CEE a presque toujours besoin d'un cadrage décarbonation plus large.",
      },
    ],
  },
  related: {
    title: "Explorer notre offre",
    subtitle:
      "Le conseil en décarbonation s'articule avec nos deux autres piliers pour couvrir toute la chaîne, du financement à la valorisation.",
    cee: {
      eyebrow: "Pilier 1",
      title: "Certificats d'économie d'énergie (CEE)",
      description:
        "Notre cœur de métier : audit du gisement, montage des dossiers et valorisation via mandat EMMY.",
    },
    brokerage: {
      eyebrow: "Pilier 3",
      title: "Courtage environnemental",
      description:
        "Crédits carbone volontaires, garanties d'origine et biotickets, avec une sélection exigeante des projets.",
    },
    contact: {
      eyebrow: "Échanger",
      title: "Parlons de votre trajectoire",
      description:
        "Un bilan carbone à lancer, une obligation à cadrer : notre équipe vous répond sous 48h.",
    },
  },
};

export type DecarbonisationContent = typeof fr;

const en: DecarbonisationContent = {
  hero: {
    imageAlt: "Decarbonisation pathway — landscape and energy",
    eyebrow: "Pillar 2 — Decarbonisation",
    title: "Decarbonisation",
    titleAccent: "advisory",
    intro:
      "Measure your footprint, build a credible reduction pathway and meet your regulatory obligations. The natural next step after an EEC audit, for a single building or an entire property portfolio.",
    cta: "Contact us",
  },
  offer: {
    eyebrow: "How we support you",
    title: "From measurement",
    titleAccent: " to action",
    items: {
      footprint: {
        title: "Scope 1, 2 & 3 carbon footprint",
        desc: "Measurement of your footprint across all emission sources — energy, processes, purchasing, mobility, waste. ADEME methodology (Bilan Carbone®) and Base Empreinte emission factors.",
      },
      pathway: {
        title: "Reduction pathway",
        desc: "A credible, quantified pathway (SBTi framework or equivalent), with levers prioritised by abatement cost and reduction scenarios.",
      },
      compliance: {
        title: "Regulatory compliance",
        desc: "Compliance with your obligations: CSRD, French Tertiary Decree (DEET / OPERAT / BACS), upcoming CSDDD thresholds. A clear view of what applies to your organisation.",
      },
      plan: {
        title: "Portfolio decarbonisation plan",
        desc: "Operational roll-out for a single building or a whole portfolio: multi-year plan, budget, milestones and tracking of actual savings over time.",
      },
    },
  },
  method: {
    eyebrow: "Our method",
    title: "Three stages,",
    titleAccent: "one clear direction",
    steps: [
      {
        title: "Measure",
        text: "Data collection, scope 1, 2 & 3 carbon footprint calculation and identification of priority emission sources.",
      },
      {
        title: "Structure",
        text: "Reduction pathway, regulatory framing and prioritisation of levers by impact and cost.",
      },
      {
        title: "Manage",
        text: "Action plan roll-out, KPI tracking and reporting in line with your obligations.",
      },
    ],
  },
  faq: {
    eyebrow: "Frequently asked questions",
    title: "Understanding",
    titleAccent: " the approach",
    items: [
      {
        q: "What is a scope 1, 2 and 3 carbon footprint?",
        a: "Scope 1 covers your direct emissions (on-site combustion, vehicle fleet), scope 2 your emissions from purchased energy (electricity, district heating), and scope 3 all indirect emissions across your value chain (purchasing, freight, travel, product use). Scope 3 is often the largest — and the one we help you structure.",
      },
      {
        q: "Does the CSRD apply to my organisation?",
        a: "The CSRD is being phased in for large companies and listed SMEs, based on headcount, balance sheet and turnover thresholds. Even if you are not directly in scope, your clients may ask you for data as part of their own scope 3 reporting. We assess your exact situation and the level of reporting expected.",
      },
      {
        q: "How does this relate to the French Tertiary Decree?",
        a: "The French Tertiary Decree (DEET) requires commercial buildings over 1,000 m² to follow an energy consumption reduction pathway, with annual reporting on the OPERAT platform. Our decarbonisation advisory integrates this obligation into a broader strategy, aligned with the EEC monetisation of your works.",
      },
      {
        q: "How does it complement Energy Efficiency Certificates?",
        a: "An EEC assessment funds and triggers energy efficiency measures; decarbonisation advisory widens the scope to all your emissions and non-financial reporting obligations. The two reinforce each other: a client carrying out an EEC audit almost always needs a broader decarbonisation framework.",
      },
    ],
  },
  related: {
    title: "Explore our offering",
    subtitle:
      "Decarbonisation advisory works hand in hand with our two other pillars to cover the entire chain, from funding to monetisation.",
    cee: {
      eyebrow: "Pillar 1",
      title: "Energy Efficiency Certificates (EEC)",
      description:
        "Our core business: savings potential audit, application filing and monetisation via EMMY registry mandate.",
    },
    brokerage: {
      eyebrow: "Pillar 3",
      title: "Environmental brokerage",
      description:
        "Voluntary carbon credits, Guarantees of Origin and biotickets, with rigorous project selection.",
    },
    contact: {
      eyebrow: "Let's talk",
      title: "Let's discuss your pathway",
      description:
        "A carbon footprint to launch, an obligation to clarify: our team replies within 48 hours.",
    },
  },
};

export const DECARBONISATION_CONTENT: Record<Locale, DecarbonisationContent> = { fr, en };
