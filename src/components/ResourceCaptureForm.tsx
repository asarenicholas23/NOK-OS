import React, { useState, useEffect } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { loadFirebase } from "../lib/loadFirebase";
import { freeTools } from "../content/siteContent";

const LEAD_EMAIL_STORAGE_KEY = "nok_lead_email";

interface ResourceCaptureFormProps {
  resourceId: string;
  resourceTitle: string;
  onUnlock: () => void;
}

export const ResourceCaptureForm: React.FC<ResourceCaptureFormProps> = ({
  resourceId,
  resourceTitle,
  onUnlock
}) => {
  const [savedEmail] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LEAD_EMAIL_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Returning visitor shortcut: skip the form entirely and unlock immediately.
  useEffect(() => {
    if (savedEmail) {
      onUnlock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !businessName) return;
    setSubmitting(true);
    setError("");
    try {
      // Firebase loads on submit, so the page itself doesn't download it.
      const [{ db }, { collection, addDoc, serverTimestamp }] = await Promise.all([loadFirebase(), import("firebase/firestore")]);
      await addDoc(collection(db, "leads"), {
        name,
        email,
        businessName,
        resourceId,
        resourceTitle,
        source: "resources-page",
        timestamp: serverTimestamp()
      });
      try {
        localStorage.setItem(LEAD_EMAIL_STORAGE_KEY, email);
      } catch {
        // Ignore storage failures (private browsing, etc.) — unlock still proceeds.
      }
      onUnlock();
    } catch (err) {
      console.error("Failed to save lead:", err);
      setError(freeTools.form.error);
      setSubmitting(false);
    }
  };

  const f = freeTools.form;
  const inputCls =
    "w-full rounded-2xl bg-site-paper px-4 py-3 text-base text-site-graphite placeholder:text-site-slate/70 outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype";
  const labelCls = "mb-1.5 block text-[15px] font-medium text-site-ink";

  if (savedEmail) {
    return (
      <div className="space-y-3 py-8 text-center" role="status">
        <CheckCircle2 className="mx-auto h-8 w-8 text-site-cyanotype" aria-hidden="true" />
        <p className="text-base text-site-slate">{f.welcomeBack}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="pr-10">
        <p className="font-mono text-xs text-site-cyanotype">{f.tag}</p>
        <h2 id="unlock-title" className="mt-1 text-2xl font-semibold leading-tight text-site-ink">
          {f.title(resourceTitle)}
        </h2>
        <p className="mt-1.5 text-base leading-normal text-site-slate">{f.body}</p>
      </div>

      <div className="space-y-3 pt-1">
        <div>
          <label htmlFor="rcf-name" className={labelCls}>{f.name}</label>
          <input id="rcf-name" type="text" required autoComplete="name" placeholder={f.namePlaceholder} value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="rcf-email" className={labelCls}>{f.email}</label>
          <input id="rcf-email" type="email" required autoComplete="email" placeholder={f.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="rcf-business" className={labelCls}>{f.business}</label>
          <input id="rcf-business" type="text" required autoComplete="organization" placeholder={f.businessPlaceholder} value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputCls} />
        </div>
      </div>

      {error && <p role="alert" className="text-[15px] text-[#B42318]">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-site-amber px-6 py-3.5 text-base font-semibold text-site-ink cursor-pointer transition-[filter] duration-300 ease-soft hover:brightness-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
        {submitting ? f.submitting : f.submit}
      </button>
    </form>
  );
};
