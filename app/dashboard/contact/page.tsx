"use client";

// Contact Us page editor. Edits the single ContactPageContent document that
// the JMT frontend /contact page renders — hero, the tabbed inquiry
// hub, the aside (WhatsApp / call / trust / office map) and the FAQ.

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  HelpCircle,
  Inbox,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import * as Collapsible from "@radix-ui/react-collapsible";
import {
  CONTACT_ICON_NAMES,
  CONTACT_META_DEFAULTS,
  defaultContactContent,
  type ContactPageContent,
} from "@/app/lib/content/contact-content";

// ─── Shared styles (same idiom as the About editor) ──────────────────────────

const inputCls =
  "w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500";
const textareaCls = `${inputCls} resize-y`;
const selectCls =
  "rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500";
const cardWrapCls = "bg-slate-800/30 p-4 rounded-lg border border-slate-700";
const labelCls = "text-sm font-medium text-slate-200";
const addBtnCls =
  "border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-700 hover:text-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const known = (CONTACT_ICON_NAMES as readonly string[]).includes(value);
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${selectCls} w-full`}>
      {!known && value && <option value={value}>{value} (custom)</option>}
      {CONTACT_ICON_NAMES.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      title="Remove"
      className="text-red-400 hover:text-red-300 hover:bg-red-400/20 shrink-0"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} className={addBtnCls}>
      <Plus className="h-4 w-4 mr-1" /> {label}
    </Button>
  );
}

function StringListEditor({
  items,
  onChange,
  placeholder,
  addLabel,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <Input
            className={inputCls}
            value={item}
            placeholder={placeholder}
            onChange={(e) => onChange(items.map((it, idx) => (idx === i ? e.target.value : it)))}
          />
          <RemoveButton onClick={() => onChange(items.filter((_, idx) => idx !== i))} />
        </div>
      ))}
      <AddButton onClick={() => onChange([...items, ""])} label={addLabel} />
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  hint,
  open,
  onToggle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  hint?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Collapsible.Root open={open} onOpenChange={onToggle}>
      <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
        <Collapsible.Trigger asChild>
          <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3 text-left">
              <Icon className="h-5 w-5 text-indigo-400 shrink-0" />
              <div>
                <span className="text-lg font-semibold text-white">{title}</span>
                {hint && <p className="text-xs text-slate-400">{hint}</p>}
              </div>
            </div>
            {open ? (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-slate-400" />
            )}
          </button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <div className="px-4 pb-4 pt-2 sm:px-6 sm:pb-6 space-y-4 border-t border-white/10">{children}</div>
        </Collapsible.Content>
      </div>
    </Collapsible.Root>
  );
}

// Merge stored content with the defaults so missing keys never crash the form
function normalizeContact(raw: unknown): ContactPageContent {
  const d = defaultContactContent();
  if (!raw || typeof raw !== "object") return d;
  const c = raw as Partial<ContactPageContent>;
  return {
    hero: { ...d.hero, ...(c.hero || {}) },
    inquiry: { ...d.inquiry, ...(c.inquiry || {}) },
    aside: {
      ...d.aside,
      ...(c.aside || {}),
      whatsapp: { ...d.aside.whatsapp, ...(c.aside?.whatsapp || {}) },
      call: { ...d.aside.call, ...(c.aside?.call || {}) },
      office: { ...d.aside.office, ...(c.aside?.office || {}) },
      trust: Array.isArray(c.aside?.trust) ? c.aside.trust : d.aside.trust,
    },
    faq: { ...d.faq, ...(c.faq || {}) },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContactDashboardPage() {
  const [metaTitle, setMetaTitle] = useState(CONTACT_META_DEFAULTS.metaTitle);
  const [metaDescription, setMetaDescription] = useState(CONTACT_META_DEFAULTS.metaDescription);
  const [content, setInternalContent] = useState<ContactPageContent>(defaultContactContent());
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({ seo: true, hero: true });

  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !p[k] }));
  const set = <K extends keyof ContactPageContent>(key: K, value: ContactPageContent[K]) =>
    setInternalContent((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/contact", { credentials: "include" });
        const data = await res.json();
        if (data.success && data.data) {
          setExists(true);
          setMetaTitle(data.data.metaTitle ?? CONTACT_META_DEFAULTS.metaTitle);
          setMetaDescription(data.data.metaDescription ?? CONTACT_META_DEFAULTS.metaDescription);
          setInternalContent(normalizeContact(data.data.content));
        }
      } catch {
        toast.error("Failed to load the contact page", { closeButton: true });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRevalidate = async () => {
    const toastId = toast.loading("Revalidating cache...");
    try {
      const res = await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["contact-page"] }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Cache cleared — frontend will fetch fresh content", { id: toastId });
      } else {
        toast.error(data.message || "Revalidation failed", { id: toastId });
      }
    } catch {
      toast.error("Revalidation failed", { id: toastId });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const toastId = toast.loading("Saving...", { closeButton: true });
    try {
      const res = await fetch("/api/contact", {
        method: exists ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ metaTitle, metaDescription, content }),
      });
      const data = await res.json();
      toast.dismiss(toastId);
      if (res.ok && data.success) {
        setExists(true);
        toast.success("Contact page saved — live site updated", { closeButton: true });
      } else {
        toast.error(data.message || "Failed to save", { closeButton: true });
      }
    } catch {
      toast.dismiss(toastId);
      toast.error("Failed to save", { closeButton: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 p-4 sm:p-6 flex items-center justify-center">
        <p className="text-slate-300">Loading...</p>
      </div>
    );
  }

  const { hero, inquiry, aside, faq } = content;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Contact Page</h1>
            <p className="text-slate-400">
              Every section of the live /contact page — save to publish instantly.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRevalidate}
              title="Clear frontend cache for the Contact page"
              className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Revalidate Cache
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6"
            >
              {saving ? "Saving..." : exists ? "Save Page" : "Create Page"}
            </Button>
          </div>
        </div>

        {/* ── SEO ── */}
        <SectionCard icon={FileText} title="SEO / Meta" open={!!open.seo} onToggle={() => toggle("seo")}>
          <Field label="Meta Title">
            <Input className={inputCls} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
          </Field>
          <Field label="Meta Description">
            <textarea rows={3} className={textareaCls} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
          </Field>
        </SectionCard>

        {/* ── Hero ── */}
        <SectionCard
          icon={Sparkles}
          title="Hero"
          hint="Dark banner: badge, title with gold accent, subtitle (*asterisks* = bold white)"
          open={!!open.hero}
          onToggle={() => toggle("hero")}
        >
          <Field label="Badge">
            <Input className={inputCls} value={hero.badge} onChange={(e) => set("hero", { ...hero, badge: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Title lead">
              <Input className={inputCls} value={hero.titleLead} onChange={(e) => set("hero", { ...hero, titleLead: e.target.value })} />
            </Field>
            <Field label="Title accent (gold gradient)">
              <Input className={inputCls} value={hero.titleAccent} onChange={(e) => set("hero", { ...hero, titleAccent: e.target.value })} />
            </Field>
          </div>
          <Field label="Subtitle — wrap words in *asterisks* to bold them">
            <textarea rows={3} className={textareaCls} value={hero.subtitle} onChange={(e) => set("hero", { ...hero, subtitle: e.target.value })} />
          </Field>
        </SectionCard>

        {/* ── Inquiry hub ── */}
        <SectionCard
          icon={Inbox}
          title="Inquiry Hub"
          hint="The tabbed form card: quote tab, inquiry tab, dropdown options, buttons and messages"
          open={!!open.inquiry}
          onToggle={() => toggle("inquiry")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Quote tab label">
              <Input className={inputCls} value={inquiry.tabQuote} onChange={(e) => set("inquiry", { ...inquiry, tabQuote: e.target.value })} />
            </Field>
            <Field label="Inquiry tab label">
              <Input className={inputCls} value={inquiry.tabInquiry} onChange={(e) => set("inquiry", { ...inquiry, tabInquiry: e.target.value })} />
            </Field>
            <Field label="Quote heading">
              <Input className={inputCls} value={inquiry.quoteHeading} onChange={(e) => set("inquiry", { ...inquiry, quoteHeading: e.target.value })} />
            </Field>
            <Field label="Inquiry heading">
              <Input className={inputCls} value={inquiry.inquiryHeading} onChange={(e) => set("inquiry", { ...inquiry, inquiryHeading: e.target.value })} />
            </Field>
          </div>
          <Field label="Quote intro">
            <textarea rows={2} className={textareaCls} value={inquiry.quoteIntro} onChange={(e) => set("inquiry", { ...inquiry, quoteIntro: e.target.value })} />
          </Field>
          <Field label="Inquiry intro">
            <textarea rows={2} className={textareaCls} value={inquiry.inquiryIntro} onChange={(e) => set("inquiry", { ...inquiry, inquiryIntro: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Phone codes">
              <StringListEditor items={inquiry.phoneCodes} onChange={(phoneCodes) => set("inquiry", { ...inquiry, phoneCodes })} placeholder="+91" addLabel="Add code" />
            </Field>
            <Field label="Document types">
              <StringListEditor items={inquiry.documentTypes} onChange={(documentTypes) => set("inquiry", { ...inquiry, documentTypes })} placeholder="Degree Certificate" addLabel="Add type" />
            </Field>
            <Field label="Destination countries">
              <StringListEditor items={inquiry.destinations} onChange={(destinations) => set("inquiry", { ...inquiry, destinations })} placeholder="UAE" addLabel="Add country" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Quote button text">
              <Input className={inputCls} value={inquiry.ctaQuote} onChange={(e) => set("inquiry", { ...inquiry, ctaQuote: e.target.value })} />
            </Field>
            <Field label="Inquiry button text">
              <Input className={inputCls} value={inquiry.ctaInquiry} onChange={(e) => set("inquiry", { ...inquiry, ctaInquiry: e.target.value })} />
            </Field>
          </div>
          <Field label="Privacy note (under the button)">
            <textarea rows={2} className={textareaCls} value={inquiry.privacyNote} onChange={(e) => set("inquiry", { ...inquiry, privacyNote: e.target.value })} />
          </Field>
          <div className={`${cardWrapCls} space-y-4`}>
            <span className="text-sm font-semibold text-slate-300">Success state (after submitting)</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Heading">
                <Input className={inputCls} value={inquiry.successHeading} onChange={(e) => set("inquiry", { ...inquiry, successHeading: e.target.value })} />
              </Field>
              <Field label="Button text">
                <Input className={inputCls} value={inquiry.successButton} onChange={(e) => set("inquiry", { ...inquiry, successButton: e.target.value })} />
              </Field>
            </div>
            <Field label="Message">
              <textarea rows={2} className={textareaCls} value={inquiry.successText} onChange={(e) => set("inquiry", { ...inquiry, successText: e.target.value })} />
            </Field>
          </div>
        </SectionCard>

        {/* ── Aside ── */}
        <SectionCard
          icon={MapPin}
          title="Quick Contacts, Trust & Office"
          hint="Right column: WhatsApp / call cards, trust stats panel, office map card"
          open={!!open.aside}
          onToggle={() => toggle("aside")}
        >
          <div className={`${cardWrapCls} space-y-3`}>
            <span className="text-sm font-semibold text-slate-300">WhatsApp card</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Field label="Title">
                <Input className={inputCls} value={aside.whatsapp.title} onChange={(e) => set("aside", { ...aside, whatsapp: { ...aside.whatsapp, title: e.target.value } })} />
              </Field>
              <Field label="Subtext">
                <Input className={inputCls} value={aside.whatsapp.sub} onChange={(e) => set("aside", { ...aside, whatsapp: { ...aside.whatsapp, sub: e.target.value } })} />
              </Field>
              <Field label="Link (wa.me URL)">
                <Input className={inputCls} value={aside.whatsapp.url} onChange={(e) => set("aside", { ...aside, whatsapp: { ...aside.whatsapp, url: e.target.value } })} />
              </Field>
            </div>
          </div>
          <div className={`${cardWrapCls} space-y-3`}>
            <span className="text-sm font-semibold text-slate-300">Call card</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Field label="Title">
                <Input className={inputCls} value={aside.call.title} onChange={(e) => set("aside", { ...aside, call: { ...aside.call, title: e.target.value } })} />
              </Field>
              <Field label="Subtext">
                <Input className={inputCls} value={aside.call.sub} onChange={(e) => set("aside", { ...aside, call: { ...aside.call, sub: e.target.value } })} />
              </Field>
              <Field label="Link (tel: URL)">
                <Input className={inputCls} value={aside.call.url} onChange={(e) => set("aside", { ...aside, call: { ...aside.call, url: e.target.value } })} />
              </Field>
            </div>
          </div>
          <div className={`${cardWrapCls} space-y-3`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300">Trust panel</span>
            </div>
            <Field label="Kicker">
              <Input className={inputCls} value={aside.trustKicker} onChange={(e) => set("aside", { ...aside, trustKicker: e.target.value })} />
            </Field>
            <div className="space-y-2">
              {aside.trust.map((t, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 flex-1 min-w-0">
                    <IconSelect value={t.icon} onChange={(icon) => set("aside", { ...aside, trust: aside.trust.map((x, idx) => (idx === i ? { ...x, icon } : x)) })} />
                    <Input className={inputCls} value={t.value} placeholder="Value (99.7%)" onChange={(e) => set("aside", { ...aside, trust: aside.trust.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)) })} />
                    <Input className={inputCls} value={t.label} placeholder="Label" onChange={(e) => set("aside", { ...aside, trust: aside.trust.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)) })} />
                  </div>
                  <RemoveButton onClick={() => set("aside", { ...aside, trust: aside.trust.filter((_, idx) => idx !== i) })} />
                </div>
              ))}
              <AddButton onClick={() => set("aside", { ...aside, trust: [...aside.trust, { icon: "BadgeCheck", value: "", label: "" }] })} label="Add stat" />
            </div>
          </div>
          <div className={`${cardWrapCls} space-y-3`}>
            <span className="text-sm font-semibold text-slate-300">Office card</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Office name">
                <Input className={inputCls} value={aside.office.name} onChange={(e) => set("aside", { ...aside, office: { ...aside.office, name: e.target.value } })} />
              </Field>
              <Field label="Working hours">
                <Input className={inputCls} value={aside.office.hours} onChange={(e) => set("aside", { ...aside, office: { ...aside.office, hours: e.target.value } })} />
              </Field>
            </div>
            <Field label="Address (one line per row)">
              <textarea rows={2} className={textareaCls} value={aside.office.address} onChange={(e) => set("aside", { ...aside, office: { ...aside.office, address: e.target.value } })} />
            </Field>
            <Field label="Map embed URL (OpenStreetMap / Google Maps embed)">
              <Input className={inputCls} value={aside.office.mapEmbedUrl} onChange={(e) => set("aside", { ...aside, office: { ...aside.office, mapEmbedUrl: e.target.value } })} />
            </Field>
            <Field label="Get Directions link">
              <Input className={inputCls} value={aside.office.directionsUrl} onChange={(e) => set("aside", { ...aside, office: { ...aside.office, directionsUrl: e.target.value } })} />
            </Field>
          </div>
        </SectionCard>

        {/* ── FAQ ── */}
        <SectionCard
          icon={HelpCircle}
          title="FAQ"
          hint='"Quick answers" accordion at the bottom of the page'
          open={!!open.faq}
          onToggle={() => toggle("faq")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Kicker">
              <Input className={inputCls} value={faq.kicker} onChange={(e) => set("faq", { ...faq, kicker: e.target.value })} />
            </Field>
            <Field label="Heading">
              <Input className={inputCls} value={faq.heading} onChange={(e) => set("faq", { ...faq, heading: e.target.value })} />
            </Field>
          </div>
          {faq.items.map((f, i) => (
            <div key={i} className={`${cardWrapCls} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">FAQ {i + 1}</span>
                <RemoveButton onClick={() => set("faq", { ...faq, items: faq.items.filter((_, idx) => idx !== i) })} />
              </div>
              <Field label="Question">
                <Input className={inputCls} value={f.q} onChange={(e) => set("faq", { ...faq, items: faq.items.map((x, idx) => (idx === i ? { ...x, q: e.target.value } : x)) })} />
              </Field>
              <Field label="Answer">
                <textarea rows={3} className={textareaCls} value={f.a} onChange={(e) => set("faq", { ...faq, items: faq.items.map((x, idx) => (idx === i ? { ...x, a: e.target.value } : x)) })} />
              </Field>
            </div>
          ))}
          <AddButton onClick={() => set("faq", { ...faq, items: [...faq.items, { q: "", a: "" }] })} label="Add FAQ" />
        </SectionCard>

        <div className="flex justify-end pb-10">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-8"
          >
            {saving ? "Saving..." : exists ? "Save Page" : "Create Page"}
          </Button>
        </div>
      </div>
    </div>
  );
}
