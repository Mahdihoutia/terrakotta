# Niveau d'exigence cible — Audits & Notes Kilowater

> Benchmark et plan d'action établis à partir de l'analyse d'un audit concurrent
> (Sinteo, Mission GRECO CNP – Alleray, Paris 15ᵉ, 19 573 m² SHON, bureaux, mai 2017, 114 pages).
> Le document concurrent représente le niveau d'exigence cible pour les livrables
> Kilowater (audit tertiaire / industrie / résidentiel collectif).

---

## 1. Ce que fait l'audit Sinteo — matrice d'exigence

### 1.1. Structure macro (114 pages)

```
0. SYNTHÈSE DE L'ÉTUDE                                      ← page 6-7 (double page)
1. CONTEXTE DE LA MISSION                                   ← 8-13
   1.1 Cadre GRECO CNP + enjeux réglementaires (Grenelle)
   1.2 Périmètre & enjeux
   1.3 Enjeux financiers
   1.4 Périmètre
   1.5 Éléments mis à disposition
2. PRÉSENTATION DU SITE                                     ← 14-41
   2.1 Présentation générale
   2.2 Activité du bâtiment
   2.3 Environnement extérieur
   2.4 Caractéristiques constructives (enveloppe + vitrage)
   2.5 Équipements techniques (distrib élec, chauffage, ventil, clim, éclairage, ECS, IT)
   2.6 Potentiel ENR
   2.7 Grille d'analyse globale (radar 1-4/4)
   2.8 Abonnements + décomposition facture annuelle par vecteur
3. BILAN THERMIQUE & ANALYSE DES DÉPENSES                   ← 42-53
   3.1 Bilan thermique (STD Design Builder)
       – Simulation annuelle
       – Simulation jour le plus froid
       – Simulation jour le plus chaud
   3.2 Analyse consommations réelles (kWhEP / m² SHON-RT)
       – 3 jauges A-G : Énergétique / Environnementale / Financière
       – Répartition par poste
4. SOLUTIONS D'AMÉLIORATION                                 ← 54-75
   4.1 Tableau de synthèse matriciel multi-colonnes
   4.2 Actions sur les comportements       (CPT 1, CPT 2, CPT 3…)
   4.3 Action sur la régulation            (REG 1, REG 2…)
   4.4 Action sur les énergies renouvelables (ENR 1…)
   4.5 Mise en œuvre (phasage)
5. ÉTUDE D'OPPORTUNITÉ CERTIFICATION                        ← 76-113
   5.6 BREEAM® In-Use
   5.7 HQE® Exploitation
```

### 1.2. Synthèse exécutive (page 6-7) — repère visuel clé

**Double page condensée** — c'est ce qu'un décideur lit en premier :

**Page gauche — État des lieux du bâtiment**
- Données administratives (nom, localisation, année construction/réhabilitation, SHON-RT, SU, volume, niveaux, activité, classement code du travail)
- Caractéristiques de l'enveloppe : radar Uₜₕ bâtiment vs Uₜₕ RT 2005, écart en %
- Grille d'analyse globale : radar 6 axes (bâti, équipements chaud, équipements froid, ventilation, éclairage, ECS) notés 1-4/4
- Répartition des déperditions thermiques : radar Site vs Moyenne France

