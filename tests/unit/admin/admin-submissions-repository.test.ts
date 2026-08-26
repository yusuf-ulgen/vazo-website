import { describe, it, expect } from 'vitest';
import { adminContactMessagesRepository } from '@/admin/submissions/api/admin-contact-messages-repository';
import { adminTradeApplicationsRepository } from '@/admin/submissions/api/admin-trade-applications-repository';
import { adminNewsletterRepository } from '@/admin/submissions/api/admin-newsletter-repository';

describe('Admin Submissions Repositories', () => {
  describe('adminContactMessagesRepository', () => {
    it('returns paginated contact messages with correct structure', async () => {
      const result = await adminContactMessagesRepository.getContactMessages({ page: 1, pageSize: 2 });
      expect(result.data.length).toBeLessThanOrEqual(2);
      expect(result.totalCount).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
    });

    it('filters contact messages by status', async () => {
      const result = await adminContactMessagesRepository.getContactMessages({ status: 'new' });
      for (const msg of result.data) {
        expect(msg.status).toBe('new');
      }
    });

    it('searches contact messages by subject or name', async () => {
      const result = await adminContactMessagesRepository.getContactMessages({ search: 'restoran' });
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]?.subject.toLowerCase()).toContain('restoran');
    });

    it('updates contact message status and notes', async () => {
      const updated = await adminContactMessagesRepository.updateContactMessage('msg-01', {
        status: 'read',
        admin_notes: 'İncelendi ve arandı.',
      });
      expect(updated.status).toBe('read');
      expect(updated.admin_notes).toBe('İncelendi ve arandı.');
      expect(updated.reviewed_at).toBeDefined();
    });
  });

  describe('adminTradeApplicationsRepository', () => {
    it('returns paginated trade applications', async () => {
      const result = await adminTradeApplicationsRepository.getTradeApplications({ page: 1, pageSize: 2 });
      expect(result.data.length).toBeLessThanOrEqual(2);
      expect(result.totalCount).toBeGreaterThan(0);
    });

    it('filters trade applications by status', async () => {
      const result = await adminTradeApplicationsRepository.getTradeApplications({ status: 'pending' });
      for (const app of result.data) {
        expect(app.status).toBe('pending');
      }
    });

    it('searches trade applications by company name or tax number', async () => {
      const result = await adminTradeApplicationsRepository.getTradeApplications({ search: 'artisan' });
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]?.company_name.toLowerCase()).toContain('artisan');
    });

    it('updates trade application status and notes', async () => {
      const updated = await adminTradeApplicationsRepository.updateTradeApplication('trade-01', {
        status: 'approved',
        admin_notes: 'Vergi levhası onaylandı.',
      });
      expect(updated.status).toBe('approved');
      expect(updated.admin_notes).toBe('Vergi levhası onaylandı.');
    });
  });

  describe('adminNewsletterRepository', () => {
    it('returns paginated newsletter subscribers', async () => {
      const result = await adminNewsletterRepository.getNewsletterSubscriptions({ page: 1, pageSize: 2 });
      expect(result.data.length).toBeLessThanOrEqual(2);
      expect(result.totalCount).toBeGreaterThan(0);
    });

    it('filters newsletter subscribers by status', async () => {
      const result = await adminNewsletterRepository.getNewsletterSubscriptions({ status: 'active' });
      for (const sub of result.data) {
        expect(sub.status).toBe('active');
      }
    });

    it('updates newsletter subscriber status', async () => {
      const updated = await adminNewsletterRepository.updateNewsletterSubscription('news-01', {
        status: 'unsubscribed',
      });
      expect(updated.status).toBe('unsubscribed');
    });
  });
});
