import { useState, useEffect, useCallback } from 'react';
import {
  ScrollText, Search, Filter, RefreshCw, X,
} from 'lucide-react';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';

const ACTION_TYPES = ['CREATE', 'UPDATE', 'DELETE', 'ROLE_CHANGE', 'LOGIN', 'LOGOUT', 'REGISTER'];
const ENTITY_TYPES = ['User', 'FashionCategory', 'Style', 'Brand', 'Goal', 'Task', 'Outfit', 'WardrobeItem'];

function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 30;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.auditLog({
        page,
        limit,
        search: search || undefined,
        action: actionFilter || undefined,
        entity: entityFilter || undefined,
      });
      setLogs(res.data?.logs || res.data || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Audit log fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter, entityFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const clearFilters = () => {
    setSearch('');
    setSearchInput('');
    setActionFilter('');
    setEntityFilter('');
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);
  const hasFilters = search || actionFilter || entityFilter;

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'green';
      case 'UPDATE': return 'blue';
      case 'DELETE': return 'red';
      case 'ROLE_CHANGE': return 'purple';
      case 'LOGIN': return 'gold';
      case 'LOGOUT': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <div>
      <div className="admin-module__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="admin-module__title">Audit Log</h1>
          <p className="admin-module__subtitle">Security and access event trail</p>
        </div>
        <button onClick={fetchLogs} className="admin-action-btn" style={{ padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          <RefreshCw size={14} /> Refresh
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
              placeholder="Search audit log..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
        </form>
        <select className="admin-form-select" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }} style={{ width: 'auto', minWidth: 140 }}>
          <option value="">All Actions</option>
          {ACTION_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="admin-form-select" value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(1); }} style={{ width: 'auto', minWidth: 140 }}>
          <option value="">All Entities</option>
          {ENTITY_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        {hasFilters && (
          <button className="admin-action-btn" onClick={clearFilters} title="Clear filters">
            <X size={14} /> Clear
          </button>
        )}
        <div className="admin-toolbar__actions">
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {total} event{total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Log entries */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
      ) : logs.length === 0 ? (
        <div className="admin-panel">
          <div className="admin-panel__body">
            <div className="admin-empty">
              <ScrollText size={48} strokeWidth={1.2} style={{ opacity: 0.3, marginBottom: 'var(--space-4)' }} />
              <div className="admin-empty__title">No audit events found</div>
              <p className="admin-empty__text">{hasFilters ? 'Try adjusting your filters.' : 'Events will appear here as admin actions occur.'}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="admin-data-table-wrap">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Entity</th>
                <th>User</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 'var(--font-size-xs)' }}>
                    {new Date(log.createdAt).toLocaleDateString()}<br />
                    <span style={{ color: 'var(--color-text-tertiary)' }}>{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </td>
                  <td><span className={`admin-badge admin-badge--${getActionColor(log.action)}`}>{log.action}</span></td>
                  <td><span className="admin-badge admin-badge--gray">{log.entity}</span></td>
                  <td>
                    {log.user ? (
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>{log.user.firstName} {log.user.lastName}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>{log.user.email}</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--color-text-tertiary)' }}>System</span>
                    )}
                  </td>
                  <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--font-size-sm)' }}>
                    {log.details || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <span>Page {page} of {totalPages}</span>
              <div className="admin-pagination__buttons">
                <button className="admin-pagination__btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <button className="admin-pagination__btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AuditLog;
