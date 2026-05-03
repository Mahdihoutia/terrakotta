import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface RelatedLink {
  href: string;
  label: string;
}

interface Props {
  title: string;
  description: string;
  icon: React.ReactNode;
  relatedLinks?: RelatedLink[];
}

export default function WorkspaceTabPlaceholder({
  title,
  description,
  icon,
  relatedLinks = [],
}: Props) {
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-tk-border bg-tk-surface/40 p-10 text-center">
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-tk-hover text-tk-text-muted">
        {icon}
      </div>
      <h2 className="text-[15px] font-semibold text-tk-text">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-tk-text-muted">
        {description}
      </p>

      {relatedLinks.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {relatedLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-1.5 rounded-md border border-tk-border bg-tk-surface px-3 py-1.5 text-[12px] font-medium text-tk-text-secondary transition-colors hover:border-tk-border-hover hover:text-tk-text"
            >
              {link.label}
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          ))}
        </div>
      )}

      <p className="mt-6 text-[11px] uppercase tracking-wider text-tk-text-faint">
        Module en cours de migration vers le workspace projet
      </p>
    </div>
  );
}
