"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, FileText, AlignLeft, ShieldCheck, RefreshCw } from "lucide-react";
import * as Collapsible from "@radix-ui/react-collapsible";
import dynamic from "next/dynamic";

const Tiptap = dynamic(() => import("@/components/common/Editor"), { ssr: false });

interface TermsPolicyFormData {
    metaTitle: string;
    metaDescription: string;
    title: string;
    subTitle: string;
    content: { body: string };
    privacyPolicyContent: { body: string };
}

const defaultFormData: TermsPolicyFormData = {
    metaTitle: "Terms & Privacy Policy · JMT",
    metaDescription: "Read the terms and conditions and privacy policy governing your use of JMT products and services.",
    title: "Terms & Policy",
    subTitle: "Please read these terms carefully before using our services.",
    content: { body: "" },
    privacyPolicyContent: { body: "" },
};

function AutoResizeTextarea({
    value,
    onChange,
    placeholder,
    className,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
}) {
    const ref = useRef<HTMLTextAreaElement>(null);

    const resize = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    }, []);

    useEffect(() => { resize(); }, [value, resize]);

    return (
        <textarea
            ref={ref}
            value={value}
            rows={1}
            onChange={(e) => { onChange(e.target.value); resize(); }}
            placeholder={placeholder}
            className={className}
            style={{ overflowY: "hidden", resize: "none" }}
        />
    );
}

interface SectionHeaderProps {
    icon: React.ReactNode;
    title: string;
    isOpen: boolean;
}

function SectionHeader({ icon, title, isOpen }: SectionHeaderProps) {
    return (
        <div className="flex items-center gap-3 text-left">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
                {icon}
            </span>
            <span className="text-[15px] font-semibold text-foreground">{title}</span>
            <span className="ml-auto shrink-0 text-muted-foreground">
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
        </div>
    );
}

