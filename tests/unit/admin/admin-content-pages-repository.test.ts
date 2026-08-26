import { describe, it, expect } from 'vitest';
import { adminContentPagesRepository } from '@/admin/content/api/admin-content-pages-repository';

describe('adminContentPagesRepository', () => {
  it('fetches all content pages with ordered sections in mock mode', async () => {
    const pages = await adminContentPagesRepository.getContentPages();
    expect(Array.isArray(pages)).toBe(true);
    expect(pages.length).toBeGreaterThan(0);

    const aboutPage = pages.find((p) => p.page_key === 'about');
    expect(aboutPage).toBeDefined();
    expect(aboutPage?.title).toBe('Hakkımızda & Zanaat Hikayemiz');
    expect(aboutPage?.sections).toBeDefined();
    expect(aboutPage?.sections?.length).toBeGreaterThan(0);
  });

  it('fetches a single page by id', async () => {
    const pages = await adminContentPagesRepository.getContentPages();
    const firstPage = pages[0];
    const fetched = await adminContentPagesRepository.getContentPageById(firstPage.id);
    expect(fetched).toBeDefined();
    expect(fetched?.id).toBe(firstPage.id);
  });

  it('creates and updates a content page in mock mode', async () => {
    const created = await adminContentPagesRepository.createContentPage({
      page_key: 'test_page',
      title: 'Test Başlık',
      seo_title: 'Test SEO',
      published: true,
    });

    expect(created.page_key).toBe('test_page');
    expect(created.title).toBe('Test Başlık');

    const updated = await adminContentPagesRepository.updateContentPage(created.id, {
      title: 'Güncellenmiş Başlık',
      published: false,
    });

    expect(updated.title).toBe('Güncellenmiş Başlık');
    expect(updated.published).toBe(false);

    await adminContentPagesRepository.deleteContentPage(created.id);
    const pagesAfterDelete = await adminContentPagesRepository.getContentPages();
    expect(pagesAfterDelete.find((p) => p.id === created.id)).toBeUndefined();
  });

  it('creates, updates and deletes a content section', async () => {
    const pages = await adminContentPagesRepository.getContentPages();
    const aboutPage = pages.find((p) => p.page_key === 'about');
    expect(aboutPage).toBeDefined();

    const newSec = await adminContentPagesRepository.createContentSection({
      page_id: aboutPage!.id,
      section_key: 'custom_section',
      title: 'Özel Bölüm',
      eyebrow: 'Vurgu',
      content: 'Bölüm metni',
      sort_order: 99,
      active: true,
    });

    expect(newSec.title).toBe('Özel Bölüm');
    expect(newSec.section_key).toBe('custom_section');

    const updatedSec = await adminContentPagesRepository.updateContentSection(newSec.id, {
      title: 'Güncel Özel Bölüm',
      active: false,
    });

    expect(updatedSec.title).toBe('Güncel Özel Bölüm');
    expect(updatedSec.active).toBe(false);

    await adminContentPagesRepository.deleteContentSection(newSec.id);
    const refreshedPage = await adminContentPagesRepository.getContentPageById(aboutPage!.id);
    expect(refreshedPage?.sections?.find((s) => s.id === newSec.id)).toBeUndefined();
  });
});
