import { proofStats, trustedLogos } from "@/data/site";
import styles from "./ProofTrust.module.css";

const splitAt = Math.ceil(trustedLogos.length / 2);
const logoRows = [
  { id: "top", logos: trustedLogos.slice(0, splitAt), reverse: false },
  { id: "bottom", logos: trustedLogos.slice(splitAt), reverse: true },
];

function LogoMarqueeRow({ logos, reverse }: { logos: typeof trustedLogos; reverse?: boolean }) {
  return (
    <div className={`${styles.logoRow} ${reverse ? styles.reverse : ""}`}>
      <div className={styles.logoTrack}>
        {[0, 1].map((runIndex) => (
          <div className={styles.logoSet} key={runIndex} aria-hidden={runIndex === 1}>
            {logos.map((logo) => (
              <div
                className={`${styles.logoTile} ${
                  logo.treatment === "native" || logo.treatment === "nativeTall" ? styles.nativeTile : ""
                }`}
                key={`${runIndex}-${logo.name}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={`${styles.logo} ${
                    logo.treatment === "native"
                      ? styles.nativeLogo
                      : logo.treatment === "nativeTall"
                        ? `${styles.nativeLogo} ${styles.tallLogo}`
                        : logo.treatment === "tinyChanges"
                          ? styles.tinyChangesLogo
                          : ""
                  }`}
                  src={logo.src}
                  alt={runIndex === 0 ? logo.name : ""}
                  loading="eager"
                  decoding="async"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProofTrust() {
  return (
    <section className={`p-section p-dark ${styles.proof}`} id="proof" aria-labelledby="proof-title">
      <div className="p-container">
        <div className={styles.head}>
          <p className="p-eyebrow">Verified proof</p>
          <h2 id="proof-title" className="p-h2">
            Numbers we can <span className="azu">stand behind</span>.
          </h2>
        </div>

        <div className={styles.stats}>
          {proofStats.map((stat) => (
            <div className={styles.stat} key={stat.value}>
              <div className={styles.value}>{stat.value}</div>
              <p className={styles.label}>{stat.label}</p>
            </div>
          ))}
        </div>

        <div className={styles.trust}>
          <p className={styles.trustLabel}>Trusted by teams across Scotland &amp; the UK</p>
          <div className={styles.marquee} aria-label="Trusted teams across Scotland and the UK">
            {logoRows.map((row) => (
              <LogoMarqueeRow key={row.id} logos={row.logos} reverse={row.reverse} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
