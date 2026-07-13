import styles from "./Showreel.module.css";

// The final showreel lives on Google Drive; /preview renders an embeddable player.
// ⚠️ The Drive file must be shared "Anyone with the link — Viewer" to play here.
// File: "Plistic Media Showreel Final.mp4"
const SHOWREEL_EMBED = "https://drive.google.com/file/d/1DiW92NcLN6JvxUylh28i4lx5Jvj0eIow/preview";

export function Showreel() {
  return (
    <section className={`p-section ${styles.section}`} id="showreel" aria-labelledby="showreel-title">
      <div className="p-container">
        <div className={styles.head}>
          <p className="p-eyebrow">Showreel</p>
          <h2 id="showreel-title" className={`p-h2 ${styles.title}`}>
            A minute of <span className="azu">what we make</span>.
          </h2>
        </div>
        <div className={styles.frame}>
          <iframe
            src={SHOWREEL_EMBED}
            title="Plistic showreel"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
