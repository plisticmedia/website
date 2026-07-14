import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { bookingPagePath, caseStudies } from "@/data/site";
import styles from "./WorkPreview.module.css";

export function WorkPreview() {
  return (
    <section className={`p-section p-dark ${styles.work}`} id="work" aria-labelledby="work-title">
      <div className="p-container">
        <div className={styles.head}>
          <div className={styles.headText}>
            <p className="p-eyebrow">Selected work</p>
            <h2 id="work-title" className="p-h2">Work we&apos;re proud of.</h2>
          </div>
          <Link className={styles.headLink} href={bookingPagePath}>
            Discuss a project
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>

        <div className={styles.grid}>
          {caseStudies.map((study) => {
            const imageStyle =
              study.client === "Connect-Ed"
                ? ({ objectFit: "cover", objectPosition: "58% center" } as const)
                : study.client === "Unfiltered"
                  ? ({ objectPosition: "58% 22%" } as const)
                  : study.client === "Tiny Changes"
                    ? ({ objectPosition: "center 22%" } as const)
                    : undefined;
            const tile = (
              <>
                <span className="p-vfc" aria-hidden="true" />
                <div className={styles.media}>
                  <Image
                    src={study.image}
                    alt={study.client}
                    fill
                    sizes="(max-width: 760px) 100vw, 50vw"
                    style={imageStyle}
                  />
                </div>
                <span className={styles.scrim} aria-hidden="true" />
                <div className={styles.copy}>
                  <p className={styles.tag}>{study.service}</p>
                  <h3 className={styles.client}>{study.client}</h3>
                  <p className={styles.desc}>{study.description}</p>
                  {study.href ? (
                    <span className={styles.readMore}>
                      Read case study
                      <ArrowRight aria-hidden="true" size={15} />
                    </span>
                  ) : null}
                </div>
              </>
            );

            return study.href ? (
              <Link className={`${styles.tile} ${styles.linkTile} p-vf`} href={study.href} key={study.client}>
                {tile}
              </Link>
            ) : (
              <article className={`${styles.tile} p-vf`} key={study.client}>
                {tile}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
