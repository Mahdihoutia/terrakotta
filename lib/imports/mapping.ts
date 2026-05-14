/**
 * Détection automatique du mapping colonnes fichier → champs Kilowater.
 * Fuzzy match : normalise (lowercase, sans accents/espaces/tirets) puis
 * compare à une liste d'alias par champ.
 */

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s_\-./]/g, "");
}

const CONTACT_ALIASES: Record<string, string[]> = {
  nom: ["nom", "lastname", "lname", "name", "surname", "nomdefamille"],
  prenom: ["prenom", "firstname", "fname", "givenname"],
  email: ["email", "mail", "emailadresse", "adressemail", "courriel", "courrier"],
  telephone: ["telephone", "tel", "phone", "mobile", "portable", "gsm", "numerotelephone"],
  raisonSociale: [
    "raisonsociale",
    "societe",
    "entreprise",
    "company",
    "organisation",
    "organization",
  ],
  fonction: ["fonction", "poste", "role", "title", "jobtitle"],
  notes: ["notes", "note", "commentaire", "commentaires", "remarque", "remarques"],
};

export function detectMapping(
  headers: string[],
  schemaFields: string[]
): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  const used = new Set<string>();
  for (const h of headers) {
    const nh = normalize(h);
    let matched: string | null = null;
    for (const field of schemaFields) {
      if (used.has(field)) continue;
      const aliases = CONTACT_ALIASES[field] ?? [field.toLowerCase()];
      if (aliases.some((a) => normalize(a) === nh)) {
        matched = field;
        used.add(field);
        break;
      }
    }
    out[h] = matched;
  }
  return out;
}

export const CONTACT_SCHEMA_FIELDS = [
  "nom",
  "prenom",
  "email",
  "telephone",
  "raisonSociale",
  "fonction",
  "notes",
] as const;

export const CONTACT_REQUIRED_FIELDS = ["nom"] as const;
