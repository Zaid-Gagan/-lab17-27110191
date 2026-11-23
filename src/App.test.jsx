import { expect, test, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test('renders the Pennywise dashboard and profile', () => {
  render(<App />);
  expect(screen.getByText('Pennywise')).toBeDefined();
  expect(screen.getByText('My Account')).toBeDefined();
  expect(screen.getByText('Rs. 295,000')).toBeDefined();
  expect(screen.getAllByText('Rs. 139,000').length).toBeGreaterThan(0);
});

test('applies available balance, savings rate and budget utilisation formulas', () => {
  render(<App />);
  expect(screen.getAllByText('Rs. 156,000').length).toBeGreaterThan(0);
  expect(screen.getAllByText('52.9%').length).toBeGreaterThan(0);
  expect(screen.getAllByText('92.7% utilised').length).toBeGreaterThan(0);
});

test('adds and deletes expense and income transactions', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Add transaction' }));
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test expense' } });
  fireEvent.change(screen.getByLabelText('Amount (Rs.)'), { target: { value: '500' } });
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Entertainment' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save transaction' }));
  expect(screen.getAllByText('Rs. 139,500').length).toBeGreaterThan(0);
  expect(JSON.parse(localStorage.getItem('pennywise-state-v1')).transactions.some((item) => item.description === 'Test expense')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Delete Test expense' }));
  expect(screen.queryByText('Rs. 139,500')).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Add transaction' }));
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Bonus income' } });
  fireEvent.change(screen.getByLabelText('Amount (Rs.)'), { target: { value: '10000' } });
  fireEvent.click(screen.getByText('Income'));
  fireEvent.click(screen.getByRole('button', { name: 'Save transaction' }));
  expect(screen.getAllByText('Rs. 305,000').length).toBeGreaterThan(0);
});

test('edits a transaction and recalculates persisted data', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Transactions' }));
  fireEvent.click(screen.getByRole('button', { name: 'Edit Apartment rent' }));
  fireEvent.change(screen.getByLabelText('Amount (Rs.)'), { target: { value: '60000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Update transaction' }));
  const saved = JSON.parse(localStorage.getItem('pennywise-state-v1'));
  expect(saved.transactions.find((item) => item.description === 'Apartment rent').amount).toBe(60000);
});

test('filters and sorts transaction history', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Transactions' }));
  fireEvent.change(screen.getByPlaceholderText('Search description'), { target: { value: 'cinema' } });
  expect(screen.getByText('Cinema tickets')).toBeDefined();
  fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'expense' } });
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Entertainment' } });
  fireEvent.change(screen.getByLabelText('Sort'), { target: { value: 'amount-desc' } });
  expect(screen.getByText('Cinema tickets')).toBeDefined();
});

test('monthly and category budgets update immediately', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Budget Planner' }));
  fireEvent.change(screen.getByLabelText('Set monthly limit'), { target: { value: '200000' } });
  fireEvent.change(screen.getByLabelText('Housing limit'), { target: { value: '50000' } });
  const saved = JSON.parse(localStorage.getItem('pennywise-state-v1'));
  expect(saved.budgets.monthly).toBe(200000);
  expect(saved.budgets.Housing).toBe(50000);
  expect(screen.getAllByText(/exceeded|spent/i).length).toBeGreaterThan(0);
});

test('creates, edits and deletes savings goals', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Savings Goals' }));
  fireEvent.click(screen.getByRole('button', { name: 'New goal' }));
  fireEvent.change(screen.getByLabelText('Goal name'), { target: { value: 'Vacation' } });
  fireEvent.change(screen.getByLabelText('Target amount (Rs.)'), { target: { value: '100000' } });
  fireEvent.change(screen.getByLabelText('Saved amount (Rs.)'), { target: { value: '25000' } });
  fireEvent.change(screen.getByLabelText('Target date'), { target: { value: '2027-12-31' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create goal' }));
  expect(screen.getByText('Vacation')).toBeDefined();
  const vacationCard = screen.getByText('Vacation').closest('.goal-card');
  fireEvent.click(vacationCard.querySelector('.text-button'));
  fireEvent.change(screen.getByLabelText('Saved amount (Rs.)'), { target: { value: '40000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Update goal' }));
  expect(JSON.parse(localStorage.getItem('pennywise-state-v1')).goals.find((item) => item.name === 'Vacation').saved).toBe(40000);
  fireEvent.click(screen.getByRole('button', { name: 'Delete Vacation' }));
  expect(screen.queryByText('Vacation')).toBeNull();
});

test('settings persist the profile label and reset sample data', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
  fireEvent.change(screen.getByLabelText('Profile label'), { target: { value: 'Ayesha Khan' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));
  expect(screen.getByText('Ayesha Khan')).toBeDefined();
  expect(JSON.parse(localStorage.getItem('pennywise-state-v1')).profileName).toBe('Ayesha Khan');
  fireEvent.click(screen.getAllByRole('button', { name: 'Reset sample data' })[0]);
  expect(JSON.parse(localStorage.getItem('pennywise-state-v1')).transactions).toHaveLength(10);
});

test('month navigation and analytics controls update from stored transactions', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
  expect(screen.getAllByText('Rs. 0').length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole('button', { name: 'Analytics' }));
  fireEvent.change(screen.getByLabelText('Trend period'), { target: { value: '12' } });
  fireEvent.change(screen.getByLabelText('Trend metric'), { target: { value: 'income' } });
  expect(screen.getByRole('img', { name: 'income trend' })).toBeDefined();
});

test('Entertainment and Other expense categories appear in analytics', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Analytics' }));
  expect(screen.getByText('Entertainment')).toBeDefined();
  expect(screen.queryByText('Other')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add transaction' }));
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Misc expense' } });
  fireEvent.change(screen.getByLabelText('Amount (Rs.)'), { target: { value: '1000' } });
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Other' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save transaction' }));
  fireEvent.click(screen.getByRole('button', { name: 'Analytics' }));
  expect(screen.getByText('Other')).toBeDefined();
});
