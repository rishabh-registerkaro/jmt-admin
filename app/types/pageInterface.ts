


export interface PageItem {
  _id: string;
  pageTitle: string;
  pageSlug: string;
  pageMetaTitle?: string;
  pageMetaDescription?: string;
  pageContent?: string;
  extraFields: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  status?:"draft" | "published";
  author:{
    _id:string;
    username:string
  };
}