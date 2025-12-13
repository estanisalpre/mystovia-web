import { useState, useEffect } from 'react';
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-400">{error}</p>
        <button
          onClick={loadAccountDetails}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (!accountDetails) return null;

  const status = getAccountStatus(accountDetails.premdays);

  return (
    <>
      <div className="max-w-2xl mx-auto">
        {/* Account Info Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">{t('account.accountInfo')}</h2>
          </div>

          <div className="divide-y divide-gray-700">
            {/* Email */}
            <div className="flex items-center justify-between p-4 hover:bg-gray-700/50 transition">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">{t('account.currentEmail')}</span>
              </div>
              <span className="text-white font-medium">{accountDetails.email}</span>
            </div>

            {/* Created At */}
            <div className="flex items-center justify-between p-4 hover:bg-gray-700/50 transition">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">{t('account.createdAt')}</span>
              </div>
              <span className="text-white font-medium">{formatDate(accountDetails.createdAt)}</span>
            </div>

            {/* Last Login */}
            <div className="flex items-center justify-between p-4 hover:bg-gray-700/50 transition">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">{t('account.lastLogin')}</span>
              </div>
              <span className="text-white font-medium">{formatDate(accountDetails.lastLogin)}</span>
            </div>

            {/* Account Status */}
            <div className="flex items-center justify-between p-4 hover:bg-gray-700/50 transition">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">{t('account.accountStatus')}</span>
              </div>
              <div className="text-right">
                <span className={`font-medium ${status.isPremium ? 'text-yellow-500' : 'text-gray-300'}`}>
                  {status.label}
                </span>
                {status.days && (
                  <p className="text-sm text-gray-400">{status.days}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            <Key className="w-5 h-5" />
            {t('account.changePassword')}
          </button>

          <button
            onClick={() => setShowEmailModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
          >
            <AtSign className="w-5 h-5" />
            {t('account.changeEmail')}
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSuccess={() => {
            setShowPasswordModal(false);
          }}
        />
      )}

      {/* Change Email Modal */}
      {showEmailModal && (
        <ChangeEmailModal
          onClose={() => setShowEmailModal(false)}
          onSuccess={() => {
            setShowEmailModal(false);
            loadAccountDetails();
          }}
        />
      )}
    </>
  );
}

function ChangePasswordModal({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose}></div>

      <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-500" />
            {t('account.changePassword')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <p className="text-green-400 font-semibold">{t('account.passwordChanged')}</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('account.currentPassword')}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('account.newPassword')}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('account.confirmNewPassword')}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t('account.changePassword')
                )}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

function ChangeEmailModal({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose}></div>

      <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AtSign className="w-5 h-5 text-purple-500" />
            {t('account.changeEmail')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <p className="text-green-400 font-semibold">{t('account.emailChanged')}</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('account.newEmail')}
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="nuevo@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('account.currentPassword')}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t('account.changeEmail')
                )}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
