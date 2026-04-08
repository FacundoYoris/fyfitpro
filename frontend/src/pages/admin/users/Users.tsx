import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import userService from '../../../services/userService';
import { User } from '../../../types';
import './Users.css';

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

const UsersIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const LightningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const statusFilters = [
  { label: 'Todos', value: '' },
  { label: 'Activos', value: 'active' },
  { label: 'Inactivos', value: 'inactive' },
];

type CreateUserForm = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dni: string;
  password: string;
  role: 'user' | 'admin';
};

const initialCreateForm: CreateUserForm = {
  username: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dni: '',
  password: '',
  role: 'user',
};

export const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserForm>(initialCreateForm);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [page, search, status]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getUsers(page, 10, search, status);
      if (response.success && response.data) {
        setUsers(response.data.users);
        setTotal(response.data.total);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('No pudimos cargar los usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 2500);
  };

  const handleSearchSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleStatusFilter = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const openStatusModal = (user: User) => {
    setActionUser(user);
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setActionUser(null);
    setProcessingStatus(false);
  };

  const confirmStatusChange = async () => {
    if (!actionUser) return;
    const currentlyActive = actionUser.isActive;
    setProcessingStatus(true);
    try {
      await userService.toggleUserStatus(actionUser.id);
      showToast(currentlyActive ? 'Usuario desactivado' : 'Usuario activado');
      closeStatusModal();
      await loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      showToast('No se pudo actualizar el estado', 'error');
      setProcessingStatus(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 10));

  const resetCreateForm = () => {
    setCreateForm(initialCreateForm);
    setCreatingUser(false);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetCreateForm();
  };

  const handleCreateUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!createForm.username.trim() || !createForm.firstName.trim() || !createForm.lastName.trim() || !createForm.password.trim()) {
      showToast('Completá los campos obligatorios', 'error');
      return;
    }

    setCreatingUser(true);
    try {
      const payload = {
        username: createForm.username.trim(),
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        email: createForm.email.trim() || undefined,
        password: createForm.password.trim(),
        phone: createForm.phone.trim() || undefined,
        dni: createForm.dni.trim() || undefined,
        role: createForm.role,
      };

      const response = await userService.createUser(payload);
      if (!response.success) {
        showToast(response.message || 'No se pudo crear el usuario', 'error');
        setCreatingUser(false);
        return;
      }

      showToast('Usuario creado correctamente');
      closeCreateModal();
      await loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      showToast(error.response?.data?.message || 'No se pudo crear el usuario', 'error');
      setCreatingUser(false);
    }
  };

  const stats = useMemo(() => {
    const activeCount = users.filter((user) => user.isActive).length;
    const inactiveCount = users.filter((user) => !user.isActive).length;
    return [
      { label: 'Usuarios totales', value: total.toString(), accent: 'cyan' },
      { label: 'Activos en vista', value: activeCount.toString(), accent: 'emerald' },
      { label: 'Inactivos en vista', value: inactiveCount.toString(), accent: 'rose' },
    ];
  }, [users, total]);

  const formatJoinDate = (date: string) => {
    const parsed = new Date(date);
    return parsed.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderSkeleton = () => (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={`skeleton-${index}`} className="user-card skeleton">
          <div className="skeleton-line avatar"></div>
          <div className="skeleton-line title"></div>
          <div className="skeleton-line subtitle"></div>
          <div className="skeleton-line meta"></div>
        </div>
      ))}
    </>
  );

  return (
    <div className="users-page">
      <div className="users-hero">
        <div>
          <p className="users-kicker">GESTIÓN DE MIEMBROS</p>
          <h1 className="users-title">Usuarios</h1>
          <p className="users-subtitle">Controla el estado de cada miembro con una interfaz oscura consistente con el resto del dashboard.</p>
        </div>
        <button type="button" className="btn-users-primary" onClick={() => setShowCreateModal(true)}>
          <UsersIcon /> Nuevo usuario
        </button>
      </div>

      <div className="users-stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className={`user-stat-card accent-${stat.accent}`}>
            <span className="stat-label">{stat.label}</span>
            <strong className="stat-value">{stat.value}</strong>
          </div>
        ))}
      </div>

      <form className="users-controls" onSubmit={handleSearchSubmit}>
        <div className="search-field">
          <SearchIcon />
          <input
            type="text"
            placeholder="Buscar por nombre, email o DNI"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          {search && (
            <button type="button" className="clear-search" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
              <CloseIcon />
            </button>
          )}
        </div>
        <div className="status-chips">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`chip ${status === filter.value ? 'active' : ''}`}
              onClick={() => handleStatusFilter(filter.value)}
            >
              <FilterIcon /> {filter.label}
            </button>
          ))}
        </div>
        <button type="submit" className="btn-users-primary ghost">
          Filtrar
        </button>
      </form>

      <div className="users-grid">
        {loading && renderSkeleton()}
        {!loading && users.length > 0 && (
          <>
            {users.map((user) => {
              const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`;
              return (
                <div key={user.id} className="user-card">
                  <div className="user-card-header">
                    <div className="user-avatar premium">{initials || '?'}</div>
                    <div>
                      <h3>{user.firstName} {user.lastName}</h3>
                      <span className="user-email">{user.email}</span>
                    </div>
                    <span className={`user-status ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="user-card-body">
                    <div>
                      <span className="meta-label">Teléfono</span>
                      <strong>{user.phone || 'Sin registrar'}</strong>
                    </div>
                    <div>
                      <span className="meta-label">DNI</span>
                      <strong>{user.dni || 'No informado'}</strong>
                    </div>
                    <div>
                      <span className="meta-label">Miembro desde</span>
                      <strong>{formatJoinDate(user.createdAt)}</strong>
                    </div>
                  </div>

                  <div className="user-card-footer">
                    <Link to={`/admin/users/${user.id}`} className="btn-ghost-user">
                      Ver perfil
                    </Link>
                    <button className={`btn-ghost-user ${user.isActive ? 'danger' : 'success'}`} type="button" onClick={() => openStatusModal(user)}>
                      <LightningIcon /> {user.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {!loading && users.length === 0 && (
        <div className="users-empty">
          <p>No se encontraron usuarios con los filtros actuales.</p>
          <button className="btn-users-primary" onClick={() => { setSearch(''); setSearchInput(''); setStatus(''); setPage(1); }}>
            Reiniciar filtros
          </button>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="users-pagination">
          <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
            Anterior
          </button>
          <span> Página {page} de {totalPages} </span>
          <button type="button" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page === totalPages}>
            Siguiente
          </button>
        </div>
      )}

      {showStatusModal && actionUser && (
        <div className="users-modal-overlay" onClick={closeStatusModal}>
          <div className="users-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={closeStatusModal}>
              <CloseIcon />
            </button>
            <h3>{actionUser.isActive ? 'Desactivar usuario' : 'Activar usuario'}</h3>
            <p>
              ¿Confirmás que querés {actionUser.isActive ? 'desactivar' : 'activar'} a <strong>{actionUser.firstName} {actionUser.lastName}</strong>? Podrás revertirlo cuando quieras.
            </p>
            <div className="modal-actions">
              <button className="btn-ghost-user" onClick={closeStatusModal} type="button">
                Cancelar
              </button>
              <button className={`btn-users-primary ${actionUser.isActive ? 'danger' : ''}`} onClick={confirmStatusChange} type="button" disabled={processingStatus}>
                {processingStatus ? 'Actualizando...' : actionUser.isActive ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="users-modal-overlay" onClick={closeCreateModal}>
          <div className="users-modal create-user-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={closeCreateModal}>
              <CloseIcon />
            </button>
            <div className="modal-header-content">
              <p className="modal-kicker">ALTA INSTANTÁNEA</p>
              <h3>Nuevo usuario</h3>
              <p className="modal-subtitle">Completa los datos básicos para sumar a un miembro o administrador. Podrás editarlo luego desde su perfil.</p>
            </div>
            <form className="create-user-form" onSubmit={handleCreateUser}>
              <div className="form-grid">
                <label className="form-field">
                  <span>Usuario *</span>
                  <input
                    type="text"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    placeholder="juanperez"
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Nombre *</span>
                  <input
                    type="text"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    placeholder="Juan"
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Apellido *</span>
                  <input
                    type="text"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    placeholder="Pérez"
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="usuario@fygym.com"
                  />
                </label>
                <label className="form-field">
                  <span>Contraseña *</span>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
                <label className="form-field">
                  <span>Teléfono</span>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="11 2345 6789"
                  />
                </label>
                <label className="form-field">
                  <span>DNI</span>
                  <input
                    type="text"
                    value={createForm.dni}
                    onChange={(e) => setCreateForm({ ...createForm, dni: e.target.value })}
                    placeholder="36.123.456"
                  />
                </label>
                <label className="form-field">
                  <span>Rol</span>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as 'user' | 'admin' })}
                  >
                    <option value="user">Miembro</option>
                    <option value="admin">Administrador</option>
                  </select>
                </label>
              </div>
              <div className="create-user-footer">
                <button type="button" className="btn-ghost-user" onClick={closeCreateModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-users-primary" disabled={creatingUser}>
                  {creatingUser ? 'Creando...' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast.show && <div className={`users-toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
};

export default Users;
