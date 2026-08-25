import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  X,
  AlertTriangle,
  Clock,
  Check,
} from 'lucide-react';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';

const REPORT_STATUSES = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending Review' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'DISMISSED', label: 'Dismissed' },
];

const ITEM_TYPES = [
  { value: 'ALL', label: 'All Item Types' },
  { value: 'STYLE', label: 'Fashion Style' },
  { value: 'BRAND', label: 'Brand' },
  { value: 'USER', label: 'User Account' },
  { value: 'OUTFIT', label: 'Outfit' },
  { value: 'COMMENT', label: 'Community Comment' },
  { value: 'OTHER', label: 'Other' },
];

function ModerationQueue() {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [detailModal, setDetailModal] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { type: 'resolve'|'dismiss', report }
  const [actionNotes, setActionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const limit = 20;

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.reports({
        page,
        limit,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        reportedItemType: typeFilter !== 'ALL' ? typeFilter : undefined,
        search: search || undefined,
      });
      setReports(res.data?.reports || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to load moderation reports:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, search]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleAction = async () => {
    if (!actionModal) return;
    setProcessing(true);
    try {
      if (actionModal.type === 'resolve') {
        await api.admin.resolveReport(actionModal.report.id, actionNotes);
      } else {
        await api.admin.dismissReport(actionModal.report.id, actionNotes);
      }
      setActionModal(null);
      setActionNotes('');
      fetchReports();
    } catch (err) {
      alert(err.message || 'Failed to update report status');
    } finally {
      setProcessing(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="admin-badge admin-badge--red"><Clock size={11} /> Pending</span>;
      case 'RESOLVED':
        return <span className="admin-badge admin-badge--green"><Check size={11} /> Resolved</span>;
      case 'DISMISSED':
        return <span className="admin-badge admin-badge--gray"><X size={11} /> Dismissed</span>;
      default:
        return <span className="admin-badge admin-badge--gray">{status}</span>;
    }
  };

  return (
    <div>
      <div className="admin-module__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="admin-module__title">Moderation &amp; Reports</h1>
          <p className="admin-module__subtitle">Review flagged content, manage community reports, and enforce platform standards</p>
        </div>
        <button className="admin-btn admin-btn--secondary" onClick={fetchReports}>
          <RefreshCw size={14} /> Refresh Queue
        </button>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <form className="admin-toolbar__search" onSubmit={handleSearch}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input
              type="text"
              className="admin-form-input"
              placeholder="Search reports by reason, details, or user..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ paddingLeft: 36, paddingRight: searchInput ? 36 : 14 }}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setPage(1);
                }}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-tertiary)',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="Clear search"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </form>

        <select
          className="admin-form-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{ width: 'auto', minWidth: 160 }}
        >
          {REPORT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select
          className="admin-form-select"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          style={{ width: 'auto', minWidth: 160 }}
        >
          {ITEM_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <div className="admin-toolbar__actions">
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {total} report{total !== 1 ? 's' : ''} total
          </span>
        </div>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
          <Spinner size="lg" />
        </div>
      ) : reports.length === 0 ? (
        <div className="admin-panel">
          <div className="admin-panel__body">
            <div style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-4)' }}>
              <ShieldAlert size={48} strokeWidth={1.2} style={{ color: 'var(--color-text-tertiary)', opacity: 0.4, marginBottom: 'var(--space-4)' }} />
              <h3 style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)', marginBottom: 4 }}>
                {statusFilter !== 'ALL' || search ? 'No reports match your filters' : 'Moderation Queue Clear'}
              </h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                {statusFilter === 'PENDING'
                  ? 'All pending reports have been reviewed.'
                  : 'No user content reports require attention at this time.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="admin-data-table-wrap">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Target Item</th>
                <th>Reason</th>
                <th>Reporter</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 'var(--font-size-xs)' }}>
                    {new Date(report.createdAt).toLocaleDateString()}<br />
                    <span style={{ color: 'var(--color-text-tertiary)' }}>{new Date(report.createdAt).toLocaleTimeString()}</span>
                  </td>
                  <td>
                    <div>
                      <span className="admin-badge admin-badge--purple" style={{ marginRight: 6 }}>
                        {report.reportedItemType}
                      </span>
                      <strong>{report.reportedItemName || report.reportedItemId}</strong>
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600 }}>{report.reason}</span>
                    </div>
                  </td>
                  <td>
                    {report.reporter ? (
                      <div style={{ fontSize: 'var(--font-size-xs)' }}>
                        <div>{report.reporter.firstName} {report.reporter.lastName}</div>
                        <div style={{ color: 'var(--color-text-tertiary)' }}>{report.reporter.email}</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--color-text-tertiary)' }}>Anonymous</span>
                    )}
                  </td>
                  <td>{getStatusBadge(report.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <button
                        className="admin-action-btn"
                        onClick={() => setDetailModal(report)}
                        title="View report details"
                      >
                        <Eye size={15} />
                      </button>
                      {report.status === 'PENDING' && (
                        <>
                          <button
                            className="admin-action-btn"
                            onClick={() => {
                              setActionModal({ type: 'resolve', report });
                              setActionNotes('');
                            }}
                            title="Resolve report"
                            style={{ color: 'var(--color-success)' }}
                          >
                            <CheckCircle size={15} />
                          </button>
                          <button
                            className="admin-action-btn"
                            onClick={() => {
                              setActionModal({ type: 'dismiss', report });
                              setActionNotes('');
                            }}
                            title="Dismiss report"
                            style={{ color: 'var(--color-text-tertiary)' }}
                          >
                            <XCircle size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <span>Page {page} of {totalPages}</span>
              <div className="admin-pagination__buttons">
                <button
                  className="admin-pagination__btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Prev
                </button>
                <button
                  className="admin-pagination__btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {detailModal && (
        <div className="admin-modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">Report Details</h3>
              <button className="admin-modal__close" onClick={() => setDetailModal(null)}><X size={18} /></button>
            </div>
            <div className="admin-modal__body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <span className="admin-badge admin-badge--purple">{detailModal.reportedItemType}</span>
                {getStatusBadge(detailModal.status)}
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Reported Entity</label>
                <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}>
                  <strong>{detailModal.reportedItemName || detailModal.reportedItemId}</strong>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>ID: {detailModal.reportedItemId}</div>
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Report Reason</label>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{detailModal.reason}</div>
              </div>

              {detailModal.details && (
                <div className="admin-form-group">
                  <label className="admin-form-label">Additional Context / Details</label>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {detailModal.details}
                  </p>
                </div>
              )}

              <div className="admin-form-group">
                <label className="admin-form-label">Reporter</label>
                <div style={{ fontSize: 'var(--font-size-sm)' }}>
                  {detailModal.reporter ? `${detailModal.reporter.firstName} ${detailModal.reporter.lastName} (${detailModal.reporter.email})` : 'Anonymous'}
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                  Filed on {new Date(detailModal.createdAt).toLocaleString()}
                </div>
              </div>

              {detailModal.resolvedAt && (
                <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    Resolution Notes
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                    {detailModal.resolutionNotes || 'No notes provided.'}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                    Handled by {detailModal.resolvedBy ? `${detailModal.resolvedBy.firstName} (${detailModal.resolvedBy.email})` : 'System'} on {new Date(detailModal.resolvedAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setDetailModal(null)}>Close</button>
              {detailModal.status === 'PENDING' && (
                <>
                  <button
                    className="admin-btn admin-btn--secondary"
                    onClick={() => {
                      setActionModal({ type: 'dismiss', report: detailModal });
                      setDetailModal(null);
                    }}
                  >
                    Dismiss
                  </button>
                  <button
                    className="admin-btn admin-btn--primary"
                    onClick={() => {
                      setActionModal({ type: 'resolve', report: detailModal });
                      setDetailModal(null);
                    }}
                  >
                    Resolve Report
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Modal (Resolve / Dismiss) */}
      {actionModal && (
        <div className="admin-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">
                {actionModal.type === 'resolve' ? 'Resolve Report' : 'Dismiss Report'}
              </h3>
              <button className="admin-modal__close" onClick={() => setActionModal(null)}><X size={18} /></button>
            </div>
            <div className="admin-modal__body">
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                {actionModal.type === 'resolve'
                  ? `Marking report for "${actionModal.report.reportedItemName || actionModal.report.reportedItemType}" as resolved. This will record your resolution in the audit trail.`
                  : `Dismissing report for "${actionModal.report.reportedItemName || actionModal.report.reportedItemType}" as non-violating or duplicate.`}
              </p>

              <div className="admin-form-group">
                <label className="admin-form-label">Resolution Notes</label>
                <textarea
                  className="admin-form-textarea"
                  placeholder={actionModal.type === 'resolve' ? 'Explain actions taken (e.g. Content updated, warning issued)...' : 'Reason for dismissal...'}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setActionModal(null)}>Cancel</button>
              <button
                className={`admin-btn ${actionModal.type === 'resolve' ? 'admin-btn--primary' : 'admin-btn--secondary'}`}
                onClick={handleAction}
                disabled={processing}
              >
                {processing ? 'Processing...' : (actionModal.type === 'resolve' ? 'Confirm Resolution' : 'Confirm Dismissal')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModerationQueue;
