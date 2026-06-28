"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import styles from "./EarnPage.module.css";

type FormState = {
  status: "idle" | "submitting" | "success" | "error";
  message: string;
};

type SubmitResult = {
  emailConfigured?: boolean;
  error?: string;
};

const initialState: FormState = { status: "idle", message: "" };

async function submitEarnForm(form: HTMLFormElement, type: "referral" | "partner") {
  const formData = new FormData(form);
  const payload = {
    type,
    ...Object.fromEntries(formData.entries()),
  };

  const response = await fetch("/api/earn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = (await response.json().catch(() => null)) as SubmitResult | null;

  if (!response.ok) {
    throw new Error(result?.error ?? "Something went wrong. Please try again.");
  }

  return result;
}

export function ReferralForm() {
  const [formState, setFormState] = useState<FormState>(initialState);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    setFormState({ status: "submitting", message: "Sending referral..." });

    try {
      const result = await submitEarnForm(form, "referral");
      form.reset();
      setFormState({
        status: "success",
        message:
          result?.emailConfigured === false
            ? "Referral received locally. Email sending is not configured in this environment."
            : "Referral received. We have sent confirmation and Jessie will follow up within 24 hours.",
      });
    } catch (error) {
      setFormState({
        status: "error",
        message: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <form className={styles.formCard} onSubmit={handleSubmit} aria-label="Submit a referral">
      <div className={styles.formHeader}>
        <span>Referral form</span>
        <h3>Introduce us to the project.</h3>
        <p>We will confirm receipt automatically and notify the Plistic team.</p>
      </div>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Your name</span>
          <input name="referrerName" type="text" autoComplete="name" required />
        </label>
        <label className={styles.field}>
          <span>Your email</span>
          <input name="referrerEmail" type="email" autoComplete="email" required />
        </label>
        <label className={styles.field}>
          <span>Referred contact name</span>
          <input name="referredName" type="text" autoComplete="name" required />
        </label>
        <label className={styles.field}>
          <span>Referred contact email</span>
          <input name="referredEmail" type="email" autoComplete="email" required />
        </label>
        <label className={`${styles.field} ${styles.fullField}`}>
          <span>Project description <em>optional</em></span>
          <textarea
            name="projectDescription"
            rows={5}
            placeholder="A few lines about what they might need, where they are based, or why Plistic could be a fit."
          />
        </label>
      </div>
      <FormStatus state={formState} />
      <button className={`p-btn ${styles.formButton}`} type="submit" disabled={formState.status === "submitting"}>
        {formState.status === "submitting" ? "Sending..." : "Submit referral"}
        <ArrowRight aria-hidden="true" size={18} />
      </button>
    </form>
  );
}

export function PartnerForm() {
  const [formState, setFormState] = useState<FormState>(initialState);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    setFormState({ status: "submitting", message: "Sending message..." });

    try {
      await submitEarnForm(form, "partner");
      form.reset();
      setFormState({
        status: "success",
        message: "Thanks, we have received your partnership enquiry and will come back to you soon.",
      });
    } catch (error) {
      setFormState({
        status: "error",
        message: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <form className={styles.formCard} onSubmit={handleSubmit} aria-label="Partnership enquiry">
      <div className={styles.formHeader}>
        <span>Partner contact</span>
        <h3>Tell us where you fit.</h3>
        <p>Use this if your work complements Plistic and you want to explore a more formal relationship.</p>
      </div>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Your name</span>
          <input name="partnerName" type="text" autoComplete="name" required />
        </label>
        <label className={styles.field}>
          <span>Your email</span>
          <input name="partnerEmail" type="email" autoComplete="email" required />
        </label>
        <label className={styles.field}>
          <span>Company or organisation</span>
          <input name="partnerCompany" type="text" autoComplete="organization" />
        </label>
        <label className={styles.field}>
          <span>What do you do?</span>
          <input name="partnerDiscipline" type="text" placeholder="Photography, PR, animation, paid media..." required />
        </label>
        <label className={`${styles.field} ${styles.fullField}`}>
          <span>Message</span>
          <textarea
            name="partnerMessage"
            rows={5}
            placeholder="Tell us about your work, who you serve, and what kind of collaboration would make sense."
            required
          />
        </label>
      </div>
      <FormStatus state={formState} />
      <button className={`p-btn ${styles.formButton}`} type="submit" disabled={formState.status === "submitting"}>
        {formState.status === "submitting" ? "Sending..." : "Send partnership enquiry"}
        <ArrowRight aria-hidden="true" size={18} />
      </button>
    </form>
  );
}

function FormStatus({ state }: { state: FormState }) {
  if (state.status === "idle" || state.status === "submitting") {
    return null;
  }

  const isSuccess = state.status === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <p className={`${styles.formStatus} ${isSuccess ? styles.success : styles.error}`} aria-live="polite">
      <Icon aria-hidden="true" size={18} />
      {state.message}
    </p>
  );
}
