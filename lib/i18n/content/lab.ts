import type { Locale } from "../config";

/** Libellés du Laboratoire d'idées (liste + page article). FR = source. */
const fr = {
  hero: {
    eyebrow: "Laboratoire d'idées",
    title: "Décrypter la",
    titleAccent: "décarbonation",
    intro:
      "Réglementation, marchés environnementaux et retours de terrain : nos analyses pour les directions immobilières, financières et RSE, les copropriétés et les collectivités.",
  },
  allArticles: "Tous les articles",
  read: "Lire",
  readArticle: "Lire l'article",
  empty: {
    title: "Aucun article dans cette catégorie",
    text: "De nouveaux contenus seront publiés prochainement.",
  },
  newsletter: {
    title: "Restons en",
    titleAccent: "veille",
    text: "Recevez nos décryptages sur les CEE, la réglementation climat et les marchés environnementaux, directement dans votre boîte mail. Pas de spam, uniquement du contenu utile.",
    placeholder: "votre@email.fr",
    button: "S'abonner",
  },
  article: {
    back: "Retour aux articles",
    related: "Articles connexes",
    breadcrumbHome: "Accueil",
    breadcrumbLab: "Laboratoire d'idées",
  },
  /** Libellés affichés par catégorie (clé = valeur stockée dans `lib/articles.ts`). */
  categories: {
    Tous: "Tous",
    Climat: "Climat",
    Biodiversité: "Biodiversité",
    Énergie: "Énergie",
    Urbanisme: "Urbanisme",
    Matériaux: "Matériaux",
    Réglementation: "Réglementation",
  },
};

export type LabContent = typeof fr;

const en: LabContent = {
  hero: {
    eyebrow: "Insights",
    title: "Decoding",
    titleAccent: "decarbonisation",
    intro:
      "Regulation, environmental markets and field experience: our analysis for real estate, finance and sustainability leaders, co-ownerships and local authorities.",
  },
  allArticles: "All articles",
  read: "Read",
  readArticle: "Read article",
  empty: {
    title: "No articles in this category",
    text: "New content will be published soon.",
  },
  newsletter: {
    title: "Stay",
    titleAccent: "informed",
    text: "Get our analysis of Energy Efficiency Certificates, climate regulation and environmental markets straight to your inbox. No spam, only useful content.",
    placeholder: "you@company.com",
    button: "Subscribe",
  },
  article: {
    back: "Back to articles",
    related: "Related articles",
    breadcrumbHome: "Home",
    breadcrumbLab: "Insights",
  },
  categories: {
    Tous: "All",
    Climat: "Climate",
    Biodiversité: "Biodiversity",
    Énergie: "Energy",
    Urbanisme: "Urban planning",
    Matériaux: "Materials",
    Réglementation: "Regulation",
  },
};

export const LAB_CONTENT: Record<Locale, LabContent> = { fr, en };
