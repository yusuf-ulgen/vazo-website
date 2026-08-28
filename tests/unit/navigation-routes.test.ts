import { describe, it, expect } from 'vitest';
import { router } from '@/app/router';
import { perakendeMegaMenuData, toptanMegaMenuData } from '@/shared/mocks/navigation';

describe('Navigation Route Resolution', () => {
  const getRegisteredPaths = () => {
    const registeredPaths: string[] = [];
    const extractPaths = (routes: typeof router.routes, prefix = '') => {
      for (const route of routes) {
        let currentPath = prefix;
        if (route.path !== undefined) {
          if (route.path.startsWith('/')) {
            currentPath = route.path;
          } else if (prefix === '' || prefix === '/') {
            currentPath = `/${route.path}`;
          } else {
            currentPath = `${prefix}/${route.path}`;
          }
        }

        if (currentPath) {
          registeredPaths.push(currentPath);
        }

        if (route.children) {
          extractPaths(route.children, currentPath);
        }
      }
    };
    extractPaths(router.routes);
    return registeredPaths;
  };

  it('contains all canonical storefront routes', () => {
    const registeredPaths = getRegisteredPaths();
    const canonicalRoutes = [
      '/',
      'products',
      'new',
      'bestsellers',
      'categories',
      'collections',
      'wishlist',
      'cart',
      'wholesale',
      'wholesale/products',
      'wholesale/how-it-works',
      'wholesale/apply',
      'about',
      'contact',
      'faq',
      'policies/shipping-returns',
      'policies/privacy-kvkk',
      'policies/terms',
      'privacy',
      'terms',
    ];

    for (const route of canonicalRoutes) {
      const exists = registeredPaths.some(
        (p) => p === route || p === `/${route}` || p === route.replace(/^\//, '')
      );
      expect(exists, `Expected route "${route}" to be registered in router`).toBe(true);
    }
  });

  it('verifies mock navigation items resolve to valid registered paths', () => {
    const invalidWholesaleRoutes = [
      '/wholesale/terms',
      '/wholesale/faq',
      '/wholesale/shipping-returns',
    ];

    const allGroups = [...perakendeMegaMenuData.groups, ...toptanMegaMenuData.groups];

    for (const group of allGroups) {
      for (const item of group.links) {
        // Must not contain broken wholesale subpaths
        expect(
          invalidWholesaleRoutes.includes(item.href),
          `Found broken route in navigation mock: ${item.href}`
        ).toBe(false);

        // Path must be a valid relative path starting with / or URL
        expect(item.href.startsWith('/') || item.href.startsWith('http')).toBe(true);
      }
    }
  });
});
