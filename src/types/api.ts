// Fizzy API Types

export interface User {
  id: string;
  name: string;
  role: 'owner' | 'member' | 'system';
  active: boolean;
  email_address: string;
  created_at: string;
  url: string;
}

export interface Board {
  id: string;
  name: string;
  all_access: boolean;
  created_at: string;
  url: string;
  creator?: User;
  auto_postpone_period?: number;
  public_description?: string;
}

export interface Column {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Tag {
  id: string;
  title: string;
  created_at: string;
  url: string;
}

export interface Step {
  id: string;
  content: string;
  completed: boolean;
}

export interface CommentBody {
  plain_text: string;
  html: string;
}

export interface Comment {
  id: string;
  created_at: string;
  updated_at: string;
  body: CommentBody;
  creator: User;
  reactions_url: string;
  url: string;
}

export interface Card {
  id: string;
  number: number;
  title: string;
  status: 'published' | 'drafted';
  description: string;
  description_html: string;
  image_url: string | null;
  tags: string[];
  golden: boolean;
  last_active_at: string;
  created_at: string;
  url: string;
  board: Board;
  column?: Column;
  creator: User;
  assignees?: User[];
  steps?: Step[];
  comments_url: string;
}

export interface Account {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  user: User;
}

export interface Identity {
  accounts: Account[];
}

export interface DirectUpload {
  url: string;
  headers: Record<string, string>;
}

export interface DirectUploadResponse {
  id: string;
  key: string;
  filename: string;
  content_type: string;
  byte_size: number;
  checksum: string;
  direct_upload: DirectUpload;
  signed_id: string;
}

export interface Notification {
  id: string;
  read: boolean;
  read_at: string | null;
  created_at: string;
  title: string;
  body: string;
  creator: User;
  card: {
    id: string;
    title: string;
    status: string;
    url: string;
  };
  url: string;
}

export interface Reaction {
  id: string;
  content: string;
  reacter: User;
  url: string;
}

// API Response types
export type BoardsResponse = Board[];
export type CardsResponse = Card[];
export type UsersResponse = User[];
export type CommentsResponse = Comment[];
export type ColumnsResponse = Column[];
export type TagsResponse = Tag[];
export type NotificationsResponse = Notification[];
