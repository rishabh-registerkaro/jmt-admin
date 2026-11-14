"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { revalidateTags } from "@/lib/revalidateClient";

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

// Top utility bar of the frontend header: two contact blocks + the CTA button
interface HeaderContactDetails {
  whatsappLabel: string;
  whatsappNumber: string;
  careLabel: string;
  careNumber: string;
  ctaText: string;
  ctaUrl: string;
}

const defaultContactDetails: HeaderContactDetails = {
  whatsappLabel: "WhatsApp Number",
  whatsappNumber: "",
  careLabel: "Customer Care",
  careNumber: "",
  ctaText: "Get A Quote",
  ctaUrl: "/contact",
};

export default function HeaderMenuPage() {
  const [mainMenu, setMainMenu] = useState<MainMenuItem[]>([]);
  const [contactDetails, setContactDetails] = useState<HeaderContactDetails>(defaultContactDetails);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const updateContact = (field: keyof HeaderContactDetails, value: string) =>
    setContactDetails((p) => ({ ...p, [field]: value }));

  const fetchHeaderMenu = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/header-menu");
      const data = await res.json();
      
      if (data.success && data.headerMenu) {
        setMainMenu(data.headerMenu.main_menu || []);
        setContactDetails({ ...defaultContactDetails, ...(data.headerMenu.contact_details || {}) });
      }
    } catch (error) {
      console.error("Error fetching header menu:", error);
      toast.error("Failed to load header menu", {
        closeButton: true
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch header menu
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount/dependency change; the fetcher sets state
    fetchHeaderMenu();
  }, []);

  // Main Menu Functions
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

  const toggleChildMenu = (mainIndex: number) => {
    const updated = [...mainMenu];
    if (updated[mainIndex].child_menu === false) {
      updated[mainIndex].child_menu = [];
    } else {
      updated[mainIndex].child_menu = false;
    }
    setMainMenu(updated);
  };

  // Child Menu Functions
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

  // Sub Child Menu Functions
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

  // Sub Sub Child Menu Functions
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

  const handleRevalidate = async () => {
    await revalidateTags(["header-menu"]);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const loadingToastId = toast.loading("Saving header menu...", {
        closeButton: true
      });

      const res = await fetch("/api/header-menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ main_menu: mainMenu, contact_details: contactDetails }),
      });

      const data = await res.json();
      toast.dismiss(loadingToastId);

      if (res.ok && data.success) {
        toast.success("Header menu saved successfully!", {
          closeButton: true,
        });
      } else {
        toast.error(data.message || "Failed to save header menu", {
          closeButton: true,
        });
      }
    } catch {
      toast.error("Failed to save header menu", {
        closeButton: true,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background px-4 py-6 sm:px-6 lg:px-8 text-foreground flex items-center justify-center">
        <p className="text-foreground-light">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background px-4 py-6 sm:px-6 lg:px-8 text-foreground">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Header Menu</h1>
            <p className="text-muted-foreground">Manage your website header navigation menu</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRevalidate}
              title="Clear frontend cache for Header Menu"
              className="border-warning/40 text-warning hover:bg-warning/10 hover:text-warning"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Revalidate Cache
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="px-6"
            >
              {saving ? "Saving..." : "Save Menu"}
            </Button>
          </div>
        </div>

        {/* Utility Bar Section — contact blocks + CTA shown above the nav strip */}
        <div className="rounded-lg border bg-card p-4 sm:p-5 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Utility Bar (Contacts &amp; CTA)</h2>
            <p className="text-sm text-muted-foreground">
              The white bar above the navigation: WhatsApp / customer care numbers and the quote button.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">WhatsApp Label</label>
              <Input
                value={contactDetails.whatsappLabel}
                onChange={(e) => updateContact("whatsappLabel", e.target.value)}
                placeholder="WhatsApp Number"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">WhatsApp Number</label>
              <Input
                value={contactDetails.whatsappNumber}
                onChange={(e) => updateContact("whatsappNumber", e.target.value)}
                placeholder="+91 88664 73857"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Customer Care Label</label>
              <Input
                value={contactDetails.careLabel}
                onChange={(e) => updateContact("careLabel", e.target.value)}
                placeholder="Customer Care"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Customer Care Number</label>
              <Input
                value={contactDetails.careNumber}
                onChange={(e) => updateContact("careNumber", e.target.value)}
                placeholder="+91 88667 87599"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">CTA Button Text</label>
              <Input
                value={contactDetails.ctaText}
                onChange={(e) => updateContact("ctaText", e.target.value)}
                placeholder="Get A Quote"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">CTA Button Link</label>
              <Input
                value={contactDetails.ctaUrl}
                onChange={(e) => updateContact("ctaUrl", e.target.value)}
                placeholder="/contact"
                className="h-10"
              />
            </div>
          </div>
        </div>

        {/* Main Menu Section */}
        <div className="rounded-lg border bg-card p-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold text-foreground">Main Menu</h2>
            <Button
              onClick={addMainMenu}
              size="sm"
              className="!gap-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Main Menu
            </Button>
          </div>

          {mainMenu.map((mainItem, mainIndex) => (
            <div
              key={mainIndex}
              className="bg-muted/40 border rounded-lg p-3 sm:p-5 space-y-5"
            >
              {/* Main Menu Item */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Main Title</label>
                    <Input
                      value={mainItem.title}
                      onChange={(e) => updateMainMenu(mainIndex, "title", e.target.value)}
                      placeholder="Main Menu Title"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Main URL</label>
                    <Input
                      value={mainItem.url}
                      onChange={(e) => updateMainMenu(mainIndex, "url", e.target.value)}
                      placeholder="/main-url"
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    onClick={() => toggleChildMenu(mainIndex)}
                    size="sm"
                    variant="outline"
                    className="!gap-0 cursor-pointer h-9"
                  >
                    {mainItem.child_menu === false ? "Add Child Menu" : "Remove Child Menu"}
                  </Button>
                  <Button
                    onClick={() => removeMainMenu(mainIndex)}
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 w-9 p-0 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Child Menu */}
              {mainItem.child_menu !== false && (
                <div className="ml-1 sm:ml-4 border-l-2 border-border pl-3 sm:pl-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-foreground-light">Child Menu</h3>
                    <Button
                      onClick={() => addChildMenu(mainIndex)}
                      size="sm"
                      className="h-8 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1.5" />
                      Add Child
                    </Button>
                  </div>

                  {(mainItem.child_menu as ChildMenuItem[]).map((childItem, childIndex) => (
                    <div
                      key={childIndex}
                      className="bg-card border rounded-lg p-3 sm:p-4 space-y-4"
                    >
                      {/* Child Menu Item */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Child Title</label>
                            <Input
                              value={childItem.title}
                              onChange={(e) =>
                                updateChildMenu(mainIndex, childIndex, "title", e.target.value)
                              }
                              placeholder="Child Menu Title"
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Child URL</label>
                            <Input
                              value={childItem.url}
                              onChange={(e) =>
                                updateChildMenu(mainIndex, childIndex, "url", e.target.value)
                              }
                              placeholder="/child-url"
                              className="h-10"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                          <Button
                            onClick={() => toggleSubChildMenu(mainIndex, childIndex)}
                            size="sm"
                            variant="outline"
                            className="!gap-0 cursor-pointer h-9 text-xs"
                          >
                            {childItem.sub_child_menu === false
                              ? "Add Sub Child"
                              : "Remove Sub Child"}
                          </Button>
                          <Button
                            onClick={() => removeChildMenu(mainIndex, childIndex)}
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 w-9 p-0 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Sub Child Menu */}
                      {childItem.sub_child_menu !== false && (
                        <div className="ml-1 sm:ml-4 border-l-2 border-border pl-3 sm:pl-4 space-y-3 mt-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold text-muted-foreground">Sub Child Menu</h4>
                            <Button
                              onClick={() => addSubChildMenu(mainIndex, childIndex)}
                              size="sm"
                              className="h-8 text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1.5" />
                              Add Sub Child
                            </Button>
                          </div>

                          {(childItem.sub_child_menu as SubChildMenuItem[]).map(
                            (subChildItem, subChildIndex) => (
                              <div
                                key={subChildIndex}
                                className="bg-muted/40 border rounded-lg p-3 sm:p-4 space-y-3"
                              >
                                {/* Sub Child Menu Item */}
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-xs font-medium text-muted-foreground">
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
                                        className="h-9 text-sm"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-xs font-medium text-muted-foreground">
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
                                        className="h-9 text-sm"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 pt-2">
                                    <Button
                                      onClick={() =>
                                        toggleSubSubChildMenu(mainIndex, childIndex, subChildIndex)
                                      }
                                      size="sm"
                                      variant="outline"
                                      className="cursor-pointer h-8 text-xs"
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
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Sub Sub Child Menu */}
                                {subChildItem.sub_sub_child_menu !== false && (
                                  <div className="ml-1 sm:ml-4 border-l-2 border-border pl-3 sm:pl-4 space-y-3 mt-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <h5 className="text-xs font-semibold text-muted-foreground">
                                        Sub Sub Child Menu
                                      </h5>
                                      <Button
                                        onClick={() =>
                                          addSubSubChildMenu(mainIndex, childIndex, subChildIndex)
                                        }
                                        size="sm"
                                        className="h-7 text-xs px-2"
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Row
                                      </Button>
                                    </div>

                                    {(subChildItem.sub_sub_child_menu as SubSubChildMenuItem[]).map(
                                      (subSubChildItem, subSubChildIndex) => (
                                        <div
                                          key={subSubChildIndex}
                                          className="flex items-start gap-3 bg-card border rounded-lg p-3"
                                        >
                                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                              <label className="text-xs font-medium text-muted-foreground">
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
                                                className="h-8 text-xs"
                                              />
                                            </div>
                                            <div className="space-y-1.5">
                                              <label className="text-xs font-medium text-muted-foreground">
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
                                                className="h-8 text-xs"
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
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 mt-6 flex-shrink-0"
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
              <p className="text-muted-foreground">No main menu items. Click &quot;Add Main Menu&quot; to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}