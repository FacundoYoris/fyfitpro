import { FormEvent, useEffect, useMemo, useState } from 'react';
import { LineChart, Scale, TrendingDown, TrendingUp, Trash2 } from 'lucide-react';
import memberService from '../../services/memberService';
import { MemberWeightStats } from '../../types';
import './WeightTracking.css';

type WeightPeriod = 'month' | '3months' | 'year' | 'all' | 'custom';

const toInputDate = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (value: string) => new Date(value).toLocaleDateString('es-AR');

const WeightTrendChart = ({ points }: { points: MemberWeightStats['trend'] }) => {
  const [hoveredPoint, setHoveredPoint] = useState<MemberWeightStats['trend'][number] | null>(null);

  if (points.length < 2) {
    return <div className="weight-empty-chart">Registra al menos 2 pesos para ver la tendencia.</div>;
  }

  const width = 900;
  const height = 280;
  const paddingX = 36;
  const paddingY = 22;

  const allWeights = points.flatMap((point) => [point.weight, point.trendWeight]);
  const minWeight = Math.min(...allWeights);
  const maxWeight = Math.max(...allWeights);
  const spread = maxWeight === minWeight ? 1 : maxWeight - minWeight;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const getCoordinate = (value: number, index: number) => {
    const x = paddingX + (index / (points.length - 1)) * chartWidth;
    const y = height - paddingY - ((value - minWeight) / spread) * chartHeight;

    return { x, y };
  };

  const actualPath = points
    .map((point, index) => {
      const coordinate = getCoordinate(point.weight, index);
      return `${index === 0 ? 'M' : 'L'} ${coordinate.x} ${coordinate.y}`;
    })
    .join(' ');

  const trendPath = points
    .map((point, index) => {
      const coordinate = getCoordinate(point.trendWeight, index);
      return `${index === 0 ? 'M' : 'L'} ${coordinate.x} ${coordinate.y}`;
    })
    .join(' ');

  return (
    <div className="weight-chart-wrap">
      {hoveredPoint ? (
        <div className="weight-chart-tooltip">
          <strong>{formatDate(hoveredPoint.date)}</strong>
          <span>Peso: {hoveredPoint.weight.toFixed(1)} kg</span>
          <span>Tendencia: {hoveredPoint.trendWeight.toFixed(1)} kg</span>
        </div>
      ) : null}

      <svg viewBox={`0 0 ${width} ${height}`} className="weight-chart" role="img" aria-label="Tendencia de peso">
        <line x1={paddingX} x2={width - paddingX} y1={height - paddingY} y2={height - paddingY} className="weight-chart-axis" />
        <line x1={paddingX} x2={paddingX} y1={paddingY} y2={height - paddingY} className="weight-chart-axis" />

        <path d={actualPath} stroke="#38bdf8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d={trendPath} stroke="#22c55e" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="6 4" />

        {points.map((point, index) => {
          const coordinate = getCoordinate(point.weight, index);

          return (
            <g key={`${point.date}-${point.weight}`}>
              <circle
                cx={coordinate.x}
                cy={coordinate.y}
                r="7"
                fill="#38bdf8"
                fillOpacity="0.2"
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              <circle cx={coordinate.x} cy={coordinate.y} r="4" fill="#38bdf8" />
            </g>
          );
        })}
      </svg>

      <div className="weight-chart-legend">
        <span><i className="actual" />Peso registrado</span>
        <span><i className="trend" />Tendencia 7 registros</span>
      </div>
    </div>
  );
};

