import ContactPage from "@/components/site/ContactPage";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default function ContactezNousPage() {
  const dict = getDictionary("fr");
  return (
    <ContactPage
      locale="fr"
      dict={dict.contact}
      projectTypeValues={dict.contact.form.projectTypes}
    />
  );
}
