export interface Lead {
  _id: string;
  name: string;
  email: string;
  phoneNo: string;
  status: "new" | "contacted" | "converted" | "lost";
  leadSource: string;
  /** Form-specific fields as {"Field Label": value} pairs */
  formData?: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
}