export const WeightTracking = () => {
  const [stats, setStats] = useState<MemberWeightStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [period, setPeriod] = useState<WeightPeriod>('month');
  const [range, setRange] = useState(() => {
    const today = new Date();
    return {
      startDate: toInputDate(new Date(today.getFullYear(), today.getMonth(), 1)),
      endDate: toInputDate(today),
    };
  });
  const [form, setForm] = useState({
    date: toInputDate(new Date()),
    weight: '',
    note: '',
  });

  const loadStats = async (nextPeriod: WeightPeriod = period) => {
    setLoading(true);
    try {
      const response = await memberService.getWeightStats({
        period: nextPeriod,
        startDate: range.startDate,
        endDate: range.endDate,
      });

      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading weight stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats('month');
  }, []);

  const summaryTone = useMemo(() => {
    if (!stats) {
      return 'neutral';
    }

    if (stats.summary.changeKg < 0) {
      return 'down';
    }

    if (stats.summary.changeKg > 0) {
      return 'up';
    }

    return 'neutral';
  }, [stats]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericWeight = Number(form.weight);
    if (Number.isNaN(numericWeight) || numericWeight <= 0) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await memberService.createWeightLog({
        date: form.date,
        weight: numericWeight,
        note: form.note,
      });

      if (response.success) {
        setForm((prev) => ({ ...prev, weight: '', note: '' }));
        await loadStats(period);
      }
    } catch (error) {
      console.error('Error creating weight log:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (logId: number) => {
    setSubmitting(true);
    try {
      const response = await memberService.deleteWeightLog(logId);
      if (response.success) {
        await loadStats(period);
      }
    } catch (error) {
      console.error('Error deleting weight log:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!loading && !stats) {
    return (
      <div className="profile-page weight-page">
        <section className="profile-panel">
          <header>
            <div className="panel-icon warning"><Scale size={18} /></div>
            <div>
              <h3>Seguimiento de peso</h3>
              <p>No pudimos cargar la información. Revisa backend y vuelve a intentar.</p>
            </div>
          </header>
          <button className="btn-save" onClick={() => loadStats(period)}>
            Reintentar
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="profile-page weight-page">
      <section className="profile-panel weight-hero">
        <div>
          <p className="weight-kicker">Seguimiento corporal</p>
          <h2>Evolucion de peso</h2>
          <p>Registra tu peso y revisa la tendencia real para entender tu progreso.</p>
          {stats ? (
            <p className="weight-period">Periodo: {formatDate(stats.period.startDate)} - {formatDate(stats.period.endDate)}</p>
          ) : null}
        </div>
      </section>

      <section className="profile-panel weight-filters">
        <header>
          <div className="panel-icon primary"><LineChart size={18} /></div>
          <div>
              <h3>Filtros de análisis</h3>
              <p>Selecciona el rango que querés analizar.</p>
          </div>
        </header>
        <div className="weight-filters-row">
          <select value={period} onChange={(event) => setPeriod(event.target.value as WeightPeriod)}>
            <option value="month">Mes actual</option>
            <option value="3months">Últimos 3 meses</option>
            <option value="year">Año actual</option>
            <option value="all">Desde el inicio</option>
            <option value="custom">Personalizado</option>
          </select>

          <input
            type="date"
            value={range.startDate}
            onChange={(event) => {
              setRange((prev) => ({ ...prev, startDate: event.target.value }));
              setPeriod('custom');
            }}
            max={range.endDate}
          />

          <input
            type="date"
            value={range.endDate}
            onChange={(event) => {
              setRange((prev) => ({ ...prev, endDate: event.target.value }));
              setPeriod('custom');
            }}
            min={range.startDate}
          />

          <button className="btn-save" onClick={() => loadStats(period)} disabled={loading || submitting}>
            Aplicar
          </button>
        </div>
      </section>

      <section className="weight-summary-grid">
        <article className="profile-panel weight-card">
          <span>Peso actual</span>
          <strong>{stats?.summary.currentWeight !== null && stats?.summary.currentWeight !== undefined ? `${stats.summary.currentWeight.toFixed(1)} kg` : '-'}</strong>
        </article>
        <article className="profile-panel weight-card">
          <span>Cambio total</span>
          <strong className={summaryTone === 'down' ? 'down' : summaryTone === 'up' ? 'up' : ''}>
            {stats ? `${stats.summary.changeKg > 0 ? '+' : ''}${stats.summary.changeKg.toFixed(1)} kg` : '-'}
          </strong>
        </article>
        <article className="profile-panel weight-card">
          <span>Ritmo semanal</span>
          <strong>{stats ? `${stats.summary.weeklyRate > 0 ? '+' : ''}${stats.summary.weeklyRate.toFixed(2)} kg/sem` : '-'}</strong>
        </article>
        <article className="profile-panel weight-card">
          <span>Registros</span>
          <strong>{stats?.summary.entriesCount || 0}</strong>
        </article>
      </section>

      <section className="profile-panel">
        <header>
          <div className="panel-icon neutral"><Scale size={18} /></div>
          <div>
            <h3>Grafico de tendencia</h3>
            <p>Linea azul: peso registrado. Linea verde: tendencia suavizada.</p>
          </div>
        </header>
        {stats ? <WeightTrendChart points={stats.trend} /> : null}
      </section>

      <section className="weight-grid">
        <article className="profile-panel">
          <header>
            <div className="panel-icon primary"><TrendingDown size={18} /></div>
            <div>
              <h3>Registrar peso</h3>
              <p>Idealmente en condiciones similares para mejor comparación.</p>
            </div>
          </header>

          <form className="weight-form" onSubmit={handleSubmit}>
            <label>
              Fecha
              <input
                type="date"
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                required
              />
            </label>

            <label>
              Peso (kg)
              <input
                type="number"
                step="0.1"
                min="1"
                value={form.weight}
                onChange={(event) => setForm((prev) => ({ ...prev, weight: event.target.value }))}
                placeholder="Ej: 82.4"
                required
              />
            </label>

            <label>
              Nota (opcional)
              <textarea
                value={form.note}
                onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
                placeholder="Ej: en ayunas"
                rows={3}
              />
            </label>

            <button type="submit" className="btn-save" disabled={submitting}>Guardar registro</button>
          </form>
        </article>

        <article className="profile-panel">
          <header>
            <div className="panel-icon warning"><TrendingUp size={18} /></div>
            <div>
              <h3>Historial reciente</h3>
              <p>Últimos 30 registros dentro del período.</p>
            </div>
          </header>

          <div className="weight-history">
            {stats?.history.length ? (
              stats.history.map((entry) => (
                <div key={entry.id} className="weight-history-row">
                  <div>
                    <strong>{entry.weight.toFixed(1)} kg</strong>
                    <span>{formatDate(entry.date)} {entry.note ? `- ${entry.note}` : ''}</span>
                  </div>
                  <button
                    type="button"
                    className="weight-delete"
                    onClick={() => handleDelete(entry.id)}
                    disabled={submitting}
                    aria-label="Eliminar registro"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p className="weight-empty-history">Todavía no hay registros en este período.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
};

export default WeightTracking;
