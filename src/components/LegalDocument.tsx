import type { LegalDocumentData, LegalSection } from "@/data/legal";
import styles from "@/app/legal.module.css";

type LegalDocumentProps = {
  document: LegalDocumentData;
};

export function LegalDocument({ document }: LegalDocumentProps) {
  return (
    <article className={styles.document}>
      <header className={styles.documentHeader}>
        <p className={styles.documentKicker}>Plistic</p>
        <h2>{document.documentTitle}</h2>
        <p>{document.companyLine}</p>
        <p className={styles.updated}>Last updated: {document.lastUpdated}</p>
        <a className={styles.download} href={document.pdfPath}>
          Download PDF
        </a>
      </header>
      {document.sections.map((section) => (
        <LegalSectionView key={section.title} level={2} section={section} />
      ))}
    </article>
  );
}

function LegalSectionView({ section, level }: { section: LegalSection; level: 2 | 3 }) {
  return (
    <section className={section.title ? undefined : styles.continuedSection}>
      {section.title ? level === 2 ? <h2>{section.title}</h2> : <h3>{section.title}</h3> : null}
      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {section.list ? (
        <ul>
          {section.list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {section.subsections?.map((subsection, index) => (
        <LegalSectionView key={`${subsection.title}-${index}`} level={3} section={subsection} />
      ))}
    </section>
  );
}
