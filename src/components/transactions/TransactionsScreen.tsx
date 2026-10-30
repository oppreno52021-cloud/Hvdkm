import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { FilterBottomSheet } from './FilterBottomSheet';
import { formatCurrency, addMoney, getLocalDateString, formatNumber } from '../../utils/calculations';
import { formatDateLabel } from '../../utils/i18n';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  RotateCcw,
  ArrowLeft
} from 'lucide-react';
import { Expense } from '../../types';
import { SwipeableTransactionItem } from './SwipeableTransactionItem';
import { useBackHandler } from '../../hooks/useBackHandler';
import { triggerHaptic } from '../../utils/haptics';

export const TransactionsScreen: React.FC = () => {
  const { 
    filteredExpenses, 
    categories, 
    accounts, 
    filters, 
    setFilters, 
    resetFilters,
    settings, 
    referenceDate,
    setViewingExpense,
    setEditingExpense,
    removeExpense,
    duplicateExpense,
    openAddExpense,
    setActiveTab,
    isPrivacyMode,
    language,
    numberFormat,
    t
  } = useApp();

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  useBackHandler(Boolean(filters.search.trim()), () => setFilters(prev => ({ ...prev, search: '' })), 'trans-search');

  const formatNum = (val: number | string) => formatNumber(val, language, numberFormat);

  // Period shortcuts
  const todayStr = useMemo(() => getLocalDateString(referenceDate), [referenceDate]);
  const monthStartStr = useMemo(() => `${todayStr.slice(0, 7)}-01`, [todayStr]);
  const monthEndStr = useMemo(() => {
    const y = referenceDate.getFullYear();
    const m = referenceDate.getMonth();
    const lastDay = new Date(y, m + 1, 0).getDate();
    return `${todayStr.slice(0, 7)}-${String(lastDay).padStart(2, '0')}`;
  }, [referenceDate, todayStr]);

  const weekStartStr = useMemo(() => {
    const d = new Date(referenceDate);
    const day = d.getDay();
    const diff = (day + 1) % 7;
    d.setDate(d.getDate() - diff);
    return getLocalDateString(d);
  }, [referenceDate]);

  const isTodayActive = filters.startDate === todayStr && filters.endDate === todayStr;
  const isWeekActive = filters.startDate === weekStartStr && filters.endDate === todayStr;
  const isMonthActive = filters.startDate === monthStartStr && filters.endDate === monthEndStr;
  const isAllPeriodActive = !filters.startDate && !filters.endDate;

  // Active filter count calculation
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.categoryIds.length > 0) count += filters.categoryIds.length;
    if (filters.paymentMethodIds.length > 0) count += filters.paymentMethodIds.length;
    if (filters.startDate || filters.endDate) count++;
    if (filters.minAmount || filters.maxAmount) count++;
    if (filters.sortBy !== 'newest') count++;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0 || Boolean(filters.search.trim());

  const categoryMap = useMemo(() => {
    return new Map(categories.map(c => [c.id, c]));
  }, [categories]);

  // Group transactions by date with daily totals
  const groupedTransactions = useMemo(() => {
    const groups: { [date: string]: { date: string; displayLabel: string; items: Expense[]; total: number } } = {};
    const todayStr = getLocalDateString(referenceDate);
    const yesterdayDate = new Date(referenceDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterdayDate);

    filteredExpenses.forEach(exp => {
      if (!groups[exp.date]) {
        const label = formatDateLabel(exp.date, language);

        groups[exp.date] = {
          date: exp.date,
          displayLabel: label,
          items: [],
          total: 0,
        };
      }

      groups[exp.date].items.push(exp);
      if (exp.type === 'expense') {
        groups[exp.date].total = addMoney(groups[exp.date].total, exp.amount);
      }
    });

    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredExpenses, referenceDate, t, language]);

  // Progressive rendering for optimal DOM size and smooth scrolling
  const [visibleGroupCount, setVisibleGroupCount] = useState(20);

  useEffect(() => {
    setVisibleGroupCount(20);
  }, [filters]);

  const displayedGroups = useMemo(() => {
    return groupedTransactions.slice(0, visibleGroupCount);
  }, [groupedTransactions, visibleGroupCount]);

  const hasMoreGroups = groupedTransactions.length > visibleGroupCount;

  return (
    <div className="space-y-4 pb-6 text-slate-900 dark:text-slate-100">
      {/* Top Header with Back to Home Button (Unified with InsightsScreen) */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="p-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-2xs shrink-0"
          title={language === 'ar' ? 'الرجوع للرئيسية' : 'Back to Home'}
          aria-label={language === 'ar' ? 'الرجوع للرئيسية' : 'Back to Home'}
        >
          <ArrowLeft size={18} strokeWidth={1.5} className="rtl:rotate-180" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {t.nav.transactions}
          </h1>
        </div>
      </div>

      {/* Search & Filter Trigger Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={18} strokeWidth={1.5} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder={t.transactions.searchPlaceholder}
            className="w-full ps-10 pe-9 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-xs"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Filter Trigger Button */}
        <button
          type="button"
          onClick={() => setIsFilterSheetOpen(true)}
          className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
            activeFilterCount > 0
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
              : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
          title={t.transactions.filter}
        >
          <SlidersHorizontal size={16} strokeWidth={1.5} />
          {activeFilterCount > 0 && (
            <span className="ms-0.5 px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[11px] font-bold">
              {formatNum(activeFilterCount)}
            </span>
          )}
        </button>
      </div>

      {/* 1-Tap Quick Period & Type Pills (Styled like InsightsScreen timeline pills) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {/* Reset All */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            resetFilters();
          }}
          className={`py-1.5 px-3 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center justify-center gap-1 ${
            isAllPeriodActive && filters.type === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800/60'
          }`}
        >
          {t.transactions.all}
        </button>

        {/* Today */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setFilters(prev => ({
              ...prev,
              startDate: isTodayActive ? '' : todayStr,
              endDate: isTodayActive ? '' : todayStr,
            }));
          }}
          className={`py-1.5 px-3 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center justify-center gap-1 ${
            isTodayActive
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800/60'
          }`}
        >
          {t.transactions.today}
        </button>

        {/* This Week */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setFilters(prev => ({
              ...prev,
              startDate: isWeekActive ? '' : weekStartStr,
              endDate: isWeekActive ? '' : todayStr,
            }));
          }}
          className={`py-1.5 px-3 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center justify-center gap-1 ${
            isWeekActive
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800/60'
          }`}
        >
          {language === 'ar' ? 'هذا الأسبوع' : 'This Week'}
        </button>

        {/* This Month */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setFilters(prev => ({
              ...prev,
              startDate: isMonthActive ? '' : monthStartStr,
              endDate: isMonthActive ? '' : monthEndStr,
            }));
          }}
          className={`py-1.5 px-3 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center justify-center gap-1 ${
            isMonthActive
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800/60'
          }`}
        >
          {language === 'ar' ? 'هذا الشهر' : 'This Month'}
        </button>

        <div className="h-4 w-px bg-slate-200 dark:border-slate-800 shrink-0 mx-0.5" />

        {/* Expense */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setFilters(prev => ({ ...prev, type: prev.type === 'expense' ? 'all' : 'expense' }));
          }}
          className={`py-1.5 px-3 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center justify-center gap-1 ${
            filters.type === 'expense'
              ? 'bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800/60'
          }`}
        >
          {t.transactions.expenses}
        </button>

        {/* Income */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setFilters(prev => ({ ...prev, type: prev.type === 'income' ? 'all' : 'income' }));
          }}
          className={`py-1.5 px-3 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center justify-center gap-1 ${
            filters.type === 'income'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800/60'
          }`}
        >
          {t.transactions.income}
        </button>

        {/* Transfer */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setFilters(prev => ({ ...prev, type: prev.type === 'transfer' ? 'all' : 'transfer' }));
          }}
          className={`py-1.5 px-3 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center justify-center gap-1 ${
            filters.type === 'transfer'
              ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800/60'
          }`}
        >
          {t.transactions.transfers}
        </button>
      </div>

      {/* Active Filter Bar Indicator with Clear All & Total Amount */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between p-3 px-4 rounded-2xl sm:rounded-3xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 animate-in fade-in">
          <div className="flex items-center gap-2 truncate text-xs">
            <span className="font-semibold">{language === 'ar' ? 'نتائج الفلترة:' : 'Filtered results:'}</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">{formatNum(filteredExpenses.length)} {language === 'ar' ? 'معاملة' : 'txns'}</span>
            <span className="text-blue-400 dark:text-blue-600">·</span>
            <span className="font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(
                filteredExpenses.reduce((sum, exp) => exp.type === 'expense' ? addMoney(sum, exp.amount) : sum, 0),
                settings.currency,
                language,
                isPrivacyMode,
                numberFormat
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-xs shrink-0 ms-2"
          >
            <RotateCcw size={13} strokeWidth={1.5} />
            <span>{t.transactions.clearFilters}</span>
          </button>
        </div>
      )}

      {/* Grouped Transactions List */}
      {groupedTransactions.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {t.transactions.noTransactionsFound}
          </h2>
          {hasActiveFilters && (
            <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1 font-medium max-w-xs mx-auto">
              {t.transactions.noMatchingFilters}
            </p>
          )}
          <div className="pt-2 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => hasActiveFilters ? resetFilters() : openAddExpense()}
              className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <span>{hasActiveFilters ? t.transactions.clearFilters : t.nav.addExpense}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedGroups.map(group => (
            <div key={group.date} className="space-y-2">
              {/* Date Group Header with Daily Total */}
              <div className="flex items-center justify-between px-2 text-sm">
                <span className="font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {group.displayLabel}
                </span>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <span>{formatNum(group.items.length)} {group.items.length === 1 ? (language === 'ar' ? 'معاملة' : 'item') : (language === 'ar' ? 'معاملات' : 'items')}</span>
                  {group.total > 0 && (
                    <>
                      <span>·</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(group.total, settings.currency, language, isPrivacyMode, numberFormat)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Transactions in Date Group with Swipe Gestures */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs overflow-hidden">
                {group.items.map(exp => {
                  const cat = categoryMap.get(exp.categoryId);
                  const fromAcc = accounts.find(a => a.id === (exp.fromAccountId || exp.accountId));
                  const toAcc = accounts.find(a => a.id === exp.toAccountId);

                  return (
                    <SwipeableTransactionItem
                      key={exp.id}
                      expense={exp}
                      category={cat}
                      fromAccount={fromAcc}
                      toAccount={toAcc}
                      currency={settings.currency}
                      language={language}
                      numberFormat={numberFormat}
                      isPrivacyMode={isPrivacyMode}
                      onClick={() => {
                        setEditingExpense(exp);
                        openAddExpense();
                      }}
                      onEdit={() => {
                        setEditingExpense(exp);
                        openAddExpense();
                      }}
                      onDelete={() => removeExpense(exp.id)}
                      onDuplicate={() => duplicateExpense(exp)}
                      transferLabel={t.home.transfer}
                      editLabel={language === 'ar' ? 'تعديل' : 'Edit'}
                      deleteLabel={language === 'ar' ? 'حذف' : 'Delete'}
                      duplicateLabel={language === 'ar' ? 'تكرار' : 'Duplicate'}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load More Button for Progressive List Expansion */}
          {hasMoreGroups && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setVisibleGroupCount(prev => prev + 20);
                }}
                className="w-full py-2.5 px-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800/80 rounded-full text-xs font-bold text-blue-600 dark:text-blue-400 transition-all cursor-pointer shadow-xs active:scale-98"
              >
                {language === 'ar'
                  ? `عرض المزيد من الأيام (${formatNum(groupedTransactions.length - visibleGroupCount)} إضافية)`
                  : `Load more days (${formatNum(groupedTransactions.length - visibleGroupCount)} more)`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
      />
    </div>
  );
};
