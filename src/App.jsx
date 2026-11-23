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
  const futureGoalDate = (monthsAhead, dayOfMonth) => {
    const future = new Date(year, month - 1 + monthsAhead, 1);
    return dateFromParts(future.getFullYear(), future.getMonth() + 1, dayOfMonth);
  };
  return {
    isSample: true,
    profileName: 'My Account',
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
    budgets: { monthly: 150000, 'Food & Dining': 30000, Transportation: 20000, Shopping: 15000, Housing: 70000, Entertainment: 12000, Healthcare: 10000, Education: 20000, Other: 10000 },
    goals: [
      { id: 'goal-1', name: 'Emergency fund', target: 300000, saved: 175000, targetDate: futureGoalDate(4, 30) },
      { id: 'goal-2', name: 'New laptop', target: 180000, saved: 82000, targetDate: futureGoalDate(2, 28) },
    ],
  };
}
function normalizeState(saved, fallback) {
  if (!saved || typeof saved !== 'object') return fallback;
  const validCategories = new Set(CATEGORIES.map((item) => item.name));
  const transactions = Array.isArray(saved.transactions)
    ? saved.transactions.filter((item) => item && item.id && item.description && item.date)
        .map((item) => ({ ...item, amount: Number(item.amount) > 0 ? Number(item.amount) : 0, type: item.type === 'income' ? 'income' : 'expense', category: validCategories.has(item.category) ? item.category : 'Other' }))
        .filter((item) => item.amount > 0)
    : fallback.transactions;
  const budgets = saved.budgets && typeof saved.budgets === 'object'
    ? { monthly: Math.max(0, Number(saved.budgets.monthly) || 0), ...Object.fromEntries(CATEGORIES.map((item) => [item.name, Math.max(0, Number(saved.budgets[item.name]) || 0)])) }
    : fallback.budgets;
  const goals = Array.isArray(saved.goals)
    ? saved.goals.filter((item) => item && item.id && item.name).map((item) => ({ ...item, target: Math.max(0, Number(item.target) || 0), saved: Math.max(0, Number(item.saved) || 0) }))
    : fallback.goals;
  return { isSample: Boolean(saved.isSample), profileName: typeof saved.profileName === 'string' && saved.profileName.trim() ? saved.profileName : 'My Account', transactions, budgets, goals };
}
function formatMoney(value) {
  return `Rs. ${Math.round(value).toLocaleString('en-US')}`;
}
function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`)).replace(',', '');
}
function monthLabel(value) {
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
}
function defaultDateForMonth(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return dateFromParts(year, monthNumber, Math.min(new Date().getDate(), new Date(year, monthNumber, 0).getDate()));
}
function Icon({ name, size = 20 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    swap: <><path d="M7 7h11l-3-3M18 7l-3 3M17 17H6l3 3M6 17l3-3"/></>,
    chart: <><path d="M3 3v18h18M7 16l4-5 4 3 5-7"/></>,
    wallet: <><path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6M16 13h5"/></>,
    target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="m12 12 7-7"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    left: <path d="m15 18-6-6 6-6"/>,
    right: <path d="m9 18 6-6-6-6"/>,
    trash: <><path d="M3 6h18M8 6V3h8v3M19 6l-1 15H6L5 6M10 11v6M14 11v6"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
function DonutChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  let cursor = 0;
  const gradient = data.length ? data.map((item) => { const start = cursor; cursor += total ? item.amount / total * 100 : 0; return `${item.color} ${start}% ${cursor}%`; }).join(', ') : '#E8EBE5 0 100%';
  return <div className="donut" style={{ background: `conic-gradient(${gradient})` }}><div className="donut-center"><strong>{formatMoney(total)}</strong><span>Total spent</span></div></div>;
}
function TrendChart({ data, mode }) {
  const width = 620, height = 220, left = 20, bottom = 190, chartWidth = 580, chartHeight = 150;
  const max = Math.max(...data.map((item) => mode === 'income' ? item.income : mode === 'savings' ? item.savings : item.expense), 1);
  const points = data.map((item, index) => ({ ...item, x: left + index * chartWidth / Math.max(data.length - 1, 1), y: bottom - ((mode === 'income' ? item.income : mode === 'savings' ? item.savings : item.expense) / max) * chartHeight }));
  const line = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const area = `${line} L ${points.at(-1).x} ${bottom} L ${points[0].x} ${bottom} Z`;
  return <div className="trend-chart"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${mode} trend`}><path d={area} fill="#547C60" opacity=".10"/><path d={line} fill="none" stroke="#547C60" strokeWidth="3" strokeLinecap="round"/>{points.map((point) => <g key={point.key}><circle cx={point.x} cy={point.y} r="5" fill="#fff" stroke="#547C60" strokeWidth="3"/><text x={point.x} y="215" textAnchor="middle" className="chart-label">{point.label}</text></g>)}</svg></div>;
}

