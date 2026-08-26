export type ContactMessageStatus = 'new' | 'read' | 'replied' | 'archived';

export interface AdminContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface ContactMessagesFilter {
  search?: string;
  status?: 'all' | ContactMessageStatus;
  page?: number;
  pageSize?: number;
}

export interface UpdateContactMessageInput {
  status?: ContactMessageStatus;
  admin_notes?: string | null;
  reviewed_at?: string | null;
}

export type TradeApplicationStatus = 'pending' | 'approved' | 'rejected' | 'more_info_needed';

export interface AdminTradeApplication {
  id: string;
  company_name: string;
  tax_number: string;
  tax_office: string;
  business_type: string;
  contact_person: string;
  email: string;
  phone: string;
  website: string | null;
  estimated_monthly_volume: string | null;
  notes: string | null;
  status: TradeApplicationStatus;
  admin_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface TradeApplicationsFilter {
  search?: string;
  status?: 'all' | TradeApplicationStatus;
  page?: number;
  pageSize?: number;
}

export interface UpdateTradeApplicationInput {
  status?: TradeApplicationStatus;
  admin_notes?: string | null;
  reviewed_at?: string | null;
}

export type NewsletterStatus = 'active' | 'unsubscribed';

export interface AdminNewsletterSubscription {
  id: string;
  normalized_email: string;
  status: NewsletterStatus;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface NewsletterFilter {
  search?: string;
  status?: 'all' | NewsletterStatus;
  source?: string;
  page?: number;
  pageSize?: number;
}

export interface UpdateNewsletterInput {
  status?: NewsletterStatus;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
