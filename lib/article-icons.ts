import {
  Sun,
  Wind,
  TreePine,
  Globe,
  Leaf,
  Building2,
  Thermometer,
  Zap,
  Droplets,
  FlaskConical,
  BadgeEuro,
  ShieldCheck,
  Scale,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Icônes des articles, référencées par nom dans `lib/articles.ts` pour que les
 * données restent sérialisables (passage Server → Client Components).
 */
export const ARTICLE_ICONS = {
  Sun,
  Wind,
  TreePine,
  Globe,
  Leaf,
  Building2,
  Thermometer,
  Zap,
  Droplets,
  FlaskConical,
  BadgeEuro,
  ShieldCheck,
  Scale,
} satisfies Record<string, LucideIcon>;

export type ArticleIconName = keyof typeof ARTICLE_ICONS;
