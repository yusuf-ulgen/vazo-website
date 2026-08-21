import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';

export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  routerInitialEntries?: MemoryRouterProps['initialEntries'];
}

export function renderWithRouter(
  ui: React.ReactElement,
  options?: CustomRenderOptions
) {
  const { routerInitialEntries = ['/'], ...renderOptions } = options || {};

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={routerInitialEntries}>
        {children}
      </MemoryRouter>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}
