export interface ListItem {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  categoryId?: number;
  category?: string;
  city?: string;
  location?: string;
  type?: string;
  createdAt?: string;
}