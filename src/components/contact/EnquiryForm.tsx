"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Mark } from "@/components/brand/Brand";
import { budgets, categories, projectTypes, timelines, type Category } from "@/config/enquiry";
import { track } from "@/lib/analytics";
import { submitEnquiry, type EnquiryState } from "@/lib/enquiry/action";

/** Form order, and the id suffix of each field, for the linked error summary. */
const FIELD_IDS: [string, string][] = [
  ["name", "name"],
  ["email", "email"],
  ["phone", "phone"],
  ["category", "category"],
  ["message", "message"],
  ["projectType", "type"],
  ["location", "location"],
  ["budget", "budget"],
  ["timeline", "timeline"],
];

const initial: EnquiryState = { status: "idle" };

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid"];

const subscribeNever = () => () => {};
/** A value from the address bar, read after hydration so the server and client markup match. */
function useLocation(part: "pathname" | "search") {
  return useSyncExternalStore(subscribeNever, () => window.location[part], () => "");
}

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
  const [chosen, setChosen] = useState<Category | "">((state.values?.category as Category) ?? "");
  const started = useRef(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const timingRef = useRef<HTMLInputElement>(null);
  const jsRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const uid = useId();

  const search = useLocation("search");
  const sourcePath = useLocation("pathname");
  const params = new URLSearchParams(search);
  const utm = UTM_KEYS.map((k) => (params.get(k) ? `${k}=${params.get(k)}` : null))
    .filter(Boolean)
    .join("&");
  // Links such as /contact?project=commercial preselect home or business.
  const preset = params.get("project");
  const presetCategory: Category | "" = preset === "residential" || preset === "commercial" ? preset : "";
  const category: Category | "" = chosen || presetCategory;

  // When the form became usable, for the server's too-fast check. Written straight to the hidden
  // fields so mounting the form causes no second render.
  useEffect(() => {
    if (timingRef.current) timingRef.current.value = String(Date.now());
    if (jsRef.current) jsRef.current.value = "1";
  }, []);

  // A preset from the address bar is known only after hydration, when React has already settled the
  // radios, so the matching one is checked directly (unless the visitor has chosen already).
  useEffect(() => {
    const form = formRef.current;
    if (!presetCategory || !form || form.querySelector("input[name=category]:checked")) return;
    const radio = form.querySelector<HTMLInputElement>(`input[name="category"][value="${presetCategory}"]`);
    if (radio) radio.checked = true;
  }, [presetCategory]);

  useEffect(() => {
    if (state.status === "success") {
      track("generate_lead", { category: state.category, location });
      successRef.current?.focus();
    } else if (state.status === "error") {
      track("form_error", { location });
      statusRef.current?.focus();
      statusRef.current?.scrollIntoView({ block: "center" });
    }
  }, [state, location]);

  const dark = tone === "dark";
  // Resting lines meet the 3:1 minimum for controls; labels and hints meet 4.5:1 on both tones.
  const fieldLine = dark ? "border-kapur/70 focus-within:border-kapur" : "border-ink/60 focus-within:border-ink";
  const muted = dark ? "text-kapur" : "text-ink-muted";
  const placeholder = dark ? "placeholder:text-kapur/85" : "placeholder:text-ink-muted";
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
  const errorLinks = FIELD_IDS.filter(([field]) => err[field]).map(([field, suffix]) => ({ id: `${uid}-${suffix}`, message: err[field] as string }));
  const goTo = (id: string) => (e: React.MouseEvent) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.focus();
    el.scrollIntoView({ block: "center" });
  };

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
          <div className={`rounded-[2px] border px-4 py-3 text-[0.9375rem] ${dark ? "border-kapur/70" : "border-ink/60"}`}>
            <p>{state.message}</p>
            {errorLinks.length ? (
              <ul className="mt-2 space-y-1">
                {errorLinks.map((l) => (
                  <li key={l.id}>
                    <a href={`#${l.id}`} onClick={goTo(l.id)} className="underline underline-offset-2">
                      {l.message}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-7 sm:grid-cols-2">
        <Field id={`${uid}-name`} label="Your name" error={err.name} line={fieldLine} tint={muted} className="sm:col-span-2">
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
        <Field id={`${uid}-email`} label="Email" error={err.email} line={fieldLine} tint={muted} hint="Email or phone, whichever you prefer">
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
        <Field id={`${uid}-phone`} label="Phone or WhatsApp" error={err.phone} line={fieldLine} tint={muted}>
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

      <fieldset
        role="radiogroup"
        aria-required="true"
        aria-invalid={err.category ? true : undefined}
        aria-describedby={err.category ? `${uid}-category-error` : undefined}
      >
        <legend className={`t-label mb-3 ${muted}`}>The project is for</legend>
        <div className="flex flex-wrap gap-3">
          {categories.map((c, i) => (
            <label
              key={c.value}
              className={`relative inline-flex min-h-12 cursor-pointer items-center gap-3 rounded-full border px-5 transition-colors has-[:checked]:border-current has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 ${
                dark
                  ? "border-kapur/70 has-[:checked]:bg-kapur has-[:checked]:text-ink"
                  : "border-ink/60 has-[:checked]:bg-ink has-[:checked]:text-kapur"
              }`}
            >
              <input
                type="radio"
                id={i === 0 ? `${uid}-category` : undefined}
                name="category"
                value={c.value}
                required
                defaultChecked={(v.category || presetCategory) === c.value}
                onChange={() => setChosen(c.value)}
                className="peer sr-only"
              />
              <span>{c.label}</span>
            </label>
          ))}
        </div>
        {err.category ? <ErrorText id={`${uid}-category-error`}>{err.category}</ErrorText> : null}
      </fieldset>

      <Field id={`${uid}-message`} label="About the space" error={err.message} line={fieldLine} tint={muted} hint="What it is, roughly how big, and what you'd like to change">
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
          <Field id={`${uid}-type`} label="Type of space" error={err.projectType} line={fieldLine} tint={muted}>
            {/* Both lists until home or business is chosen, so the field also works without JavaScript. */}
            <select
              id={`${uid}-type`}
              name="projectType"
              defaultValue={v.projectType ?? ""}
              className="w-full appearance-none bg-transparent py-2 text-[1.0625rem] outline-none"
            >
              <option value="">Choose one</option>
              {category
                ? types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))
                : categories.map((c) => (
                    <optgroup key={c.value} label={c.label}>
                      {projectTypes[c.value].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </optgroup>
                  ))}
            </select>
          </Field>
          <Field id={`${uid}-location`} label="Where is it?" error={err.location} line={fieldLine} tint={muted}>
            <input
              id={`${uid}-location`}
              name="location"
              type="text"
              autoComplete="address-level2"
              maxLength={120}
              placeholder="Area and city"
              defaultValue={v.location}
              className={`w-full bg-transparent py-2 text-[1.0625rem] outline-none ${placeholder}`}
            />
          </Field>
          <Field id={`${uid}-budget`} label="Budget for the whole project" error={err.budget} line={fieldLine} tint={muted}>
            <select id={`${uid}-budget`} name="budget" defaultValue={v.budget ?? ""} className="w-full appearance-none bg-transparent py-2 text-[1.0625rem] outline-none">
              <option value="">Prefer not to say</option>
              {budgets.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
          <Field id={`${uid}-timeline`} label="When would you like to start?" error={err.timeline} line={fieldLine} tint={muted}>
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
      {/* No value props: React would reset them on the next render and wipe the stamp. */}
      <input ref={timingRef} type="hidden" name="started_at" />
      <input ref={jsRef} type="hidden" name="js" />
      <input type="hidden" name="sourcePath" value={sourcePath} />
      <input type="hidden" name="utm" value={utm} />

      {turnstileSiteKey ? (
        <Turnstile siteKey={turnstileSiteKey} theme={dark ? "dark" : "light"} resetOn={state.status === "error" ? state : null} />
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

type TurnstileApi = {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
};

let turnstileScript: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  const existing = (window as { turnstile?: TurnstileApi }).turnstile;
  if (existing) return Promise.resolve(existing);
  turnstileScript ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => {
      const api = (window as { turnstile?: TurnstileApi }).turnstile;
      if (api) resolve(api);
      else reject(new Error("Turnstile did not initialise"));
    };
    script.onerror = () => {
      turnstileScript = null;
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return turnstileScript;
}

/**
 * Cloudflare Turnstile, rendered explicitly so it also appears after a client-side navigation.
 * The script loads only as the form comes near the screen or is first used, and the widget is
 * reset after a failed send because each token can be checked only once.
 */
function Turnstile({ siteKey, theme, resetOn }: { siteKey: string; theme: "light" | "dark"; resetOn: EnquiryState | null }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<{ api: TurnstileApi; id: string } | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const form = el.closest("form");
    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) start();
      },
      { rootMargin: "600px 0px" },
    );
    function start() {
      io.disconnect();
      form?.removeEventListener("focusin", start);
      loadTurnstile()
        .then((api) => {
          if (cancelled || widget.current || !el) return;
          widget.current = { api, id: api.render(el, { sitekey: siteKey, theme, action: "enquiry" }) };
        })
        .catch((err) => console.error("[enquiry]", err));
    }
    io.observe(el);
    form?.addEventListener("focusin", start);
    return () => {
      cancelled = true;
      io.disconnect();
      form?.removeEventListener("focusin", start);
      if (widget.current) widget.current.api.remove(widget.current.id);
      widget.current = null;
    };
  }, [siteKey, theme]);

  useEffect(() => {
    if (resetOn && widget.current) widget.current.api.reset(widget.current.id);
  }, [resetOn]);

  // Reserves the widget's height so the button below does not move when it appears.
  return <div ref={box} className="min-h-[65px]" />;
}

function Field({
  id,
  label,
  hint,
  error,
  line,
  tint,
  className = "",
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  line: string;
  /** Text colour for the label and hint, chosen per tone to pass contrast. */
  tint: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className={`border-b transition-colors ${line} ${error ? "border-current" : ""}`}>
        <label htmlFor={id} className={`t-label block ${tint}`}>
          {label}
        </label>
        {children}
      </div>
      {hint ? (
        <p id={`${id}-hint`} className={`t-caption mt-2 ${tint}`}>
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
