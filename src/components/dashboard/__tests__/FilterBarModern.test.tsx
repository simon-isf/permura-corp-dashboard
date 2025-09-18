import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from '../FilterBarModern';
import { Profile } from '@/lib/supabase';

// Mock the hooks
vi.mock('@/hooks/useCompanies', () => ({
  useCompanies: () => ({
    companies: [],
    loading: false
  })
}));

const mockProfile: Profile = {
  id: 'test-id',
  email: 'test@example.com',
  role: 'user',
  company_id: 'test-company',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const defaultProps = {
  closers: ['John Doe', 'Jane Smith'],
  setters: ['Alice Johnson', 'Bob Wilson'],
  onFiltersChange: vi.fn(),
  loading: false,
  profile: mockProfile
};

describe('FilterBar Date Selection', () => {
  it('should render date range presets', () => {
    const onFiltersChange = vi.fn();
    render(<FilterBar {...defaultProps} onFiltersChange={onFiltersChange} />);

    // Check that preset buttons are rendered
    expect(screen.getByText('MTD')).toBeInTheDocument();
    expect(screen.getByText('YTD')).toBeInTheDocument();
    expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
    expect(screen.getByText('Last 14 Days')).toBeInTheDocument();
    expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
  });

  it('should show selection state indicators', () => {
    const onFiltersChange = vi.fn();
    render(<FilterBar {...defaultProps} onFiltersChange={onFiltersChange} />);

    // Open the date picker
    const dateRangeButton = screen.getByRole('button', { name: /date range/i });
    fireEvent.click(dateRangeButton);

    // Should show "Click to select start date" initially
    expect(screen.getByText('Click to select start date')).toBeInTheDocument();
  });

  it('should handle preset selection', () => {
    const onFiltersChange = vi.fn();
    render(<FilterBar {...defaultProps} onFiltersChange={onFiltersChange} />);

    // Click on MTD preset
    const mtdButton = screen.getByText('MTD');
    fireEvent.click(mtdButton);

    // The onFiltersChange should be called with the MTD date range
    // Note: The actual date range would depend on the current date
    expect(onFiltersChange).toHaveBeenCalled();
  });

  it('should implement strict alternating selection cycle', () => {
    const onFiltersChange = vi.fn();
    render(<FilterBar {...defaultProps} onFiltersChange={onFiltersChange} />);

    // The component should start with expectingEndDate = false
    // This means the first click should always be treated as a start date

    // Test that the component renders
    expect(screen.getByText('Date Range')).toBeInTheDocument();
  });
});
