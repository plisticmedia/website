import type { Metadata } from "next";
import Link from "next/link";
import { Check, Handshake, Users, X } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/auth";
import { getSellerNetwork, getLinkableBusinesses, type NetworkConnection } from "@/lib/peers";
import { ActionButton } from "@/components/ActionButton";
import { SubmitButton } from "@/components/SubmitButton";
import { addCollaboration, confirmCollaboration, declineCollaboration, removeCollaboration, submitPeerFeedback } from "./actions";
import styles from "./Network.module.css";

export const metadata: Metadata = { title: "My network | Plistic" };
export const dynamic = "force-dynamic";

export default async function NetworkPage() {
  const profile = await requireUser("/dashboard/network");
  const [network, linkable] = await Promise.all([getSellerNetwork(profile.id), getLinkableBusinesses(profile.id)]);
  const { confirmed, incoming, outgoing, myServices } = network;

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.inner}`}>
          <p className={styles.kicker}>
            <Link href="/dashboard">Dashboard</Link> / My network
          </p>
          <h1>My network</h1>
          <p className={styles.lead}>
            Map who you&apos;ve worked with. Add a business you&apos;ve collaborated with — once they confirm, it shows on
            both your profiles. You can also leave <strong>private</strong> feedback on a confirmed collaborator; that&apos;s
            only ever seen by Plistic, never published.
          </p>

          {myServices.length === 0 ? (
            <p className={styles.empty}>
              You need a listing first. <Link href="/dashboard/listings/new">Create one</Link> to start building your network.
            </p>
          ) : (
            <>
              {/* Incoming requests to confirm */}
              {incoming.length > 0 && (
                <section className={styles.block}>
                  <h2 className={styles.h2}><Users size={18} aria-hidden="true" /> Confirm you&apos;ve worked together</h2>
                  <ul className={styles.list}>
                    {incoming.map((c) => (
                      <li key={c.id} className={styles.row}>
                        <div>
                          <strong>{c.other.title}</strong> says they&apos;ve worked with <strong>{c.mine.title}</strong>.
                          {c.note ? <div className={styles.note}>“{c.note}”</div> : null}
                        </div>
                        <div className={styles.rowActions}>
                          <ActionButton action={confirmCollaboration.bind(null, c.id)} pendingText="…" className={styles.btnSmall}>
                            <Check size={14} aria-hidden="true" /> Confirm
                          </ActionButton>
                          <ActionButton action={declineCollaboration.bind(null, c.id)} pendingText="…" className={`${styles.btnSmall} ${styles.btnGhost}`}>
                            <X size={14} aria-hidden="true" /> Decline
                          </ActionButton>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Add a collaboration */}
              <section className={styles.block}>
                <h2 className={styles.h2}><Handshake size={18} aria-hidden="true" /> Add a business you&apos;ve worked with</h2>
                <form action={addCollaboration} className={styles.addForm}>
                  {myServices.length === 1 ? (
                    <input type="hidden" name="myServiceId" value={myServices[0].id} />
                  ) : (
                    <label className={styles.field}>
                      <span>Your listing</span>
                      <select name="myServiceId" required>
                        {myServices.map((s) => (
                          <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className={styles.field}>
                    <span>Business you worked with</span>
                    <select name="peerServiceId" required defaultValue="">
                      <option value="" disabled>Choose a business…</option>
                      {linkable.map((s) => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>What did you work on together? (optional, shown publicly)</span>
                    <input name="note" type="text" maxLength={300} placeholder="e.g. Co-produced the Tiny Changes podcast" />
                  </label>
                  <SubmitButton pendingText="Adding…" className="p-btn">Add collaboration</SubmitButton>
                </form>
                <p className={styles.hint}>
                  Only published businesses appear here. It stays pending until they confirm.
                </p>
              </section>

              {/* Confirmed collaborators + private feedback */}
              <section className={styles.block}>
                <h2 className={styles.h2}>Confirmed collaborators ({confirmed.length})</h2>
                {confirmed.length === 0 ? (
                  <p className={styles.hint}>None yet — add one above.</p>
                ) : (
                  <ul className={styles.list}>
                    {confirmed.map((c) => (
                      <li key={c.id} className={styles.rowCol}>
                        <div className={styles.rowTop}>
                          <div>
                            <Link href={`/directory/${c.other.slug}`} target="_blank"><strong>{c.other.title}</strong></Link>
                            {myServices.length > 1 ? <span className={styles.note}> · with {c.mine.title}</span> : null}
                            {c.note ? <div className={styles.note}>“{c.note}”</div> : null}
                          </div>
                          <ActionButton
                            action={removeCollaboration.bind(null, c.id)}
                            pendingText="…"
                            className={`${styles.btnSmall} ${styles.btnGhost}`}
                            confirm={`Remove the collaboration with ${c.other.title}?`}
                          >
                            Remove
                          </ActionButton>
                        </div>
                        <FeedbackForm conn={c} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Outgoing pending */}
              {outgoing.length > 0 && (
                <section className={styles.block}>
                  <h2 className={styles.h2}>Awaiting confirmation ({outgoing.length})</h2>
                  <ul className={styles.list}>
                    {outgoing.map((c) => (
                      <li key={c.id} className={styles.row}>
                        <div>
                          <strong>{c.other.title}</strong> — waiting for them to confirm.
                          {c.note ? <div className={styles.note}>“{c.note}”</div> : null}
                        </div>
                        <ActionButton action={removeCollaboration.bind(null, c.id)} pendingText="…" className={`${styles.btnSmall} ${styles.btnGhost}`}>
                          Cancel
                        </ActionButton>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function FeedbackForm({ conn }: { conn: NetworkConnection }) {
  return (
    <details className={styles.feedback}>
      <summary>Leave private feedback on {conn.other.title}</summary>
      <p className={styles.privacyNote}>
        Private to Plistic — never shown on their profile or to them. Helps us keep the directory trustworthy.
      </p>
      <form action={submitPeerFeedback} className={styles.fbForm}>
        <input type="hidden" name="raterServiceId" value={conn.mine.id} />
        <input type="hidden" name="subjectServiceId" value={conn.other.id} />
        <label className={styles.field}>
          <span>Would you work with them again? *</span>
          <select name="wouldWorkAgain" required defaultValue="">
            <option value="" disabled>Choose…</option>
            <option value="yes">Yes</option>
            <option value="mixed">Mixed</option>
            <option value="no">No</option>
          </select>
        </label>
        <div className={styles.ratings}>
          {(["reliability", "communication", "quality"] as const).map((dim) => (
            <label key={dim} className={styles.field}>
              <span>{dim[0].toUpperCase() + dim.slice(1)}</span>
              <select name={dim} defaultValue="">
                <option value="">–</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <label className={styles.field}>
          <span>Anything else? (private)</span>
          <textarea name="privateNote" rows={2} maxLength={2000} placeholder="Only Plistic sees this." />
        </label>
        <SubmitButton pendingText="Saving…" className={styles.btnSmall}>Save private feedback</SubmitButton>
      </form>
    </details>
  );
}
