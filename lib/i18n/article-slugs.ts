/**
 * Correspondance des slugs d'articles traduits : slug FR → slug EN.
 * Module volontairement léger (importé par le sélecteur de langue côté client).
 * Ajouter une entrée ici en même temps que la traduction dans `content/articles-en.ts`.
 */
export const ARTICLE_SLUGS_EN: Record<string, string> = {
  "obligations-decarbonation-entreprises-2026": "decarbonisation-obligations-france-2026",
  "biodiversite-entreprises-patrimoine-immobilier": "biodiversity-companies-real-estate",
  "credits-carbone-volontaires-projet-credible": "voluntary-carbon-credits-credible-projects",
};

export const ARTICLE_SLUGS_FR: Record<string, string> = Object.fromEntries(
  Object.entries(ARTICLE_SLUGS_EN).map(([fr, en]) => [en, fr]),
);
