import type { Locale } from "../config";

/**
 * Contenu de la page « Accompagnement CEE » (FR = source).
 * Les passages entre `**` sont rendus en gras (cf. `components/site/Emphasis.tsx`).
 */
const fr = {
  hero: {
    eyebrow: "Aides financières",
    title: "Accompagnement CEE : dossiers et fiches d'opérations",
    intro:
      "Les certificats d'économies d'énergie (CEE) constituent l'un des principaux leviers de financement de la rénovation énergétique en France. Pourtant, la complexité des fiches standardisées, le calcul des kWh cumac et les exigences administratives des obligés découragent souvent les maîtres d'ouvrage. Kilowater prend en charge l'intégralité du parcours : de l'identification des fiches applicables jusqu'au versement de la prime énergie, en passant par le calcul précis des volumes et le montage du dossier.",
    cta: "Évaluer mon potentiel CEE",
  },
  scheme: {
    eyebrow: "Le dispositif",
    title: "Qu'est-ce que les certificats d'économies d'énergie ?",
    columns: [
      [
        "Le dispositif des certificats d'économies d'énergie, instauré par la loi POPE de 2005, oblige les grandes entreprises de l'énergie — appelées les **obligés** (EDF, Engie, Total Énergies, TotalEnergies Marketing France…) — à promouvoir activement l'efficacité énergétique auprès de leurs clients. Pour satisfaire leurs obligations, ces acteurs financent des travaux d'économies d'énergie réalisés par des tiers, en échange de quoi ils reçoivent des certificats attestant des économies générées.",
        "Chaque certificat représente 1 kWh cumac — c'est-à-dire 1 kilowattheure d'énergie finale économisé, **cumulé sur la durée de vie de l'équipement** et actualisé à un taux de 4 % par an. Concrètement, une isolation de combles génère plusieurs dizaines de milliers de kWh cumac, et chaque MWh cumac se négocie entre 5 et 10 € selon les conditions de marché.",
      ],
      [
        "Pour structurer ce système, le ministère chargé de l'énergie publie un catalogue de **fiches d'opérations standardisées**, classées par secteur (résidentiel, tertiaire, industriel, agricole, transport, réseaux) et par type de travaux. Chaque fiche définit les conditions d'éligibilité, les critères techniques à respecter et la formule de calcul des kWh cumac générés.",
        "Nous sommes actuellement dans la **6ᵉ période CEE (P6), qui court de 2026 à 2030**. L'objectif national fixé pour cette période est de **5 250 TWh cumac**, un niveau d'ambition inédit qui témoigne de la montée en puissance du dispositif. Cette période introduit de nouvelles fiches et révise certains calculs, rendant l'accompagnement par un bureau d'étude CEE plus que jamais nécessaire pour sécuriser vos dossiers.",
      ],
    ],
  },
  catalogue: {
    eyebrow: "Catalogue opérations",
    title: "Fiches CEE courantes",
    intro:
      "Kilowater maîtrise l'ensemble des fiches standardisées du catalogue. Voici les opérations les plus fréquemment valorisées dans les secteurs résidentiel et tertiaire.",
    residential: {
      heading: "Habitat collectif (copropriétés, bailleurs) — Fiches BAR-TH / BAR-EN",
      fiches: [
        { code: "BAR-TH-171", name: "Pompe à chaleur air/eau", description: "Installation d'une PAC air/eau pour le chauffage des logements en habitat collectif." },
        { code: "BAR-TH-159", name: "PAC collectif", description: "Pompe à chaleur collective pour immeubles ou copropriétés." },
        { code: "BAR-EN-101", name: "Isolation des combles", description: "Isolation thermique des combles perdus ou aménagés par soufflage ou projection." },
        { code: "BAR-EN-102", name: "Isolation des murs", description: "Isolation thermique des murs par l'intérieur ou par l'extérieur (ITE)." },
        { code: "BAR-EN-103", name: "Isolation du plancher bas", description: "Isolation thermique du plancher bas sur sous-sol, cave ou vide sanitaire." },
      ],
    },
    tertiary: {
      heading: "Secteur tertiaire — Fiches BAT-TH",
      fiches: [
        { code: "BAT-TH-116", name: "Système de régulation", description: "Mise en place d'un système de régulation performant sur installation de chauffage." },
        { code: "BAT-TH-134", name: "Ventilateur à variation de vitesse", description: "Remplacement de moteurs de ventilateurs par des moteurs à haute efficacité avec VEV." },
        { code: "BAT-TH-139", name: "Récupération chaleur sur froid", description: "Récupération de chaleur sur les condenseurs de groupes froid pour la production d'eau chaude." },
        { code: "BAT-TH-142", name: "Déstratificateur de chaleur", description: "Installation de déstratificateurs dans les locaux à grande hauteur sous plafond." },
        { code: "BAT-TH-163", name: "PAC tertiaire", description: "Pompe à chaleur pour le chauffage ou la climatisation de locaux tertiaires." },
      ],
    },
    industry: {
      heading: "Secteur industriel — Fiches IND-UT / IND-BA",
      fiches: [
        { code: "IND-UT-102", name: "Système de variation de vitesse", description: "Installation d'un variateur électronique de vitesse sur un moteur asynchrone existant." },
        { code: "IND-UT-104", name: "Compresseur d'air à vitesse variable", description: "Remplacement d'un compresseur d'air à vitesse fixe par un compresseur à vitesse variable." },
        { code: "IND-UT-116", name: "Système de récupération de chaleur", description: "Récupération de chaleur fatale sur un process industriel pour le chauffage ou le préchauffage." },
        { code: "IND-UT-117", name: "Brûleur micro-modulant", description: "Remplacement d'un brûleur de chaudière industrielle par un brûleur micro-modulant haut rendement." },
        { code: "IND-BA-112", name: "Isolation des réseaux hydrauliques", description: "Mise en place d'une isolation sur les réseaux hydrauliques de chauffage ou de froid industriel." },
      ],
    },
  },
  method: {
    eyebrow: "Méthode",
    title: "Notre accompagnement",
    intro:
      "Un accompagnement CEE réussi repose sur la rigueur à chaque étape. Notre bureau d'étude prend en charge l'intégralité du processus, de l'évaluation initiale à la réception de la prime énergie.",
    steps: [
      {
        title: "Audit de votre situation et éligibilité",
        description:
          "Nous analysons votre situation : type de bâtiment, travaux envisagés, statut (copropriété, bailleur, entreprise tertiaire, industriel, collectivité) et vérifions votre éligibilité aux différentes fiches CEE applicables.",
      },
      {
        title: "Identification des fiches CEE applicables",
        description:
          "Parmi les centaines de fiches standardisées du catalogue CEE, nous sélectionnons celles qui correspondent précisément à vos travaux et maximisent le volume de kWh cumac valorisables.",
      },
      {
        title: "Calcul des volumes kWh cumac",
        description:
          "Nous appliquons les formules réglementaires de chaque fiche pour calculer précisément le volume de kWh cumac générés. Ce calcul tient compte des facteurs spécifiques à votre projet : zone climatique, surface, puissance, etc.",
      },
      {
        title: "Montage du dossier et relation avec l'obligé",
        description:
          "Nous constituons le dossier administratif complet et assurons la relation avec l'obligé (fournisseur d'énergie ou délégataire). Nous vérifions la conformité des pièces justificatives et facilitons la validation du dossier.",
      },
      {
        title: "Suivi jusqu'au versement de la prime",
        description:
          "Nous assurons le suivi de votre dossier jusqu'au versement effectif de la prime CEE, en répondant aux éventuelles demandes de compléments et en vous tenant informé à chaque étape.",
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Questions fréquentes",
    intro:
      "Tout ce que vous devez savoir sur les certificats d'économies d'énergie avant de lancer votre dossier.",
    items: [
      {
        question: "Qui peut bénéficier des CEE ?",
        answer:
          "Kilowater accompagne exclusivement les acteurs professionnels : syndicats de copropriétés, bailleurs sociaux et privés, entreprises du secteur tertiaire, industriels et collectivités. La condition principale est que les travaux réalisés correspondent à une fiche d'opération standardisée du catalogue officiel (fiches BAT-TH pour le tertiaire, BAR-TH pour l'habitat collectif, IND pour l'industrie).",
      },
      {
        question: "Quels travaux sont éligibles aux CEE ?",
        answer:
          "Sont éligibles les travaux figurant dans le catalogue des fiches d'opérations standardisées : isolation thermique (combles, murs, planchers), remplacement de systèmes de chauffage (chaudières, pompes à chaleur), optimisation de la ventilation et du refroidissement, éclairage performant, régulation et automatisation des bâtiments, ou encore récupération d'énergie. Le catalogue est régulièrement mis à jour et compte aujourd'hui plus de 200 fiches réparties entre les secteurs résidentiel, tertiaire, industriel, agricole et transport.",
      },
      {
        question: "Comment sont calculés les kWh cumac ?",
        answer:
          "Le kWh cumac (cumulé et actualisé) est l'unité de mesure des certificats d'économies d'énergie. Il représente l'énergie économisée sur la durée de vie de l'équipement installé, actualisée à un taux de 4 % par an. Pour chaque fiche, une formule de calcul précise intègre plusieurs paramètres : la surface ou la puissance de l'équipement, la zone climatique du bâtiment, un coefficient de précarité énergétique le cas échéant, et la durée de vie conventionnelle de l'opération. Ces formules sont fixées par arrêté et s'appliquent de façon identique pour tous les acteurs.",
      },
      {
        question: "Peut-on cumuler les CEE avec d'autres aides B2B ?",
        answer:
          "Oui, dans la grande majorité des cas, les CEE se cumulent avec les autres dispositifs destinés aux professionnels : MaPrimeRénov' Copropriétés, Éco-PTZ collectif, Fonds Chaleur de l'ADEME, aides régionales aux entreprises et collectivités, et TVA réduite tertiaire lorsqu'elle s'applique. Les CEE sont des primes versées par les fournisseurs d'énergie (les obligés) en contrepartie des économies générées ; leur articulation avec les autres aides est soumise à conditions et plafonds. Nous optimisons l'ensemble du montage financier pour maximiser votre valorisation.",
      },
      {
        question: "Quel est le délai pour obtenir la prime CEE ?",
        answer:
          "La durée de traitement d'un dossier CEE varie selon l'obligé ou le délégataire et la complexité du dossier. En pratique, il faut compter entre 1 et 4 mois après la réception du dossier complet pour obtenir le versement de la prime. Pour les opérations spécifiques (hors catalogue) ou les dossiers volumineux dans le secteur industriel, les délais peuvent être plus longs. L'engagement de l'obligé doit intervenir avant le début des travaux, ce qui impose d'anticiper le montage du dossier.",
      },
      {
        question: "Qu'est-ce que la 6ᵉ période CEE (P6) ?",
        answer:
          "La 6ᵉ période des certificats d'économies d'énergie (P6) court du 1ᵉʳ janvier 2026 au 31 décembre 2030. L'objectif national fixé par les pouvoirs publics est de 5 250 TWh cumac d'économies d'énergie à réaliser sur cette période, ce qui représente une hausse significative par rapport aux périodes précédentes. Cette ambition accrue se traduit par de nouvelles fiches d'opérations, des évolutions des formules de calcul existantes et une vigilance renforcée sur la qualité des dossiers. Kilowater suit en permanence ces évolutions réglementaires pour vous garantir des dossiers conformes et optimisés.",
      },
    ],
  },
  cta: {
    eyebrow: "Passez à l'action",
    title: "Évaluons ensemble votre potentiel CEE",
    text: "Vous avez un projet de rénovation énergétique et souhaitez savoir quelles fiches CEE sont applicables, quel volume de kWh cumac vous pouvez valoriser et quelle prime énergie vous pouvez espérer obtenir ? Contactez Kilowater pour un premier échange gratuit.",
    button: "Discutons de votre projet",
  },
  related: {
    title: "Compléter votre projet",
    subtitle:
      "Le dispositif CEE s'articule avec d'autres expertises pour maximiser la performance et le financement de votre rénovation.",
    decarbonation: {
      eyebrow: "Pilier 2",
      title: "Conseil en décarbonation",
      description:
        "Après l'audit CEE, structurer votre trajectoire bas carbone : bilan carbone, SBTi, conformité CSRD et décret tertiaire.",
    },
    brokerage: {
      eyebrow: "Pilier 3",
      title: "Courtage environnemental",
      description:
        "Valorisez vos actifs : crédits carbone volontaires, garanties d'origine et biotickets, avec une sélection exigeante des projets.",
    },
    references: {
      eyebrow: "Réalisations",
      title: "Nos références CEE",
      description:
        "Découvrez des dossiers réels accompagnés et financés via les Certificats d'Économies d'Énergie.",
    },
  },
};

export type CeeContent = typeof fr;

const en: CeeContent = {
  hero: {
    eyebrow: "Funding schemes",
    title: "Energy Efficiency Certificates (EEC): applications and standard operations",
    intro:
      "France's Energy Efficiency Certificates scheme (EEC) is one of the main funding levers for energy renovation in the country. Yet the complexity of standardised operation sheets, kWh cumac calculations and the administrative requirements of obligated parties often discourage project owners. Kilowater handles the entire process: from identifying the applicable operation sheets to payment of the incentive, including accurate volume calculations and application filing.",
    cta: "Assess my EEC potential",
  },
  scheme: {
    eyebrow: "The scheme",
    title: "What are Energy Efficiency Certificates?",
    columns: [
      [
        "The Energy Efficiency Certificates scheme, introduced by France's 2005 POPE Act, requires major energy companies — known as **obligated parties** (EDF, Engie, TotalEnergies…) — to actively promote energy efficiency among their customers. To meet their obligations, these companies fund energy-saving works carried out by third parties, and in return receive certificates attesting to the savings achieved.",
        "Each certificate represents 1 kWh cumac — that is, 1 kilowatt-hour of final energy saved, **accumulated over the lifetime of the equipment** and discounted at 4% per year. In practice, loft insulation generates tens of thousands of kWh cumac, and each MWh cumac trades at €5 to €10 depending on market conditions.",
      ],
      [
        "To structure the system, the French ministry in charge of energy publishes a catalogue of **standardised operation sheets**, organised by sector (residential, commercial, industrial, agricultural, transport, networks) and type of works. Each sheet sets out eligibility conditions, technical criteria and the formula for calculating the kWh cumac generated.",
        "We are currently in the **6th EEC period (P6), running from 2026 to 2030**. The national target for this period is **5,250 TWh cumac**, an unprecedented level of ambition that reflects the growing importance of the scheme. This period introduces new operation sheets and revises some calculations, making expert EEC support more necessary than ever to secure your applications.",
      ],
    ],
  },
  catalogue: {
    eyebrow: "Operations catalogue",
    title: "Common EEC operation sheets",
    intro:
      "Kilowater masters the full catalogue of standardised operation sheets. Here are the operations most frequently monetised in the residential, commercial and industrial sectors.",
    residential: {
      heading: "Multi-unit housing (co-ownerships, landlords) — BAR-TH / BAR-EN sheets",
      fiches: [
        { code: "BAR-TH-171", name: "Air-to-water heat pump", description: "Installation of an air-to-water heat pump for heating apartments in multi-unit buildings." },
        { code: "BAR-TH-159", name: "Collective heat pump", description: "Collective heat pump for apartment buildings or co-ownerships." },
        { code: "BAR-EN-101", name: "Loft insulation", description: "Thermal insulation of unused or converted lofts by blowing or spraying." },
        { code: "BAR-EN-102", name: "Wall insulation", description: "Internal or external wall insulation (EWI)." },
        { code: "BAR-EN-103", name: "Floor insulation", description: "Thermal insulation of ground floors above basements, cellars or crawl spaces." },
      ],
    },
    tertiary: {
      heading: "Commercial buildings — BAT-TH sheets",
      fiches: [
        { code: "BAT-TH-116", name: "Control system", description: "Installation of a high-performance control system on a heating installation." },
        { code: "BAT-TH-134", name: "Variable-speed fans", description: "Replacement of fan motors with high-efficiency motors with variable speed drives." },
        { code: "BAT-TH-139", name: "Heat recovery from cooling", description: "Heat recovery from chiller condensers for hot water production." },
        { code: "BAT-TH-142", name: "Heat destratifier", description: "Installation of destratifiers in high-ceiling spaces." },
        { code: "BAT-TH-163", name: "Commercial heat pump", description: "Heat pump for heating or cooling commercial premises." },
      ],
    },
    industry: {
      heading: "Industry — IND-UT / IND-BA sheets",
      fiches: [
        { code: "IND-UT-102", name: "Variable speed drive", description: "Installation of an electronic variable speed drive on an existing asynchronous motor." },
        { code: "IND-UT-104", name: "Variable-speed air compressor", description: "Replacement of a fixed-speed air compressor with a variable-speed compressor." },
        { code: "IND-UT-116", name: "Heat recovery system", description: "Recovery of waste heat from an industrial process for heating or preheating." },
        { code: "IND-UT-117", name: "Micro-modulating burner", description: "Replacement of an industrial boiler burner with a high-efficiency micro-modulating burner." },
        { code: "IND-BA-112", name: "Pipework insulation", description: "Insulation of industrial heating or cooling pipework." },
      ],
    },
  },
  method: {
    eyebrow: "Method",
    title: "How we support you",
    intro:
      "Successful EEC support relies on rigour at every stage. Our engineering team manages the entire process, from initial assessment to receipt of the incentive.",
    steps: [
      {
        title: "Assessment of your situation and eligibility",
        description:
          "We analyse your situation: building type, planned works, status (co-ownership, landlord, commercial business, industrial company, local authority) and check your eligibility for the applicable EEC operation sheets.",
      },
      {
        title: "Identification of applicable operation sheets",
        description:
          "From the hundreds of standardised sheets in the EEC catalogue, we select those that precisely match your works and maximise the volume of kWh cumac that can be monetised.",
      },
      {
        title: "kWh cumac volume calculation",
        description:
          "We apply the regulatory formula of each sheet to accurately calculate the kWh cumac generated, taking into account project-specific factors: climate zone, floor area, power output, etc.",
      },
      {
        title: "Application filing and liaison with the obligated party",
        description:
          "We prepare the complete application file and manage the relationship with the obligated party (energy supplier or delegate). We check the compliance of supporting documents and facilitate approval.",
      },
      {
        title: "Follow-up until incentive payment",
        description:
          "We follow your application through to actual payment of the EEC incentive, handling any requests for additional information and keeping you informed at every step.",
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Frequently asked questions",
    intro: "Everything you need to know about Energy Efficiency Certificates before starting your application.",
    items: [
      {
        question: "Who can benefit from EEC?",
        answer:
          "Kilowater works exclusively with professional clients: co-ownership associations, social and private landlords, commercial businesses, industrial companies and local authorities. The main condition is that the works match a standardised operation sheet in the official catalogue (BAT-TH sheets for commercial buildings, BAR-TH for multi-unit housing, IND for industry).",
      },
      {
        question: "Which works are eligible for EEC?",
        answer:
          "Eligible works are those listed in the catalogue of standardised operation sheets: thermal insulation (lofts, walls, floors), replacement of heating systems (boilers, heat pumps), ventilation and cooling optimisation, efficient lighting, building controls and automation, and energy recovery. The catalogue is updated regularly and now includes more than 200 sheets across the residential, commercial, industrial, agricultural and transport sectors.",
      },
      {
        question: "How are kWh cumac calculated?",
        answer:
          "The kWh cumac (cumulative and discounted) is the unit of measurement for Energy Efficiency Certificates. It represents the energy saved over the lifetime of the installed equipment, discounted at 4% per year. Each sheet has a precise formula that takes into account several parameters: equipment surface area or power, the building's climate zone, a fuel poverty coefficient where applicable, and the conventional lifetime of the operation. These formulas are set by ministerial order and apply identically to all market players.",
      },
      {
        question: "Can EEC be combined with other B2B funding schemes?",
        answer:
          "Yes, in the vast majority of cases EEC can be combined with other French schemes for professionals: MaPrimeRénov' Copropriétés (co-ownership renovation grant), collective Éco-PTZ (zero-interest eco-loan), ADEME Heat Fund (Fonds Chaleur), regional grants for businesses and local authorities, and reduced VAT for commercial buildings where applicable. EEC incentives are paid by energy suppliers (obligated parties) in exchange for the savings generated; combining them with other schemes is subject to conditions and caps. We optimise the entire financing structure to maximise your returns.",
      },
      {
        question: "How long does it take to receive the EEC incentive?",
        answer:
          "Processing time for an EEC application depends on the obligated party or delegate and the complexity of the file. In practice, expect 1 to 4 months after submission of a complete file for the incentive to be paid. For specific (non-catalogue) operations or large industrial applications, timelines may be longer. The obligated party's commitment must be secured before works begin, so the application needs to be prepared in advance.",
      },
      {
        question: "What is the 6th EEC period (P6)?",
        answer:
          "The 6th Energy Efficiency Certificates period (P6) runs from 1 January 2026 to 31 December 2030. The national target set by the French authorities is 5,250 TWh cumac of energy savings over this period, a significant increase on previous periods. This higher ambition brings new operation sheets, changes to existing calculation formulas and closer scrutiny of application quality. Kilowater continuously monitors these regulatory changes to ensure your applications are compliant and optimised.",
      },
    ],
  },
  cta: {
    eyebrow: "Take action",
    title: "Let's assess your EEC potential together",
    text: "Planning an energy renovation project and want to know which EEC operation sheets apply, how many kWh cumac you can monetise and what incentive you can expect? Contact Kilowater for a free initial discussion.",
    button: "Let's discuss your project",
  },
  related: {
    title: "Complete your project",
    subtitle:
      "The EEC scheme works alongside other areas of expertise to maximise the performance and funding of your renovation.",
    decarbonation: {
      eyebrow: "Pillar 2",
      title: "Decarbonisation advisory",
      description:
        "After the EEC audit, structure your low-carbon pathway: carbon footprint, SBTi, CSRD and French Tertiary Decree compliance.",
    },
    brokerage: {
      eyebrow: "Pillar 3",
      title: "Environmental brokerage",
      description:
        "Monetise your assets: voluntary carbon credits, Guarantees of Origin and biotickets, with rigorous project selection.",
    },
    references: {
      eyebrow: "Track record",
      title: "Our EEC projects",
      description: "Explore real projects supported and funded through Energy Efficiency Certificates.",
    },
  },
};

export const CEE_CONTENT: Record<Locale, CeeContent> = { fr, en };
