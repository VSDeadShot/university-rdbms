import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock Recharts ResizeObserver issue in jsdom environment
vi.mock('recharts', async () => {
  const originalModule = await vi.importActual('recharts') as any;
  return {
    ...originalModule,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  };
});

describe('App Component', () => {
  it('renders the application and displays the correct title', () => {
    render(<App />);
    expect(screen.getByText(/University Management/i)).toBeInTheDocument();
  });
});
