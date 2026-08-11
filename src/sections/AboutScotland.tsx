import Image from "next/image";
import { Brain, MapPinned } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import styles from "./AboutScotland.module.css";

const founders = [
  {
    name: "Kayla-Megan Burns",
    role: "Founder",
    image: {
      src: "/assets/photos/founders/kayla-megan-burns.jpg",
      alt: "Kayla-Megan Burns, founder of Plistic",
      position: "50% 38%",
    },
    paragraphs: [
      "Kayla leads everything that happens before a camera rolls - the storyboarding, scripting, research and partnerships - on the conviction that the best media happens when the makers genuinely care about what's being said. They believe everyone has a story worth telling, and make space for voices that don't always get a platform: a mental-health podcast for young musicians, a documentary on neurodivergent entrepreneurship, a business podcast that hit #1 in its niche on Apple Podcasts.",
      "A PhD researcher at St Andrews working across psychology, technology and media, Kayla treats how an audience receives content as seriously as how it's made - which is why they coach hosts and on-camera talent to show up at their best, not just point a camera and hope. (They also sit on the board of the RSNO and are a published children's author.)",
    ],
  },
  {
    name: "Ross Sloan",
    role: "Founder, Head of Production",
    image: {
      src: "/assets/photos/founders/ross-sloan-2026.jpg",
      alt: "Ross Sloan, founder and head of production at Plistic",
      position: "50% 50%",
    },
    paragraphs: [
      "Ross makes the work happen - overseeing every project from the first recording day to the final delivered file - because he believes professional production shouldn't be out of reach for the people with the most interesting things to say. His background in psychology runs through every edit-room and on-set decision: how format and pacing hold attention, and what makes something genuinely watchable rather than merely well-produced.",
      "He's at his best on live event captures - multi-camera, in real time, shaped into something that outlasts the day. Recent highlights include two large-scale music-video projects with Lockie Media: twelve videos over eighteen months, from a newsroom to a near-3,000 m² warehouse with pyrotechnics and drones.",
    ],
  },
];

export function AboutScotland() {
  return (
    <section className={`p-section ${styles.about}`} id="about" aria-labelledby="about-title">
      <div className="p-container">
        <div className={styles.layout}>
          <div className={styles.copy}>
            <p className="p-eyebrow">Made in Scotland</p>
            <h1 id="about-title" className="p-h2">
              Built for how people actually <span className="azu">listen &amp; watch</span>.
            </h1>
            <p className="p-lead">
              For six years - first as Songplistic and Podplistic, now combined as Plistic - we've made media in
              Scotland with one belief at the core: understand the psychology of both the people on screen and the
              people watching, and you make work that actually lands.
            </p>
            <div className={styles.points}>
              <div className={styles.point}>
                <MapPinned aria-hidden="true" size={20} />
                <span>Glasgow-based, recording remotely across the UK and internationally.</span>
              </div>
              <div className={styles.point}>
                <Brain aria-hidden="true" size={20} />
                <span>Psychology-informed production - getting the best from those on screen and those watching - across six years of work.</span>
              </div>
            </div>
          </div>

          <div className={`${styles.media} p-vf`}>
            <span className="p-vfc" aria-hidden="true" />
            <Image
              src="/assets/photos/site/accelerateher.jpg"
              alt="Plistic filming a live event in Scotland"
              fill
              sizes="(max-width: 860px) 100vw, 50vw"
            />
          </div>
        </div>

        <div style={{ marginTop: "clamp(2.4rem, 5vw, 3.6rem)" }} aria-labelledby="building-title">
          <p className="p-eyebrow">More than a studio</p>
          <h2 id="building-title" className="p-h2">
            Why we built the <span className="azu">Media Directory</span> &amp; Scotland&apos;s Showcase.
          </h2>
          <div className={styles.buildGrid}>
            <div className={styles.buildCard}>
              <h3>The Media Directory</h3>
              <p>
                Making media accessible was never just about our own studio. Scotland is full of brilliant creative
                and media businesses that are hard to find and hard to hire. The directory puts them in one place -
                searchable by service, price and place - so buyers can find the right people, and every business,
                from a solo freelancer to a full studio, gets a page of their own.
              </p>
            </div>
            <div className={styles.buildCard}>
              <h3>Scotland&apos;s Showcase</h3>
              <p>
                So much world-class work is made here and never celebrated as Scottish. The Showcase is our home for
                the best of it - the films, records, events and stories worth shouting about - so the country&apos;s
                creative scene gets the recognition it deserves, and the people behind it get seen.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.founders} id="founders" aria-labelledby="founders-title">
          <div className={styles.foundersHead}>
            <p className="p-eyebrow">Founders</p>
            <h2 id="founders-title">The people shaping the work.</h2>
          </div>
          <div className={styles.founderGrid}>
            {founders.map((founder) => {
              const titleId = `${founder.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-bio`;

              return (
                <Card className={styles.founderCard} key={founder.name} role="article" aria-labelledby={titleId}>
                  <CardHeader className={styles.founderIntro}>
                    <div className={styles.founderPhoto}>
                      <Image
                        src={founder.image.src}
                        alt={founder.image.alt}
                        fill
                        sizes="(max-width: 700px) 120px, 280px"
                        style={{ objectPosition: founder.image.position }}
                      />
                    </div>
                    <div className={styles.founderIdentity}>
                      <CardDescription className={styles.role}>{founder.role}</CardDescription>
                      <CardTitle className={styles.founderName} id={titleId}>
                        {founder.name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className={styles.founderBio}>
                    {founder.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
