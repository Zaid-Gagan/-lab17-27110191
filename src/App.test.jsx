import { expect, test, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test('renders the Pennywise dashboard', () => {
  render(<App />);
  expect(screen.getByText('Pennywise')).toBeDefined();
  expect(screen.getByText('Good morning, Alex')).toBeDefined();
  expect(screen.getByText('My Account')).toBeDefined();
});

test('applies the Pennywise savings and budget formulas to sample data', () => {
  render(<App />);
  expect(screen.getByText('Rs. 295,000')).toBeDefined();
  expect(screen.getAllByText('Rs. 139,000').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Rs. 156,000').length).toBeGreaterThan(0);
  expect(screen.getByText('52.9%')).toBeDefined();
  expect(screen.getByText('92.7% utilised')).toBeDefined();
});

test('adds, persists, and deletes a transaction', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Add transaction' }));
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test expense' } });
  fireEvent.change(screen.getByLabelText('Amount (Rs.)'), { target: { value: '500' } });

  const dateInput = screen.getByLabelText('Date');
  const date = dateInput.defaultValue || dateInput.value;
  fireEvent.change(dateInput, { target: { value: date } });
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Entertainment' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save transaction' }));

  expect(screen.getAllByText('Rs. 139,500').length).toBeGreaterThan(0);
  const saved = JSON.parse(localStorage.getItem('pennywise-state-v1'));
  expect(saved.transactions.some((item) => item.description === 'Test expense')).toBe(true);

  fireEvent.click(screen.getByRole('button', { name: 'Delete Test expense' }));
  expect(screen.queryByText('Rs. 139,500')).toBeNull();
  expect(screen.getAllByText('Rs. 139,000').length).toBeGreaterThan(0);
});

test('resets the sample dataset', () => {
  render(<App />);
  localStorage.setItem('pennywise-state-v1', JSON.stringify({
    isSample: false,
    transactions: [{ id: 'custom', type: 'expense', description: 'Custom', amount: 1, category: 'Other', date: '2025-01-01' }],
    budgets: { monthly: 1000, Other: 1000 },
  }));
  fireEvent.click(screen.getByRole('button', { name: 'Reset sample data' }));
  const saved = JSON.parse(localStorage.getItem('pennywise-state-v1'));
  expect(saved.isSample).toBe(true);
  expect(saved.transactions).toHaveLength(10);
});

test('navigation, month filtering, and budget controls work', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: 'Budget Planner' }));
  expect(screen.getByRole('heading', { name: 'Budget Planner' })).toBeDefined();
  const monthlyInput = screen.getByLabelText('Set monthly limit');
  fireEvent.change(monthlyInput, { target: { value: '200000' } });
  const savedBudget = JSON.parse(localStorage.getItem('pennywise-state-v1'));
  expect(savedBudget.budgets.monthly).toBe(200000);

  fireEvent.click(screen.getByRole('button', { name: 'Analytics' }));
  expect(screen.getByRole('heading', { name: 'Income vs expenses' })).toBeDefined();

  fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }));
  const previousMonth = screen.getByRole('button', { name: 'Previous month' });
  fireEvent.click(previousMonth);
  expect(screen.getAllByText('Rs. 0').length).toBeGreaterThan(0);

  fireEvent.click(screen.getByRole('button', { name: 'View analytics' }));
  expect(screen.getByRole('heading', { name: 'Where your money goes' })).toBeDefined();
});

test('income transactions and Entertainment/Other categories update the app', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Add transaction' }));
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Bonus income' } });
  fireEvent.change(screen.getByLabelText('Amount (Rs.)'), { target: { value: '10000' } });
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: screen.getByLabelText('Date').defaultValue } });
  fireEvent.click(screen.getByText('Income'));
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Other' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save transaction' }));

  expect(screen.getAllByText('Rs. 305,000').length).toBeGreaterThan(0);

  fireEvent.click(screen.getByRole('button', { name: 'Add transaction' }));
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Miscellaneous expense' } });
  fireEvent.change(screen.getByLabelText('Amount (Rs.)'), { target: { value: '1000' } });
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Other' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save transaction' }));

  fireEvent.click(screen.getByRole('button', { name: 'Analytics' }));
  expect(screen.queryByText('Other')).not.toBeNull();
  expect(screen.queryByText('Entertainment')).not.toBeNull();
});
