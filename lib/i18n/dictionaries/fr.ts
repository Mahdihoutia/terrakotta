/**
 * Dictionnaire français — langue source du site vitrine.
 *
 * Toute clé ajoutée ici doit exister dans `en.ts` : le type `Dictionary`
 * fait échouer la compilation si une traduction manque.
 */
export const fr = {
  meta: {
    siteTitle: "Kilowater — Partenaire décarbonation & énergie",
    description:
      "Kilowater, partenaire décarbonation & énergie des entreprises. Étude de gisement CEE, conseil en décarbonation (bilan carbone, CSRD, décret tertiaire) et courtage de produits environnementaux (crédits carbone, garanties d'origine, biotickets) pour copropriétés, bailleurs, collectivités et maîtres d'ouvrage tertiaires & industriels.",
  },

  languageSwitcher: {
    label: "Langue",
  },

  nav: {
    links: {
      about: "Le Bureau",
      services: "Nos prestations",
      references: "Nos références",
      lab: "Laboratoire d'idées",
    },
    services: {
      heading: "Nos expertises",
      all: {
        label: "Toutes nos prestations",
        desc: "Notre offre intégrée décarbonation & énergie, en un coup d'œil",
      },
      cee: {
        label: "Certificats d'économie d'énergie",
        desc: "Audit, montage des dossiers et valorisation via mandat EMMY",
      },
      decarbonation: {
        label: "Décarbonation",
        desc: "Bilan carbone, trajectoires SBTi, CSRD et décret tertiaire",
      },
      brokerage: {
        label: "Courtage produits environnementaux",
        desc: "Crédits carbone volontaires, garanties d'origine et biotickets",
      },
      contact: "Nous contacter",
      videoLabel: "Parc d'éoliennes en mouvement",
      promo: {
        eyebrow: "Partenaire",
        title: "Votre partenaire",
        titleAccent: "décarbonation & énergie",
        text: "De l'audit technique à la valorisation CEE et carbone, une chaîne complète à votre service.",
      },
    },
    about: {
      heading: "Le cabinet",
      about: {
        label: "Qui sommes-nous",
        desc: "Notre histoire, nos valeurs et notre équipe d'ingénieurs",
      },
      contact: {
        label: "Contactez-nous",
        desc: "Coordonnées, formulaire et prise de rendez-vous",
      },
      videoLabel: "Cheminée industrielle en activité",
      promo: {
        eyebrow: "Décarbonation",
        title: "Réduire l'empreinte",
        titleAccent: "de vos bâtiments",
        text: "Une mission : accompagner la transition énergétique du tertiaire et de l'industrie.",
      },
    },
    cta: "Démarrer un projet",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
  },

  footer: {
    ctaEyebrow: "Prêt à transformer votre bâtiment ?",
    ctaTitle: "Parlons de votre",
    ctaTitleAccent: "projet",
    ctaButton: "Contactez-nous",
    tagline:
      "Partenaire décarbonation & énergie des entreprises. Nous accompagnons copropriétés, bailleurs, collectivités et maîtres d'ouvrage tertiaires & industriels — de l'audit technique à la valorisation CEE et carbone.",
    badgesHeading: "Qualifications & référentiels",
    badges: {
      emmy: { label: "Mandat EMMY", sub: "Dépôt & valorisation des CEE" },
      bilanCarbone: { label: "Bilan Carbone®", sub: "GHG Protocol — scopes 1·2·3" },
      sbti: { label: "SBTi", sub: "Trajectoires de réduction" },
      ghg: { label: "GHG Protocol", sub: "Standard comptabilité GES" },
      go: { label: "Garanties d'origine", sub: "Électricité & biométhane" },
    },
    navHeading: "Navigation",
    nav: {
      about: "Qui sommes-nous",
      services: "Nos prestations",
      references: "Nos références",
      lab: "Laboratoire d'idées",
      contact: "Contactez-nous",
    },
    expertisesHeading: "Expertises",
    expertises: {
      cee: "Certificats d'économies d'énergie",
      decarbonation: "Conseil en décarbonation",
      brokerage: "Courtage environnemental",
    },
    contactHeading: "Contact",
    rights: "Tous droits réservés.",
    cookies: "Cookies",
  },

  cookies: {
    dialogLabel: "Préférences cookies",
    eyebrow: "Cookies & confidentialité",
    textBefore: "Nous utilisons uniquement des cookies ",
    textStrong: "strictement nécessaires",
    textAfter:
      " au fonctionnement du site. Des mesures d'audience anonymes peuvent être activées avec votre accord.",
    learnMore: "En savoir plus",
    reject: "Refuser",
    accept: "Accepter",
    close: "Fermer (équivaut à Refuser)",
  },

  home: {
    hero: {
      eyebrow: "Partenaire décarbonation & énergie — B2B",
      srTitle: "Kilowater, partenaire décarbonation & énergie des entreprises — ",
      titleLines: ["Décarboner,", "financer,"],
      titleAccent: "valoriser",
      text: "Un interlocuteur unique entre vos obligations énergétiques et les mécanismes qui les financent : CEE, crédits carbone, garanties d'origine. De l'audit technique à la valorisation, nous pilotons toute la chaîne.",
      primaryCta: "Démarrer un projet",
      secondaryCta: "Nos expertises",
      scroll: "Défiler",
    },
    figures: [
      { value: "150+", label: "Projets accompagnés" },
      { value: "40%", label: "Économies d'énergie moyennes" },
      { value: "1 seul", label: "Interlocuteur, de l'audit à la prime" },
      { value: "+25 GWh", label: "D'économies valorisées" },
    ],
    offer: {
      eyebrow: "Notre offre",
      title: "Une offre intégrée,",
      titleAccent: "un seul interlocuteur",
      intro:
        "Le CEE finance et structure la relation, le conseil décarbonation cadre votre trajectoire, le courtage valorise vos actifs environnementaux. Le tout adossé à une expertise technique de terrain, notre vraie différence.",
      items: {
        cee: {
          title: "Certificats d'économie d'énergie",
          desc: "Audit technique du gisement d'économies d'énergie, montage des dossiers CEE et valorisation via mandat EMMY. Notre cœur de métier, du diagnostic à la prime.",
        },
        decarbonation: {
          title: "Conseil en décarbonation",
          desc: "Bilan carbone scopes 1, 2 & 3, trajectoires de réduction (SBTi) et accompagnement réglementaire : CSRD, décret tertiaire, futurs seuils CSDDD.",
        },
        brokerage: {
          title: "Courtage produits environnementaux",
          desc: "Crédits carbone volontaires, garanties d'origine et biotickets. Nous connectons porteurs de projets et entreprises, avec une sélection exigeante des projets.",
        },
        field: {
          title: "Expertise technique de terrain",
          desc: "Audit énergétique, études thermiques et assistance à maîtrise d'ouvrage. L'expertise ingénierie qui fonde et fiabilise chaque euro de valorisation.",
        },
      },
      learnMore: "En savoir plus",
      allServices: "Toutes nos prestations",
    },
    trust: {
      heading: "Ils nous font confiance",
    },
    commitment: {
      videoLabel: "Ingénieurs inspectant une armoire électrique",
      eyebrow: "Notre engagement",
      title: "Chaque projet",
      titleAccentLines: ["mérite sa", "révolution"],
      text: "La décarbonation ne se décrète pas, elle se pilote. Économies d'énergie, réduction des émissions, valorisation des actifs environnementaux : nous transformons vos obligations en leviers financiers.",
      cta: "Lancez votre projet",
    },
    references: {
      eyebrow: "Nos références",
      title: "Des projets",
      titleAccent: " qui parlent",
      seeAll: "Voir toutes les références",
      items: [
        {
          title: "Résidence Voltaire",
          type: "Copropriété — 64 logements",
          location: "Paris 11e",
          result: "– 47% de consommation énergétique",
        },
        {
          title: "Lycée International de Saint-Germain",
          type: "Collectivité — Bâtiment tertiaire",
          location: "Saint-Germain-en-Laye",
          result: "Passage de E à B sur le DPE",
        },
        {
          title: "Plateforme logistique Roissy",
          type: "Industriel — Bailleur tertiaire",
          location: "Roissy-en-France",
          result: "1,2 M€ de primes CEE valorisées",
        },
        {
          title: "Ancien siège BNP Paribas RE",
          type: "Tertiaire — 12 000 m²",
          location: "La Défense",
          result: "Conformité décret tertiaire – 40%",
        },
      ],
    },
    approach: {
      imageAlt: "Chantier de rénovation",
      eyebrow: "Notre approche",
      title: "Rigueur technique,",
      titleAccent: "vision humaine",
      text: "Chaque patrimoine a son gisement. Notre rôle est de le mesurer, structurer la trajectoire de décarbonation la plus juste, puis actionner les bons dispositifs de financement et de valorisation.",
      cta: "Découvrir Kilowater",
      steps: [
        {
          title: "Diagnostic",
          text: "Audit technique du gisement d'économies d'énergie et du bilan carbone.",
        },
        {
          title: "Structuration",
          text: "Trajectoire de réduction, montage des dossiers CEE et cadrage réglementaire.",
        },
        {
          title: "Valorisation",
          text: "Primes CEE, crédits carbone et garanties d'origine : chaque levier activé.",
        },
      ],
    },
  },

  relatedLinks: {
    eyebrow: "Pour aller plus loin",
    cta: "Découvrir",
  },

  about: {
    hero: {
      eyebrow: "Qui sommes-nous",
      title: "Une équipe,",
      titleAccent: "tous vos leviers",
      intro:
        "Kilowater est le partenaire unique entre vos obligations énergétiques et les mécanismes qui les financent. Notre différence : une expertise technique de terrain, du chargé d'affaires CEE à l'ingénieur thermicien.",
    },
    story: {
      imageAlt: "Équipe Kilowater — collaboration et esprit d'équipe",
      quote: {
        before: "La décarbonation est un acte",
        accent1: " technique",
        middle: ", mais surtout un acte",
        accent2: " financier",
        after: ".",
      },
      paragraphs: [
        "Depuis notre création, nous avons accompagné plus de 150 projets — copropriétés, parcs de bailleurs, bâtiments tertiaires, sites industriels et équipements publics.",
        "Notre modèle : le CEE finance et structure la relation, le conseil décarbonation cadre la trajectoire, le courtage valorise les actifs environnementaux. Un seul interlocuteur, de l'audit à la prime.",
      ],
    },
    values: {
      eyebrow: "Nos valeurs",
      title: { before: "Ce qui nous ", accent: "guide", after: "" },
      items: {
        rigour: {
          title: "Exigence",
          desc: "Chaque projet est traité avec la rigueur et la précision d'un bureau d'étude de référence. Pas de compromis sur la qualité.",
        },
        integrity: {
          title: "Intégrité",
          desc: "Sur le carbone comme sur l'énergie, nous ne valorisons que des projets crédibles. Pas de greenwashing, une sélection exigeante des actifs environnementaux.",
        },
        proximity: {
          title: "Proximité",
          desc: "Un interlocuteur unique, disponible et transparent. Nous croyons que la confiance se construit dans l'échange.",
        },
        expertise: {
          title: "Expertise",
          desc: "Qualifications RGE, certifications et formation continue. Notre équipe maîtrise les évolutions réglementaires et techniques.",
        },
      },
    },
    qualifications: {
      eyebrow: "Qualifications",
      title: "Des compétences",
      titleAccent: "certifiées",
      intro:
        "Nos qualifications garantissent à nos clients un niveau d'expertise reconnu par les organismes officiels et indispensable pour l'obtention des aides financières.",
      items: [
        "RGE — Reconnu Garant de l'Environnement",
        "Signataire de la Charte CEE — mandataire EMMY",
        "Audit énergétique réglementaire (tertiaire, copropriété)",
        "Bilan carbone scopes 1, 2 & 3 — méthodologie ADEME",
        "Conformité décret tertiaire (DEET) & CSRD",
      ],
    },
    related: {
      title: "Notre savoir-faire en action",
      subtitle:
        "Découvrez comment nous mettons notre expertise au service de la décarbonation des entreprises.",
      services: {
        eyebrow: "Catalogue",
        title: "Nos prestations",
        description:
          "L'éventail complet de nos services : de l'audit initial au suivi post-travaux.",
      },
      references: {
        eyebrow: "Réalisations",
        title: "Nos références",
        description:
          "Projets concrets de décarbonation et d'efficacité énergétique : copropriétés, tertiaire, collectivités, industrie.",
      },
      contact: {
        eyebrow: "Discuter",
        title: "Échanger sur votre projet",
        description: "Une question, une étude, un avis technique : nous répondons sous 48h.",
      },
    },
  },

  contact: {
    hero: {
      eyebrow: "Contact",
      title: "Parlons de votre",
      titleAccent: "projet",
      intro:
        "Copropriété, bailleur, collectivité ou maître d'ouvrage tertiaire & industriel : décrivez-nous votre besoin. Nous vous répondons sous 48h.",
    },
    form: {
      lastName: { label: "Nom *", placeholder: "Votre nom" },
      firstName: { label: "Prénom *", placeholder: "Votre prénom" },
      email: { label: "Email *", placeholder: "votre@email.fr" },
      phone: { label: "Téléphone", placeholder: "06 XX XX XX XX" },
      company: { label: "Raison sociale", placeholder: "Nom de l'entreprise" },
      jobTitle: { label: "Fonction", placeholder: "Votre poste" },
      projectType: { label: "Type de projet", placeholder: "Sélectionnez" },
      /** L'ordre doit rester aligné entre les langues (la valeur envoyée est le libellé FR). */
      projectTypes: [
        "Étude de gisement CEE",
        "Audit énergétique & étude thermique",
        "Maîtrise d'œuvre & AMO",
        "Conseil en décarbonation (bilan carbone, CSRD)",
        "Courtage produits environnementaux (carbone, GO, biotickets)",
        "Autre",
      ],
      message: {
        label: "Votre message *",
        placeholder: "Décrivez votre projet, le type de bâtiment, vos objectifs...",
      },
      submit: "Envoyer le message",
      sending: "Envoi en cours…",
      error: "Une erreur est survenue. Veuillez réessayer ou nous contacter par téléphone.",
    },
    success: {
      title: "Message envoyé",
      text: "Merci pour votre message. Nous vous répondrons dans les plus brefs délais, généralement sous 48h ouvrées.",
    },
    details: {
      heading: "Nos coordonnées",
      email: "Email",
      phone: "Téléphone",
      address: "Adresse",
      addressValue: "115 Rue Saint-Dominique, 75007 Paris",
      hours: "Horaires",
      hoursValue: "Lun – Ven : 9h00 – 18h00",
      note: "Nous nous engageons à vous répondre sous 48 heures ouvrées. Pour les demandes urgentes, n'hésitez pas à nous appeler directement.",
    },
  },
};

export type Dictionary = typeof fr;
