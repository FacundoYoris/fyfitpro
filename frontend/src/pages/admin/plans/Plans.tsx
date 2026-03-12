import { useEffect, useState } from 'react';
import planService from '../../../services/planService';
import { Plan } from '../../../types';
import './Plans.css';

interface PlanFormState {
  name: string;
  description: string;
  price: string;
  durationDays: string;
  daysPerWeek: string;
  benefits: string;
}

const initialFormState: PlanFormState = {
  name: '',
  description: '',
  price: '',
  durationDays: '',
  daysPerWeek: '',
  benefits: '',
};

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L15.5 4.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const accentVariants = ['emerald', 'cyan', 'amber', 'violet'];

export const Plans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<PlanFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await planService.getPlans();
      if (response.success && response.data) {
        setPlans(response.data);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      showToast('No se pudieron cargar los planes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount);

  const openCreateModal = () => {
    setSelectedPlan(null);
    setFormData(initialFormState);
    setShowFormModal(true);
  };

  const openEditModal = (plan: Plan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      durationDays: plan.durationDays.toString(),
      daysPerWeek: plan.daysPerWeek ? plan.daysPerWeek.toString() : '',
      benefits: plan.benefits ? plan.benefits.split('|').filter(Boolean).join('\n') : '',
    });
    setShowFormModal(true);
  };

  const closeModals = () => {
    setShowFormModal(false);
    setShowDeleteModal(false);
    setSelectedPlan(null);
    setFormData(initialFormState);
  };

  const handleInputChange = (field: keyof PlanFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      showToast('El nombre es obligatorio', 'error');
      return;
    }

    const price = Number(formData.price);
    const duration = Number(formData.durationDays);

    if (!price || price <= 0) {
      showToast('Ingresa un precio válido', 'error');
      return;
    }

    if (!duration || duration <= 0) {
      showToast('Ingresa una duración válida', 'error');
      return;
    }

    const payload: Partial<Plan> = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      price,
      durationDays: duration,
      daysPerWeek: formData.daysPerWeek ? Number(formData.daysPerWeek) : undefined,
      benefits: formData.benefits
        ? formData.benefits
            .split('\n')
            .map((benefit) => benefit.trim())
            .filter(Boolean)
            .join('|')
        : undefined,
    };

    setIsSubmitting(true);

    try {
      if (selectedPlan) {
        await planService.updatePlan(selectedPlan.id, payload);
        showToast('Plan actualizado correctamente');
      } else {
        await planService.createPlan(payload);
        showToast('Plan creado correctamente');
      }

      await loadPlans();
      closeModals();
    } catch (error) {
      console.error('Error saving plan:', error);
      showToast('No se pudo guardar el plan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);
    try {
      await planService.deletePlan(selectedPlan.id);
      showToast('Plan eliminado');
      await loadPlans();
      closeModals();
    } catch (error) {
      console.error('Error deleting plan:', error);
      showToast('No se pudo eliminar el plan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="plans-page">
      <div className="plans-hero">
        <div>
          <p className="plans-kicker">PROGRAMACIÓN DE PLANES</p>
          <h1 className="plans-title">Membresías</h1>
          <p className="plans-subtitle">Diseña ofertas irresistibles.</p>
        </div>
        <button className="btn-primary-plan" onClick={openCreateModal}>
          <PlusIcon /> Nuevo Plan
        </button>
      </div>

      <div className="plans-grid">
        {plans.map((plan, index) => {
          const accent = accentVariants[index % accentVariants.length];
          const benefits = plan.benefits
            ? plan.benefits.split('|').map((benefit) => benefit.trim()).filter(Boolean)
            : [];

          return (
            <div key={plan.id} className={`plan-card premium accent-${accent}`}>
              <div className="plan-card-header">
                <span className={`plan-pill ${plan.isActive ? 'active' : 'inactive'}`}>
                  {plan.isActive ? 'Activo' : 'Inactivo'}
                </span>
                <div className="plan-actions-inline">
                  <button className="icon-btn" onClick={() => openEditModal(plan)} title="Editar plan">
                    <EditIcon />
                  </button>
                  <button className="icon-btn danger" onClick={() => handleDelete(plan)} title="Eliminar plan">
                    <TrashIcon />
                  </button>
                </div>
              </div>

              <div className="plan-content">
                <div className="plan-heading">
                  <h3>{plan.name}</h3>
                </div>

                <div className="plan-price-block">
                  <span className="price">{formatCurrency(plan.price)}</span>
                  <span className="duration">por {plan.durationDays} días</span>
                </div>

                <div className="plan-meta">
                  <div>
                    <span className="meta-label">Duración total</span>
                    <strong>{plan.durationDays} días</strong>
                  </div>
                  <div>
                    <span className="meta-label">Días por semana</span>
                    <strong>{plan.daysPerWeek || 'Personalizado'}</strong>
                  </div>
                </div>

                {benefits.length > 0 && (
                  <ul className="plan-benefits-list">
                    {benefits.map((benefit, idx) => (
                      <li key={idx}>{benefit}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="plan-card-footer">
                <button className="ghost-btn" onClick={() => openEditModal(plan)}>
                  Editar plan
                </button>
                <button className="ghost-btn danger" onClick={() => handleDelete(plan)}>
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {plans.length === 0 && (
        <div className="plans-empty">
          <p>Sin planes aún</p>
          <button className="btn-primary-plan" onClick={openCreateModal}>
            <PlusIcon /> Crear primer plan
          </button>
        </div>
      )}

      {showFormModal && (
        <div className="plans-modal-overlay" onClick={closeModals}>
          <div className="plans-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={closeModals}>
              <CloseIcon />
            </button>
            <h2>{selectedPlan ? 'Editar plan' : 'Nuevo plan'}</h2>
            <p className="modal-subtitle">Define precios, duración y beneficios con una interfaz uniforme.</p>
            <form className="plan-form" onSubmit={handleSubmit}>
              <label>
                Nombre del plan
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => handleInputChange('name', event.target.value)}
                  placeholder="Ej. Plan Elite"
                  required
                />
              </label>

              <div className="form-row">
                <label>
                  Precio
                  <input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(event) => handleInputChange('price', event.target.value)}
                    placeholder="0"
                    required
                  />
                </label>
                <label>
                  Duración (días)
                  <input
                    type="number"
                    min="1"
                    value={formData.durationDays}
                    onChange={(event) => handleInputChange('durationDays', event.target.value)}
                    placeholder="30"
                    required
                  />
                </label>
                <label>
                  Días por semana
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={formData.daysPerWeek}
                    onChange={(event) => handleInputChange('daysPerWeek', event.target.value)}
                    placeholder="Opcional"
                  />
                </label>
              </div>

              <label>
                Descripción
                <textarea
                  value={formData.description}
                  onChange={(event) => handleInputChange('description', event.target.value)}
                  placeholder="Resumen atractivo del plan"
                  rows={3}
                />
              </label>

              <label>
                Beneficios (uno por línea)
                <textarea
                  value={formData.benefits}
                  onChange={(event) => handleInputChange('benefits', event.target.value)}
                  placeholder={'Acceso a todas las salas\nClases ilimitadas\nSeguimiento personalizado'}
                  rows={4}
                />
              </label>

              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={closeModals}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary-plan" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : selectedPlan ? 'Guardar cambios' : 'Crear plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selectedPlan && (
        <div className="plans-modal-overlay" onClick={closeModals}>
          <div className="plans-modal confirm" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={closeModals}>
              <CloseIcon />
            </button>
            <h3>Eliminar "{selectedPlan.name}"</h3>
            <p>Esta acción no se puede deshacer. ¿Seguro que deseas eliminar este plan?</p>
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={closeModals}>
                Cancelar
              </button>
              <button type="button" className="ghost-btn danger" onClick={confirmDelete} disabled={isSubmitting}>
                {isSubmitting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && <div className={`plans-toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
};

export default Plans;
