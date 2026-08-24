import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  ChevronDown,
  ChevronUp,
  Shield,
  Eye,
  X,
  Target,
  Shirt,
  Layers,
  ListChecks,
  BookOpen,
  Feather,
  Ban,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [loading, setLoading] = useState(true);

  const [updatingId, setUpdatingId] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'role'|'status', user, action }

  const limit = 15;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.users({
        page,
        limit,
        search: search || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        sort,
        order,
      });
      setUsers(res.data?.users || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter, sort, order]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleSort = (col) => {
    if (sort === col) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(col);
      setOrder('asc');
    }
    setPage(1);
  };

  const executeConfirmAction = async () => {
    if (!confirmModal) return;
    const { type, user } = confirmModal;
    setUpdatingId(user.id);
    setConfirmModal(null);

    try {
      if (type === 'role') {
        const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
        await api.admin.updateRole(user.id, newRole);
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
      } else if (type === 'status') {
        const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
        await api.admin.updateStatus(user.id, newStatus);
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)));
      }
    } catch (err) {
      alert(err.message || 'Failed to update user');
    } finally {
      setUpdatingId(null);
    }
  };

  const openDetail = async (userId) => {
    setDetailLoading(true);
    setDetailUser(null);
    try {
      const res = await api.admin.userDetail(userId);
      setDetailUser(res.data);
    } catch (err) {
      alert(err.message || 'Failed to load user profile');
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const SortIcon = ({ col }) => {
    if (sort !== col) return null;
    return order === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  return (
    <div>
      <div className="admin-module__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="admin-module__title">User Management</h1>
          <p className="admin-module__subtitle">Manage platform accounts, security permissions, and account statuses</p>
        </div>
        <button className="admin-btn admin-btn--secondary" onClick={fetchUsers}>
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
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
        </form>

        <select
          className="admin-form-select"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          style={{ width: 'auto', minWidth: 140 }}
        >
          <option value="ALL">All Roles</option>
          <option value="USER">Standard User</option>
          <option value="ADMIN">Administrator</option>
        </select>

        <select
          className="admin-form-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{ width: 'auto', minWidth: 140 }}
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>

        <div className="admin-toolbar__actions">
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {total} user{total !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
          <Spinner size="lg" />
        </div>
      ) : users.length === 0 ? (
        <div className="admin-panel">
          <div className="admin-panel__body">
            <div style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-4)' }}>
              <Users size={48} strokeWidth={1.2} style={{ color: 'var(--color-text-tertiary)', opacity: 0.4, marginBottom: 'var(--space-4)' }} />
              <h3 style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)', marginBottom: 4 }}>
                No users found
              </h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                Try adjusting your search query or filters.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="admin-data-table-wrap">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('firstName')} style={{ cursor: 'pointer' }}>
                  User <SortIcon col="firstName" />
                </th>
                <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                  Email <SortIcon col="email" />
                </th>
                <th>Provider</th>
                <th>Role</th>
                <th>Status</th>
                <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>
                  Joined <SortIcon col="createdAt" />
                </th>
                <th>Entities</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div className="admin-sidebar__avatar" style={{ width: 32, height: 32, fontSize: '11px' }}>
                        {u.firstName?.charAt(0) || 'U'}{u.lastName?.charAt(0) || ''}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {u.firstName} {u.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      {u.email}
                    </span>
                  </td>
                  <td>
                    <span className="admin-badge admin-badge--gray" style={{ fontSize: '10px' }}>
                      {u.provider || 'LOCAL'}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${u.role === 'ADMIN' ? 'admin-badge--red' : 'admin-badge--gray'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${u.status === 'SUSPENDED' ? 'admin-badge--red' : 'admin-badge--green'}`}>
                      {u.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <span className="admin-badge admin-badge--gold" title="Goals">
                        <Target size={10} /> {u._count?.goals || 0}
                      </span>
                      <span className="admin-badge admin-badge--purple" title="Wardrobe items">
                        <Shirt size={10} /> {u._count?.wardrobeItems || 0}
                      </span>
                      <span className="admin-badge admin-badge--blue" title="Outfits">
                        <Layers size={10} /> {u._count?.outfits || 0}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <button
                        className="admin-action-btn"
                        onClick={() => openDetail(u.id)}
                        title="View user details"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        className="admin-action-btn"
                        onClick={() => setConfirmModal({ type: 'role', user: u })}
                        disabled={updatingId === u.id}
                        title={u.role === 'ADMIN' ? 'Demote to Standard USER' : 'Promote to ADMIN'}
                      >
                        <Shield size={15} />
                      </button>
                      <button
                        className={`admin-action-btn ${u.status === 'SUSPENDED' ? '' : 'admin-action-btn--danger'}`}
                        onClick={() => setConfirmModal({ type: 'status', user: u })}
                        disabled={updatingId === u.id}
                        title={u.status === 'SUSPENDED' ? 'Reactivate account' : 'Suspend account'}
                      >
                        {u.status === 'SUSPENDED' ? <CheckCircle size={15} style={{ color: 'var(--color-success)' }} /> : <Ban size={15} />}
                      </button>
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

      {/* User Details Drawer / Modal */}
      {(detailUser || detailLoading) && (
        <div className="admin-modal-overlay" onClick={() => { setDetailUser(null); setDetailLoading(false); }}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">User Profile &amp; Activity</h3>
              <button className="admin-modal__close" onClick={() => { setDetailUser(null); setDetailLoading(false); }}>
                <X size={18} />
              </button>
            </div>
            <div className="admin-modal__body">
              {detailLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
                  <Spinner />
                </div>
              ) : detailUser && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                    <div className="admin-sidebar__avatar" style={{ width: 48, height: 48, fontSize: '18px' }}>
                      {detailUser.firstName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                        {detailUser.firstName} {detailUser.lastName}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                        {detailUser.email}
                      </div>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                      <span className="admin-badge admin-badge--gold" style={{ fontSize: '10px' }}>
                        {detailUser.provider || 'LOCAL'}
                      </span>
                      <span className={`admin-badge ${detailUser.role === 'ADMIN' ? 'admin-badge--red' : 'admin-badge--gray'}`}>
                        {detailUser.role}
                      </span>
                      <span className={`admin-badge ${detailUser.status === 'SUSPENDED' ? 'admin-badge--red' : 'admin-badge--green'}`}>
                        {detailUser.status || 'ACTIVE'}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)', border: '1px solid var(--color-border-light)' }}>
                    ID: {detailUser.id}
                  </div>

                  {detailUser.bio && (
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
                      {detailUser.bio}
                    </div>
                  )}

                  {/* Activity Matrix */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                    {[
                      { label: 'Goals', count: detailUser._count?.goals, Icon: Target },
                      { label: 'Tasks', count: detailUser._count?.tasks, Icon: ListChecks },
                      { label: 'Habits', count: detailUser._count?.habits, Icon: BookOpen },
                      { label: 'Wardrobe', count: detailUser._count?.wardrobeItems, Icon: Shirt },
                      { label: 'Outfits', count: detailUser._count?.outfits, Icon: Layers },
                      { label: 'Journal', count: detailUser._count?.journalEntries, Icon: Feather },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{
                          textAlign: 'center',
                          padding: 'var(--space-3)',
                          background: 'var(--color-bg-secondary)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border-light)',
                        }}
                      >
                        <item.Icon size={16} style={{ color: 'var(--color-accent-primary)', marginBottom: 4 }} />
                        <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>{item.count || 0}</div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-3)' }}>
                    Account created: {new Date(detailUser.createdAt).toLocaleString()} · Last modified: {new Date(detailUser.updatedAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setDetailUser(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="admin-modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">
                {confirmModal.type === 'role' ? 'Change User Role' : (confirmModal.user.status === 'SUSPENDED' ? 'Reactivate Account' : 'Suspend Account')}
              </h3>
              <button className="admin-modal__close" onClick={() => setConfirmModal(null)}><X size={18} /></button>
            </div>
            <div className="admin-modal__body">
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {confirmModal.type === 'role' ? (
                  confirmModal.user.role === 'ADMIN' ? (
                    <>Demote <strong style={{ color: 'var(--color-text-primary)' }}>{confirmModal.user.firstName} ({confirmModal.user.email})</strong> to a standard user? They will immediately lose access to all admin workspaces.</>
                  ) : (
                    <>Promote <strong style={{ color: 'var(--color-text-primary)' }}>{confirmModal.user.firstName} ({confirmModal.user.email})</strong> to Administrator? They will receive full access to all admin operations and database controls.</>
                  )
                ) : (
                  confirmModal.user.status === 'SUSPENDED' ? (
                    <>Reactivate the account for <strong style={{ color: 'var(--color-text-primary)' }}>{confirmModal.user.email}</strong>? They will be allowed to log in and use the platform again.</>
                  ) : (
                    <>Suspend <strong style={{ color: 'var(--color-text-primary)' }}>{confirmModal.user.email}</strong>? This user will be blocked from logging in until reactivated.</>
                  )
                )}
              </p>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setConfirmModal(null)}>
                Cancel
              </button>
              <button
                className={`admin-btn ${confirmModal.type === 'status' && confirmModal.user.status !== 'SUSPENDED' ? 'admin-btn--danger' : 'admin-btn--primary'}`}
                onClick={executeConfirmAction}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