function App() {
  const initialMonth = monthKey();
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [activeView, setActiveView] = useState('overview');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [goalModal, setGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('selected');
  const [sortBy, setSortBy] = useState('date-desc');
  const [trendPeriod, setTrendPeriod] = useState(6);
  const [trendMode, setTrendMode] = useState('expense');
  const [state, setState] = useState(() => {
    try {
      const fallback = makeSampleData(initialMonth);
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? normalizeState(JSON.parse(saved), fallback) : fallback;
    } catch { return makeSampleData(initialMonth); }
  });
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }, [state]);
  useEffect(() => { if (!toast) return undefined; const timeout = setTimeout(() => setToast(''), 2600); return () => clearTimeout(timeout); }, [toast]);

  const monthTransactions = useMemo(() => state.transactions.filter((item) => item.date.startsWith(selectedMonth)), [state.transactions, selectedMonth]);
  const income = monthTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expenses = monthTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const balance = income - expenses;
  const monthlyBudget = Number(state.budgets.monthly || 0);
  const budgetUtilisation = monthlyBudget > 0 ? expenses / monthlyBudget * 100 : 0;
  const savingsRate = income > 0 ? balance / income * 100 : 0;
  const categorySpending = CATEGORIES.map((category) => ({ ...category, amount: monthTransactions.filter((item) => item.type === 'expense' && item.category === category.name).reduce((sum, item) => sum + item.amount, 0) })).filter((item) => item.amount > 0);
  const trendData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return Array.from({ length: trendPeriod }, (_, index) => {
      const date = new Date(year, month - 1 - (trendPeriod - 1 - index), 1);
      const key = monthKey(date);
      const list = state.transactions.filter((item) => item.date.startsWith(key));
      const monthIncome = list.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
      const monthExpense = list.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
      return { key, label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date), income: monthIncome, expense: monthExpense, savings: monthIncome > 0 ? (monthIncome - monthExpense) / monthIncome * 100 : 0 };
    });
  }, [selectedMonth, state.transactions, trendPeriod]);
  const displayedTransactions = useMemo(() => {
    const list = state.transactions.filter((item) => item.description.toLowerCase().includes(search.trim().toLowerCase()) && (typeFilter === 'all' || item.type === typeFilter) && (categoryFilter === 'all' || item.category === categoryFilter) && (monthFilter === 'all' || item.date.startsWith(selectedMonth)));
    return [...list].sort((a, b) => sortBy === 'amount-desc' ? b.amount - a.amount : sortBy === 'amount-asc' ? a.amount - b.amount : sortBy === 'date-asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
  }, [state.transactions, search, typeFilter, categoryFilter, monthFilter, selectedMonth, sortBy]);

  function changeMonth(direction) { const [year, month] = selectedMonth.split('-').map(Number); setSelectedMonth(monthKey(new Date(year, month - 1 + direction, 1))); }
  function navigate(view) { setActiveView(view); setMobileNav(false); }
  function openAddTransaction() { setEditingTransaction(null); setModalOpen(true); }
  function openEditTransaction(item) { setEditingTransaction(item); setModalOpen(true); }
  function resetSampleData() { setSelectedMonth(initialMonth); setState(makeSampleData(initialMonth)); setToast('Original sample data restored'); }
  function deleteTransaction(id) { setState((current) => ({ ...current, isSample: false, transactions: current.transactions.filter((item) => item.id !== id) })); setToast('Transaction deleted'); }
  function updateBudget(category, value) { setState((current) => ({ ...current, isSample: false, budgets: { ...current.budgets, [category]: Math.max(0, Number(value) || 0) } })); }
  function saveTransaction(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = Number(form.get('amount'));
    const description = String(form.get('description')).trim();
    const date = String(form.get('date'));
    const category = String(form.get('category'));
    if (!description || amount <= 0 || !date || !CATEGORIES.some((item) => item.name === category)) { setToast('Check the transaction details'); return; }
    const record = { id: editingTransaction?.id || `tx-${Date.now()}`, type: String(form.get('type')), description, amount, category, date };
    setState((current) => ({ ...current, isSample: false, transactions: editingTransaction ? current.transactions.map((item) => item.id === editingTransaction.id ? record : item) : [record, ...current.transactions] }));
    setSelectedMonth(date.slice(0, 7)); setModalOpen(false); setEditingTransaction(null); setToast(editingTransaction ? 'Transaction updated' : 'Transaction saved');
  }
  function saveGoal(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name')).trim();
    const target = Number(form.get('target'));
    const saved = Number(form.get('saved'));
    const targetDate = String(form.get('targetDate'));
    if (!name || target <= 0 || saved < 0 || !targetDate) { setToast('Check the goal details'); return; }
    const record = { id: editingGoal?.id || `goal-${Date.now()}`, name, target, saved, targetDate };
    setState((current) => ({ ...current, goals: editingGoal ? current.goals.map((item) => item.id === editingGoal.id ? record : item) : [record, ...current.goals] }));
    setGoalModal(false); setEditingGoal(null); setToast(editingGoal ? 'Savings goal updated' : 'Savings goal created');
  }
  function deleteGoal(id) { setState((current) => ({ ...current, goals: current.goals.filter((item) => item.id !== id) })); setToast('Savings goal deleted'); }

  const navItems = [['overview','Dashboard','grid'],['transactions','Transactions','swap'],['budget','Budget Planner','wallet'],['analytics','Analytics','chart'],['goals','Savings Goals','target'],['settings','Settings','settings']];
  const largestCategory = [...categorySpending].sort((a,b) => b.amount-a.amount)[0]?.name;
  const observation = expenses === 0 ? 'No expenses recorded for this month.' : balance >= 0 ? `${largestCategory || 'Your largest category'} is currently your largest spending category.` : 'Expenses have exceeded income this month.';

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
        <div className="brand"><div className="brand-mark">P</div><div><strong>Pennywise</strong><span>Take control of your money.</span></div></div>
        <nav className="side-nav" aria-label="Main navigation">{navItems.map(([view,label,icon]) => <button key={view} className={activeView === view ? 'active' : ''} onClick={() => navigate(view)}><Icon name={icon}/><span>{label}</span></button>)}</nav>
        <div className="profile"><div className="avatar">{state.profileName.split(' ').map((item) => item[0]).join('').slice(0,2).toUpperCase()}</div><div><strong>{state.profileName}</strong><span>Personal account</span></div></div>
      </aside>
      {mobileNav && <button className="nav-backdrop" aria-label="Close menu" onClick={() => setMobileNav(false)} />}
      <main className="main-content">
        <header className="topbar"><button className="menu-button" aria-label="Open menu" onClick={() => setMobileNav(true)}>☰</button><div><p className="eyebrow">{activeView === 'overview' ? 'Financial overview' : activeView}</p><h1>{activeView === 'overview' ? `Good morning, ${state.profileName}` : navItems.find((item) => item[0] === activeView)?.[1]}</h1></div><div className="top-actions"><div className="month-picker"><button aria-label="Previous month" onClick={() => changeMonth(-1)}><Icon name="left" size={16}/></button><span>{monthLabel(selectedMonth)}</span><button aria-label="Next month" onClick={() => changeMonth(1)}><Icon name="right" size={16}/></button></div><button className="primary-button" onClick={openAddTransaction}><Icon name="plus" size={17}/>Add transaction</button></div></header>

        {activeView === 'overview' && <div className="view">
          {state.isSample && <div className="sample-banner"><span><strong>Sample data</strong> — example records only.</span><button onClick={resetSampleData}>Reset sample data</button></div>}
          <section className="stat-grid"><StatCard title="Total income" value={formatMoney(income)} note={`For ${monthLabel(selectedMonth)}`} badge="↗" tone="income"/><StatCard title="Total expenses" value={formatMoney(expenses)} note={`${budgetUtilisation.toFixed(1)}% of monthly budget`} badge="↘" tone="expense"/><StatCard title="Available balance" value={formatMoney(balance)} note={balance >= 0 ? 'Ready for your goals' : 'Expenses exceed income'} badge="◎" tone="balance"/><StatCard title="Savings rate" value={`${savingsRate.toFixed(1)}%`} note={`${formatMoney(Math.max(0,balance))} saved`} badge="%" tone="savings"/></section>
          <section className="dashboard-grid"><article className="panel spending-panel"><div className="panel-header"><div><p className="eyebrow">Spending</p><h2>Expense breakdown</h2></div><button className="text-button" onClick={() => navigate('analytics')}>View analytics</button></div>{categorySpending.length ? <div className="chart-layout"><DonutChart data={categorySpending}/><div className="chart-legend">{[...categorySpending].sort((a,b)=>b.amount-a.amount).map((item)=><div key={item.name}><span className="legend-dot" style={{background:item.color}}/><span>{item.name}</span><strong>{formatMoney(item.amount)}</strong></div>)}</div></div> : <EmptyState title="No expenses yet" text="Add an expense to see the breakdown." action={openAddTransaction}/>}</article>
          <article className="panel budget-panel"><div className="panel-header"><div><p className="eyebrow">Monthly budget</p><h2>{budgetUtilisation.toFixed(1)}% utilised</h2></div><button className="text-button" onClick={() => navigate('budget')}>Manage</button></div><div className="budget-overview"><strong>{formatMoney(expenses)}</strong><span>spent of {formatMoney(monthlyBudget)}</span><div className="progress-track"><div className={budgetUtilisation > 100 ? 'over' : ''} style={{width:`${Math.min(budgetUtilisation,100)}%`}}/></div><p>{monthlyBudget > 0 && budgetUtilisation > 100 ? 'You have exceeded your monthly budget.' : monthlyBudget === 0 && expenses > 0 ? 'Set a monthly budget to track spending.' : `${formatMoney(Math.max(monthlyBudget-expenses,0))} remaining`}</p></div></article></section>
          <section className="dashboard-grid secondary-grid"><article className="panel observation-panel"><p className="eyebrow">Financial observation</p><h2>{observation}</h2></article><article className="panel goals-summary"><div className="panel-header"><div><p className="eyebrow">Savings goals</p><h2>{formatMoney(state.goals.reduce((sum,item)=>sum+item.saved,0))} saved</h2></div><button className="text-button" onClick={() => navigate('goals')}>View goals</button></div><div className="goal-mini-list">{state.goals.slice(0,2).map((goal)=>{const percent=goal.target?Math.min(goal.saved/goal.target*100,100):0;return <div key={goal.id}><div><strong>{goal.name}</strong><span>{percent.toFixed(1)}%</span></div><div className="progress-track"><div style={{width:`${percent}%`}}/></div></div>;})}{!state.goals.length&&<p>No savings goals yet.</p>}</div></article></section>
          <RecentTransactions transactions={monthTransactions} onDelete={deleteTransaction} onEdit={openEditTransaction} onViewAll={()=>navigate('transactions')}/>
        </div>}

        {activeView === 'transactions' && <div className="view"><section className="panel table-panel"><div className="panel-header"><div><p className="eyebrow">Money movement</p><h2>Transaction history</h2></div><button className="secondary-button" onClick={openAddTransaction}>+ New transaction</button></div><div className="transaction-controls"><label>Search<input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder="Search description"/></label><label>Type<select value={typeFilter} onChange={(event)=>setTypeFilter(event.target.value)}><option value="all">All types</option><option value="income">Income</option><option value="expense">Expense</option></select></label><label>Category<select value={categoryFilter} onChange={(event)=>setCategoryFilter(event.target.value)}><option value="all">All categories</option>{CATEGORIES.map((item)=><option key={item.name}>{item.name}</option>)}</select></label><label>Month<select value={monthFilter} onChange={(event)=>setMonthFilter(event.target.value)}><option value="selected">Selected month</option><option value="all">All months</option></select></label><label>Sort<select value={sortBy} onChange={(event)=>setSortBy(event.target.value)}><option value="date-desc">Date: newest</option><option value="date-asc">Date: oldest</option><option value="amount-desc">Amount: high</option><option value="amount-asc">Amount: low</option></select></label></div><TransactionTable transactions={displayedTransactions} onDelete={deleteTransaction} onEdit={openEditTransaction}/></section></div>}

        {activeView === 'budget' && <div className="view"><section className="budget-summary"><div><p className="eyebrow">Monthly budget</p><strong>{formatMoney(monthlyBudget)}</strong></div><label>Set monthly limit<input aria-label="Set monthly limit" type="number" min="0" value={monthlyBudget} onChange={(event)=>updateBudget('monthly',event.target.value)}/></label></section><section className="panel budget-list-panel"><div className="panel-header"><div><p className="eyebrow">Category limits</p><h2>Budget planner</h2></div></div><div className="budget-list">{CATEGORIES.map((category)=>{const spent=monthTransactions.filter((item)=>item.type==='expense'&&item.category===category.name).reduce((sum,item)=>sum+item.amount,0);const limit=Number(state.budgets[category.name]||0);const percent=limit>0?spent/limit*100:0;return <div className="budget-row" key={category.name}><span className="category-icon" style={{background:`${category.color}20`,color:category.color}}>{category.name.slice(0,1)}</span><div className="budget-row-main"><div className="budget-row-title"><strong>{category.name}</strong><span className={percent>100?'over-text':''}>{formatMoney(spent)} spent · {formatMoney(Math.max(limit-spent,0))} remaining</span></div><div className="progress-track"><div className={percent>100?'over':''} style={{width:`${Math.min(percent,100)}%`,background:percent>100?undefined:category.color}}/></div></div><label className="limit-input">Limit<input aria-label={`${category.name} limit`} type="number" min="0" value={limit} onChange={(event)=>updateBudget(category.name,event.target.value)}/></label></div>;})}</div></section></div>}

        {activeView === 'analytics' && <div className="view"><section className="analytics-grid"><article className="panel"><div className="panel-header"><div><p className="eyebrow">This month</p><h2>Income vs expenses</h2></div></div><div className="comparison"><Comparison label="Income" value={income} tone="income" width={100}/><Comparison label="Expenses" value={expenses} tone="expense" width={income>0?Math.min(expenses/income*100,100):0}/></div></article><article className="panel trend-panel"><div className="panel-header"><div><p className="eyebrow">Calculated from transactions</p><h2>Financial trend</h2></div><div className="chart-controls"><select aria-label="Trend period" value={trendPeriod} onChange={(event)=>setTrendPeriod(Number(event.target.value))}><option value="3">3 months</option><option value="6">6 months</option><option value="12">12 months</option></select><select aria-label="Trend metric" value={trendMode} onChange={(event)=>setTrendMode(event.target.value)}><option value="expense">Expenses</option><option value="income">Income</option><option value="savings">Savings rate</option></select></div></div><TrendChart data={trendData} mode={trendMode}/></article></section><section className="panel analytics-breakdown"><div className="panel-header"><div><p className="eyebrow">Category analysis</p><h2>Where your money goes</h2></div></div>{categorySpending.length?<div className="category-breakdown">{[...categorySpending].sort((a,b)=>b.amount-a.amount).map((item)=>{const share=expenses?item.amount/expenses*100:0;return <div className="category-breakdown-row" key={item.name}><div><span className="legend-dot" style={{background:item.color}}/><strong>{item.name}</strong></div><div className="share-bar"><div style={{width:`${share}%`,background:item.color}}/></div><strong>{share.toFixed(1)}%</strong><span>{formatMoney(item.amount)}</span></div>;})}</div>:<EmptyState title="No spending data" text="Add expenses to build category analysis." action={openAddTransaction}/>}</section></div>}

        {activeView === 'goals' && <div className="view"><div className="goals-header"><div><p className="eyebrow">Financial future</p><h2>Savings goals</h2></div><button className="primary-button" onClick={()=>{setEditingGoal(null);setGoalModal(true)}}><Icon name="plus" size={17}/>New goal</button></div><section className="goal-grid">{state.goals.map((goal)=>{const percent=goal.target>0?goal.saved/goal.target*100:0;return <article className="panel goal-card" key={goal.id}><div className="goal-card-head"><span className="category-icon"><Icon name="target" size={18}/></span><div><h3>{goal.name}</h3><p>Target {formatDate(goal.targetDate)}</p></div><button className="delete-button" aria-label={`Delete ${goal.name}`} onClick={()=>deleteGoal(goal.id)}><Icon name="trash" size={16}/></button></div><strong>{formatMoney(goal.saved)} <span>of {formatMoney(goal.target)}</span></strong><div className="progress-track"><div style={{width:`${Math.min(percent,100)}%`}}/></div><div className="goal-card-footer"><span>{percent.toFixed(1)}% complete</span><button className="text-button" onClick={()=>{setEditingGoal(goal);setGoalModal(true)}}>Edit goal</button></div></article>;})}{!state.goals.length&&<div className="panel"><EmptyState title="No savings goals" text="Create a goal and start tracking progress." action={()=>{setEditingGoal(null);setGoalModal(true)}}/></div>}</section></div>}

        {activeView === 'settings' && <div className="view"><section className="panel settings-panel"><div className="panel-header"><div><p className="eyebrow">Preferences</p><h2>Account settings</h2></div></div><form onSubmit={(event)=>{event.preventDefault();const name=String(new FormData(event.currentTarget).get('profileName')).trim();if(!name){setToast('Enter a profile label');return;}setState((current)=>({...current,profileName:name}));setToast('Profile updated');}}><label>Profile label<input name="profileName" defaultValue={state.profileName} required maxLength="40"/></label><button className="primary-button" type="submit">Save settings</button></form><div className="settings-reset"><div><strong>Reset sample data</strong><span>Replace current records with the original sample dataset.</span></div><button className="secondary-button" onClick={resetSampleData}>Reset sample data</button></div></section></div>}
      </main>

      {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event)=>event.target===event.currentTarget&&setModalOpen(false)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="transaction-title"><div className="modal-header"><div><p className="eyebrow">Money movement</p><h2 id="transaction-title">{editingTransaction?'Edit transaction':'Add transaction'}</h2></div><button className="close-button" aria-label="Close" onClick={()=>setModalOpen(false)}>×</button></div><form onSubmit={saveTransaction}><div className="type-toggle"><label><input type="radio" name="type" value="expense" defaultChecked={!editingTransaction||editingTransaction.type==='expense'}/><span>Expense</span></label><label><input type="radio" name="type" value="income" defaultChecked={editingTransaction?.type==='income'}/><span>Income</span></label></div><label>Description<input name="description" required maxLength="60" defaultValue={editingTransaction?.description||''} placeholder="e.g. Weekly groceries"/></label><div className="form-row"><label>Amount (Rs.)<input name="amount" type="number" required min="0.01" step="0.01" defaultValue={editingTransaction?.amount||''} placeholder="0"/></label><label>Date<input name="date" type="date" required defaultValue={editingTransaction?.date||defaultDateForMonth(selectedMonth)}/></label></div><label>Category<select name="category" defaultValue={editingTransaction?.category||'Food & Dining'}>{CATEGORIES.map((item)=><option key={item.name}>{item.name}</option>)}</select></label><button className="primary-button submit-button" type="submit">{editingTransaction?'Update transaction':'Save transaction'}</button></form></div></div>}
      {goalModal && <div className="modal-backdrop" role="presentation" onMouseDown={(event)=>event.target===event.currentTarget&&setGoalModal(false)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="goal-title"><div className="modal-header"><div><p className="eyebrow">Savings plan</p><h2 id="goal-title">{editingGoal?'Edit savings goal':'Create savings goal'}</h2></div><button className="close-button" aria-label="Close" onClick={()=>setGoalModal(false)}>×</button></div><form onSubmit={saveGoal}><label>Goal name<input name="name" required maxLength="50" defaultValue={editingGoal?.name||''} placeholder="e.g. Emergency fund"/></label><div className="form-row"><label>Target amount (Rs.)<input name="target" type="number" required min="0.01" step="0.01" defaultValue={editingGoal?.target||''}/></label><label>Saved amount (Rs.)<input name="saved" type="number" required min="0" step="0.01" defaultValue={editingGoal?.saved||0}/></label></div><label>Target date<input name="targetDate" type="date" required defaultValue={editingGoal?.targetDate||defaultDateForMonth(selectedMonth)}/></label><button className="primary-button submit-button" type="submit">{editingGoal?'Update goal':'Create goal'}</button></form></div></div>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function StatCard({title,value,note,badge,tone}) { return <article className="stat-card"><div className="stat-heading"><span>{title}</span><span className={`icon-badge ${tone}`}>{badge}</span></div><strong>{value}</strong><small>{note}</small></article>; }
function Comparison({label,value,tone,width}) { return <div><span className={`comparison-label ${tone}-label`}>{label}</span><strong>{formatMoney(value)}</strong><div className={`comparison-bar ${tone==='expense'?'expense-bar':''}`}><div style={{width:`${width}%`}}/></div></div>; }
function EmptyState({title,text,action}) { return <div className="empty-state"><div>◎</div><h3>{title}</h3><p>{text}</p><button className="secondary-button" onClick={action}>Add transaction</button></div>; }
function TransactionTable({transactions,onDelete,onEdit}) {
  if (!transactions.length) return <EmptyState title="No transactions found" text="Adjust your filters or add a transaction." action={()=>document.querySelector('.primary-button')?.click()}/>;
  return <div className="transaction-table"><div className="table-head"><span>Transaction</span><span>Category</span><span>Date</span><span>Amount</span><span/></div>{transactions.map((item)=>{const category=CATEGORIES.find((entry)=>entry.name===item.category);return <div className="table-row" key={item.id}><div className="transaction-name"><span className="category-icon" style={{background:`${category?.color||'#547C60'}20`,color:category?.color}}>{item.description.slice(0,1).toUpperCase()}</span><strong>{item.description}</strong></div><span>{item.category}</span><span>{formatDate(item.date)}</span><strong className={item.type==='income'?'income-text':'expense-text'}>{item.type==='income'?'+':'-'}{formatMoney(item.amount)}</strong><div className="row-actions"><button className="delete-button" aria-label={`Edit ${item.description}`} onClick={()=>onEdit(item)}>✎</button><button className="delete-button" aria-label={`Delete ${item.description}`} onClick={()=>onDelete(item.id)}><Icon name="trash" size={17}/></button></div></div>;})}</div>;
}
function RecentTransactions({transactions,onDelete,onEdit,onViewAll}) {
  const recent=[...transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  return <section className="panel recent-panel"><div className="panel-header"><div><p className="eyebrow">Latest activity</p><h2>Recent transactions</h2></div><button className="text-button" onClick={onViewAll}>View all</button></div>{recent.length?<div className="recent-list">{recent.map((item)=>{const category=CATEGORIES.find((entry)=>entry.name===item.category);return <div className="recent-row" key={item.id}><span className="category-icon" style={{background:`${category?.color||'#547C60'}20`,color:category?.color}}>{item.description.slice(0,1).toUpperCase()}</span><div><strong>{item.description}</strong><span>{item.category} · {formatDate(item.date)}</span></div><strong className={item.type==='income'?'income-text':'expense-text'}>{item.type==='income'?'+':'-'}{formatMoney(item.amount)}</strong><div className="row-actions"><button className="delete-button" aria-label={`Edit ${item.description}`} onClick={()=>onEdit(item)}>✎</button><button className="delete-button" aria-label={`Delete ${item.description}`} onClick={()=>onDelete(item.id)}><Icon name="trash" size={16}/></button></div></div>;})}</div>:<EmptyState title="No activity this month" text="Add a transaction to get started." action={()=>document.querySelector('.primary-button')?.click()}/>}</section>;
}

export default App;
