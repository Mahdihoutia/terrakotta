import { notFound } from "next/navigation";
import ArticleView from "@/components/site/ArticleView";
import { toSummary } from "@/lib/articles";
import { getLocalizedArticle, getLocalizedRelated } from "@/lib/i18n/articles";
import { LAB_CONTENT } from "@/lib/i18n/content/lab";
import { markdownToHtml } from "@/lib/markdown";

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getLocalizedArticle("fr", slug);
  if (!article) notFound();

  return (
    <ArticleView
      locale="fr"
      content={LAB_CONTENT.fr}
      article={toSummary(article)}
      contentHtml={markdownToHtml(article.content)}
      related={getLocalizedRelated("fr", slug)}
    />
  );
}
