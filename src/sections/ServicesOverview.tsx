import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { services } from "@/data/site";
import styles from "./ServicesOverview.module.css";

export function ServicesOverview() {
  return (
    <section className={`p-section ${styles.services}`} id="services" aria-labelledby="services-title">
      <div className="p-container">
        <div className={styles.head}>
          <p className="p-eyebrow">Services</p>
          <h2 id="services-title" className="p-h2">
            Everything media, made sim<span className="azu">PLISTIC</span>.
          </h2>
          <p className="p-lead">
            Audio, video, documentary, music, ads, distribution, research and coaching - one Glasgow production
            company for the whole project.
          </p>
        </div>

        <div className={styles.grid}>
          {services.slice(0, 4).map((service, idx) => {
            const imageStyle =
              service.title === "Documentary" || service.title === "Event filming"
                ? ({ objectPosition: "center top" } as const)
                : undefined;

            return (
              <Link className={`${styles.tile} p-vf`} href={service.href ?? "#contact"} key={service.title}>
                <span className="p-vfc" aria-hidden="true" />
                <div className={styles.media}>
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    sizes="(max-width: 560px) 100vw, (max-width: 1000px) 50vw, 25vw"
                    style={imageStyle}
                  />
                </div>
                <span className={styles.scrim} aria-hidden="true" />
                <div className={styles.copy}>
                  <p className={styles.num}>{String(idx + 1).padStart(2, "0")} / 04</p>
                  <h3 className={styles.title}>{service.title}</h3>
                  <p className={styles.summary}>{service.summary}</p>
                  <span className={styles.link}>
                    Explore
                    <ArrowRight aria-hidden="true" size={15} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
