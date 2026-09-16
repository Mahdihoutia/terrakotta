import type { Locale } from "../config";

/** Contenu de la page « Nos prestations » (FR = source). */
const fr = {
  hero: {
    eyebrow: "Nos prestations — Une offre intégrée",
    title: "Une offre intégrée,",
    titleAccent: "une seule chaîne de valeur",
    intro:
      "De l'étude de gisement CEE au conseil en décarbonation, jusqu'au courtage des produits environnementaux : un interlocuteur unique entre vos obligations énergétiques et les mécanismes qui les financent.",
  },
  items: {
    cee: {
      pillar: "Pilier 1 — CEE",
      title: "Certificats d'économie d'énergie (CEE)",
      desc: "Notre cœur de métier et notre porte d'entrée. Nous auditons le gisement d'économies d'énergie mobilisable sur votre patrimoine, montons les dossiers de Certificats d'Économies d'Énergie et les valorisons via mandat sur EMMY. Un seul interlocuteur, du diagnostic au versement de la prime.",
      details: [
        "Audit du gisement d'économies d'énergie",
        "Constitution et dépôt des dossiers CEE",
        "Valorisation via mandat EMMY",
        "Optimisation des kWh cumac & suivi jusqu'au versement",
      ],
    },
    decarbonation: {
      pillar: "Pilier 2 — Décarbonation",
      title: "Bilan carbone & trajectoire de décarbonation",
      desc: "La montée en gamme naturelle après l'audit CEE. Nous mesurons votre empreinte, structurons une trajectoire de réduction crédible et vous mettons en conformité avec vos obligations, à l'échelle du bâtiment comme du parc immobilier.",
      details: [
        "Bilan carbone scopes 1, 2 & 3",
        "Trajectoire de réduction (référentiel SBTi ou équivalent)",
        "Conformité CSRD & décret tertiaire (DEET / BACS)",
        "Plan pluriannuel de décarbonation du patrimoine",
      ],
    },
    courtage: {
      pillar: "Pilier 3 — Courtage environnemental",
      title: "Courtage de produits environnementaux",
      desc: "Notre rôle d'agrégateur : consolider une offre fragmentée et la rendre accessible aux acheteurs. Nous connectons porteurs de projets et entreprises sur l'ensemble des actifs environnementaux, avec une exigence forte sur la crédibilité des projets — pas seulement la mise en relation.",
      details: [
        "Crédits carbone volontaires (Label Bas Carbone, standards internationaux)",
        "Garanties d'origine (électricité, biométhane)",
        "Biotickets (IRICC)",
        "Sélection exigeante des projets & mise en relation offre / demande",
      ],
    },
    suivi: {
      pillar: "Pilier 1 — Mesure & performance",
      title: "Commissionnement & suivi de performance",
      desc: "Vérification de la performance réelle des installations après travaux. Nous mesurons, ajustons et optimisons pour garantir que les objectifs d'économies et de réduction d'émissions sont tenus dans la durée.",
      details: [
        "Mesure des consommations réelles",
        "Ajustement des réglages et paramètres",
        "Rapport de performance annuel",
        "Garantie de résultat énergétique (GRE)",
      ],
    },
  },
  contactLink: "Nous contacter",
  cta: {
    eyebrow: "Votre projet",
    title: "Chaque bâtiment mérite",
    titleAccent: "une solution sur mesure",
    text: "Décrivez-nous votre projet et nous vous proposerons un accompagnement adapté à vos objectifs et votre budget.",
    button: "Contactez-nous",
  },
  related: {
    title: "Explorer notre offre",
    subtitle:
      "Trois leviers complémentaires, un seul interlocuteur — de la valorisation de vos économies d'énergie au courtage de vos actifs environnementaux.",
    cee: {
      eyebrow: "Pilier 1",
      title: "Certificats d'économie d'énergie (CEE)",
      description:
        "Notre cœur de métier : audit du gisement, montage des dossiers et valorisation via mandat EMMY. Du diagnostic au versement de la prime.",
    },
    decarbonation: {
      eyebrow: "Pilier 2",
      title: "Conseil en décarbonation",
      description:
        "Bilan carbone scopes 1, 2 & 3, trajectoire de réduction (SBTi) et mise en conformité CSRD et décret tertiaire.",
    },
    brokerage: {
      eyebrow: "Pilier 3",
      title: "Courtage environnemental",
      description:
        "Crédits carbone volontaires, garanties d'origine et biotickets : nous connectons porteurs de projets et entreprises, avec une sélection exigeante.",
    },
  },
};

