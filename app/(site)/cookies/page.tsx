import LegalLayout from "@/components/site/LegalLayout";
import CookieResetButton from "@/components/site/CookieResetButton";

export default function CookiesPage() {
  return (
    <LegalLayout
      eyebrow="Cookies"
      title="Gestion des cookies"
      subtitle="Cette page détaille les cookies déposés sur votre navigateur lors de votre visite et la manière de gérer vos préférences."
      updatedAt="5 mai 2026"
    >
      <h2>Qu&apos;est-ce qu&apos;un cookie&nbsp;?</h2>
      <p>
        Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, smartphone, tablette) lors de
        la visite d&apos;un site web. Il permet au site de mémoriser des informations relatives à votre navigation
        afin de faciliter votre expérience.
      </p>

      <h2>Cookies utilisés par www.kilowater.fr</h2>
      <p>
        Nous utilisons un nombre minimal de cookies, strictement nécessaires au fonctionnement du site. Aucun cookie
        publicitaire ou de profilage n&apos;est déposé.
      </p>

      <h3>Cookies strictement nécessaires (exemptés de consentement)</h3>
      <ul>
        <li>
          <strong>kw_cookie_consent_v1</strong> — mémorise votre choix concernant la bannière de cookies.
          Durée&nbsp;: 12 mois. Stocké dans le <em>localStorage</em> de votre navigateur.
        </li>
      </ul>

      <h3>Cookies de mesure d&apos;audience (soumis à consentement)</h3>
      <p>
        Nous pouvons être amenés à activer une mesure d&apos;audience anonyme (Vercel Analytics) afin d&apos;améliorer
        le site. Ces statistiques ne permettent pas de vous identifier et ne sont activées qu&apos;avec votre accord
        via la bannière de cookies.
      </p>

      <h2>Gérer vos préférences</h2>
      <p>
        Vous pouvez à tout moment modifier votre choix en cliquant sur le bouton ci-dessous, puis en faisant
        votre nouvelle sélection lorsque la bannière réapparaît.
      </p>
      <p>
        <CookieResetButton />
      </p>

      <h2>Configuration de votre navigateur</h2>
      <p>
        Vous pouvez également paramétrer votre navigateur pour bloquer ou supprimer les cookies. Voici les liens
        d&apos;aide pour les principaux navigateurs&nbsp;:
      </p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer">Google Chrome</a></li>
        <li><a href="https://support.mozilla.org/fr/kb/cookies-informations-sites-enregistrent" target="_blank" rel="noreferrer">Mozilla Firefox</a></li>
        <li><a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noreferrer">Safari</a></li>
        <li><a href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noreferrer">Microsoft Edge</a></li>
      </ul>

      <p>
        Pour plus d&apos;informations, consultez la{" "}
        <a href="https://www.cnil.fr/fr/cookies-et-traceurs-que-dit-la-loi" target="_blank" rel="noreferrer">
          page de la CNIL sur les cookies
        </a>.
      </p>
    </LegalLayout>
  );
}