**Page droite — Bilan énergétique du bâtiment**
- Données générales par poste (kWhEP par usage + type d'énergie)
- Graphique camembert : répartition consommation par usage
- **3 jauges A-G** côte à côte :
  - Performance Énergétique (kWhEP/m²·an)
  - Performance Environnementale (kgCO₂eq/m²·an)
  - Performance Financière (€HT/m²·an)
- Moyenne bureaux France 2005 inscrite sous chaque jauge

### 1.3. Fiche action standardisée — modèle

Chaque préconisation a le même gabarit sur 2 pages :

```
┌─────────────────────────────────────────────────────┐
│  [CODE]        Titre de l'action          Package: CPT │
│                                       Opportunité: ★★★★★│
│                              Planification: Immédiate  │
├─────────────────────────────────────────────────────┤
│  L'ACTION EN BREF                                    │
│  [3-5 paragraphes contextualisés]                   │
├─────────────────────────────────────────────────────┤
│  ÉCONOMIES                                           │
│  Méthode : [description calcul]                     │
│  Gain financier :   X €/an                           │
│  Économies énergie: X kWhEP/an  (Y %)                │
│  Économies GES :    X kgCO₂/an  (Y %)                │
│  Commentaires : [répartition bailleur/preneur]       │
├─────────────────────────────────────────────────────┤
│  FAISABILITÉ                                         │
│  Perturbation : Aucune / Moyenne / Forte             │
│  Planification : Immédiate / CT / MT / LT            │
├─────────────────────────────────────────────────────┤
│  COÛTS                                               │
│  Investissement : X € HT                             │
│  [Détail chiffrage]                                  │
└─────────────────────────────────────────────────────┘
```

### 1.4. Tableau matriciel des préconisations (page 54-55)

Colonnes : **Référence · Préconisation · Investissement € HT · Écon. EF (% + kWh) · Écon. EP (% + kWh) · Écon. financière (% + €TTC) · Écon. kgCO₂/an · Bouquet · Possible en site occupé · Durée si non occupé · Date de réalisation · Loyer (€/an) · CEE MWh cumac · Responsable (Loc/ADB/Prop) · Commentaires**

Familles d'actions (codes) : CPT (comportements), BAT (enveloppe), CHA (chauffage), CLI (climatisation), VENT (ventilation), ECL (éclairage), ECS, REG (régulation/GTB), ENR.

---

## 2. Gap analysis — Kilowater actuel

| Exigence Sinteo | Kilowater aujourd'hui | Gap |
|---|---|---|
| Synthèse exécutive double-page | ❌ Absente | 🔴 Majeur |
| 3 jauges A-G côte à côte | ✅ DPE/GES via `drawDPEGESDual` | 🟡 Ajouter jauge financière |
| Grille analyse globale radar 1-4/4 | ❌ Absente | 🟠 Moyen |
| Comparaison Moyenne France | ❌ Absente | 🟠 Moyen |
| STD 3 saisons (annuel + froid + chaud) | ❌ Absente | 🔴 Majeur (tertiaire) |
| Tableau matriciel préconisations | ❌ Absent | 🔴 Majeur |
| Fiches actions standardisées | ❌ Observations libres | 🔴 Majeur |
| Catégorisation CPT/BAT/CHA/CLI/VENT/ECL/ECS/REG/ENR | ❌ Liste libre | 🔴 Majeur |
| Phasage Immédiat / CT / MT / LT | ❌ 3 niveaux priorité | 🟠 Moyen |
| Étoiles opportunité ★★★★★ | ❌ Absent | 🟠 Moyen |
| Répartition bailleur/preneur | ❌ Absent | 🟠 Moyen (tertiaire) |
| CEE cumac par fiche | ✅ `computeCumac` (Sprint 1) | ✅ Fait |
| Bilan carbone scope 1/2/3 | ✅ Sprint 2 | ✅ Fait |
| Étanchéité + apports | ✅ Sprint 2 | ✅ Fait |
| Analyse factures par vecteur | ❌ Absente | 🟠 Moyen |
| Étude certification BREEAM/HQE | ❌ Absente | 🟢 Mineur (optionnel) |
| Pagination / lisibilité PDF | ✅ Fond blanc, prose, footer ok | ✅ Fait |

---

## 3. Plan d'action — 4 sprints

### Sprint 3 — Synthèse exécutive & jauges (priorité 🔴)

**Objectif** : livrer une page 1 de synthèse lisible par un décideur non-technique
en 60 secondes.

1. Nouvelle section PDF `drawExecutiveSummary` dans `lib/pdf-styles.ts` :
   - En-tête « État des lieux » + « Bilan énergétique »
   - Cartouche administratif (surface, année, activité, niveaux, zone climatique)
   - Radar Uₜₕ parois (Murs / Toiture / Plancher / Ouvrants) vs RT 2012 / RE 2020
2. **3 jauges côte à côte** (helper `drawTripleGauge`) :
   - Énergétique : kWhEP/m²·an → étiquette A-G DPE existante
   - Environnementale : kgCO₂/m²·an → GES existant
   - Financière : €HT/m²·an → nouvelle échelle (seuils à caler sur DEET)
3. Ajout du champ `cout_energie_m2_an` dans le questionnaire audit (section 7).
4. Affichage en page 3 (juste après cover + sommaire), avant les sections détaillées.

Livrable : synthèse exécutive 2 pages intégrée dans `AuditEnergetique.tsx`.

### Sprint 4 — Préconisations structurées (priorité 🔴)

**Objectif** : remplacer les champs libres de préconisation par un système de
fiches actions catalogué et chiffré.

1. Créer `lib/preconisations-catalogue.ts` :
   - Énumération des familles `CPT · BAT · CHA · CLI · VENT · ECL · ECS · REG · ENR`
   - Type `FicheAction` : `{ code, famille, titre, opportunite (1-5), planification, perturbation, investissement, gain_ef_pct, gain_ep_kwh, gain_financier_eur, gain_ges_kg, cee_mwh_cumac, responsabilite (Prop/Loc/ADB), commentaires, methode }`
2. Nouvelle section dans `AuditEnergetique.tsx` : **« Plan d'actions »**
   - Interface pour ajouter N fiches actions au rapport
   - Sélection famille + template pré-rempli (calculs par défaut)
   - Aperçu cumulé (Σ investissement, Σ gains, TRI moyen)
3. PDF : deux nouveaux helpers
   - `drawPreconisationsMatrix` : tableau matriciel de synthèse (page unique orientation paysage ou format condensé)
   - `drawFicheAction` : une page par fiche avec encadrés standardisés (bref / économies / faisabilité / coûts)

Livrable : module préconisations complet avec 15-30 templates prêts à l'emploi.

### Sprint 5 — STD & analyse de factures (priorité 🟠)

**Objectif** : monter le niveau technique du bilan thermique et contextualiser
les consommations.

1. Section **Bilan thermique** enrichie avec 3 simulations saisonnières :
   - Annuelle (en MWh, déperditions par paroi)
   - Jour le plus froid (kWh, déperditions renforcées renouvellement d'air)
   - Jour le plus chaud (kWh, déperditions nocturnes + apports solaires)
   - Champs saisissables : besoins chauffage, besoins froid, DJU site
2. Section **Analyse des factures** :
   - Table abonnements par vecteur (électricité, gaz, réseau chaleur, eau)
   - Décomposition facture annuelle (part fixe / part variable, HT / TVA / TICFE / CTA)
   - Graphique empilé « composition de la facture »
3. **Grille d'analyse globale** — radar 1-4/4 sur 6 axes (Bâti / Chaud / Froid / Ventilation / Éclairage / ECS) rempli manuellement par l'auditeur, affiché en synthèse exécutive.

Livrable : bilan thermique 3 pages + analyse factures 2 pages.

### Sprint 6 — Responsabilités bailleur/preneur + phasage roadmap (priorité 🟠)

**Objectif** : s'aligner sur la logique tertiaire (Décret Tertiaire/DEET) où la
répartition des charges conditionne la faisabilité.

1. Champ `responsabilite` sur chaque fiche action : `Propriétaire · Locataire · ADB (annexe bail) · Mixte`.
2. Phasage en 4 horizons :
   - Immédiat (< 3 mois, sans CAPEX lourd)
   - Court terme (3-12 mois)
   - Moyen terme (1-3 ans)
   - Long terme (3-10 ans, gros œuvre)
3. **Roadmap DEET 2030 / 2040 / 2050** :
   - Section dédiée « Trajectoire Décret Tertiaire »
   - Baseline + objectifs -40 % / -50 % / -60 %
   - Graphique en cascade (consommation actuelle → après chaque lot d'actions)
4. Calcul automatique du **temps de retour brut** et **TRI** par fiche + cumulé.

Livrable : roadmap DEET + répartition bailleur/preneur.

### Sprint 7 (optionnel) — Certifications environnementales (priorité 🟢)

Si la cible Kilowater inclut le haut tertiaire / foncières :
- Module BREEAM In-Use (notation par thème, plan d'action vers niveau supérieur)
- Module HQE Exploitation (radar 14 cibles, profil cible/optimisé)

Non prioritaire : à décider après retours clients Sprint 3-6.

---

## 4. Principes transverses à respecter

- **Sources citées systématiquement** : Base Carbone ADEME 2024, Arrêté DPE 31 mars 2021, NF EN 16247-1/2, Décret Tertiaire 2019, RE 2020.
- **Ton professionnel neutre** : pas de superlatifs commerciaux, vocabulaire d'ingénierie (Uₜₕ, Cₑₚ, DJU, EER, SEER, Q4Pa-surf, n50).
- **Chiffrage transparent** : chaque gain affiché porte sa méthode de calcul en note (« Méthode : G × V × DJU × 24 × (1 - η_récupération) »).
- **Hypothèses explicites** : tarifs énergie, PRG fluides, facteurs carbone, DJU site, période de fonctionnement — en annexe méthodologique.
- **Cohérence EF ↔ EP ↔ CO₂ ↔ €** : toujours afficher les 4 dimensions d'un gain.
- **Comparaisons** : valeur Site vs moyenne France / moyenne secteur systématiquement.

---

## 5. Note sur la Note de dimensionnement (CEE)

La Note de dimensionnement joue un rôle différent (justification technique pour
prime CEE). Le niveau Sinteo ne s'applique pas directement. Points à renforcer
néanmoins :

- **Fiche de garantie de résultat** en fin de note : engagement chiffré sur le
  gain annoncé, avec conditions d'exploitation (régulation, consignes, période
  de fonctionnement).
- **Tableau bénéfices multi-dimensions** (EF / EP / €/an / CO₂ / cumac) homogène
  avec celui de l'audit pour cohérence inter-documents.
- **Section « Contrôle avant / après »** : pré-requis, mesures de vérification
  (IPMVP Option A/B/C), période de mesure.

---

*Dernière mise à jour : Avril 2026*
*Responsable : Mahdi Houtia (Kilowater)*
