"use client";

import { Lead } from "@/app/types/lead";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ViewLeadProps {
  lead: Lead;
}

export default function ViewLead({ lead }: ViewLeadProps) {
  return (
    <div className="space-y-6 p-4 mt-4">
      <div className="flex flex-col items-center text-center space-y-3">
        {/* <Avatar className="h-20 w-20">
          <AvatarImage src="/dummy-user.png" />
          <AvatarFallback>
            {lead.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </AvatarFallback>
        </Avatar> */}

        <div>
          <h2 className="text-xl font-bold text-white">{lead.name}</h2>
          <p className="text-sm text-slate-400">{lead.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        <Item label="Phone" value={lead.phoneNo} />
        <Item label="Submitted From" value={lead.leadSource || "-"} />

        <Item label="Status" value={lead.status} badge={true} />

        <Item
          label="Created At"
          value={new Date(lead.createdAt).toLocaleString()}
        />
      </div>

      {/* Form-specific fields — whatever {"Field Label": value} pairs the
          submitting form sent; new forms show up here automatically. */}
      {lead.formData && Object.keys(lead.formData).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wide mb-2">
            Form Details
          </h3>
          <div className="space-y-1">
            {Object.entries(lead.formData).map(([label, value]) =>
              String(value ?? "").length > 60 ? (
                <div key={label} className="flex flex-col gap-1.5 border-b border-slate-700 py-2">
                  <span className="text-slate-400 text-sm">{label}</span>
                  <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                    {String(value)}
                  </p>
                </div>
              ) : (
                <Item key={label} label={label} value={String(value ?? "-")} />
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Item({
  label,
  value,
  badge = false,
}: {
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div className="flex justify-between border-b border-slate-700 py-2">
      <span className="text-slate-400 text-sm">{label}</span>

      {badge ? (
        <span className="px-3 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300 capitalize">
          {value}
        </span>
      ) : (
        <span className="text-white font-medium">{value}</span>
      )}
    </div>
  );
}
