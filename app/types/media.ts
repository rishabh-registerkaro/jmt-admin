export interface Asset {
  asset_id: string;
  public_id: string;
  filename: string;
  format: string;
  secure_url: string;
  bytes: number;
  width: number;
  height: number;
  created_at: string;
  resource_type: string;
}