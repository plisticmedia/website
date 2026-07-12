import { Quote } from "lucide-react";
import { testimonials } from "@/data/site";
import styles from "./Testimonials.module.css";

export function Testimonials() {
  return (
    <section className={`p-section ${styles.section}`} id="testimonials" aria-labelledby="testimonials-title">
      <div className="p-container">
        <div className={styles.head}>
          <p className="p-eyebrow">In their words</p>
          <h2 id="testimonials-title" className="p-h2">
            What clients <span className="azu">say</span>.
          </h2>
        </div>

        <div className={styles.grid}>
          {testimonials.map((t) => (
            <figure className={styles.card} key={t.name + t.quote.slice(0, 12)}>
              <Quote aria-hidden="true" size={26} className={styles.mark} />
              <blockquote>{t.quote}</blockquote>
              <figcaption>
                <strong>{t.name}</strong>
                <span>{t.org}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
