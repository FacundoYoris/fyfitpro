import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import planService from '../../../services/planService';

export const PlanForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    durationDays: '',
    daysPerWeek: '',
    benefits: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        durationDays: parseInt(formData.durationDays),
        daysPerWeek: formData.daysPerWeek ? parseInt(formData.daysPerWeek) : undefined,
        benefits: formData.benefits ? formData.benefits.split('\n').filter(b => b.trim()).join('|') : undefined,
      };

      const response = await planService.createPlan(data);
      if (response.success) {
        navigate('/admin/plans');
      } else {
        setError(response.message || 'Error al crear plan');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Nuevo Plan</h1>
        <p className="page-subtitle">Crear un nuevo plan de membresía</p>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre del plan *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="ej: Premium, Básico, Mensual"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción breve del plan"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Precio (ARS) *</label>
              <input
                type="number"
                className="form-input"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="15000"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Duración (días) *</label>
              <input
                type="number"
                className="form-input"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                placeholder="30"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Días por semana</label>
            <select
              className="form-select"
              value={formData.daysPerWeek}
              onChange={(e) => setFormData({ ...formData, daysPerWeek: e.target.value })}
            >
              <option value="">Sin límite</option>
              <option value="1">1 día</option>
              <option value="2">2 días</option>
              <option value="3">3 días</option>
              <option value="4">4 días</option>
              <option value="5">5 días</option>
              <option value="6">6 días</option>
              <option value="7">7 días</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Beneficios (uno por línea)</label>
            <textarea
              className="form-input"
              value={formData.benefits}
              onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
              placeholder="Acceso a sala de musculación&#10;Instructor de turno&#10;Clases grupales"
              rows={5}
            />
          </div>

          <div className="flex gap-4 mt-4">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Plan'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/plans')}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanForm;
