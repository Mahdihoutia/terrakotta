import type { Dictionary } from "./fr";

/**
 * English dictionary — British English (decarbonise, programme…).
 *
 * Glossaire de référence (à respecter sur toutes les pages) :
 * - CEE                              → EEC
 * - certificats d'économies d'énergie → Energy Efficiency Certificates (EEC)
 * - prime CEE                        → EEC incentive
 * - mandat EMMY                      → EMMY registry mandate
 * - partenaire décarbonation & énergie → decarbonisation & energy partner
 * - offre intégrée                   → integrated offering
 * - bilan carbone                    → carbon footprint assessment (Bilan Carbone® = marque)
 * - crédits carbone volontaires      → voluntary carbon credits (≠ EU ETS allowances)
 * - garanties d'origine              → Guarantees of Origin
 * - décret tertiaire                 → French Tertiary Decree
 * - DPE                              → EPC rating (DPE)
 * - copropriété                      → co-ownership building
 * - bailleur                         → landlord
 * - collectivité                     → local authority
 * - maître d'ouvrage                 → project owner
 * - gisement (d'économies)           → savings potential
 */
export const en: Dictionary = {
  meta: {
    siteTitle: "Kilowater — Decarbonisation & energy partner",
    description:
      "Kilowater is the decarbonisation & energy partner for businesses in France. Energy Efficiency Certificates (EEC), decarbonisation advisory (carbon footprint, CSRD, French Tertiary Decree) and brokerage of environmental products (voluntary carbon credits, Guarantees of Origin, biotickets) for co-ownership buildings, landlords, local authorities and commercial & industrial project owners.",
  },

  languageSwitcher: {
    label: "Language",
  },

  nav: {
    links: {
      about: "About",
      services: "Services",
      references: "Projects",
      lab: "Insights",
    },
    services: {
      heading: "Our expertise",
      all: {
        label: "All services",
        desc: "Our integrated decarbonisation & energy offering at a glance",
      },
      cee: {
        label: "Energy Efficiency Certificates",
        desc: "Audit, application filing and monetisation via EMMY registry mandate",
      },
      decarbonation: {
        label: "Decarbonisation",
        desc: "Carbon footprint, SBTi pathways, CSRD and French Tertiary Decree",
      },
      brokerage: {
        label: "Environmental products brokerage",
        desc: "Voluntary carbon credits, Guarantees of Origin and biotickets",
      },
      contact: "Contact us",
      videoLabel: "Wind farm in motion",
      promo: {
        eyebrow: "Partner",
        title: "Your decarbonisation",
        titleAccent: "& energy partner",
        text: "From technical audit to EEC and carbon monetisation, a complete value chain at your service.",
      },
    },
    about: {
      heading: "The firm",
      about: {
        label: "About us",
        desc: "Our story, our values and our engineering team",
      },
      contact: {
        label: "Contact us",
        desc: "Contact details, enquiry form and meeting requests",
      },
      videoLabel: "Industrial chimney in operation",
      promo: {
        eyebrow: "Decarbonisation",
        title: "Reducing the footprint",
        titleAccent: "of your buildings",
        text: "One mission: supporting the energy transition of commercial and industrial buildings.",
      },
    },
    cta: "Start a project",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },

  footer: {
    ctaEyebrow: "Ready to transform your building?",
    ctaTitle: "Let's talk about your",
    ctaTitleAccent: "project",
    ctaButton: "Contact us",
    tagline:
      "Decarbonisation & energy partner for businesses. We support co-ownership buildings, landlords, local authorities and commercial & industrial project owners — from technical audit to EEC and carbon monetisation.",
    badgesHeading: "Qualifications & standards",
    badges: {
      emmy: { label: "EMMY mandate", sub: "EEC filing & monetisation" },
      bilanCarbone: { label: "Bilan Carbone®", sub: "GHG Protocol — scopes 1·2·3" },
      sbti: { label: "SBTi", sub: "Reduction pathways" },
      ghg: { label: "GHG Protocol", sub: "GHG accounting standard" },
      go: { label: "Guarantees of Origin", sub: "Electricity & biomethane" },
    },
    navHeading: "Navigation",
    nav: {
      about: "About us",
      services: "Services",
      references: "Projects",
      lab: "Insights",
      contact: "Contact us",
    },
    expertisesHeading: "Expertise",
    expertises: {
      cee: "Energy Efficiency Certificates",
      decarbonation: "Decarbonisation advisory",
      brokerage: "Environmental brokerage",
    },
    contactHeading: "Contact",
    rights: "All rights reserved.",
    cookies: "Cookies",
  },

  cookies: {
    dialogLabel: "Cookie preferences",
    eyebrow: "Cookies & privacy",
    textBefore: "We only use cookies that are ",
    textStrong: "strictly necessary",
    textAfter:
      " for the website to work. Anonymous audience measurement may be enabled with your consent.",
    learnMore: "Learn more",
    reject: "Decline",
    accept: "Accept",
    close: "Close (same as Decline)",
  },

  home: {
    hero: {
      eyebrow: "Decarbonisation & energy partner — B2B",
      srTitle: "Kilowater, the decarbonisation & energy partner for businesses — ",
      titleLines: ["Decarbonise,", "finance,"],
      titleAccent: "create value",
      text: "A single point of contact between your energy obligations and the schemes that fund them: Energy Efficiency Certificates (EEC), carbon credits, Guarantees of Origin. From technical audit to monetisation, we manage the entire chain.",
      primaryCta: "Start a project",
      secondaryCta: "Our expertise",
      scroll: "Scroll",
    },
    figures: [
      { value: "150+", label: "Projects delivered" },
      { value: "40%", label: "Average energy savings" },
      { value: "1", label: "Point of contact, from audit to incentive" },
      { value: "25+ GWh", label: "Of energy savings monetised" },
    ],
    offer: {
      eyebrow: "Our offering",
      title: "An integrated offering,",
      titleAccent: "one point of contact",
      intro:
        "Energy Efficiency Certificates fund and anchor the relationship, decarbonisation advisory frames your pathway, and brokerage turns your environmental assets into value. All backed by hands-on technical expertise — what truly sets us apart.",
      items: {
        cee: {
          title: "Energy Efficiency Certificates (EEC)",
          desc: "Technical audit of your energy savings potential, EEC application filing and monetisation via our EMMY registry mandate. Our core business, from diagnosis to incentive.",
        },
        decarbonation: {
          title: "Decarbonisation advisory",
          desc: "Scope 1, 2 & 3 carbon footprint, reduction pathways (SBTi) and regulatory support: CSRD, French Tertiary Decree, upcoming CSDDD thresholds.",
        },
        brokerage: {
          title: "Environmental products brokerage",
          desc: "Voluntary carbon credits, Guarantees of Origin and biotickets. We connect project developers with businesses, with rigorous project selection.",
        },
        field: {
          title: "Hands-on technical expertise",
          desc: "Energy audits, thermal studies and owner's engineering. The engineering expertise that underpins and secures every euro of value created.",
        },
      },
      learnMore: "Learn more",
      allServices: "All services",
    },
    trust: {
      heading: "They trust us",
    },
    commitment: {
      videoLabel: "Engineers inspecting an electrical cabinet",
      eyebrow: "Our commitment",
      title: "Every project",
      titleAccentLines: ["deserves its own", "revolution"],
      text: "Decarbonisation isn't declared, it's managed. Energy savings, emission reductions, monetisation of environmental assets: we turn your obligations into financial levers.",
      cta: "Launch your project",
    },
    references: {
      eyebrow: "Our projects",
      title: "Projects that",
      titleAccent: " speak for themselves",
      seeAll: "See all projects",
      items: [
        {
          title: "Résidence Voltaire",
          type: "Co-ownership building — 64 units",
          location: "Paris 11th",
          result: "–47% energy consumption",
        },
        {
          title: "Lycée International de Saint-Germain",
          type: "Local authority — Public building",
          location: "Saint-Germain-en-Laye",
          result: "EPC rating (DPE) up from E to B",
        },
        {
          title: "Roissy logistics hub",
          type: "Industrial — Commercial landlord",
          location: "Roissy-en-France",
          result: "€1.2M in EEC incentives secured",
        },
        {
          title: "Former BNP Paribas RE headquarters",
          type: "Commercial — 12,000 m²",
          location: "La Défense",
          result: "French Tertiary Decree compliance: –40%",
        },
      ],
    },
    approach: {
      imageAlt: "Renovation site",
      eyebrow: "Our approach",
      title: "Technical rigour,",
      titleAccent: "human vision",
      text: "Every property portfolio has its own savings potential. Our role is to measure it, structure the right decarbonisation pathway, then activate the right funding and monetisation schemes.",
      cta: "Discover Kilowater",
      steps: [
        {
          title: "Diagnosis",
          text: "Technical audit of energy savings potential and carbon footprint.",
        },
        {
          title: "Structuring",
          text: "Reduction pathway, EEC application filing and regulatory framing.",
        },
        {
          title: "Monetisation",
          text: "EEC incentives, carbon credits and Guarantees of Origin: every lever activated.",
        },
      ],
    },
  },

  relatedLinks: {
    eyebrow: "Go further",
    cta: "Discover",
  },

  about: {
    hero: {
      eyebrow: "About us",
      title: "One team,",
      titleAccent: "every lever",
      intro:
        "Kilowater is your single partner between your energy obligations and the schemes that fund them. What sets us apart: hands-on technical expertise, from EEC project managers to thermal engineers.",
    },
    story: {
      imageAlt: "Kilowater team — collaboration and team spirit",
      quote: {
        before: "Decarbonisation is a",
        accent1: " technical",
        middle: " act, but above all a",
        accent2: " financial",
        after: " one.",
      },
      paragraphs: [
        "Since our founding, we have supported more than 150 projects — co-ownership buildings, landlord portfolios, commercial buildings, industrial sites and public facilities.",
        "Our model: Energy Efficiency Certificates (EEC) fund and anchor the relationship, decarbonisation advisory frames the pathway, and brokerage turns environmental assets into value. One point of contact, from audit to incentive.",
      ],
    },
    values: {
      eyebrow: "Our values",
      title: { before: "What ", accent: "guides", after: " us" },
      items: {
        rigour: {
          title: "Rigour",
          desc: "Every project is handled with the precision of a leading engineering consultancy. No compromise on quality.",
        },
        integrity: {
          title: "Integrity",
          desc: "In carbon as in energy, we only work with credible projects. No greenwashing — rigorous selection of environmental assets.",
        },
        proximity: {
          title: "Proximity",
          desc: "A single, available and transparent point of contact. We believe trust is built through dialogue.",
        },
        expertise: {
          title: "Expertise",
          desc: "RGE qualifications, certifications and continuous training. Our team stays on top of regulatory and technical developments.",
        },
      },
    },
    qualifications: {
      eyebrow: "Qualifications",
      title: "Certified",
      titleAccent: "expertise",
      intro:
        "Our qualifications give clients a level of expertise recognised by official bodies — a prerequisite for accessing French public funding schemes.",
      items: [
        "RGE certification (Recognised Environmental Guarantor)",
        "EEC Charter signatory — EMMY registry agent",
        "Regulatory energy audits (commercial buildings, co-ownerships)",
        "Scope 1, 2 & 3 carbon footprint — ADEME methodology",
        "French Tertiary Decree (DEET) & CSRD compliance",
      ],
    },
    related: {
      title: "Our expertise in action",
      subtitle: "See how we put our expertise to work for business decarbonisation.",
      services: {
        eyebrow: "Services",
        title: "Our services",
        description: "Our full range of services, from initial audit to post-works monitoring.",
      },
      references: {
        eyebrow: "Track record",
        title: "Our projects",
        description:
          "Real-world decarbonisation and energy efficiency projects: co-ownerships, commercial buildings, local authorities, industry.",
      },
      contact: {
        eyebrow: "Let's talk",
        title: "Discuss your project",
        description: "A question, a study, a technical opinion: we reply within 48 hours.",
      },
    },
  },

  contact: {
    hero: {
      eyebrow: "Contact",
      title: "Let's talk about your",
      titleAccent: "project",
      intro:
        "Co-ownership, landlord, local authority or commercial & industrial project owner: tell us what you need. We reply within 48 hours.",
    },
    form: {
      lastName: { label: "Last name *", placeholder: "Your last name" },
      firstName: { label: "First name *", placeholder: "Your first name" },
      email: { label: "Email *", placeholder: "you@company.com" },
      phone: { label: "Phone", placeholder: "+33 6 XX XX XX XX" },
      company: { label: "Company", placeholder: "Company name" },
      jobTitle: { label: "Job title", placeholder: "Your role" },
      projectType: { label: "Project type", placeholder: "Select" },
      projectTypes: [
        "Energy Efficiency Certificates (EEC) assessment",
        "Energy audit & thermal study",
        "Project management & owner's engineering",
        "Decarbonisation advisory (carbon footprint, CSRD)",
        "Environmental products brokerage (carbon, GOs, biotickets)",
        "Other",
      ],
      message: {
        label: "Your message *",
        placeholder: "Describe your project, the type of building, your objectives...",
      },
      submit: "Send message",
      sending: "Sending…",
      error: "Something went wrong. Please try again or call us directly.",
    },
    success: {
      title: "Message sent",
      text: "Thank you for your message. We will get back to you as soon as possible, usually within 48 business hours.",
    },
    details: {
      heading: "Contact details",
      email: "Email",
      phone: "Phone",
      address: "Address",
      addressValue: "115 Rue Saint-Dominique, 75007 Paris, France",
      hours: "Opening hours",
      hoursValue: "Mon – Fri: 9:00 am – 6:00 pm (CET)",
      note: "We commit to replying within 48 business hours. For urgent requests, please call us directly.",
    },
  },
};
