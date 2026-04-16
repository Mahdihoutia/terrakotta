import type { Metadata } from "next";
import { getArticleBySlug, getAllArticles } from "@/lib/articles";

const BASE_URL = "https://kilowater.fr";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

/* ─── Parse French date ex: "18 février 2026" → ISO string ─── */
const FR_MONTHS: Record<string, string> = {
  janvier: "01", février: "02", mars: "03", avril: "04", mai: "05", juin: "06",
  juillet: "07", août: "08", septembre: "09", octobre: "10", novembre: "11", décembre: "12",
};
function toIsoDate(frDate: string): string {
  const match = frDate.toLowerCase().match(/(\d{1,2})\s+([a-zéûôîâ]+)\s+(\d{4})/);
  if (!match) return new Date().toISOString();
  const [, day, month, year] = match;
  const mm = FR_MONTHS[month] ?? "01";
  return `${year}-${mm}-${day.padStart(2, "0")}T09:00:00+01:00`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article introuvable",
    };
  }

  return {
    title: article.title,
    description: article.excerpt,
    keywords: [
      article.category.toLowerCase(),
      "rénovation énergétique",
      "bureau d'étude",
      "kilowater",
    ],
    openGraph: {
      title: `${article.title} | Kilowater`,
      description: article.excerpt,
      url: `${BASE_URL}/laboratoire-idees/${slug}`,
      type: "article",
      publishedTime: toIsoDate(article.date),
      images: [
        {
          url: article.image,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    alternates: {
      canonical: `${BASE_URL}/laboratoire-idees/${slug}`,
    },
  };
}

export function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export default async function ArticleLayout({ params, children }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) return <>{children}</>;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: article.image,
    datePublished: toIsoDate(article.date),
    dateModified: toIsoDate(article.date),
    author: {
      "@type": "Organization",
      name: "Kilowater",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Kilowater",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/opengraph-image`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/laboratoire-idees/${slug}`,
    },
    articleSection: article.category,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Laboratoire d'idées",
        item: `${BASE_URL}/laboratoire-idees`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `${BASE_URL}/laboratoire-idees/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
