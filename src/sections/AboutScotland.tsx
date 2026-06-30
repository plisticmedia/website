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
      "Kayla founded Plistic with a simple conviction: that the best media work happens when the people making it genuinely care about what's being said. As founder, they lead on everything that happens before a camera rolls or a microphone goes live - the storyboarding, scripting, research, and partnerships that turn a client's vision into reality.",
      "Kayla believes that everyone has an important story to tell. The projects that excite them span everything from a mental health podcast for young musicians to a documentary on neurodivergent entrepreneurship to a long-running business podcast that became number one in its niche on Apple Podcasts - and plenty in between that would surprise you. What they most value in this work is helping people figure out how to tell their story well, making space for voices that don't always get the platform they deserve, and doing the research and preparation that determines whether a project actually lands. They also work directly with hosts, presenters, and on-camera talent - coaching people to show up at their best rather than simply pointing a camera at them and hoping for the best.",
      "That instinct is sharpened by something unusual in a media producer: Kayla is a PhD researcher at the University of St Andrews, with their research sitting at the intersection of psychology, technology, and media. This directly informs how Kayla approaches production, where understanding how an audience receives and experiences content matters just as much as how the content is made.",
      "Outside of Plistic, Kayla sits on the board of the Royal Scottish National Orchestra, contributes to the Cross-Party Group on Music in the Scottish Parliament, and has given evidence to the Scottish Parliament's Economy and Fair Work Committee on AI and the creative industries. They are also a published children's author.",
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
      "Ross Sloan co-founded Plistic because he believed that professional media production should not be out of reach for the people and organisations who have the most interesting things to say. As Head of Production and Operations, he is the person who makes the work happen - overseeing production across every project, from the first recording day through to the final delivered file.",
      "His background in psychology shapes his understanding of how audiences engage with content, how format and pacing affect attention, and what makes something genuinely watchable or listenable rather than merely well-produced. It runs through the decisions he makes in the edit room and on set.",
      "Among the projects Ross enjoys most are event recordings - the challenge of capturing something live, in real time, across multiple cameras, then shaping it into something that holds together long after the event itself is over.",
      "Recent highlights include two large-scale music video projects produced in collaboration with Lockie Media: twelve videos across eighteen months in locations ranging from a newsroom to a near-3,000 square metre warehouse with pyrotechnics and drones, plus a full choreography shoot at Strathclyde Union.",
      "Ross is committed to making the audio and video production industry more accessible - to musicians, podcasters, and organisations that have something worth sharing but are not sure where to start. That commitment, alongside his curiosity about what great media production actually requires, is what makes him the right person at the centre of everything Plistic produces.",
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
              Plistic is the evolution of Songplistic and Podplistic - Glasgow-based production companies that started
              off in music and podcast production, but have now combined to cover all your media needs.
            </p>
            <div className={styles.points}>
              <div className={styles.point}>
                <MapPinned aria-hidden="true" size={20} />
                <span>Glasgow-based, recording remotely across the UK and internationally.</span>
              </div>
              <div className={styles.point}>
                <Brain aria-hidden="true" size={20} />
                <span>Psychology-informed production shapes the research, pacing, coaching, and delivery behind every project.</span>
              </div>
            </div>
          </div>

          <div className={`${styles.media} p-vf`}>
            <span className="p-vfc" aria-hidden="true" />
            <Image
              src="/assets/photos/glasgow-view.webp"
              alt="A Glasgow view from a Plistic production workspace"
              fill
              sizes="(max-width: 860px) 100vw, 50vw"
            />
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
