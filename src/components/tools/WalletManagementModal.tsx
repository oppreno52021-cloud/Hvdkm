import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Account, AccountType } from '../../types';
import { AccountIcon } from '../common/AccountIcon';
import { StyledIconSelector } from '../common/StyledIconSelector';
import { formatCurrency } from '../../utils/calculations';
import { getAccountDisplayName, getAccountTypeDisplayName } from '../../utils/i18n';
import { 
  X, 
  ArrowLeft,
  Plus, 
  Trash2, 
  Check, 
  Wallet, 
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../hooks/useBackHandler';
import { triggerHaptic } from '../../utils/haptics';

interface WalletManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WALLET_PRESETS = [
  { name: 'كاش', nameEn: 'Cash', type: 'cash' as AccountType, color: '#10B981', icon: 'Banknote' },
  { name: 'إنستاباي', nameEn: 'InstaPay', type: 'mobile_wallet' as AccountType, color: '#8B5CF6', icon: 'Smartphone' },
  { name: 'فودافون كاش', nameEn: 'Vodafone Cash', type: 'mobile_wallet' as AccountType, color: '#EF4444', icon: 'Smartphone' },
  { name: 'البنك الأهلي', nameEn: 'National Bank', type: 'bank' as AccountType, color: '#059669', icon: 'Landmark' },
  { name: 'بنك مصر', nameEn: 'Banque Misr', type: 'bank' as AccountType, color: '#D97706', icon: 'Landmark' },
  { name: 'CIB', nameEn: 'CIB', type: 'bank' as AccountType, color: '#2563EB', icon: 'Landmark' },
  { name: 'فيزا مشتريات', nameEn: 'Credit Card', type: 'credit_card' as AccountType, color: '#6366F1', icon: 'CreditCard' },
];

const WALLET_COLORS = [
  '#10B981', '#2563EB', '#8B5CF6', '#EF4444', 
  '#F59E0B', '#06B6D4', '#EC4899', '#64748B'
];

export const WalletManagementModal: React.FC<WalletManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { 
    accounts, 
    accountSummaries, 
    saveAccountItem, 
    deleteAccountItem, 
    settings, 
    updateSettings,
    language, 
    isPrivacyMode, 
    numberFormat,
    showToast 
  } = useApp();

  const isRTL = language === 'ar';
  const [isEditingOrAdding, setIsEditingOrAdding] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('cash');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [color, setColor] = useState('#10B981');
  const [icon, setIcon] = useState('Banknote');
  const [showOnHome, setShowOnHome] = useState(true);
  const [showAdvancedCustomize, setShowAdvancedCustomize] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

  useBodyScrollLock(isOpen);
  useBackHandler(isOpen, onClose, 'wallet-modal');
  useBackHandler(isEditingOrAdding, () => {
    setIsEditingOrAdding(false);
    setEditingAccount(null);
  }, 'wallet-edit');
  useBackHandler(Boolean(accountToDelete), () => setAccountToDelete(null), 'wallet-delete');

  if (!isOpen) return null;

  const handleStartAdd = () => {
    triggerHaptic('light');
    setEditingAccount(null);
    setName('');
    setType('cash');
    setOpeningBalance('0');
    setColor('#10B981');
    setIcon('Banknote');
    setShowOnHome(true);
    setShowAdvancedCustomize(false);
    setIsEditingOrAdding(true);
  };

  const handleStartEdit = (acc: Account) => {
    triggerHaptic('light');
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setOpeningBalance(acc.openingBalance.toString());
    setColor(acc.color || '#10B981');
    setIcon(acc.icon || 'Banknote');
    setShowOnHome(acc.showOnHome ?? true);
    setShowAdvancedCustomize(false);
    setIsEditingOrAdding(true);
  };

  const handleApplyPreset = (preset: typeof WALLET_PRESETS[0]) => {
    triggerHaptic('light');
    setName(language === 'ar' ? preset.name : preset.nameEn);
    setType(preset.type);
    setColor(preset.color);
    setIcon(preset.icon);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast(language === 'ar' ? 'يرجى إدخال اسم المحفظة' : 'Please enter wallet name');
      return;
    }
    const balance = parseFloat(openingBalance) || 0;
    triggerHaptic('success');

    try {
      if (editingAccount) {
        await saveAccountItem({
          ...editingAccount,
          name: name.trim(),
          type,
          openingBalance: balance,
          color,
          icon,
          showOnHome,
        });
        showToast(language === 'ar' ? 'تم تحديث المحفظة بنجاح' : 'Wallet updated successfully');
      } else {
        await saveAccountItem({
          id: `acc-${Date.now()}`,
          name: name.trim(),
          type,
          openingBalance: balance,
          currency: settings.currency,
          color,
          icon: icon || (type === 'cash' ? 'Banknote' : type === 'mobile_wallet' ? 'Smartphone' : 'Landmark'),
          isActive: true,
          isArchived: false,
          showOnHome,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        showToast(language === 'ar' ? 'تمت إضافة المحفظة بنجاح' : 'Wallet added successfully');
      }
      setIsEditingOrAdding(false);
      setEditingAccount(null);
    } catch {
      // Handled in context
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div 
        className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col border border-slate-200/90 dark:border-slate-800/80 shadow-2xl z-10 overflow-hidden"
        role="dialog"
      >
        {/* ========================================================================= */}
        {/* VIEW 1: MAIN WALLETS LIST (Calm, Serene, Clutter-Free)                     */}
        {/* ========================================================================= */}
        {!isEditingOrAdding ? (
          <>
            {/* Header */}
            <div className="p-4 px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-2xs shrink-0"
                  title={language === 'ar' ? 'رجوع' : 'Back'}
                >
                  <ArrowLeft size={16} className="rtl:rotate-180" />
                </button>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    {language === 'ar' ? 'المحافظ والحسابات' : 'Wallets & Accounts'}
                  </h2>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                    {language === 'ar' ? `${accounts.length} محافظ مسجلة` : `${accounts.length} active wallets`}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 sm:p-5 overflow-y-auto no-scrollbar space-y-4">
              {/* Clean Balance & Action Card */}
              <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#091124] via-[#0f1b38] to-[#16274e] text-white border border-blue-400/20 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    {language === 'ar' ? 'إجمالي رصيد كل المحافظ' : 'Total Net Worth'}
                  </span>
                  <button
                    type="button"
                    onClick={handleStartAdd}
                    className="px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                  >
                    <Plus size={14} strokeWidth={2} />
                    <span>{language === 'ar' ? 'إضافة محفظة' : 'Add Wallet'}</span>
                  </button>
                </div>

                <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-200 via-sky-300 to-blue-400 bg-clip-text text-transparent tracking-tight tabular-nums">
                  {formatCurrency(accountSummaries.totalNetWorth, settings.currency, language, isPrivacyMode, numberFormat)}
                </div>
              </div>

              {/* Wallets List Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ar' ? 'قائمة المحافظ (اضغط للتعديل)' : 'Your Wallets (Tap to edit)'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {accounts.length} {language === 'ar' ? 'محافظ' : 'wallets'}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs overflow-hidden">
                  {accountSummaries.summaries.map(s => {
                    const acc = s.account;
                    const isOwed = s.currentBalance < 0;
                    const accColor = acc.color || '#3B82F6';
                    const isHiddenOnHome = acc.showOnHome === false;

                    return (
                      <div
                        key={acc.id}
                        onClick={() => handleStartEdit(acc)}
                        className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer select-none group"
                      >
                        {/* Left: Icon, Name & Type */}
                        <div className="flex items-center gap-3 min-w-0 flex-1 pe-2">
                          <div 
                            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs"
                            style={{ backgroundColor: `${accColor}18`, color: accColor }}
                          >
                            <AccountIcon name={acc.icon || acc.type} color={accColor} size={18} strokeWidth={1.5} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate tracking-tight">
                                {getAccountDisplayName(acc.name, language)}
                              </span>
                              {isHiddenOnHome && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full shrink-0">
                                  <EyeOff size={10} />
                                  <span>{language === 'ar' ? 'مخفية' : 'Hidden'}</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5 font-medium">
                              {getAccountTypeDisplayName(acc.type, language)}
                            </span>
                          </div>
                        </div>

                        {/* Right: Balance & Chevron */}
                        <div className="text-end shrink-0 flex items-center gap-2">
                          <span className={`text-sm sm:text-base font-bold tracking-tight tabular-nums ${
                            isOwed ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                          }`}>
                            {formatCurrency(s.currentBalance, settings.currency, language, isPrivacyMode, numberFormat)}
                          </span>
                          <div className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors">
                            {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Master Toggle: Show Strip on Home Screen */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Eye size={16} strokeWidth={1.5} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                      {language === 'ar' ? 'شريط المحافظ في الرئيسية' : 'Home Wallets Strip'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                      {language === 'ar' ? 'إظهار المحافظ أعلى الشاشة الرئيسية' : 'Display wallets at top of home'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.showWalletsOnHome ?? true}
                  onClick={() => updateSettings({ showWalletsOnHome: !(settings.showWalletsOnHome ?? true) })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${(settings.showWalletsOnHome ?? true) ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${(settings.showWalletsOnHome ?? true) ? 'ltr:translate-x-4 rtl:-translate-x-4' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: DEDICATED ADD / EDIT SCREEN (Clean, Focused, Step-by-Step)        */
          /* ========================================================================= */
          <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-4 px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingOrAdding(false);
                    setEditingAccount(null);
                  }}
                  className="p-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-2xs shrink-0"
                  title={language === 'ar' ? 'رجوع للمحافظ' : 'Back to Wallets'}
                >
                  <ArrowLeft size={16} className="rtl:rotate-180" />
                </button>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    {editingAccount 
                      ? (language === 'ar' ? `تعديل "${getAccountDisplayName(editingAccount.name, language)}"` : `Edit "${editingAccount.name}"`)
                      : (language === 'ar' ? 'إضافة محفظة جديدة' : 'Add New Wallet')}
                  </h2>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                    {editingAccount 
                      ? (language === 'ar' ? 'تعديل البيانات والرصيد الافتتاحي' : 'Update details & opening balance')
                      : (language === 'ar' ? 'اختر نموذجاً سريعاً أو أدخل البيانات' : 'Pick a quick preset or type details')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsEditingOrAdding(false);
                  setEditingAccount(null);
                }}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-4 sm:p-5 overflow-y-auto no-scrollbar space-y-4">
              {/* 1-Tap Quick Presets Bar */}
              {!editingAccount && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles size={13} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'ar' ? 'نماذج جاهزة بنقرة واحدة:' : 'Quick 1-Tap Presets:'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {WALLET_PRESETS.map(preset => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className="py-1.5 px-3 rounded-full bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0 hover:border-blue-500 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                      >
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: preset.color }} 
                        />
                        <span>{language === 'ar' ? preset.name : preset.nameEn}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Wallet Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'ar' ? 'اسم المحفظة / الحساب' : 'Wallet Name'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: فودافون كاش، البنك الأهلي، كاش...' : 'e.g. Vodafone Cash, Cash...'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-900 dark:text-white"
                  required
                />
              </div>

              {/* Type and Opening Balance in 2-Columns */}
              <div className="grid grid-cols-2 gap-3">
                {/* Type */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    {language === 'ar' ? 'نوع المحفظة' : 'Wallet Type'}
                  </label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as AccountType)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:outline-hidden focus:border-blue-600 transition-all text-slate-900 dark:text-white"
                  >
                    <option value="cash">{language === 'ar' ? 'نقدي (كاش)' : 'Cash'}</option>
                    <option value="mobile_wallet">{language === 'ar' ? 'محفظة إلكترونية' : 'Mobile Wallet'}</option>
                    <option value="bank">{language === 'ar' ? 'حساب بنكي' : 'Bank Account'}</option>
                    <option value="credit_card">{language === 'ar' ? 'بطاقة ائتمان' : 'Credit Card'}</option>
                    <option value="savings">{language === 'ar' ? 'حساب توفير' : 'Savings'}</option>
                  </select>
                </div>

                {/* Opening Balance */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    {language === 'ar' ? 'الرصيد الافتتاحي' : 'Opening Balance'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={openingBalance}
                      onChange={e => setOpeningBalance(e.target.value)}
                      className="w-full ps-3 pe-12 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-bold focus:outline-hidden focus:border-blue-600 transition-all text-slate-900 dark:text-white tabular-nums"
                      placeholder="0"
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                      {settings.currency === 'EGP' ? (language === 'ar' ? 'ج.م' : 'EGP') : settings.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Show on Home Screen Toggle */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={15} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ar' ? 'إظهار في الشاشة الرئيسية' : 'Show on Home screen'}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showOnHome}
                  onClick={() => setShowOnHome(!showOnHome)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${showOnHome ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${showOnHome ? 'ltr:translate-x-4 rtl:-translate-x-4' : 'translate-x-0'}`}
                  />
                </button>
              </div>

              {/* Optional Customization: Color and Icon Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvancedCustomize(!showAdvancedCustomize)}
                  className="w-full py-2 px-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs" 
                      style={{ backgroundColor: color }} 
                    />
                    <span>{language === 'ar' ? 'تخصيص اللون والأيقونة' : 'Customize Color & Icon'}</span>
                  </div>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                    {showAdvancedCustomize ? (language === 'ar' ? 'إخفاء' : 'Hide') : (language === 'ar' ? 'تعديل' : 'Edit')}
                  </span>
                </button>

                {showAdvancedCustomize && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3 animate-in fade-in">
                    {/* Color Swatches */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                        {language === 'ar' ? 'لون المحفظة:' : 'Wallet Color:'}
                      </label>
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                        {WALLET_COLORS.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            style={{ backgroundColor: c }}
                            className={`w-7 h-7 rounded-full transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                              color === c ? 'ring-2 ring-offset-2 ring-blue-600 scale-110 shadow-xs' : 'opacity-80 hover:opacity-100'
                            }`}
                          >
                            {color === c && <Check size={13} className="text-white" strokeWidth={2.5} />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Icon Selector */}
                    <div className="pt-1">
                      <StyledIconSelector
                        targetType="account"
                        selectedIcon={icon}
                        onSelect={(ic) => setIcon(ic)}
                        language={language}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0">
              {editingAccount && (
                <button
                  type="button"
                  onClick={() => {
                    if (accounts.length <= 1) {
                      showToast(language === 'ar' ? 'لا يمكن حذف المحفظة الوحيدة المتبقية' : 'Cannot delete the only remaining wallet');
                      return;
                    }
                    setAccountToDelete(editingAccount);
                  }}
                  className="px-3.5 py-3 rounded-full border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0"
                  title={language === 'ar' ? 'حذف المحفظة' : 'Delete Wallet'}
                >
                  <Trash2 size={15} />
                  <span>{language === 'ar' ? 'حذف' : 'Delete'}</span>
                </button>
              )}

              <button
                type="submit"
                className="flex-1 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98"
              >
                {editingAccount 
                  ? (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes') 
                  : (language === 'ar' ? 'تأكيد إضافة المحفظة' : 'Confirm Add Wallet')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsEditingOrAdding(false);
                  setEditingAccount(null);
                }}
                className="px-4 py-3 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </form>
        )}

        {/* Delete Wallet Confirmation Sub-Dialog */}
        {accountToDelete && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3 text-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? `حذف محفظة "${getAccountDisplayName(accountToDelete.name, language)}"` : `Delete Wallet "${accountToDelete.name}"`}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {language === 'ar' 
                  ? 'هل أنت متأكد من رغبتك في حذف هذه المحفظة؟ سيتم تحويل المعاملات المرتبطة بها تلقائياً إلى المحفظة المتبقية.' 
                  : 'Are you sure you want to delete this wallet? Associated transactions will be reassigned to the remaining wallet.'}
              </p>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAccountToDelete(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-full cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = accountToDelete.id;
                    setAccountToDelete(null);
                    setIsEditingOrAdding(false);
                    setEditingAccount(null);
                    await deleteAccountItem(id);
                    showToast(language === 'ar' ? 'تم حذف المحفظة بنجاح' : 'Wallet deleted successfully');
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-full cursor-pointer shadow-xs"
                >
                  {language === 'ar' ? 'تأكيد الحذف' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
