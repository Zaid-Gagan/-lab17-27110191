import { useEffect, useMemo, useState } from 'react';
import './App.css';

const CATEGORIES = [
  { name: 'Food & Dining', color: '#547C60' },
  { name: 'Transportation', color: '#D6B878' },
  { name: 'Shopping', color: '#91A89A' },
  { name: 'Housing', color: '#142820' },
  { name: 'Entertainment', color: '#C98F6A' },
  { name: 'Healthcare', color: '#7DA1A0' },
  { name: 'Education', color: '#9B8CB0' },
  { name: 'Other', color: '#A7A28F' },
];

const STORAGE_KEY = 'pennywise-state-v1';

function normalizeState(saved, fallback) {
  if (!saved || typeof saved !== 'object') return fallback;
  const validCategories = new Set(CATEGORIES.map((category) => category.name));
  const transactions = Array.isArray(saved.transactions)
    ? saved.transactions
        .filter((item) => item && item.id && item.date && item.description)
        .map((item) => ({
          ...item,
          amount: Number(item.amount) > 0 ? Number(item.amount) : 0,
          type: item.type === 'income' ? 'income' : 'expense',
          category: validCategories.has(item.category) ? item.category : 'Other',
        }))
        .filter((item) => item.amount > 0)
    : [];
  const budgets = saved.budgets && typeof saved.budgets === 'object'
    ? {
        monthly: Math.max(0, Number(saved.budgets.monthly) || 0),
        ...Object.fromEntries(CATEGORIES.map((category) => [
          category.name,
          Math.max(0, Number(saved.budgets[category.name]) || 0),
        ])),
      }
    : fallback.budgets;
  return { isSample: Boolean(saved.isSample), transactions, budgets };
}

