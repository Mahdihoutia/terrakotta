import type { Locale } from "../config";

/** Contenu de la page « Courtage environnemental » (FR = source). */
const fr = {
  hero: {
    imageAlt: "Actifs environnementaux — énergies renouvelables",
    eyebrow: "Pilier 3 — Courtage environnemental",
    title: "Courtage de produits",
    titleAccent: "environnementaux",
    intro:
      "Crédits carbone volontaires, garanties d'origine et biotickets. Nous connectons porteurs de projets et entreprises, avec une exigence forte sur la crédibilité des projets — pas seulement la mise en relation.",
    cta: "Nous contacter",
  },
  offer: {
    eyebrow: "Ce que nous courtons",
    title: "Un accès simple à un",
    titleAccent: " marché fragmenté",
    items: {
      credits: {
        title: "Crédits carbone volontaires",
        desc: "Mise en relation entre porteurs de projets (Label Bas Carbone, standards internationaux) et entreprises acheteuses. Nous sourçons, qualifions et négocions pour votre compte.",
      },
      go: {
        title: "Garanties d'origine",
        desc: "Approvisionnement en garanties d'origine électricité et biométhane pour tracer et verdir vos consommations, avec le bon niveau de qualité selon vos objectifs de reporting.",
      },
      biotickets: {
        title: "Biotickets (IRICC)",
        desc: "Intermédiation sur les certificats liés aux énergies renouvelables dans les transports (IRICC), entre producteurs et acteurs soumis à obligation.",
      },
      sourcing: {
        title: "Sélection & sourcing",
        desc: "Notre vraie valeur ajoutée : une sélection exigeante des projets crédibles. Pas de simple mise en relation — un filtre sur la qualité et l'additionnalité, contre le greenwashing.",
      },
    },
  },
  vigilance: {
    eyebrow: "Notre exigence",
    title: "La crédibilité",
    titleAccent: " avant tout",
    items: [
      {
        title: "Volontaire n'est pas réglementé",
        text: "Les crédits carbone volontaires ne se substituent pas aux quotas EU ETS / ETS2. Nous cadrons clairement l'usage de chaque produit pour éviter toute confusion et tout risque de greenwashing (durcissement EmpCo attendu).",
      },
      {
        title: "La qualité avant le volume",
        text: "La crédibilité de certains standards internationaux s'est dégradée. Nous privilégions des projets vérifiables, additionnels et documentés — quitte à écarter des volumes bon marché mais fragiles.",
      },
      {
        title: "Un réseau des deux côtés",
        text: "Notre rôle d'agrégateur consolide une offre fragmentée (petits producteurs, porteurs de projets locaux) pour la rendre accessible aux acheteurs, dans une relation transparente.",
      },
    ],
  },
  related: {
    title: "Explorer notre offre",
    subtitle:
      "Le courtage environnemental prolonge naturellement notre accompagnement, du financement des économies d'énergie à la valorisation de vos actifs.",
    cee: {
      eyebrow: "Pilier 1",
      title: "Certificats d'économie d'énergie (CEE)",
      description:
        "Notre cœur de métier : audit du gisement, montage des dossiers et valorisation via mandat EMMY.",
    },
    decarbonation: {
      eyebrow: "Pilier 2",
      title: "Conseil en décarbonation",
      description:
        "Bilan carbone scopes 1, 2 & 3, trajectoire de réduction (SBTi) et conformité CSRD / décret tertiaire.",
    },
    contact: {
      eyebrow: "Échanger",
      title: "Parlons de vos actifs",
      description:
        "Un besoin de crédits carbone, de garanties d'origine ou de biotickets : notre équipe vous répond sous 48h.",
    },
  },
};

export type BrokerageContent = typeof fr;

const en: BrokerageContent = {
  hero: {
    imageAlt: "Environmental assets — renewable energy",
    eyebrow: "Pillar 3 — Environmental brokerage",
    title: "Environmental products",
    titleAccent: "brokerage",
    intro:
      "Voluntary carbon credits, Guarantees of Origin and biotickets. We connect project developers and businesses, with a strong focus on project credibility — not just matchmaking.",
    cta: "Contact us",
  },
  offer: {
    eyebrow: "What we broker",
    title: "Simple access to a",
    titleAccent: " fragmented market",
    items: {
      credits: {
        title: "Voluntary carbon credits",
        desc: "Matching project developers (Label Bas Carbone, the French government carbon standard, and international standards) with corporate buyers. We source, qualify and negotiate on your behalf.",
      },
      go: {
        title: "Guarantees of Origin",
        desc: "Sourcing of electricity and biomethane Guarantees of Origin to trace and green your consumption, with the right quality level for your reporting objectives.",
      },
      biotickets: {
        title: "Biotickets (IRICC)",
        desc: "Intermediation on certificates for renewable energy in transport under the French IRICC scheme, between producers and obligated parties.",
      },
      sourcing: {
        title: "Selection & sourcing",
        desc: "Our real added value: rigorous selection of credible projects. Not just matchmaking — a filter on quality and additionality, to guard against greenwashing.",
      },
    },
  },
  vigilance: {
    eyebrow: "Our standards",
    title: "Credibility",
    titleAccent: " first",
    items: [
      {
        title: "Voluntary is not compliance",
        text: "Voluntary carbon credits are not a substitute for EU ETS / ETS2 allowances. We clearly frame how each product can be used, to avoid any confusion and any greenwashing risk (stricter EU EmpCo rules ahead).",
      },
      {
        title: "Quality over volume",
        text: "The credibility of some international standards has weakened. We favour verifiable, additional and well-documented projects — even if that means turning down cheap but fragile volumes.",
      },
      {
        title: "A network on both sides",
        text: "As an aggregator, we consolidate a fragmented supply (small producers, local project developers) and make it accessible to buyers, in a transparent relationship.",
      },
    ],
  },
  related: {
    title: "Explore our offering",
    subtitle:
      "Environmental brokerage is a natural extension of our support, from funding energy savings to monetising your assets.",
    cee: {
      eyebrow: "Pillar 1",
      title: "Energy Efficiency Certificates (EEC)",
      description:
        "Our core business: savings potential audit, application filing and monetisation via EMMY registry mandate.",
    },
    decarbonation: {
      eyebrow: "Pillar 2",
      title: "Decarbonisation advisory",
      description:
        "Scope 1, 2 & 3 carbon footprint, reduction pathway (SBTi) and CSRD / French Tertiary Decree compliance.",
    },
    contact: {
      eyebrow: "Let's talk",
      title: "Let's discuss your assets",
      description:
        "Need carbon credits, Guarantees of Origin or biotickets? Our team replies within 48 hours.",
    },
  },
};

export const BROKERAGE_CONTENT: Record<Locale, BrokerageContent> = { fr, en };
