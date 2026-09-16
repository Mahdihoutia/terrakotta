import { Fragment } from "react";

interface Props {
  /** Texte où les passages entre `**` sont mis en gras. */
  text: string;
  className?: string;
}

/** Rend un texte de dictionnaire avec emphase légère (`**gras**`), sans HTML brut. */
export default function Emphasis({ text, className }: Props) {
  return (
    <>
      {text.split("**").map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className={className}>
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
