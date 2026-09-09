// Définit un nouveau mot de passe admin (ADMIN_PASSWORD_HASH) dans .env
// Usage : node set-admin-password.mjs
// Le mot de passe est saisi DANS Node (invisible), jamais dans le shell.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";
import bcrypt from "bcryptjs";

// Dossier du script → le .env visé est toujours celui du projet kilowater,
// quel que soit le répertoire courant du terminal.
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

function askHidden(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(query);
    // Masque l'écho des caractères tapés.
    rl._writeToOutput = () => {};
    rl.question("", (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const ENV_PATH = path.join(SCRIPT_DIR, ".env");

const pw1 = await askHidden("Nouveau mot de passe : ");
if (!pw1 || pw1.length < 8) {
  console.error("\n❌ Mot de passe trop court (8 caractères minimum). Rien n'a été modifié.");
  process.exit(1);
}
const pw2 = await askHidden("Confirme le mot de passe : ");
if (pw1 !== pw2) {
  console.error("\n❌ Les deux saisies ne correspondent pas. Rien n'a été modifié.");
  process.exit(1);
}

const hash = bcrypt.hashSync(pw1, 12);

// Met à jour (ou ajoute) la ligne ADMIN_PASSWORD_HASH dans .env
// IMPORTANT : Next.js interprète les `$` comme des variables dans .env
// (dotenv-expand) → on échappe chaque `$` avec `\` sinon le hash est tronqué.
// NB : sur Vercel, coller le hash BRUT (sans `\`), pas cette version échappée.
let env = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";
const escapedHash = hash.replace(/\$/g, "\\$");
const line = `ADMIN_PASSWORD_HASH="${escapedHash}"`;
if (/^ADMIN_PASSWORD_HASH=.*$/m.test(env)) {
  env = env.replace(/^ADMIN_PASSWORD_HASH=.*$/m, line);
} else {
  env = env.replace(/\n?$/, "\n") + line + "\n";
}
fs.writeFileSync(ENV_PATH, env);

console.log("\n✅ Mot de passe mis à jour dans .env (avec les $ échappés)");
console.log("\nHash BRUT pour Vercel (sans backslash — à coller tel quel) :\n" + hash);
console.log("\nProchaine étape : coller ce hash BRUT dans Vercel (ADMIN_PASSWORD_HASH) puis redéployer.");
