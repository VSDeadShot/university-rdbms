import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { AuthProvider } from './context/AuthContext';

// Mock Recharts ResizeObserver issue in jsdom environment
vi.mock('recharts', async () => {
  const originalModule = await vi.importActual('recharts') as any;
  return {
    ...originalModule,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  };
});

describe('App Component', () => {
  it('renders the authentication page by default when not logged in', () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );
    expect(screen.getByText(/UniManage/i)).toBeInTheDocument();
  });
});