export default function TermsPolicyDashboardPage() {
    const [formData, setFormData] = useState<TermsPolicyFormData>(defaultFormData);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isNew, setIsNew] = useState(false);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        meta: true,
        terms: true,
        privacy: false,
    });

    useEffect(() => {
        fetch("/api/terms-policy")
            .then((r) => r.json())
            .then((res) => {
                if (res.success && res.data) {
                    setFormData({
                        metaTitle: res.data.metaTitle || defaultFormData.metaTitle,
                        metaDescription: res.data.metaDescription || defaultFormData.metaDescription,
                        title: res.data.title || defaultFormData.title,
                        subTitle: res.data.subTitle || defaultFormData.subTitle,
                        content: { body: res.data.content?.body || "" },
                        privacyPolicyContent: { body: res.data.privacyPolicyContent?.body || "" },
                    });
                    setIsNew(false);
                } else {
                    setIsNew(true);
                }
            })
            .catch(() => toast.error("Failed to load terms & policy data"))
            .finally(() => setLoading(false));
    }, []);

    function toggleSection(key: string) {
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    function setField(field: keyof Omit<TermsPolicyFormData, "content" | "privacyPolicyContent">, value: string) {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }

    async function handleRevalidate() {
        const toastId = toast.loading("Revalidating cache...");
        try {
            const res = await fetch("/api/revalidate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tags: ["terms-policy"] }),
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
    }

    async function handleSave() {
        setSaving(true);
        try {
            const method = isNew ? "POST" : "PATCH";
            const res = await fetch("/api/terms-policy", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(isNew ? "Terms & Policy created!" : "Terms & Policy updated!");
                setIsNew(false);
            } else {
                toast.error(data.message || "Failed to save");
            }
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
        );
    }

    const inputCls =
        "transition-colors";
    const labelCls = "block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";
    const textareaCls =
        "w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-brand/60 focus-visible:ring-2 focus-visible:ring-ring resize-none transition-colors";

    return (
        <div className="min-h-screen w-full bg-background px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">

                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Terms &amp; Policy</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {isNew
                                ? "No data yet — fill in the fields and click Create Page."
                                : "Edit and save to update the live Terms & Policy page."}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                        {!isNew && (
                            <Button
                                variant="outline"
                                onClick={handleRevalidate}
                                className="border-warning/40 text-warning bg-warning/10 hover:bg-warning/20 hover:text-warning cursor-pointer"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Revalidate Cache
                            </Button>
                        )}
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="disabled:opacity-60 cursor-pointer"
                        >
                            {saving ? "Saving…" : isNew ? "Create Page" : "Save Changes"}
                        </Button>
                    </div>
                </div>

                <div className="space-y-3">

                    {/* Meta Section */}
                    <Collapsible.Root open={openSections.meta} onOpenChange={() => toggleSection("meta")}>
                        <div className="overflow-hidden rounded-lg border bg-card">
                            <Collapsible.Trigger className="w-full cursor-pointer px-5 py-4 hover:bg-muted/50 transition-colors">
                                <SectionHeader icon={<FileText size={15} />} title="SEO / Meta" isOpen={openSections.meta} />
                            </Collapsible.Trigger>
                            <Collapsible.Content>
                                <div className="border-t border-border px-5 pb-6 pt-5 space-y-4">
                                    <div>
                                        <label className={labelCls}>Meta Title</label>
                                        <Input
                                            className={inputCls}
                                            value={formData.metaTitle}
                                            onChange={(e) => setField("metaTitle", e.target.value)}
                                            placeholder="Terms & Privacy Policy · JMT"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Meta Description</label>
                                        <AutoResizeTextarea
                                            className={textareaCls}
                                            value={formData.metaDescription}
                                            onChange={(v) => setField("metaDescription", v)}
                                            placeholder="Read the terms and conditions and privacy policy…"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Page Title</label>
                                        <Input
                                            className={inputCls}
                                            value={formData.title}
                                            onChange={(e) => setField("title", e.target.value)}
                                            placeholder="Terms & Policy"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Sub Title</label>
                                        <AutoResizeTextarea
                                            className={textareaCls}
                                            value={formData.subTitle}
                                            onChange={(v) => setField("subTitle", v)}
                                            placeholder="Please read these terms carefully before using our services."
                                        />
                                    </div>
                                </div>
                            </Collapsible.Content>
                        </div>
                    </Collapsible.Root>

                    {/* Terms & Conditions Content */}
                    <Collapsible.Root open={openSections.terms} onOpenChange={() => toggleSection("terms")}>
                        <div className="overflow-hidden rounded-lg border bg-card">
                            <Collapsible.Trigger className="w-full cursor-pointer px-5 py-4 hover:bg-muted/50 transition-colors">
                                <SectionHeader icon={<AlignLeft size={15} />} title="Terms & Conditions Content" isOpen={openSections.terms} />
                            </Collapsible.Trigger>
                            <Collapsible.Content>
                                <div className="border-t border-border px-5 pb-6 pt-5">
                                    <p className="mb-4 text-[12px] text-muted-foreground">
                                        Content shown in the <span className="text-brand-link font-medium">Terms & Conditions</span> tab on the live page.
                                    </p>
                                    <div className="rounded-lg overflow-hidden border border-border">
                                        <Tiptap
                                            content={formData.content.body}
                                            onChange={(html) =>
                                                setFormData((prev) => ({ ...prev, content: { body: html } }))
                                            }
                                            placeholder="Write the full terms and conditions here…"
                                        />
                                    </div>
                                </div>
                            </Collapsible.Content>
                        </div>
                    </Collapsible.Root>

                    {/* Privacy Policy Content */}
                    <Collapsible.Root open={openSections.privacy} onOpenChange={() => toggleSection("privacy")}>
                        <div className="overflow-hidden rounded-lg border bg-card">
                            <Collapsible.Trigger className="w-full cursor-pointer px-5 py-4 hover:bg-muted/50 transition-colors">
                                <SectionHeader icon={<ShieldCheck size={15} />} title="Privacy Policy Content" isOpen={openSections.privacy} />
                            </Collapsible.Trigger>
                            <Collapsible.Content>
                                <div className="border-t border-border px-5 pb-6 pt-5">
                                    <p className="mb-4 text-[12px] text-muted-foreground">
                                        Content shown in the <span className="text-brand-link font-medium">Privacy Policy</span> tab on the live page.
                                    </p>
                                    <div className="rounded-lg overflow-hidden border border-border">
                                        <Tiptap
                                            content={formData.privacyPolicyContent.body}
                                            onChange={(html) =>
                                                setFormData((prev) => ({ ...prev, privacyPolicyContent: { body: html } }))
                                            }
                                            placeholder="Write the full privacy policy here…"
                                        />
                                    </div>
                                </div>
                            </Collapsible.Content>
                        </div>
                    </Collapsible.Root>

                </div>
            </div>
        </div>
    );
}
