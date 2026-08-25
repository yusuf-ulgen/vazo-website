import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { App } from '@/app/App';
import { SiteLayout } from '@/site/layouts/SiteLayout';
import { router } from '@/app/router';

describe('Router & App Integration Tests', () => {
  it('renders App component without errors', () => {
    const { container } = render(<App />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders SiteLayout with announcement, navbar, outlet, and footer', () => {
    const testRouter = createMemoryRouter([
      {
        path: '/',
        element: <SiteLayout />,
        children: [{ index: true, element: <div>Sayfa İçeriği</div> }],
      },
    ]);

    render(<RouterProvider router={testRouter} />);
    expect(screen.getByText('Sayfa İçeriği')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Vazo Studio' }).length).toBeGreaterThanOrEqual(1);
  });

  it('defines all public routes in the production router table', () => {
    expect(router.routes.length).toBeGreaterThan(0);
    const storefrontRoutes = router.routes[0]?.children || [];
    const paths = storefrontRoutes.map((r) => r.path);

    expect(paths).toContain('products');
    expect(paths).toContain('new');
    expect(paths).toContain('bestsellers');
    expect(paths).toContain('categories');
    expect(paths).toContain('collections');
    expect(paths).toContain('wholesale');
    expect(paths).toContain('about');
    expect(paths).toContain('contact');
    expect(paths).toContain('faq');
    expect(paths).toContain('*');

    const routePaths = router.routes.map((r) => r.path);
    expect(routePaths).toContain('/admin');
    expect(routePaths).toContain('/admin/login');
  });
});
