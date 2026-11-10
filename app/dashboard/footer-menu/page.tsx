"use client";

import { useEffect, useState } from "react";
import { Info, Plus, Trash2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface SubSubChildMenuItem {
    sub_sub_child_title: string;
    sub_sub_child_url: string;
}

interface SubChildMenuItem {
    title: string;
    url: string;
    sub_sub_child_menu: SubSubChildMenuItem[] | false;
}

interface ChildMenuItem {
    title: string;
    url: string;
    sub_child_menu: SubChildMenuItem[] | false;
}

interface MainMenuItem {
    title: string;
    url: string;
    child_menu: ChildMenuItem[] | false;
}

type ContactType = "email" | "phone" | "address" | "social" | "link" | "text";

interface ContactDetailSubChild {
    title: string;
    type?: ContactType;
    value?: string;
    url?: string;
    image?: string;
}

interface ContactDetailItem {
    title: string;
    type?: ContactType;
    value?: string;
    url?: string;
    image?: string;
    sub_child?: ContactDetailSubChild[] | false;
    has_sub_child?: boolean;
}

export default function FooterMenuPage() {
    const [mainMenu, setMainMenu] = useState<MainMenuItem[]>([]);
    const [contactDetails, setContactDetails] = useState<ContactDetailItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch footer menu
    useEffect(() => {
        fetchFooterMenu();
    }, []);

    const fetchFooterMenu = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/footer-menu");
            const data = await res.json();

            if (data.success && data.footerMenu) {
                setMainMenu(data.footerMenu.main_menu || []);
                setContactDetails(data.footerMenu.contact_details || []);
            }
        } catch (error) {
            console.error("Error fetching footer menu:", error);
            toast.error("Failed to load footer menu", {
                closeButton: true
            });
        } finally {
            setLoading(false);
        }
    };

    // ========== MAIN MENU FUNCTIONS (Same as Header Menu) ==========
    const addMainMenu = () => {
        setMainMenu([
            ...mainMenu,
            { title: "", url: "", child_menu: false },
        ]);
    };

    const updateMainMenu = (index: number, field: "title" | "url", value: string) => {
        const updated = [...mainMenu];
        updated[index][field] = value;
        setMainMenu(updated);
    };

    const removeMainMenu = (index: number) => {
        setMainMenu(mainMenu.filter((_, i) => i !== index));
    };

    // Add this helper function after the generateUrl function (around line 280)
    const showImageInfoToast = () => {
        toast.info("How to add icons:", {
            description: (
                <div className="space-y-0.5 text-sm text-slate-800">
                    <div>1. Go to Media Files section</div>
                    <div>2. Upload your icon/image</div>
                    <div>3. Copy the image URL</div>
                    <div>4. Paste it in the Image/Icon URL field above</div>
                </div>
            ),
            closeButton: true,
            duration: 5000,
        });
    };


    const toggleChildMenu = (mainIndex: number) => {
        const updated = [...mainMenu];
        if (updated[mainIndex].child_menu === false) {
            updated[mainIndex].child_menu = [];
        } else {
            updated[mainIndex].child_menu = false;
        }
        setMainMenu(updated);
    };

    const addChildMenu = (mainIndex: number) => {
        const updated = [...mainMenu];
        if (updated[mainIndex].child_menu === false) {
            updated[mainIndex].child_menu = [];
        }
        (updated[mainIndex].child_menu as ChildMenuItem[]).push({
            title: "",
            url: "",
            sub_child_menu: false,
        });
        setMainMenu(updated);
    };

    const updateChildMenu = (
        mainIndex: number,
        childIndex: number,
        field: "title" | "url",
        value: string
    ) => {
        const updated = [...mainMenu];
        const childMenu = updated[mainIndex].child_menu as ChildMenuItem[];
        childMenu[childIndex][field] = value;
        setMainMenu(updated);
    };

    const removeChildMenu = (mainIndex: number, childIndex: number) => {
        const updated = [...mainMenu];
        const childMenu = updated[mainIndex].child_menu as ChildMenuItem[];
        childMenu.splice(childIndex, 1);
        if (childMenu.length === 0) {
            updated[mainIndex].child_menu = false;
        }
        setMainMenu(updated);
    };

    const toggleSubChildMenu = (mainIndex: number, childIndex: number) => {
        const updated = [...mainMenu];
        const childMenu = updated[mainIndex].child_menu as ChildMenuItem[];
        if (childMenu[childIndex].sub_child_menu === false) {
            childMenu[childIndex].sub_child_menu = [];
        } else {
            childMenu[childIndex].sub_child_menu = false;
        }
        setMainMenu(updated);
    };

    const addSubChildMenu = (mainIndex: number, childIndex: number) => {
        const updated = [...mainMenu];
        const childMenu = updated[mainIndex].child_menu as ChildMenuItem[];
        if (childMenu[childIndex].sub_child_menu === false) {
            childMenu[childIndex].sub_child_menu = [];
        }
        (childMenu[childIndex].sub_child_menu as SubChildMenuItem[]).push({
            title: "",
            url: "",
            sub_sub_child_menu: false,
        });
        setMainMenu(updated);
    };

    const updateSubChildMenu = (
        mainIndex: number,
        childIndex: number,
        subChildIndex: number,
        field: "title" | "url",
        value: string
    ) => {
        const updated = [...mainMenu];
        const childMenu = updated[mainIndex].child_menu as ChildMenuItem[];
        const subChildMenu = childMenu[childIndex].sub_child_menu as SubChildMenuItem[];
        subChildMenu[subChildIndex][field] = value;
        setMainMenu(updated);
    };

    const removeSubChildMenu = (
        mainIndex: number,
        childIndex: number,
        subChildIndex: number
    ) => {
        const updated = [...mainMenu];
        const childMenu = updated[mainIndex].child_menu as ChildMenuItem[];
        const subChildMenu = childMenu[childIndex].sub_child_menu as SubChildMenuItem[];
        subChildMenu.splice(subChildIndex, 1);
        if (subChildMenu.length === 0) {
            childMenu[childIndex].sub_child_menu = false;
        }
        setMainMenu(updated);
    };

    const toggleSubSubChildMenu = (
        mainIndex: number,
        childIndex: number,
        subChildIndex: number
    ) => {
        const updated = [...mainMenu];
        const childMenu = updated[mainIndex].child_menu as ChildMenuItem[];
        const subChildMenu = childMenu[childIndex].sub_child_menu as SubChildMenuItem[];
        if (subChildMenu[subChildIndex].sub_sub_child_menu === false) {
            subChildMenu[subChildIndex].sub_sub_child_menu = [];
        } else {
            subChildMenu[subChildIndex].sub_sub_child_menu = false;
        }
        setMainMenu(updated);
    };

    const addSubSubChildMenu = (
        mainIndex: number,
        childIndex: number,
        subChildIndex: number
    ) => {
        const updated = [...mainMenu];
        const childMenu = updated[mainIndex].child_menu as ChildMenuItem[];
        const subChildMenu = childMenu[childIndex].sub_child_menu as SubChildMenuItem[];
        if (subChildMenu[subChildIndex].sub_sub_child_menu === false) {
            subChildMenu[subChildIndex].sub_sub_child_menu = [];
        }
        (subChildMenu[subChildIndex].sub_sub_child_menu as SubSubChildMenuItem[]).push({
            sub_sub_child_title: "",
            sub_sub_child_url: "",
        });
        setMainMenu(updated);
    };

    const updateSubSubChildMenu = (
        mainIndex: number,
        childIndex: number,
        subChildIndex: number,
        subSubChildIndex: number,
        field: "sub_sub_child_title" | "sub_sub_child_url",
        value: string
    ) => {
        const updated = [...mainMenu];
        const childMenu = updated[mainIndex].child_menu as ChildMenuItem[];
        const subChildMenu = childMenu[childIndex].sub_child_menu as SubChildMenuItem[];
        const subSubChildMenu = subChildMenu[subChildIndex].sub_sub_child_menu as SubSubChildMenuItem[];
        subSubChildMenu[subSubChildIndex][field] = value;
        setMainMenu(updated);
    };

    const removeSubSubChildMenu = (
        mainIndex: number,
        childIndex: number,
        subChildIndex: number,
        subSubChildIndex: number
    ) => {
        const updated = [...mainMenu];
        const childMenu = updated[mainIndex].child_menu as ChildMenuItem[];
        const subChildMenu = childMenu[childIndex].sub_child_menu as SubChildMenuItem[];
        const subSubChildMenu = subChildMenu[subChildIndex].sub_sub_child_menu as SubSubChildMenuItem[];
        subSubChildMenu.splice(subSubChildIndex, 1);
        if (subSubChildMenu.length === 0) {
            subChildMenu[subChildIndex].sub_sub_child_menu = false;
        }
        setMainMenu(updated);
    };

    // ========== CONTACT DETAILS FUNCTIONS ==========
    // Helper function to auto-generate URL based on type and value
    const generateUrl = (type: ContactType | undefined, value: string): string => {
        if (!type || !value) return "";

        switch (type) {
            case "email":
                return value.includes("@") ? `mailto:${value}` : "";
            case "phone":
                // Remove any non-digit characters except + for tel: links
                const phoneNumber = value.replace(/[^\d+]/g, "");
                return phoneNumber ? `tel:${phoneNumber}` : "";
            case "address":
            case "text":
                return ""; // No URL for address or text
            case "social":
            case "link":
                return value.startsWith("http") ? value : value.startsWith("/") ? value : `https://${value}`;
            default:
                return value;
        }
    };

    const addContactDetail = () => {
        setContactDetails([
            ...contactDetails,
            { title: "", type: "text", value: "", url: "", image: "", sub_child: false },
        ]);
    };

    const updateContactDetail = (
        index: number,
        field: "title" | "type" | "value" | "url" | "image",
        value: string | ContactType
    ) => {
        const updated = [...contactDetails];

        // Handle type-specific assignments
        if (field === "type") {
            updated[index].type = value as ContactType;
        } else if (field === "value") {
            updated[index].value = value as string;
        } else if (field === "title") {
            updated[index].title = value as string;
        } else if (field === "url") {
            updated[index].url = value as string;
        } else if (field === "image") {
            updated[index].image = value as string;
        }

        // Auto-generate URL when type or value changes
        if (field === "type" || field === "value") {
            const type = field === "type" ? (value as ContactType) : updated[index].type;
            const val = field === "value" ? (value as string) : updated[index].value || "";
            updated[index].url = generateUrl(type, val);
        }

        setContactDetails(updated);
    };

    const removeContactDetail = (index: number) => {
        setContactDetails(contactDetails.filter((_, i) => i !== index));
    };

    const toggleContactSubChild = (index: number) => {
        const updated = [...contactDetails];
        if (updated[index].sub_child === false || updated[index].sub_child === undefined) {
            updated[index].sub_child = [];
            updated[index].has_sub_child = true;
        } else {
            updated[index].sub_child = false;
            updated[index].has_sub_child = false;
        }
        setContactDetails(updated);
    };

    const addContactSubChild = (index: number) => {
        const updated = [...contactDetails];
        if (updated[index].sub_child === false || updated[index].sub_child === undefined) {
            updated[index].sub_child = [];
            updated[index].has_sub_child = true;
        }
        (updated[index].sub_child as ContactDetailSubChild[]).push({
            title: "",
            type: "text",
            value: "",
            url: "",
            image: "",
        });
        setContactDetails(updated);
    };

    const updateContactSubChild = (
        index: number,
        subChildIndex: number,
        field: "title" | "type" | "value" | "url" | "image",
        value: string | ContactType
    ) => {
        const updated = [...contactDetails];
        const subChild = updated[index].sub_child as ContactDetailSubChild[];

        // Handle type-specific assignments
        if (field === "type") {
            subChild[subChildIndex].type = value as ContactType;
        } else if (field === "value") {
            subChild[subChildIndex].value = value as string;
        } else if (field === "title") {
            subChild[subChildIndex].title = value as string;
        } else if (field === "url") {
            subChild[subChildIndex].url = value as string;
        } else if (field === "image") {
            subChild[subChildIndex].image = value as string;
        }

        // Auto-generate URL when type or value changes
        if (field === "type" || field === "value") {
            const type = field === "type" ? (value as ContactType) : subChild[subChildIndex].type;
            const val = field === "value" ? (value as string) : subChild[subChildIndex].value || "";
            subChild[subChildIndex].url = generateUrl(type, val);
        }

        setContactDetails(updated);
    };

    const removeContactSubChild = (index: number, subChildIndex: number) => {
        const updated = [...contactDetails];
        const subChild = updated[index].sub_child as ContactDetailSubChild[];
        subChild.splice(subChildIndex, 1);
        if (subChild.length === 0) {
            updated[index].sub_child = false;
            updated[index].has_sub_child = false;
        }
        setContactDetails(updated);
    };

    const handleRevalidate = async () => {
        const toastId = toast.loading("Revalidating cache...");
        try {
            const res = await fetch("/api/revalidate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tags: ["footer-menu"] }),
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
        try {
            setSaving(true);
            const loadingToastId = toast.loading("Saving footer menu...", {
                closeButton: true
            });

            const res = await fetch("/api/footer-menu", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    main_menu: mainMenu,
                    contact_details: contactDetails
                }),
            });

            const data = await res.json();
            toast.dismiss(loadingToastId);

            if (res.ok && data.success) {
                toast.success("Footer menu saved successfully!", {
                    closeButton: true,
                });
            } else {
                toast.error(data.message || "Failed to save footer menu", {
                    closeButton: true,
                });
            }
        } catch (error) {
            toast.error("Failed to save footer menu", {
                closeButton: true,
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
                <p className="text-slate-300">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Footer Menu</h1>
                        <p className="text-slate-400">Manage your website footer navigation menu and contact details</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={handleRevalidate}
                            title="Clear frontend cache for Footer Menu"
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
                            {saving ? "Saving..." : "Save Menu"}
                        </Button>
                    </div>
                </div>

                {/* Main Menu Section */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white">Main Menu</h2>
                        <Button
                            onClick={addMainMenu}
                            size="sm"
                            className="bg-indigo-500 hover:bg-indigo-600 text-white  !gap-0"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Main Menu
                        </Button>
                    </div>

                    {mainMenu.map((mainItem, mainIndex) => (
                        <div
                            key={mainIndex}
                            className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 space-y-5"
                        >
                            {/* Main Menu Item */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Main Title</label>
                                        <Input
                                            value={mainItem.title}
                                            onChange={(e) => updateMainMenu(mainIndex, "title", e.target.value)}
                                            placeholder="Main Menu Title"
                                            className="bg-slate-900/60 border-slate-600 text-white placeholder-slate-400 h-10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Main URL</label>
                                        <Input
                                            value={mainItem.url}
                                            onChange={(e) => updateMainMenu(mainIndex, "url", e.target.value)}
                                            placeholder="/main-url"
                                            className="bg-slate-900/60 border-slate-600 text-white placeholder-slate-400 h-10"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        onClick={() => toggleChildMenu(mainIndex)}
                                        size="sm"
                                        variant="outline"
                                        className="border-slate-600 !gap-0 text-slate-300 bg-slate-700 hover:bg-slate-800 cursor-pointer hover:text-white h-9"
                                    >
                                        {mainItem.child_menu === false ? "Add Child Menu" : "Remove Child Menu"}
                                    </Button>
                                    <Button
                                        onClick={() => removeMainMenu(mainIndex)}
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-9 w-9 p-0 cursor-pointer"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Child Menu - Same structure as header menu */}
                            {mainItem.child_menu !== false && (
                                <div className="ml-4 border-l-2 border-indigo-500/30 pl-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-base font-semibold text-slate-300">Child Menu</h3>
                                        <Button
                                            onClick={() => addChildMenu(mainIndex)}
                                            size="sm"
                                            className="bg-indigo-500 hover:bg-indigo-600 text-white h-8 text-xs"
                                        >
                                            <Plus className="h-3 w-3 mr-1.5" />
                                            Add Child
                                        </Button>
                                    </div>

                                    {(mainItem.child_menu as ChildMenuItem[]).map((childItem, childIndex) => (
                                        <div
                                            key={childIndex}
                                            className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 space-y-4"
                                        >
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-slate-300">Child Title</label>
                                                        <Input
                                                            value={childItem.title}
                                                            onChange={(e) =>
                                                                updateChildMenu(mainIndex, childIndex, "title", e.target.value)
                                                            }
                                                            placeholder="Child Menu Title"
                                                            className="bg-slate-800/60 border-slate-600 text-white placeholder-slate-400 h-10"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-slate-300">Child URL</label>
                                                        <Input
                                                            value={childItem.url}
                                                            onChange={(e) =>
                                                                updateChildMenu(mainIndex, childIndex, "url", e.target.value)
                                                            }
                                                            placeholder="/child-url"
                                                            className="bg-slate-800/60 border-slate-600 text-white placeholder-slate-400 h-10"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-end gap-2 pt-2">
                                                    <Button
                                                        onClick={() => toggleSubChildMenu(mainIndex, childIndex)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-slate-600 !gap-0 text-slate-300 bg-slate-700 hover:bg-slate-800 cursor-pointer hover:text-white h-9 text-xs"
                                                    >
                                                        {childItem.sub_child_menu === false
                                                            ? "Add Sub Child"
                                                            : "Remove Sub Child"}
                                                    </Button>
                                                    <Button
                                                        onClick={() => removeChildMenu(mainIndex, childIndex)}
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-9 w-9 p-0 cursor-pointer"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {childItem.sub_child_menu !== false && (
                                                <div className="ml-4 border-l-2 border-indigo-400/30 pl-4 space-y-3 mt-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-sm font-semibold text-slate-400">Sub Child Menu</h4>
                                                        <Button
                                                            onClick={() => addSubChildMenu(mainIndex, childIndex)}
                                                            size="sm"
                                                            className="bg-indigo-500 hover:bg-indigo-600 text-white h-8 text-xs"
                                                        >
                                                            <Plus className="h-3 w-3 mr-1.5" />
                                                            Add Sub Child
                                                        </Button>
                                                    </div>

                                                    {(childItem.sub_child_menu as SubChildMenuItem[]).map(
                                                        (subChildItem, subChildIndex) => (
                                                            <div
                                                                key={subChildIndex}
                                                                className="bg-slate-800/30 border border-slate-600 rounded-lg p-4 space-y-3"
                                                            >
                                                                <div className="space-y-3">
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="space-y-2">
                                                                            <label className="text-xs font-medium text-slate-400">
                                                                                Sub Child Title
                                                                            </label>
                                                                            <Input
                                                                                value={subChildItem.title}
                                                                                onChange={(e) =>
                                                                                    updateSubChildMenu(
                                                                                        mainIndex,
                                                                                        childIndex,
                                                                                        subChildIndex,
                                                                                        "title",
                                                                                        e.target.value
                                                                                    )
                                                                                }
                                                                                placeholder="Sub Child Menu Title"
                                                                                className="bg-slate-700/60 border-slate-500 text-white placeholder-slate-400 h-9 text-sm"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <label className="text-xs font-medium text-slate-400">
                                                                                Sub Child URL
                                                                            </label>
                                                                            <Input
                                                                                value={subChildItem.url}
                                                                                onChange={(e) =>
                                                                                    updateSubChildMenu(
                                                                                        mainIndex,
                                                                                        childIndex,
                                                                                        subChildIndex,
                                                                                        "url",
                                                                                        e.target.value
                                                                                    )
                                                                                }
                                                                                placeholder="/sub-child-url"
                                                                                className="bg-slate-700/60 border-slate-500 text-white placeholder-slate-400 h-9 text-sm"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 pt-2">
                                                                        <Button
                                                                            onClick={() =>
                                                                                toggleSubSubChildMenu(mainIndex, childIndex, subChildIndex)
                                                                            }
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="border-slate-500 text-slate-400 bg-slate-700 hover:bg-slate-800 cursor-pointer hover:text-white h-8 text-xs"
                                                                        >
                                                                            {subChildItem.sub_sub_child_menu === false
                                                                                ? "Add Sub Sub Child"
                                                                                : "Remove Sub Sub Child"}
                                                                        </Button>
                                                                        <Button
                                                                            onClick={() =>
                                                                                removeSubChildMenu(mainIndex, childIndex, subChildIndex)
                                                                            }
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-8 w-8 p-0"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                {subChildItem.sub_sub_child_menu !== false && (
                                                                    <div className="ml-4 border-l-2 border-indigo-300/30 pl-4 space-y-3 mt-3">
                                                                        <div className="flex items-center justify-between">
                                                                            <h5 className="text-xs font-semibold text-slate-500">
                                                                                Sub Sub Child Menu
                                                                            </h5>
                                                                            <Button
                                                                                onClick={() =>
                                                                                    addSubSubChildMenu(mainIndex, childIndex, subChildIndex)
                                                                                }
                                                                                size="sm"
                                                                                className="bg-indigo-500 hover:bg-indigo-600 text-white h-7 text-xs px-2"
                                                                            >
                                                                                <Plus className="h-3 w-3 mr-1" />
                                                                                Add Row
                                                                            </Button>
                                                                        </div>

                                                                        {(subChildItem.sub_sub_child_menu as SubSubChildMenuItem[]).map(
                                                                            (subSubChildItem, subSubChildIndex) => (
                                                                                <div
                                                                                    key={subSubChildIndex}
                                                                                    className="flex items-start gap-3 bg-slate-700/20 border border-slate-500 rounded-lg p-3"
                                                                                >
                                                                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                                                                        <div className="space-y-1.5">
                                                                                            <label className="text-xs font-medium text-slate-500">
                                                                                                Sub Sub Child Title
                                                                                            </label>
                                                                                            <Input
                                                                                                value={subSubChildItem.sub_sub_child_title}
                                                                                                onChange={(e) =>
                                                                                                    updateSubSubChildMenu(
                                                                                                        mainIndex,
                                                                                                        childIndex,
                                                                                                        subChildIndex,
                                                                                                        subSubChildIndex,
                                                                                                        "sub_sub_child_title",
                                                                                                        e.target.value
                                                                                                    )
                                                                                                }
                                                                                                placeholder="Sub Sub Child Title"
                                                                                                className="bg-slate-600/60 border-slate-500 text-white placeholder-slate-400 h-8 text-xs"
                                                                                            />
                                                                                        </div>
                                                                                        <div className="space-y-1.5">
                                                                                            <label className="text-xs font-medium text-slate-500">
                                                                                                Sub Sub Child URL
                                                                                            </label>
                                                                                            <Input
                                                                                                value={subSubChildItem.sub_sub_child_url}
                                                                                                onChange={(e) =>
                                                                                                    updateSubSubChildMenu(
                                                                                                        mainIndex,
                                                                                                        childIndex,
                                                                                                        subChildIndex,
                                                                                                        subSubChildIndex,
                                                                                                        "sub_sub_child_url",
                                                                                                        e.target.value
                                                                                                    )
                                                                                                }
                                                                                                placeholder="/sub-sub-child-url"
                                                                                                className="bg-slate-600/60 border-slate-500 text-white placeholder-slate-400 h-8 text-xs"
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                    <Button
                                                                                        onClick={() =>
                                                                                            removeSubSubChildMenu(
                                                                                                mainIndex,
                                                                                                childIndex,
                                                                                                subChildIndex,
                                                                                                subSubChildIndex
                                                                                            )
                                                                                        }
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-8 w-8 p-0 mt-6 flex-shrink-0"
                                                                                    >
                                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {mainMenu.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-400">No main menu items. Click "Add Main Menu" to get started.</p>
                        </div>
                    )}
                </div>

                {/* Contact Details Section */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white">Contact Details</h2>
                        <Button
                            onClick={addContactDetail}
                            size="sm"
                            className="bg-indigo-500 hover:bg-indigo-600 text-white  !gap-0"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Contact Detail
                        </Button>
                    </div>

                    {contactDetails.map((contactItem, index) => (
                        <div
                            key={index}
                            className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 space-y-4"
                        >
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Title</label>
                                        <Input
                                            value={contactItem.title || ""}
                                            onChange={(e) => updateContactDetail(index, "title", e.target.value)}
                                            placeholder="e.g., Email, Phone, Address, Follow Us"
                                            className="bg-slate-900/60 border-slate-600 text-white placeholder-slate-400 h-10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Type</label>
                                        <Select
                                            value={contactItem.type || "text"}
                                            onValueChange={(value) => updateContactDetail(index, "type", value as ContactType)}
                                        >
                                            <SelectTrigger className="bg-slate-900/60 border-slate-600 text-white h-10">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-slate-600 text-white">
                                                <SelectItem value="email" className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                                                    Email
                                                </SelectItem>
                                                <SelectItem value="phone" className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                                                    Phone
                                                </SelectItem>
                                                <SelectItem value="address" className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                                                    Address
                                                </SelectItem>
                                                <SelectItem value="social" className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                                                    Social Media
                                                </SelectItem>
                                                <SelectItem value="link" className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                                                    Link
                                                </SelectItem>
                                                <SelectItem value="text" className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                                                    Text
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Value field - shown for all types */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">
                                        {contactItem.type === "email" && "Email Address"}
                                        {contactItem.type === "phone" && "Phone Number"}
                                        {contactItem.type === "address" && "Address"}
                                        {contactItem.type === "social" && "Social Media URL"}
                                        {contactItem.type === "link" && "Link URL"}
                                        {contactItem.type === "text" && "Text Content"}
                                        {!contactItem.type && "Value"}
                                    </label>
                                    <Input
                                        value={contactItem.value || ""}
                                        onChange={(e) => updateContactDetail(index, "value", e.target.value)}
                                        placeholder={
                                            contactItem.type === "email" ? "contact@example.com"
                                                : contactItem.type === "phone" ? "+1234567890"
                                                    : contactItem.type === "address" ? "123 Street, City, State, ZIP"
                                                        : contactItem.type === "social" ? "https://instagram.com/username"
                                                            : contactItem.type === "link" ? "https://example.com or /path"
                                                                : "Enter value"
                                        }
                                        className="bg-slate-900/60 border-slate-600 text-white placeholder-slate-400 h-10"
                                    />
                                </div>

                                {/* URL field - auto-generated for email/phone, editable for others */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">
                                        URL {contactItem.type === "email" || contactItem.type === "phone" ? "(Auto-generated)" : ""}
                                    </label>
                                    <Input
                                        value={contactItem.url || ""}
                                        onChange={(e) => updateContactDetail(index, "url", e.target.value)}
                                        placeholder={
                                            contactItem.type === "email" ? "mailto:contact@example.com (auto)"
                                                : contactItem.type === "phone" ? "tel:+1234567890 (auto)"
                                                    : "https://example.com or /path"
                                        }
                                        disabled={contactItem.type === "email" || contactItem.type === "phone"}
                                        className="bg-slate-900/60 border-slate-600 text-white placeholder-slate-400 h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>

                                {/* Image URL - shown for social media and optional for others */}
                                {(contactItem.type === "social" || contactItem.type === "link" || !contactItem.type) && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm font-medium text-slate-300">Image/Icon URL (Optional)</label>
                                            <button
                                                type="button"
                                                onClick={showImageInfoToast}
                                                className="text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer mb-0"
                                                title="Click for instructions on how to add icons"
                                            >
                                                <Info className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <Input
                                            value={contactItem.image || ""}
                                            onChange={(e) => updateContactDetail(index, "image", e.target.value)}
                                            placeholder="https://example.com/icon.png"
                                            className="bg-slate-900/60 border-slate-600 text-white placeholder-slate-400 h-10"
                                        />
                                    </div>
                                )}
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        onClick={() => toggleContactSubChild(index)}
                                        size="sm"
                                        variant="outline"
                                        className="border-slate-600 !gap-0 text-slate-300 bg-slate-700 hover:bg-slate-800 cursor-pointer hover:text-white h-9"
                                    >
                                        {contactItem.sub_child === false || contactItem.sub_child === undefined
                                            ? "Add Sub Child"
                                            : "Remove Sub Child"}
                                    </Button>
                                    <Button
                                        onClick={() => removeContactDetail(index)}
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-9 w-9 p-0 cursor-pointer"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Contact Sub Child */}
                            {contactItem.sub_child !== false && contactItem.sub_child !== undefined && (
                                <div className="ml-4 border-l-2 border-indigo-500/30 pl-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-base font-semibold text-slate-300">Sub Child</h3>
                                        <Button
                                            onClick={() => addContactSubChild(index)}
                                            size="sm"
                                            className="bg-indigo-500 hover:bg-indigo-600 text-white h-8 text-xs"
                                        >
                                            <Plus className="h-3 w-3 mr-1.5" />
                                            Add Sub Child
                                        </Button>
                                    </div>

                                    {(contactItem.sub_child as ContactDetailSubChild[]).map(
                                        (subChildItem, subChildIndex) => (
                                            <div
                                                key={subChildIndex}
                                                className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 space-y-3"
                                            >
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-slate-300">Title</label>
                                                        <Input
                                                            value={subChildItem.title || ""}
                                                            onChange={(e) =>
                                                                updateContactSubChild(index, subChildIndex, "title", e.target.value)
                                                            }
                                                            placeholder="Sub Child Title"
                                                            className="bg-slate-800/60 border-slate-600 text-white placeholder-slate-400 h-10"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-slate-300">Type</label>
                                                        <Select
                                                            value={subChildItem.type || "text"}
                                                            onValueChange={(value) => updateContactSubChild(index, subChildIndex, "type", value)}
                                                        >
                                                            <SelectTrigger className="bg-slate-800/60 border-slate-600 text-white h-10">
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-slate-900 border-slate-600 text-white">
                                                                <SelectItem value="email" className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                                                                    Email
                                                                </SelectItem>
                                                                <SelectItem value="phone" className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                                                                    Phone
                                                                </SelectItem>
                                                                <SelectItem value="address" className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                                                                    Address
                                                                </SelectItem>
                                                                <SelectItem value="social" className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                                                                    Social Media
                                                                </SelectItem>
                                                                <SelectItem value="link" className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                                                                    Link
                                                                </SelectItem>
                                                                <SelectItem value="text" className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                                                                    Text
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-slate-300">
                                                        {subChildItem.type === "email" && "Email Address"}
                                                        {subChildItem.type === "phone" && "Phone Number"}
                                                        {subChildItem.type === "address" && "Address"}
                                                        {subChildItem.type === "social" && "Social Media URL"}
                                                        {subChildItem.type === "link" && "Link URL"}
                                                        {subChildItem.type === "text" && "Text Content"}
                                                        {!subChildItem.type && "Value"}
                                                    </label>
                                                    <Input
                                                        value={subChildItem.value || ""}
                                                        onChange={(e) =>
                                                            updateContactSubChild(index, subChildIndex, "value", e.target.value)
                                                        }
                                                        placeholder={
                                                            subChildItem.type === "email" ? "contact@example.com"
                                                                : subChildItem.type === "phone" ? "+1234567890"
                                                                    : subChildItem.type === "address" ? "123 Street, City, State"
                                                                        : subChildItem.type === "social" ? "https://instagram.com/username"
                                                                            : subChildItem.type === "link" ? "https://example.com"
                                                                                : "Enter value"
                                                        }
                                                        className="bg-slate-800/60 border-slate-600 text-white placeholder-slate-400 h-10"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-slate-300">
                                                        URL {subChildItem.type === "email" || subChildItem.type === "phone" ? "(Auto-generated)" : ""}
                                                    </label>
                                                    <Input
                                                        value={subChildItem.url || ""}
                                                        onChange={(e) =>
                                                            updateContactSubChild(index, subChildIndex, "url", e.target.value)
                                                        }
                                                        placeholder={
                                                            subChildItem.type === "email" ? "mailto:contact@example.com (auto)"
                                                                : subChildItem.type === "phone" ? "tel:+1234567890 (auto)"
                                                                    : "https://example.com"
                                                        }
                                                        disabled={subChildItem.type === "email" || subChildItem.type === "phone"}
                                                        className="bg-slate-800/60 border-slate-600 text-white placeholder-slate-400 h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    />
                                                </div>

                                                {(subChildItem.type === "social" || subChildItem.type === "link" || !subChildItem.type) && (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-sm font-medium text-slate-300">Image/Icon URL (Optional)</label>
                                                            <button
                                                                type="button"
                                                                onClick={showImageInfoToast}
                                                                className="text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer mb-0"
                                                                title="Click for instructions on how to add icons"
                                                            >
                                                                <Info className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                        <Input
                                                            value={subChildItem.image || ""}
                                                            onChange={(e) =>
                                                                updateContactSubChild(index, subChildIndex, "image", e.target.value)
                                                            }
                                                            placeholder="https://example.com/icon.png"
                                                            className="bg-slate-800/60 border-slate-600 text-white placeholder-slate-400 h-10"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-end">
                                                    <Button
                                                        onClick={() => removeContactSubChild(index, subChildIndex)}
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-9 w-9 p-0 cursor-pointer"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {contactDetails.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-400">No contact details. Click "Add Contact Detail" to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}