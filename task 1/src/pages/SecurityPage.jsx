import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Laptop,
  Smartphone,
  Tablet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Trash2,
  RefreshCw,
  LogOut,
  Info,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import api from '../utils/api';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import Button from '../components/common/Button';

export default function SecurityPage() {
  const [devices, setDevices] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState({ text: '', type: 'info' });

  // Show banner alert
  const showAlert = (text, type = 'info') => {
    setNotification({ text, type });
    setTimeout(() => setNotification({ text: '', type: 'info' }), 4000);
  };

  // Fetch security data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [devicesRes, historyRes] = await Promise.all([
        api.get('/security/devices'),
        api.get('/security/history'),
      ]);

      if (devicesRes.success) setDevices(devicesRes.devices || []);
      if (historyRes.success) setHistory(historyRes.history || []);
    } catch (err) {
      showAlert(err.message || 'Unable to load security history.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Revoke single device
  const handleRevokeDevice = async (deviceId, isCurrent) => {
    if (isCurrent && !window.confirm('Revoking your current device will require OTP verification next time. Continue?')) {
      return;
    }

    setActionLoading(true);
    try {
      await api.delete(`/security/devices/${deviceId}`);
      showAlert('Device access has been revoked.', 'success');
      await fetchData();
    } catch (err) {
      showAlert(err.message || 'Failed to revoke device.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Revoke all other devices
  const handleRevokeAllOther = async () => {
    if (!window.confirm('Are you sure you want to revoke all other trusted devices? They will need to verify via email OTP on next login.')) {
      return;
    }

    setActionLoading(true);
    try {
      await api.delete('/security/devices');
      showAlert('All other devices have been revoked.', 'success');
      await fetchData();
    } catch (err) {
      showAlert(err.message || 'Failed to revoke devices.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Device icon helper
  const renderDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-5 h-5 text-brand-400" />;
      case 'tablet':
        return <Tablet className="w-5 h-5 text-indigo-400" />;
      default:
        return <Laptop className="w-5 h-5 text-purple-400" />;
    }
  };

  // Status badge helper
  const renderStatusBadge = (status, revoked) => {
    if (revoked || status === 'REVOKED') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          Revoked
        </span>
      );
    }

    switch (status) {
      case 'SUCCESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            Success
          </span>
        );
      case 'OTP_REQUIRED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            OTP Verified
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-950 text-slate-100 selection:bg-brand-500/30">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-3">
              <Shield className="w-3.5 h-3.5" />
              <span>Security Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Device & Login Security
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Review active trusted devices, monitor login events, and revoke unauthorized sessions.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            iconLeft={RefreshCw}
            disabled={isLoading || actionLoading}
            onClick={fetchData}
            className="self-start sm:self-center"
          >
            Refresh
          </Button>
        </div>

        {/* Notification Banner */}
        {notification.text && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-xs sm:text-sm font-medium flex items-center gap-3 animate-fade-in ${
              notification.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
        )}

        <div className="space-y-10">
          {/* =========================================================================
              SECTION 1: TRUSTED DEVICES
             ========================================================================= */}
          <section className="bg-surface-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Trusted Devices</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                    {devices.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Devices that have completed email OTP verification and can sign in without a code.
                </p>
              </div>

              {devices.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  iconLeft={LogOut}
                  disabled={actionLoading}
                  onClick={handleRevokeAllOther}
                  className="text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                >
                  Revoke All Other Devices
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Loading trusted devices...
              </div>
            ) : devices.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-slate-800 rounded-2xl bg-surface-950/40 text-slate-400 text-xs">
                No trusted devices registered yet. Devices are added when you approve an email OTP.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {devices.map((device) => (
                  <div
                    key={device.deviceId || device.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      device.isCurrentDevice
                        ? 'bg-brand-600/5 border-brand-500/30 shadow-md'
                        : 'bg-surface-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface-800 border border-slate-700/80 flex items-center justify-center shrink-0">
                          {renderDeviceIcon(device.deviceType)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {device.browser}
                            </span>
                            {device.isCurrentDevice && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                                This Device
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 block mt-0.5">
                            {device.os} • IP: {device.ip}
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-1">
                            Last active: {new Date(device.lastUsedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRevokeDevice(device.deviceId, device.isCurrentDevice)}
                        disabled={actionLoading}
                        title="Revoke trusted access"
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* =========================================================================
              SECTION 2: LOGIN AUDIT HISTORY
             ========================================================================= */}
          <section className="bg-surface-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white">Recent Login Activity</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit log of recent sign-in attempts, device types, and network locations.
              </p>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Loading login history...
              </div>
            ) : history.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-slate-800 rounded-2xl bg-surface-950/40 text-slate-400 text-xs">
                No sign-in events recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 bg-surface-950/50">
                    <tr>
                      <th className="py-3 px-4 rounded-l-xl">Status</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Device & Browser</th>
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4 rounded-r-xl">Approx. Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {history.map((item) => (
                      <tr key={item._id} className="hover:bg-surface-800/30 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          {renderStatusBadge(item.status, item.sessionRevoked)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-300">
                          {new Date(item.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-semibold text-white block">
                            {item.browser || 'Unknown'}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            {item.os || 'Unknown OS'} ({item.deviceType || 'desktop'})
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-400">
                          {item.ipAddress || '127.0.0.1'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {item.location?.city || item.location?.country ? (
                            <span className="inline-flex items-center gap-1 text-slate-300">
                              <MapPin className="w-3.5 h-3.5 text-brand-400" />
                              {[item.location.city, item.location.country]
                                .filter(Boolean)
                                .join(', ')}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">
                              Local / Not Geocoded
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
