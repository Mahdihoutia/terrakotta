import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleView from "@/components/site/ArticleView";
import { toSummary } from "@/lib/articles";
import { SITE_URL } from "@/lib/i18n/config";
import { ARTICLE_SLUGS_FR } from "@/lib/i18n/article-slugs";
import { getLocalizedArticle, getLocalizedArticles, getLocalizedRelated } from "@/lib/i18n/articles";
import { LAB_CONTENT } from "@/lib/i18n/content/lab";
import { getArticleAlternates, ROUTES } from "@/lib/i18n/routes";
import { markdownToHtml } from "@/lib/markdown";

interface Props {
  params: Promise<{ slug: string }>;
}

/* Seuls les articles traduits existent en anglais */
export const dynamicParams = false;

export function generateStaticParams() {
  return getLocalizedArticles("en").map((a) => ({ slug: a.slug }));
}

/** "16 September 2026" → ISO 8601 */
function toIsoDate(enDate: string): string {
  const parsed = new Date(`${enDate} 09:00 UTC`);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getLocalizedArticle("en", slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: `${article.title} | Kilowater`,
      description: article.excerpt,
      url: `${SITE_URL}${ROUTES.en.lab}/${slug}`,
      type: "article",
      publishedTime: toIsoDate(article.date),
      images: [{ url: article.image, width: 1200, height: 630, alt: article.title }],
    },
    alternates: getArticleAlternates(ARTICLE_SLUGS_FR[slug], "en"),
  };
}

export default async function InsightArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getLocalizedArticle("en", slug);
  if (!article) notFound();

  const url = `${SITE_URL}${ROUTES.en.lab}/${slug}`;
  const content = LAB_CONTENT.en;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    inLanguage: "en",
    headline: article.title,
    description: article.excerpt,
    image: article.image,
    datePublished: toIsoDate(article.date),
    dateModified: toIsoDate(article.date),
    author: { "@type": "Organization", name: "Kilowater", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "Kilowater",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/opengraph-image` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: content.categories[article.category],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: content.article.breadcrumbHome, item: `${SITE_URL}${ROUTES.en.home}` },
      { "@type": "ListItem", position: 2, name: content.article.breadcrumbLab, item: `${SITE_URL}${ROUTES.en.lab}` },
      { "@type": "ListItem", position: 3, name: article.title, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ArticleView
        locale="en"
        content={content}
        article={toSummary(article)}
        contentHtml={markdownToHtml(article.content)}
        related={getLocalizedRelated("en", slug)}
      />
    </>
  );
}