function defaultDateForMonth(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  const day = Math.min(new Date().getDate(), new Date(year, monthNumber, 0).getDate());
  return dateFromParts(year, monthNumber, day);
}

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function dateFromParts(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function makeSampleData(selectedMonth) {
  const [year, month] = selectedMonth.split('-').map(Number);
  const maxDay = new Date(year, month, 0).getDate();
  const day = (value) => dateFromParts(year, month, Math.min(value, maxDay));
  return {
    isSample: true,
    transactions: [
      { id: 'sample-1', type: 'income', description: 'Monthly salary', amount: 250000, category: 'Other', date: day(1) },
      { id: 'sample-2', type: 'expense', description: 'Apartment rent', amount: 65000, category: 'Housing', date: day(2) },
      { id: 'sample-3', type: 'expense', description: 'Weekly groceries', amount: 18500, category: 'Food & Dining', date: day(5) },
      { id: 'sample-4', type: 'expense', description: 'Fuel and commute', amount: 12500, category: 'Transportation', date: day(8) },
      { id: 'sample-5', type: 'expense', description: 'Home supplies', amount: 9800, category: 'Shopping', date: day(10) },
      { id: 'sample-6', type: 'expense', description: 'Dinner with friends', amount: 7200, category: 'Food & Dining', date: day(12) },
      { id: 'sample-7', type: 'income', description: 'Freelance project', amount: 45000, category: 'Other', date: day(14) },
      { id: 'sample-8', type: 'expense', description: 'Cinema tickets', amount: 4800, category: 'Entertainment', date: day(16) },
      { id: 'sample-9', type: 'expense', description: 'Pharmacy', amount: 6200, category: 'Healthcare', date: day(18) },
      { id: 'sample-10', type: 'expense', description: 'Online course', amount: 15000, category: 'Education', date: day(20) },
    ],
    budgets: {
      monthly: 150000,
      'Food & Dining': 30000,
      Transportation: 20000,
      Shopping: 15000,
      Housing: 70000,
      Entertainment: 12000,
      Healthcare: 10000,
      Education: 20000,
      Other: 10000,
    },
  };
}

function formatMoney(value) {
  return `Rs. ${Math.round(value).toLocaleString('en-US')}`;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(date)
    .replace(',', '');
}

function monthLabel(value) {
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
}

function Icon({ name, size = 20 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    swap: <><path d="M7 7h11l-3-3"/><path d="M18 7l-3 3"/><path d="M17 17H6l3 3"/><path d="M6 17l3-3"/></>,
    chart: <><path d="M3 3v18h18"/><path d="M7 16l4-5 4 3 5-7"/></>,
    wallet: <><path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6"/><path d="M16 13h5"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2H12v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 6 14H5.8v-2H6a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L7.2 9l1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2H15V6a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 9l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2H21a1.7 1.7 0 0 0-1.6 1z"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    left: <path d="m15 18-6-6 6-6"/>,
    right: <path d="m9 18 6-6-6-6"/>,
    download: <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>,
    trash: <><path d="M3 6h18"/><path d="M8 6V3h8v3"/><path d="M19 6l-1 15H6L5 6"/><path d="M10 11v6M14 11v6"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function DonutChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  let cursor = 0;
  const gradient = data.length
    ? data.map((item) => {
        const start = cursor;
        cursor += total ? (item.amount / total) * 100 : 0;
        return `${item.color} ${start}% ${cursor}%`;
      }).join(', ')
    : '#E8EBE5 0 100%';
  return (
    <div className="donut" style={{ background: `conic-gradient(${gradient})` }}>
      <div className="donut-center"><strong>{formatMoney(total)}</strong><span>Total spent</span></div>
    </div>
  );
}

function App() {
  const initialMonth = monthKey();
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [activeView, setActiveView] = useState('overview');
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState('');
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const fallback = makeSampleData(initialMonth);
      return saved ? normalizeState(JSON.parse(saved), fallback) : fallback;
    } catch {
      return makeSampleData(initialMonth);
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // The application remains usable when browser storage is unavailable.
    }
  }, [state]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(timeout);
  }, [toast]);

  const monthTransactions = useMemo(
    () => state.transactions.filter((item) => item.date.startsWith(selectedMonth)),
    [state.transactions, selectedMonth]
  );
  const income = monthTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expenses = monthTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const balance = income - expenses;
  const monthlyBudget = Number(state.budgets.monthly || 0);
  const budgetUtilisation = monthlyBudget ? (expenses / monthlyBudget) * 100 : 0;
  const savingsRate = income ? ((income - expenses) / income) * 100 : 0;

  const categorySpending = CATEGORIES.map((category) => ({
    ...category,
    amount: monthTransactions
      .filter((item) => item.type === 'expense' && item.category === category.name)
      .reduce((sum, item) => sum + item.amount, 0),
  })).filter((item) => item.amount > 0);

  const trendData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(year, month - 1 - (5 - index), 1);
      const key = monthKey(date);
      const list = state.transactions.filter((item) => item.date.startsWith(key));
      return {
        key,
        label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date),
        amount: list.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0),
      };
    });
  }, [selectedMonth, state.transactions]);

  function changeMonth(direction) {
    const [year, month] = selectedMonth.split('-').map(Number);
    setSelectedMonth(monthKey(new Date(year, month - 1 + direction, 1)));
  }

  function navigate(view) {
    setActiveView(view);
    setMobileNav(false);
  }

  function resetSampleData() {
    setSelectedMonth(initialMonth);
    setState(makeSampleData(initialMonth));
    setToast('Sample transactions restored');
  }

  function deleteTransaction(id) {
    setState((current) => ({
      ...current,
      isSample: false,
      transactions: current.transactions.filter((item) => item.id !== id),
    }));
    setToast('Transaction deleted');
  }

  function updateBudget(category, value) {
    const amount = Math.max(0, Number(value) || 0);
    setState((current) => ({
      ...current,
      isSample: false,
      budgets: { ...current.budgets, [category]: amount },
    }));
  }

  function addTransaction(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = Number(form.get('amount'));
    if (!amount || amount <= 0) return;
    const transaction = {
      id: `tx-${Date.now()}`,
      type: form.get('type'),
      description: String(form.get('description')).trim(),
      amount,
      category: form.get('category'),
      date: form.get('date'),
    };
    if (!transaction.description || !transaction.date) return;
    setState((current) => ({
      ...current,
      isSample: false,
      transactions: [transaction, ...current.transactions],
    }));
    setSelectedMonth(transaction.date.slice(0, 7));
    setModalOpen(false);
    setToast('Transaction saved');
  }

  const navItems = [
    ['overview', 'Dashboard', 'grid'],
    ['transactions', 'Transactions', 'swap'],
    ['budget', 'Budget Planner', 'wallet'],
    ['analytics', 'Analytics', 'chart'],
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">P</div>
          <div><strong>Pennywise</strong><span>Take control of your money.</span></div>
        </div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map(([view, label, icon]) => (
            <button key={view} className={activeView === view ? 'active' : ''} onClick={() => navigate(view)}>
              <Icon name={icon} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <button className="settings-link" onClick={() => navigate('budget')}><Icon name="settings" /><span>Settings</span></button>
        <div className="profile">
          <div className="avatar">MA</div>
          <div><strong>My Account</strong><span>Personal account</span></div>
        </div>
      </aside>

      {mobileNav && <button className="nav-backdrop" aria-label="Close menu" onClick={() => setMobileNav(false)} />}

      <main className="main-content">
        <header className="topbar">
          <button className="menu-button" aria-label="Open menu" onClick={() => setMobileNav(true)}>☰</button>
          <div>
            <p className="eyebrow">{activeView === 'overview' ? 'Financial overview' : activeView}</p>
            <h1>{activeView === 'overview' ? 'Good morning, Alex' : navItems.find((item) => item[0] === activeView)?.[1]}</h1>
          </div>
          <div className="top-actions">
            <div className="month-picker">
              <button aria-label="Previous month" onClick={() => changeMonth(-1)}><Icon name="left" size={16}/></button>
              <span>{monthLabel(selectedMonth)}</span>
              <button aria-label="Next month" onClick={() => changeMonth(1)}><Icon name="right" size={16}/></button>
            </div>
            <button className="primary-button" onClick={() => setModalOpen(true)}><Icon name="plus" size={17}/>Add transaction</button>
          </div>
        </header>

        {activeView === 'overview' && (
          <div className="view">
            {state.isSample && (
              <div className="sample-banner"><span><strong>Sample data</strong> — explore Pennywise with example transactions.</span><button onClick={resetSampleData}>Reset sample data</button></div>
            )}
            <section className="stat-grid">
              <article className="stat-card">
                <div className="stat-heading"><span>Total income</span><span className="icon-badge income">↗</span></div>
                <strong>{formatMoney(income)}</strong>
                <small>For {monthLabel(selectedMonth)}</small>
              </article>
              <article className="stat-card">
                <div className="stat-heading"><span>Total expenses</span><span className="icon-badge expense">↘</span></div>
                <strong>{formatMoney(expenses)}</strong>
                <small>{budgetUtilisation.toFixed(1)}% of monthly budget</small>
              </article>
              <article className="stat-card">
                <div className="stat-heading"><span>Available balance</span><span className="icon-badge balance">◎</span></div>
                <strong>{formatMoney(balance)}</strong>
                <small>{balance >= 0 ? 'Ready to put toward your goals' : 'Expenses exceed income'}</small>
              </article>
              <article className="stat-card">
                <div className="stat-heading"><span>Savings rate</span><span className="icon-badge savings">%</span></div>
                <strong>{savingsRate.toFixed(1)}%</strong>
                <small>{formatMoney(Math.max(0, balance))} saved this month</small>
              </article>
            </section>

            <section className="dashboard-grid">
              <article className="panel spending-panel">
                <div className="panel-header"><div><p className="eyebrow">Spending</p><h2>Expense breakdown</h2></div><button className="text-button" onClick={() => navigate('analytics')}>View analytics</button></div>
                {categorySpending.length ? (
                  <div className="chart-layout">
                    <DonutChart data={categorySpending}/>
                    <div className="chart-legend">
                      {categorySpending.sort((a, b) => b.amount - a.amount).slice(0, 6).map((item) => (
                        <div key={item.name}><span className="legend-dot" style={{ background: item.color }}/><span>{item.name}</span><strong>{formatMoney(item.amount)}</strong></div>
                      ))}
                    </div>
                  </div>
                ) : <EmptyState title="No expenses yet" text="Add an expense to see your category breakdown." action={() => setModalOpen(true)} />}
              </article>

              <article className="panel budget-panel">
                <div className="panel-header"><div><p className="eyebrow">Monthly budget</p><h2>{budgetUtilisation.toFixed(1)}% utilised</h2></div><button className="text-button" onClick={() => navigate('budget')}>Manage</button></div>
                <div className="budget-overview">
                  <div><strong>{formatMoney(expenses)}</strong><span>spent of {formatMoney(monthlyBudget)}</span></div>
                  <div className="progress-track"><div className={budgetUtilisation > 100 ? 'over' : ''} style={{ width: `${Math.min(budgetUtilisation, 100)}%` }}/></div>
                  <p>{monthlyBudget > 0 && budgetUtilisation > 100 ? 'You have exceeded your monthly budget.' : monthlyBudget === 0 && expenses > 0 ? 'Set a monthly budget to track this spending.' : `${formatMoney(Math.max(monthlyBudget - expenses, 0))} remaining`}</p>
                </div>
              </article>
            </section>

            <RecentTransactions transactions={monthTransactions} onDelete={deleteTransaction} onViewAll={() => navigate('transactions')} />
          </div>
        )}

        {activeView === 'transactions' && (
          <div className="view">
            <section className="panel table-panel">
              <div className="panel-header"><div><p className="eyebrow">Money movement</p><h2>Transaction history</h2></div><button className="secondary-button" onClick={() => setModalOpen(true)}>+ New transaction</button></div>
              <TransactionTable transactions={monthTransactions} onDelete={deleteTransaction}/>
            </section>
          </div>
        )}

        {activeView === 'budget' && (
          <div className="view">
            <section className="budget-summary">
              <div><p className="eyebrow">Monthly budget</p><strong>{formatMoney(monthlyBudget)}</strong></div>
              <label>Set monthly limit<input type="number" min="0" value={monthlyBudget} onChange={(event) => updateBudget('monthly', event.target.value)} /></label>
            </section>
            <section className="panel budget-list-panel">
              <div className="panel-header"><div><p className="eyebrow">Category limits</p><h2>Budget planner</h2></div></div>
              <div className="budget-list">
                {CATEGORIES.map((category) => {
                  const spent = monthTransactions.filter((item) => item.type === 'expense' && item.category === category.name).reduce((sum, item) => sum + item.amount, 0);
                  const limit = Number(state.budgets[category.name] || 0);
                  const percent = limit ? (spent / limit) * 100 : 0;
                  return (
                    <div className="budget-row" key={category.name}>
                      <span className="category-icon" style={{ background: `${category.color}20`, color: category.color }}>{category.name.slice(0, 1)}</span>
                      <div className="budget-row-main"><div className="budget-row-title"><strong>{category.name}</strong><span className={percent > 100 ? 'over-text' : ''}>{formatMoney(spent)} / {formatMoney(limit)}</span></div><div className="progress-track"><div className={percent > 100 ? 'over' : ''} style={{ width: `${Math.min(percent, 100)}%`, background: percent > 100 ? undefined : category.color }}/></div></div>
                      <label className="limit-input">Limit<input type="number" min="0" value={limit} onChange={(event) => updateBudget(category.name, event.target.value)} /></label>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {activeView === 'analytics' && (
          <div className="view">
            <section className="analytics-grid">
              <article className="panel">
                <div className="panel-header"><div><p className="eyebrow">This month</p><h2>Income vs expenses</h2></div></div>
                <div className="comparison">
                  <div><span className="comparison-label income-label">Income</span><strong>{formatMoney(income)}</strong><div className="comparison-bar"><div style={{ width: income ? '100%' : '0%' }}/></div></div>
                  <div><span className="comparison-label expense-label">Expenses</span><strong>{formatMoney(expenses)}</strong><div className="comparison-bar expense-bar"><div style={{ width: income ? `${Math.min((expenses / income) * 100, 100)}%` : '0%' }}/></div></div>
                </div>
              </article>
              <article className="panel trend-panel">
                <div className="panel-header"><div><p className="eyebrow">Last six months</p><h2>Spending trend</h2></div></div>
                <TrendChart data={trendData}/>
              </article>
            </section>
            <section className="panel analytics-breakdown">
              <div className="panel-header"><div><p className="eyebrow">Category analysis</p><h2>Where your money goes</h2></div></div>
              {categorySpending.length ? (
                <div className="category-breakdown">
                  {categorySpending.sort((a, b) => b.amount - a.amount).map((item) => {
                    const share = expenses ? (item.amount / expenses) * 100 : 0;
                    return <div className="category-breakdown-row" key={item.name}><div><span className="legend-dot" style={{ background: item.color }}/><strong>{item.name}</strong></div><div className="share-bar"><div style={{ width: `${share}%`, background: item.color }}/></div><strong>{share.toFixed(1)}%</strong><span>{formatMoney(item.amount)}</span></div>;
                  })}
                </div>
              ) : <EmptyState title="No spending data" text="Add expenses to build your category analysis." action={() => setModalOpen(true)} />}
            </section>
          </div>
        )}
      </main>

      {modalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setModalOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="transaction-title">
            <div className="modal-header"><div><p className="eyebrow">Money movement</p><h2 id="transaction-title">Add transaction</h2></div><button className="close-button" aria-label="Close" onClick={() => setModalOpen(false)}>×</button></div>
            <form onSubmit={addTransaction}>
              <div className="type-toggle">
                <label><input type="radio" name="type" value="expense" defaultChecked/><span>Expense</span></label>
                <label><input type="radio" name="type" value="income"/><span>Income</span></label>
              </div>
              <label>Description<input name="description" required maxLength="60" placeholder="e.g. Weekly groceries" /></label>
              <div className="form-row">
                <label>Amount (Rs.)<input name="amount" type="number" required min="0.01" step="0.01" placeholder="0" /></label>
                <label>Date<input name="date" type="date" required defaultValue={defaultDateForMonth(selectedMonth)} /></label>
              </div>
              <label>Category<select name="category" defaultValue="Food & Dining">{CATEGORIES.map((category) => <option key={category.name}>{category.name}</option>)}</select></label>
              <button className="primary-button submit-button" type="submit">Save transaction</button>
            </form>
          </div>
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function EmptyState({ title, text, action }) {
  return <div className="empty-state"><div>◎</div><h3>{title}</h3><p>{text}</p><button className="secondary-button" onClick={action}>Add transaction</button></div>;
}

function TransactionTable({ transactions, onDelete }) {
  if (!transactions.length) return <EmptyState title="No transactions this month" text="Your transaction history will appear here." action={() => document.querySelector('.primary-button')?.click()} />;
  return (
    <div className="transaction-table">
      <div className="table-head"><span>Transaction</span><span>Category</span><span>Date</span><span>Amount</span><span /></div>
      {[...transactions].sort((a, b) => b.date.localeCompare(a.date)).map((item) => {
        const category = CATEGORIES.find((entry) => entry.name === item.category);
        return (
          <div className="table-row" key={item.id}>
            <div className="transaction-name"><span className="category-icon" style={{ background: `${category?.color || '#547C60'}20`, color: category?.color }}>{item.description.slice(0, 1).toUpperCase()}</span><strong>{item.description}</strong></div>
            <span>{item.category}</span><span>{formatDate(item.date)}</span>
            <strong className={item.type === 'income' ? 'income-text' : 'expense-text'}>{item.type === 'income' ? '+' : '-'}{formatMoney(item.amount)}</strong>
            <button className="delete-button" aria-label={`Delete ${item.description}`} onClick={() => onDelete(item.id)}><Icon name="trash" size={17}/></button>
          </div>
        );
      })}
    </div>
  );
}

function RecentTransactions({ transactions, onDelete, onViewAll }) {
  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  return (
    <section className="panel recent-panel">
      <div className="panel-header"><div><p className="eyebrow">Latest activity</p><h2>Recent transactions</h2></div><button className="text-button" onClick={onViewAll}>View all</button></div>
      {recent.length ? <div className="recent-list">{recent.map((item) => {
        const category = CATEGORIES.find((entry) => entry.name === item.category);
        return <div className="recent-row" key={item.id}><span className="category-icon" style={{ background: `${category?.color || '#547C60'}20`, color: category?.color }}>{item.description.slice(0, 1).toUpperCase()}</span><div><strong>{item.description}</strong><span>{item.category} · {formatDate(item.date)}</span></div><strong className={item.type === 'income' ? 'income-text' : 'expense-text'}>{item.type === 'income' ? '+' : '-'}{formatMoney(item.amount)}</strong><button className="delete-button" aria-label={`Delete ${item.description}`} onClick={() => onDelete(item.id)}><Icon name="trash" size={16}/></button></div>;
      })}</div> : <EmptyState title="No activity this month" text="Add a transaction to get started." action={() => document.querySelector('.primary-button')?.click()} />}
    </section>
  );
}

function TrendChart({ data }) {
  const max = Math.max(...data.map((item) => item.amount), 1);
  const width = 620;
  const height = 220;
  const left = 20;
  const bottom = 190;
  const chartWidth = 580;
  const chartHeight = 150;
  const points = data.map((item, index) => ({
    ...item,
    x: left + (index * chartWidth) / (data.length - 1),
    y: bottom - (item.amount / max) * chartHeight,
  }));
  const line = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const area = `${line} L ${points[points.length - 1].x} ${bottom} L ${points[0].x} ${bottom} Z`;
  return (
    <div className="trend-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Monthly spending trend">
        {[0, 1, 2, 3].map((lineIndex) => <line key={lineIndex} x1={left} x2={600} y1={bottom - lineIndex * 50} y2={bottom - lineIndex * 50} stroke="#E8EBE5" />)}
        <path d={area} fill="#547C60" opacity=".10"/>
        <path d={line} fill="none" stroke="#547C60" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        {points.map((point) => <g key={point.key}><circle cx={point.x} cy={point.y} r="5" fill="#FFFFFF" stroke="#547C60" strokeWidth="3"/><text x={point.x} y="215" textAnchor="middle" className="chart-label">{point.label}</text></g>)}
      </svg>
    </div>
  );
}

export default App;
