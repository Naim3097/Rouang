"use client";

import Link from "next/link";
import Script from "next/script";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Mark } from "@/components/brand/Brand";
import { budgets, categories, projectTypes, timelines, type Category } from "@/config/enquiry";
import { track } from "@/lib/analytics";
import { submitEnquiry, type EnquiryState } from "@/lib/enquiry/action";

const initial: EnquiryState = { status: "idle" };

/**
 * The project enquiry. Short by default: name, a way to reply, home or business, and a few lines
 * about the space. Everything else is optional and tucked behind "Add detail".
 * Works without JavaScript (server action), validates on the server, and only shows the success
 * state after the server confirms the enquiry was stored.
 */
export function EnquiryForm({
  tone = "light",
  detailsOpen = false,
  turnstileSiteKey = null,
  location = "contact",
}: {
  tone?: "light" | "dark";
  detailsOpen?: boolean;
  turnstileSiteKey?: string | null;
  location?: string;
}) {
  const [state, formAction, pending] = useActionState(submitEnquiry, initial);
  const [category, setCategory] = useState<Category | "">((state.values?.category as Category) ?? "");
  const [startedAt, setStartedAt] = useState("");
  const [utm, setUtm] = useState("");
  const [sourcePath, setSourcePath] = useState("");
  const started = useRef(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const uid = useId();

  useEffect(() => {
    setStartedAt(String(Date.now()));
    setSourcePath(window.location.pathname);
    const params = new URLSearchParams(window.location.search);
    const tags = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid"]
      .map((k) => (params.get(k) ? `${k}=${params.get(k)}` : null))
      .filter(Boolean);
    setUtm(tags.join("&"));
    // Links such as /contact?project=commercial preselect home or business.
    const preset = params.get("project");
    if ((preset === "residential" || preset === "commercial") && formRef.current) {
      const radio = formRef.current.querySelector<HTMLInputElement>(`input[name="category"][value="${preset}"]`);
      if (radio && !formRef.current.querySelector<HTMLInputElement>('input[name="category"]:checked')) {
        radio.checked = true;
        setCategory(preset);
      }
    }
  }, []);

  useEffect(() => {
    if (state.status === "success") {
      track("generate_lead", { category: state.category, location });
      successRef.current?.focus();
    } else if (state.status === "error") {
      track("form_error", { location });
      statusRef.current?.focus();
    }
  }, [state, location]);

  const dark = tone === "dark";
  const fieldLine = dark ? "border-kapur/30 focus-within:border-kapur" : "border-ink/25 focus-within:border-ink";
  const muted = dark ? "text-kapur/70" : "text-ink-muted";
  const err = state.fieldErrors ?? {};
  const v = state.values ?? {};

  if (state.status === "success") {
    return (
      <div className="py-6" role="status">
        <Mark className={`h-10 w-10 ${dark ? "text-kapur" : "text-ink"}`} />
        <h3 ref={successRef} tabIndex={-1} className="t-sub mt-6 outline-none">
          Thank you, {state.firstName}. Your enquiry is with the studio.
        </h3>
        <p className={`mt-4 max-w-[34rem] ${muted}`}>
          The studio will reply using the details you gave. If something changes in the meantime, you can send
          another note.
        </p>
      </div>
    );
  }

  const onFirstInput = () => {
    if (!started.current) {
      started.current = true;
      track("form_start", { location });
    }
  };

  const types = category ? projectTypes[category] : [];

  return (
    <form ref={formRef} action={formAction} noValidate onInput={onFirstInput} className="space-y-7" aria-describedby={`${uid}-privacy`}>
      <div
        ref={statusRef}
        tabIndex={-1}
        role={state.status === "error" ? "alert" : undefined}
        aria-live="polite"
        className="outline-none empty:hidden"
      >
        {state.status === "error" && state.message ? (
          <p className={`rounded-[2px] border px-4 py-3 text-[0.9375rem] ${dark ? "border-kapur/40" : "border-ink/40"}`}>
            {state.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-7 sm:grid-cols-2">
        <Field id={`${uid}-name`} label="Your name" error={err.name} line={fieldLine} className="sm:col-span-2">
          <input
            id={`${uid}-name`}
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={120}
            defaultValue={v.name}
            aria-invalid={!!err.name}
            aria-describedby={err.name ? `${uid}-name-error` : undefined}
            className="w-full bg-transparent py-2 text-[1.0625rem] outline-none"
          />
        </Field>
        <Field id={`${uid}-email`} label="Email" error={err.email} line={fieldLine} hint="Email or phone, whichever you prefer">
          <input
            id={`${uid}-email`}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            defaultValue={v.email}
            aria-invalid={!!err.email}
            aria-describedby={`${uid}-email-hint${err.email ? ` ${uid}-email-error` : ""}`}
            className="w-full bg-transparent py-2 text-[1.0625rem] outline-none"
          />
        </Field>
        <Field id={`${uid}-phone`} label="Phone or WhatsApp" error={err.phone} line={fieldLine}>
          <input
            id={`${uid}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            maxLength={24}
            defaultValue={v.phone}
            aria-invalid={!!err.phone}
            aria-describedby={err.phone ? `${uid}-phone-error` : undefined}
            className="w-full bg-transparent py-2 text-[1.0625rem] outline-none"
          />
        </Field>
      </div>

      <fieldset aria-describedby={err.category ? `${uid}-category-error` : undefined}>
        <legend className={`t-label mb-3 ${muted}`}>The project is for</legend>
        <div className="flex flex-wrap gap-3">
          {categories.map((c) => (
            <label
              key={c.value}
              className={`relative inline-flex min-h-12 cursor-pointer items-center gap-3 rounded-full border px-5 transition-colors has-[:checked]:border-current has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 ${
                dark
                  ? "border-kapur/30 has-[:checked]:bg-kapur has-[:checked]:text-ink"
                  : "border-ink/25 has-[:checked]:bg-ink has-[:checked]:text-kapur"
              }`}
            >
              <input
                type="radio"
                name="category"
                value={c.value}
                required
                defaultChecked={v.category === c.value}
                onChange={() => setCategory(c.value)}
                className="peer sr-only"
              />
              <span>{c.label}</span>
            </label>
          ))}
        </div>
        {err.category ? <ErrorText id={`${uid}-category-error`}>{err.category}</ErrorText> : null}
      </fieldset>

      <Field id={`${uid}-message`} label="About the space" error={err.message} line={fieldLine} hint="What it is, roughly how big, and what you'd like to change">
        <textarea
          id={`${uid}-message`}
          name="message"
          required
          rows={4}
          maxLength={3000}
          defaultValue={v.message}
          aria-invalid={!!err.message}
          aria-describedby={`${uid}-message-hint${err.message ? ` ${uid}-message-error` : ""}`}
          className="w-full resize-y bg-transparent py-2 text-[1.0625rem] leading-relaxed outline-none"
        />
      </Field>

      <details open={detailsOpen || !!(v.projectType || v.location || v.budget || v.timeline)} className="group">
        <summary className={`t-label inline-flex min-h-11 cursor-pointer list-none items-center gap-3 ${muted} [&::-webkit-details-marker]:hidden`}>
          <span className="relative block h-3 w-3" aria-hidden="true">
            <span className="absolute left-0 top-1/2 h-px w-3 bg-current" />
            <span className="absolute left-1/2 top-0 h-3 w-px bg-current transition-transform duration-300 group-open:scale-y-0" />
          </span>
          Add detail (optional)
        </summary>
        <div className="mt-6 grid gap-7 sm:grid-cols-2">
          <Field id={`${uid}-type`} label="Type of space" error={err.projectType} line={fieldLine}>
            <select
              id={`${uid}-type`}
              name="projectType"
              defaultValue={v.projectType ?? ""}
              disabled={!category}
              className="w-full appearance-none bg-transparent py-2 text-[1.0625rem] outline-none disabled:opacity-50"
            >
              <option value="">{category ? "Choose one" : "Choose home or business first"}</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field id={`${uid}-location`} label="Where is it?" error={err.location} line={fieldLine}>
            <input
              id={`${uid}-location`}
              name="location"
              type="text"
              autoComplete="address-level2"
              maxLength={120}
              placeholder="Area and city"
              defaultValue={v.location}
              className="w-full bg-transparent py-2 text-[1.0625rem] outline-none placeholder:opacity-50"
            />
          </Field>
          <Field id={`${uid}-budget`} label="Budget for the whole project" error={err.budget} line={fieldLine}>
            <select id={`${uid}-budget`} name="budget" defaultValue={v.budget ?? ""} className="w-full appearance-none bg-transparent py-2 text-[1.0625rem] outline-none">
              <option value="">Prefer not to say</option>
              {budgets.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
          <Field id={`${uid}-timeline`} label="When would you like to start?" error={err.timeline} line={fieldLine}>
            <select id={`${uid}-timeline`} name="timeline" defaultValue={v.timeline ?? ""} className="w-full appearance-none bg-transparent py-2 text-[1.0625rem] outline-none">
              <option value="">Prefer not to say</option>
              {timelines.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </details>

      {/* Spam trap: hidden from people and assistive technology. */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label>
          Company website
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <input type="hidden" name="started_at" value={startedAt} />
      <input type="hidden" name="sourcePath" value={sourcePath} />
      <input type="hidden" name="utm" value={utm} />

      {turnstileSiteKey ? (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme={dark ? "dark" : "light"} />
        </>
      ) : null}

      <div className="flex flex-col gap-5 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={pending}
          className={`btn ${dark ? "btn-solid-light" : "btn-solid-dark"} disabled:cursor-wait disabled:opacity-70`}
        >
          <span>{pending ? "Sending…" : "Send enquiry"}</span>
          <span className="btn-ring" aria-hidden="true">
            <Mark className="h-[1.85rem] w-[1.85rem]" />
          </span>
        </button>
        <p id={`${uid}-privacy`} className={`t-caption max-w-[24rem] ${muted}`}>
          We use these details only to reply to your enquiry. See our{" "}
          <Link href="/privacy#english" className="underline underline-offset-2">
            privacy notice
          </Link>
          .{" "}
          <span lang="ms">
            Maklumat ini hanya digunakan untuk membalas pertanyaan anda. Rujuk{" "}
            <Link href="/privacy#bahasa-malaysia" className="underline underline-offset-2">
              notis privasi
            </Link>{" "}
            kami.
          </span>
        </p>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  line,
  className = "",
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  line: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className={`border-b transition-colors ${line} ${error ? "border-current" : ""}`}>
        <label htmlFor={id} className="t-label block opacity-70">
          {label}
        </label>
        {children}
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="t-caption mt-2 opacity-70">
          {hint}
        </p>
      ) : null}
      {error ? <ErrorText id={`${id}-error`}>{error}</ErrorText> : null}
    </div>
  );
}

function ErrorText({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="t-caption mt-2 flex items-center gap-2">
      <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </p>
  );
}
