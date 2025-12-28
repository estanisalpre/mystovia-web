import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Calendar, Clock, Crown, Key, AtSign, X, AlertCircle, Check, Loader2 } from 'lucide-react';
import { getAccountDetails, changePassword, changeEmail } from '../../utils/api';
import '../../i18n';

interface AccountDetails {
  email: string;
  createdAt: string;
  lastLogin: string;
  premdays: number;
}

export default function AccountManagement() {
  const { t } = useTranslation();
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    loadAccountDetails();
  }, []);

  const loadAccountDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getAccountDetails();

      if (result.success && result.data) {
        setAccountDetails(result.data);
      } else {
        setError(result.error || t('account.errorLoading'));
      }
    } catch (err) {
      setError(t('account.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAccountStatus = (premdays: number) => {
    if (premdays > 0) {
      return {
        label: t('account.premiumAccount'),
        days: `${premdays} ${t('account.daysRemaining')}`,
        isPremium: true
      };
    }
    return {
      label: t('account.freeAccount'),
      days: '',
      isPremium: false
    };
  };

  if (loading) {
    return (
      <section className="flex items-center justify-center py-20" aria-busy="true" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" aria-hidden="true" />
        <span className="sr-only">Cargando...</span>
      </section>
    );
  }

  if (error) {
    return (
      <aside className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-center" role="alert">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" aria-hidden="true" />
        <p className="text-red-400">{error}</p>
        <button
          onClick={loadAccountDetails}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          type="button"
        >
          {t('common.retry')}
        </button>
      </aside>
    );
  }

  if (!accountDetails) return null;

  const status = getAccountStatus(accountDetails.premdays);

  return (
    <>
      <article className="max-w-2xl mx-auto">
        {/* Account Info Table */}
        <section className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mb-8">
          <header className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">{t('account.accountInfo')}</h2>
          </header>

          <dl className="divide-y divide-gray-700">
            {/* Email */}
            <div className="flex items-center justify-between p-4 hover:bg-gray-700/50 transition">
              <dt className="flex items-center gap-3 text-gray-400">
                <Mail className="w-5 h-5" aria-hidden="true" />
                {t('account.currentEmail')}
              </dt>
              <dd className="text-white font-medium m-0">{accountDetails.email}</dd>
            </div>

            {/* Created At */}
            <div className="flex items-center justify-between p-4 hover:bg-gray-700/50 transition">
              <dt className="flex items-center gap-3 text-gray-400">
                <Calendar className="w-5 h-5" aria-hidden="true" />
                {t('account.createdAt')}
              </dt>
              <dd className="text-white font-medium m-0">
                <time dateTime={accountDetails.createdAt}>{formatDate(accountDetails.createdAt)}</time>
              </dd>
            </div>

            {/* Last Login */}
            <div className="flex items-center justify-between p-4 hover:bg-gray-700/50 transition">
              <dt className="flex items-center gap-3 text-gray-400">
                <Clock className="w-5 h-5" aria-hidden="true" />
                {t('account.lastLogin')}
              </dt>
              <dd className="text-white font-medium m-0">
                <time dateTime={accountDetails.lastLogin}>{formatDate(accountDetails.lastLogin)}</time>
              </dd>
            </div>

            {/* Account Status */}
            <div className="flex items-center justify-between p-4 hover:bg-gray-700/50 transition">
              <dt className="flex items-center gap-3 text-gray-400">
                <Crown className="w-5 h-5" aria-hidden="true" />
                {t('account.accountStatus')}
              </dt>
              <dd className="text-right m-0">
                <span className={`font-medium ${status.isPremium ? 'text-yellow-500' : 'text-gray-300'}`}>
                  {status.label}
                </span>
                {status.days && (
                  <p className="text-sm text-gray-400 m-0">{status.days}</p>
                )}
              </dd>
            </div>
          </dl>
        </section>

        {/* Action Buttons */}
        <nav className="flex flex-col sm:flex-row gap-4" aria-label="Acciones de cuenta">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            type="button"
          >
            <Key className="w-5 h-5" aria-hidden="true" />
            {t('account.changePassword')}
          </button>

          <button
            onClick={() => setShowEmailModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
            type="button"
          >
            <AtSign className="w-5 h-5" aria-hidden="true" />
            {t('account.changeEmail')}
          </button>
        </nav>
      </article>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          setShowPasswordModal(false);
        }}
      />

      {/* Change Email Modal */}
      <ChangeEmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSuccess={() => {
          setShowEmailModal(false);
          loadAccountDetails();
        }}
      />
    </>
  );
}

function ChangePasswordModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError(t('account.passwordsDontMatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('account.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      const result = await changePassword(currentPassword, newPassword);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError(result.error || t('account.errorChangingPassword'));
      }
    } catch (err) {
      setError(t('account.errorChangingPassword'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 m-auto w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-0 backdrop:bg-black/70"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      aria-labelledby="change-password-title"
    >
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-gray-700">
        <h2 id="change-password-title" className="text-xl font-bold text-white flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-500" aria-hidden="true" />
          {t('account.changePassword')}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition"
          type="button"
          aria-label="Cerrar"
        >
          <X className="w-6 h-6" aria-hidden="true" />
        </button>
      </header>

      {/* Content */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {success ? (
          <section className="text-center py-8">
            <figure className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" aria-hidden="true" />
            </figure>
            <p className="text-green-400 font-semibold">{t('account.passwordChanged')}</p>
          </section>
        ) : (
          <>
            <label className="block">
              <span className="block text-sm font-medium text-gray-300 mb-2">
                {t('account.currentPassword')}
              </span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
                autoComplete="current-password"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-300 mb-2">
                {t('account.newPassword')}
              </span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-300 mb-2">
                {t('account.confirmNewPassword')}
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
                autoComplete="new-password"
              />
            </label>

            {error && (
              <aside className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2" role="alert">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-red-400 text-sm">{error}</p>
              </aside>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              ) : (
                t('account.changePassword')
              )}
            </button>
          </>
        )}
      </form>
    </dialog>
  );
}

function ChangeEmailModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
      setNewEmail('');
      setCurrentPassword('');
      setError('');
      setSuccess(false);
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newEmail.includes('@')) {
      setError(t('account.invalidEmail'));
      return;
    }

    setLoading(true);

    try {
      const result = await changeEmail(newEmail, currentPassword);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError(result.error || t('account.errorChangingEmail'));
      }
    } catch (err) {
      setError(t('account.errorChangingEmail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 m-auto w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-0 backdrop:bg-black/70"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      aria-labelledby="change-email-title"
    >
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-gray-700">
        <h2 id="change-email-title" className="text-xl font-bold text-white flex items-center gap-2">
          <AtSign className="w-5 h-5 text-purple-500" aria-hidden="true" />
          {t('account.changeEmail')}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition"
          type="button"
          aria-label="Cerrar"
        >
          <X className="w-6 h-6" aria-hidden="true" />
        </button>
      </header>

      {/* Content */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {success ? (
          <section className="text-center py-8">
            <figure className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" aria-hidden="true" />
            </figure>
            <p className="text-green-400 font-semibold">{t('account.emailChanged')}</p>
          </section>
        ) : (
          <>
            <label className="block">
              <span className="block text-sm font-medium text-gray-300 mb-2">
                {t('account.newEmail')}
              </span>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="nuevo@email.com"
                required
                autoComplete="email"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-300 mb-2">
                {t('account.currentPassword')}
              </span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                required
                autoComplete="current-password"
              />
            </label>

            {error && (
              <aside className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2" role="alert">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-red-400 text-sm">{error}</p>
              </aside>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              ) : (
                t('account.changeEmail')
              )}
            </button>
          </>
        )}
      </form>
    </dialog>
  );
}
