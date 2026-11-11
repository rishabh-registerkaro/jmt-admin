"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lead } from "@/app/types/lead";
import { Label } from "../ui/label";
import { SheetFooter } from "../ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface EditLeadFormProps {
  lead: Lead;
  onSave: (lead: Lead) => Promise<void> | void;
}

export default function EditLeadForm({ lead, onSave }: EditLeadFormProps) {
  const [form, setForm] = useState<Lead>(lead);

  const handleChange = (field: keyof Lead, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="mt-6 space-y-4 p-3">
      {/* NAME */}
      <div className="space-y-2">
        <Label className="text-foreground-light" htmlFor="name">Name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
      </div>

      {/* EMAIL */}
      <div className="space-y-2">
        <Label className="text-foreground-light" htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
        />
      </div>

      {/* PHONE */}
      <div className="space-y-2">
        <Label className="text-foreground-light" htmlFor="phoneNo">Phone</Label>
        <Input
          id="phoneNo"
          value={form.phoneNo}
          onChange={(e) => handleChange("phoneNo", e.target.value)}
        />
      </div>

      {/* SOURCE */}
      <div className="space-y-2">
        <Label className="text-foreground-light" htmlFor="leadSource">Source</Label>
        <Select
          value={form.leadSource ?? "Website"}
          onValueChange={(value) => handleChange("leadSource", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Website">Website</SelectItem>
            <SelectItem value="Referral">Referral</SelectItem>
            <SelectItem value="Social Media">Social Media</SelectItem>
            <SelectItem value="Email Campaign">Email Campaign</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* STATUS */}
      <div className="space-y-2">
        <Label className="text-foreground-light" htmlFor="status">Status</Label>
        <Select
          value={form.status}
          onValueChange={(value) => handleChange("status", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SheetFooter>
        <Button
          onClick={() => onSave(form)}
          className="w-full cursor-pointer"
        >
          Save Changes
        </Button>
      </SheetFooter>
    </div>
  );
}