export type ServicesContent = typeof fr;

const en: ServicesContent = {
  hero: {
    eyebrow: "Our services — An integrated offering",
    title: "An integrated offering,",
    titleAccent: "a single value chain",
    intro:
      "From Energy Efficiency Certificates (EEC) assessments to decarbonisation advisory and environmental products brokerage: a single point of contact between your energy obligations and the schemes that fund them.",
  },
  items: {
    cee: {
      pillar: "Pillar 1 — EEC",
      title: "Energy Efficiency Certificates (EEC)",
      desc: "Our core business and entry point. We audit the energy savings potential across your property portfolio, prepare Energy Efficiency Certificate applications and monetise them through our EMMY registry mandate. One point of contact, from diagnosis to incentive payment.",
      details: [
        "Energy savings potential audit",
        "Preparation and filing of EEC applications",
        "Monetisation via EMMY registry mandate",
        "kWh cumac optimisation & follow-up until payment",
      ],
    },
    decarbonation: {
      pillar: "Pillar 2 — Decarbonisation",
      title: "Carbon footprint & decarbonisation pathway",
      desc: "The natural next step after an EEC audit. We measure your footprint, build a credible reduction pathway and bring you into compliance with your obligations, for a single building or an entire property portfolio.",
      details: [
        "Scope 1, 2 & 3 carbon footprint",
        "Reduction pathway (SBTi framework or equivalent)",
        "CSRD & French Tertiary Decree compliance (DEET / BACS)",
        "Multi-year portfolio decarbonisation plan",
      ],
    },
    courtage: {
      pillar: "Pillar 3 — Environmental brokerage",
      title: "Environmental products brokerage",
      desc: "Our role as an aggregator: consolidating a fragmented supply and making it accessible to buyers. We connect project developers and businesses across all environmental assets, with a strong focus on project credibility — not just matchmaking.",
      details: [
        "Voluntary carbon credits (Label Bas Carbone, international standards)",
        "Guarantees of Origin (electricity, biomethane)",
        "Biotickets (IRICC)",
        "Rigorous project selection & supply / demand matching",
      ],
    },
    suivi: {
      pillar: "Pillar 1 — Measurement & performance",
      title: "Commissioning & performance monitoring",
      desc: "Verification of the actual performance of installations after works. We measure, adjust and optimise to ensure energy savings and emission reduction targets are met over time.",
      details: [
        "Measurement of actual consumption",
        "Adjustment of settings and parameters",
        "Annual performance report",
        "Energy performance guarantee (GRE)",
      ],
    },
  },
  contactLink: "Contact us",
  cta: {
    eyebrow: "Your project",
    title: "Every building deserves",
    titleAccent: "a tailored solution",
    text: "Tell us about your project and we will propose support tailored to your objectives and budget.",
    button: "Contact us",
  },
  related: {
    title: "Explore our offering",
    subtitle:
      "Three complementary levers, one point of contact — from monetising your energy savings to brokering your environmental assets.",
    cee: {
      eyebrow: "Pillar 1",
      title: "Energy Efficiency Certificates (EEC)",
      description:
        "Our core business: savings potential audit, application filing and monetisation via EMMY registry mandate. From diagnosis to incentive payment.",
    },
    decarbonation: {
      eyebrow: "Pillar 2",
      title: "Decarbonisation advisory",
      description:
        "Scope 1, 2 & 3 carbon footprint, reduction pathway (SBTi) and CSRD and French Tertiary Decree compliance.",
    },
    brokerage: {
      eyebrow: "Pillar 3",
      title: "Environmental brokerage",
      description:
        "Voluntary carbon credits, Guarantees of Origin and biotickets: we connect project developers and businesses, with rigorous selection.",
    },
  },
};

export const SERVICES_CONTENT: Record<Locale, ServicesContent> = { fr, en };
