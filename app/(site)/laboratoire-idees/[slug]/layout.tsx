import type { Metadata } from "next";
import { getArticleBySlug, getAllArticles } from "@/lib/articles";

const BASE_URL = "https://kilowater.fr";

interface Props {
  params: Promise<{ slug: string }>;
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
      publishedTime: article.date,
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

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
