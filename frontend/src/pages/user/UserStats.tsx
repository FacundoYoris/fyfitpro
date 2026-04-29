import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  CalendarCheck2,
  CircleOff,
  ChartNoAxesCombined,
  Dumbbell,
  Flame,
  Scale,
  TrendingUp,
} from 'lucide-react';
import memberService from '../../services/memberService';
import { MemberExerciseProgressionPoint, MemberStats } from '../../types';
import './UserStats.css';

interface ProgressionChartProps {
  points: MemberExerciseProgressionPoint[];
  color: string;
  gradientId: string;
}

interface StatsRange {
  startDate: string;
  endDate: string;
}

interface StatsFilters {
  period: 'week' | 'month' | '3months' | 'year' | 'all' | 'custom';
  routineFilter: string;
}

type QuickPreset = 'today' | 'last7' | 'prevMonth' | 'month' | 'all' | null;

const formatWeight = (value: number | null) => (value === null ? '-' : `${value.toFixed(1)} kg`);

const parseLocalDate = (value: string) => {
  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

  if (dateOnlyPattern.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(value);
};

const formatDate = (value: string | null) => {
  if (!value) {
    return '-';
  }

  return parseLocalDate(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatShortDate = (value: string) => parseLocalDate(value).toLocaleDateString('es-AR', {
  day: '2-digit',
  month: '2-digit',
});

const getAdherenceCopy = (completed: number, expected: number, completionRate: number) => {
  if (expected === 0) {
    return 'Todavía no hay días esperados en este período.';
  }

  if (completionRate >= 95) {
    return `Cumpliste ${completed} de ${expected} días. Adherencia: ${completionRate.toFixed(1)}%. Modo bestia.`;
  }

  if (completionRate >= 80) {
    return `Cumpliste ${completed} de ${expected} días. Adherencia: ${completionRate.toFixed(1)}%. Vas muy bien.`;
  }

  if (completionRate >= 60) {
    return `Cumpliste ${completed} de ${expected} días. Adherencia: ${completionRate.toFixed(1)}%. Estás en buena ruta.`;
  }

  return `Cumpliste ${completed} de ${expected} días. Adherencia: ${completionRate.toFixed(1)}%. Hay margen para subir.`;
};

const WeeklyAttendanceChart = ({
  timeline,
}: {
  timeline: MemberStats['attendance']['weeklyTimeline'];
}) => {
  if (timeline.length === 0) {
    return <p className="stats-attendance-empty">Sin semanas con días esperados en este rango.</p>;
  }

  return (
    <div className="stats-weekly-chart">
      {timeline.map((week) => (
        <div
          key={week.weekStart}
          className="stats-week-col"
          title={`${formatDate(week.weekStart)} - ${week.completed}/${week.expected} (${week.completionRate.toFixed(1)}%)`}
        >
          <div className="stats-week-bar-bg">
            <div
              className="stats-week-bar-fill"
              style={{ height: `${Math.max(6, Math.min(100, week.completionRate))}%` }}
            />
          </div>
          <span>{formatShortDate(week.weekStart)}</span>
        </div>
      ))}
    </div>
  );
};

const toInputDate = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultRange = (): StatsRange => {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    startDate: toInputDate(monthStart),
    endDate: toInputDate(today),
  };
};

const getTodayRange = (): StatsRange => {
  const today = toInputDate(new Date());

  return {
    startDate: today,
    endDate: today,
  };
};

const getLastDaysRange = (days: number): StatsRange => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));

  return {
    startDate: toInputDate(startDate),
    endDate: toInputDate(endDate),
  };
};

const getPreviousMonthRange = (): StatsRange => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    startDate: toInputDate(startDate),
    endDate: toInputDate(endDate),
  };
};

const ProgressionChart = ({ points, color, gradientId }: ProgressionChartProps) => {
  const [hoveredPoint, setHoveredPoint] = useState<MemberExerciseProgressionPoint | null>(null);

  if (points.length === 0) {
    return <div className="stats-empty-chart">Sin registros para este grupo de repeticiones.</div>;
  }

  if (points.length === 1) {
    return (
      <div className="stats-empty-chart">
        Solo hay 1 registro ({points[0].maxWeight.toFixed(1)} kg el {formatDate(points[0].date)}). A medida que cargues más entrenamientos vas a ver la curva.
      </div>
    );
  }

  const width = 680;
  const height = 220;
  const paddingX = 32;
  const paddingY = 24;

  const weights = points.map((point) => point.maxWeight);
  const maxWeight = Math.max(...weights);
  const minWeight = Math.min(...weights);
  const spread = maxWeight === minWeight ? 1 : maxWeight - minWeight;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const coordinates = points.map((point, index) => {
    const x = points.length === 1
      ? width / 2
      : paddingX + (index / (points.length - 1)) * chartWidth;
    const ratioY = (point.maxWeight - minWeight) / spread;
    const y = height - paddingY - ratioY * chartHeight;

    return {
      x,
      y,
      point,
    };
  });

  const linePath = coordinates
    .map((coordinate, index) => `${index === 0 ? 'M' : 'L'} ${coordinate.x} ${coordinate.y}`)
    .join(' ');

  return (
    <div className="stats-chart-wrapper">
      {hoveredPoint ? (
        <div className="stats-chart-tooltip">
          <strong>{formatDate(hoveredPoint.date)}</strong>
          <span>{hoveredPoint.maxWeight.toFixed(1)} kg - {hoveredPoint.reps} reps</span>
        </div>
      ) : null}

      <svg viewBox={`0 0 ${width} ${height}`} className="stats-chart" role="img" aria-label="Evolucion de peso por fecha">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <line x1={paddingX} x2={width - paddingX} y1={height - paddingY} y2={height - paddingY} className="stats-chart-axis" />
        <line x1={paddingX} x2={paddingX} y1={paddingY} y2={height - paddingY} className="stats-chart-axis" />

        <path
          d={`${linePath} L ${coordinates[coordinates.length - 1].x} ${height - paddingY} L ${coordinates[0].x} ${height - paddingY} Z`}
          fill={`url(#${gradientId})`}
        />
        <path d={linePath} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />

        {coordinates.map((coordinate) => (
          <g key={`${coordinate.point.date}-${coordinate.point.reps}-${coordinate.point.maxWeight}`}>
            <circle
              cx={coordinate.x}
              cy={coordinate.y}
              r="6"
              fill={color}
              fillOpacity="0.2"
              onMouseEnter={() => setHoveredPoint(coordinate.point)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
            <circle cx={coordinate.x} cy={coordinate.y} r="4" fill={color} />
          </g>
        ))}
      </svg>

      <div className="stats-chart-footer">
        <span>{formatDate(points[0].date)}</span>
        <span>{formatDate(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
};

export const UserStats = () => {
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [loading, setLoading] = useState(true);
  const [exerciseLoading, setExerciseLoading] = useState(false);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [range, setRange] = useState<StatsRange>(defaultRange);
  const [filters, setFilters] = useState<StatsFilters>({
    period: 'month',
    routineFilter: 'active',
  });
  const [activePreset, setActivePreset] = useState<QuickPreset>('month');

  const loadStats = async (
    exerciseId?: number,
    nextRange?: StatsRange,
    nextFilters?: StatsFilters
  ) => {
    const rangeToUse = nextRange || range;
    const filtersToUse = nextFilters || filters;

    if (stats) {
      setExerciseLoading(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await memberService.getStats({
        exerciseId,
        startDate: rangeToUse.startDate,
        endDate: rangeToUse.endDate,
        period: filtersToUse.period,
        routineFilter: filtersToUse.routineFilter,
      });
      if (response.success && response.data) {
        setStats(response.data);
        setSelectedExerciseId(response.data.selectedExerciseId || undefined);
        setErrorMessage(null);
      } else {
        setErrorMessage(response.message || 'No se pudo cargar tu información.');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setErrorMessage('No se pudo cargar tu información. Intenta nuevamente en unos segundos.');
    } finally {
      setLoading(false);
      setExerciseLoading(false);
    }
  };

  useEffect(() => {
    loadStats(undefined, defaultRange);
  }, [defaultRange]);

  const progressionByReps = useMemo(() => {
    if (!stats) {
      return [];
    }

    const group = new Map<number, MemberExerciseProgressionPoint[]>();
    for (const entry of stats.progression) {
      const bucket = group.get(entry.reps) || [];
      bucket.push(entry);
      group.set(entry.reps, bucket);
    }

    return Array.from(group.entries())
      .map(([reps, points]) => ({
        reps,
        points,
      }))
      .sort((a, b) => a.reps - b.reps);
  }, [stats]);

  const selectedExercise = useMemo(() => (
    stats?.exercises.find((exercise) => exercise.id === selectedExerciseId) || null
  ), [stats, selectedExerciseId]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="profile-page">
        <section className="profile-panel">
          <header>
            <div className="panel-icon neutral"><ChartNoAxesCombined size={18} /></div>
            <div>
              <h3>Estadisticas</h3>
              <p>{errorMessage || 'No pudimos cargar tu información.'}</p>
            </div>
          </header>
          <button className="btn-save" onClick={() => loadStats()}>
            Reintentar
          </button>
        </section>
      </div>
    );
  }

  const completionRate = Math.max(0, Math.min(100, stats.attendance.completionRate));
  const maxExerciseFrequency = Math.max(
    ...stats.indicators.exerciseFrequency.map((item) => item.sessionsCount),
    1
  );
  const maxMuscleVolume = Math.max(
    ...stats.indicators.muscleVolumeBreakdown.map((item) => item.volume),
    1
  );

  return (
    <div className="profile-page stats-page">
      <section className="profile-panel stats-main">
        <div className="stats-main-left">
          <p className="stats-kicker">Panel personal</p>
          <h2>Tus estadisticas de entrenamiento</h2>
          <p className="stats-subtitle">Mira tu cumplimiento, progresion por ejercicio y metricas clave para tomar decisiones.</p>
          <p className="stats-period-label">
            Periodo: {formatDate(stats.period.startDate)} - {formatDate(stats.period.endDate)}
          </p>
        </div>
        <div className="stats-ring-wrap">
          <div
            className="stats-ring"
            style={{
              background: `conic-gradient(#22c55e ${completionRate * 3.6}deg, rgba(148, 163, 184, 0.25) ${completionRate * 3.6}deg)`,
            }}
          >
            <div className="stats-ring-inner">
              <strong>{completionRate.toFixed(1)}%</strong>
              <span>cumplimiento</span>
            </div>
          </div>
        </div>
      </section>

      <section className="profile-panel stats-range-panel">
        <header>
          <div className="panel-icon neutral"><CalendarCheck2 size={18} /></div>
          <div>
            <h3>Filtros</h3>
            <p>Define periodo, rutina y ejercicio antes de analizar.</p>
          </div>
        </header>

        <div className="stats-presets">
          <button
            type="button"
            className={`stats-preset-btn ${activePreset === 'today' ? 'active' : ''}`}
            onClick={() => {
              const nextFilters: StatsFilters = { ...filters, period: 'custom' };
              const nextRange = getTodayRange();
              setFilters(nextFilters);
              setRange(nextRange);
              setActivePreset('today');
              loadStats(selectedExerciseId, nextRange, nextFilters);
            }}
            disabled={exerciseLoading}
          >
            Hoy
          </button>
          <button
            type="button"
            className={`stats-preset-btn ${activePreset === 'last7' ? 'active' : ''}`}
            onClick={() => {
              const nextFilters: StatsFilters = { ...filters, period: 'custom' };
              const nextRange = getLastDaysRange(7);
              setFilters(nextFilters);
              setRange(nextRange);
              setActivePreset('last7');
              loadStats(selectedExerciseId, nextRange, nextFilters);
            }}
            disabled={exerciseLoading}
          >
            Últimos 7 días
          </button>
          <button
            type="button"
            className={`stats-preset-btn ${activePreset === 'prevMonth' ? 'active' : ''}`}
            onClick={() => {
              const nextFilters: StatsFilters = { ...filters, period: 'custom' };
              const nextRange = getPreviousMonthRange();
              setFilters(nextFilters);
              setRange(nextRange);
              setActivePreset('prevMonth');
              loadStats(selectedExerciseId, nextRange, nextFilters);
            }}
            disabled={exerciseLoading}
          >
            Mes anterior
          </button>
          <button
            type="button"
            className={`stats-preset-btn ${activePreset === 'month' ? 'active' : ''}`}
            onClick={() => {
              const nextFilters: StatsFilters = { ...filters, period: 'month' };
              const nextRange = getDefaultRange();
              setFilters(nextFilters);
              setRange(nextRange);
              setActivePreset('month');
              loadStats(selectedExerciseId, nextRange, nextFilters);
            }}
            disabled={exerciseLoading}
          >
            Mes actual
          </button>
          <button
            type="button"
            className={`stats-preset-btn ${activePreset === 'all' ? 'active' : ''}`}
            onClick={() => {
              const nextFilters: StatsFilters = { ...filters, period: 'all' };
              setFilters(nextFilters);
              setActivePreset('all');
              loadStats(selectedExerciseId, range, nextFilters);
            }}
            disabled={exerciseLoading}
          >
            Desde el inicio
          </button>
        </div>

        <div className="stats-range-controls">
          <label>
            Periodo
            <select
              value={filters.period}
              onChange={(event) => {
                const value = event.target.value as StatsFilters['period'];
                const next = { ...filters, period: value };
                setFilters(next);
                if (value === 'month') {
                  setActivePreset('month');
                } else if (value === 'all') {
                  setActivePreset('all');
                } else {
                  setActivePreset(null);
                }
              }}
            >
              <option value="week">Semana actual</option>
              <option value="month">Mes actual</option>
              <option value="3months">Ultimos 3 meses</option>
              <option value="year">Año actual</option>
              <option value="all">Desde el inicio</option>
              <option value="custom">Personalizado</option>
            </select>
          </label>

          <label>
            Rutina
            <select
              value={filters.routineFilter}
              onChange={(event) => {
                const value = event.target.value;
                const next = { ...filters, routineFilter: value };
                setFilters(next);
              }}
            >
              {(stats.filters.availableRoutines || []).map((option) => (
                <option key={option.value} value={option.value} disabled={!option.enabled}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Desde
            <input
              type="date"
              value={range.startDate}
              onChange={(event) => {
                setRange((prev) => ({ ...prev, startDate: event.target.value }));
                setFilters((prev) => ({ ...prev, period: 'custom' }));
                setActivePreset(null);
              }}
              max={range.endDate}
            />
          </label>

          <label>
            Hasta
            <input
              type="date"
              value={range.endDate}
              onChange={(event) => {
                setRange((prev) => ({ ...prev, endDate: event.target.value }));
                setFilters((prev) => ({ ...prev, period: 'custom' }));
                setActivePreset(null);
              }}
              min={range.startDate}
            />
          </label>

          <button
            type="button"
            className="stats-range-btn primary"
            onClick={() => {
              if (filters.period === 'month') {
                setActivePreset('month');
              } else if (filters.period === 'all') {
                setActivePreset('all');
              } else {
                setActivePreset(null);
              }
              loadStats(selectedExerciseId, range, filters);
            }}
            disabled={exerciseLoading || !range.startDate || !range.endDate}
          >
            Aplicar filtros
          </button>
        </div>
      </section>

      <section className="stats-grid">
        <article className="profile-panel stats-card">
          <header>
            <div className="panel-icon primary"><CalendarCheck2 size={18} /></div>
            <div>
              <h3>Asistencias</h3>
              <p>Días esperados vs días finalizados en el período</p>
            </div>
          </header>
          <div className="stats-adherence-highlight">
            <strong>{stats.attendance.completionRate.toFixed(1)}%</strong>
            <span>Adherencia del periodo</span>
          </div>
          <p className="stats-adherence-copy">
            {getAdherenceCopy(
              stats.attendance.completedSessions,
              stats.attendance.expectedSessions,
              stats.attendance.completionRate
            )}
          </p>
          <div className="stats-attendance-meter" role="presentation">
            <div
              className="completed"
              style={{ width: `${stats.attendance.expectedSessions > 0 ? (stats.attendance.completedSessions / stats.attendance.expectedSessions) * 100 : 0}%` }}
            />
            <div
              className="pending"
              style={{ width: `${stats.attendance.expectedSessions > 0 ? (stats.attendance.pendingSessions / stats.attendance.expectedSessions) * 100 : 0}%` }}
            />
            <div
              className="missed"
              style={{ width: `${stats.attendance.expectedSessions > 0 ? (stats.attendance.missedSessions / stats.attendance.expectedSessions) * 100 : 0}%` }}
            />
          </div>
          <div className="stats-values">
            <div><span>Esperados</span><strong>{stats.attendance.expectedSessions}</strong></div>
            <div><span>Finalizados</span><strong>{stats.attendance.completedSessions}</strong></div>
            <div><span>Pendientes</span><strong>{stats.attendance.pendingSessions}</strong></div>
            <div><span>Faltas</span><strong>{stats.attendance.missedSessions}</strong></div>
          </div>
          <WeeklyAttendanceChart timeline={stats.attendance.weeklyTimeline} />
        </article>

        <article className="profile-panel stats-card">
          <header>
            <div className="panel-icon warning"><Flame size={18} /></div>
            <div>
              <h3>Rachas y constancia</h3>
              <p>Indicadores de disciplina del periodo</p>
            </div>
          </header>
          <div className="stats-values">
            <div><span>Racha actual</span><strong>{stats.indicators.currentStreak} días</strong></div>
            <div><span>Mejor racha</span><strong>{stats.indicators.bestStreak} días</strong></div>
            <div><span>Consistencia del periodo</span><strong>{stats.indicators.consistencyInRange.toFixed(1)}%</strong></div>
            <div><span>Último entreno</span><strong>{formatDate(stats.indicators.lastCompletedAt)}</strong></div>
          </div>
        </article>

        <article className="profile-panel stats-card">
          <header>
            <div className="panel-icon neutral"><Activity size={18} /></div>
            <div>
              <h3>Carga de trabajo</h3>
              <p>Volumen y variedad del periodo</p>
            </div>
          </header>
          <div className="stats-values">
            <div><span>Sesiones completadas</span><strong>{stats.indicators.completedInRange}</strong></div>
            <div><span>Volumen total</span><strong>{stats.indicators.volumeInRange.toFixed(0)} kg</strong></div>
            <div><span>Promedio por sesión</span><strong>{stats.indicators.averageVolumePerSessionInRange.toFixed(0)} kg</strong></div>
            <div><span>Ejercicios distintos</span><strong>{stats.indicators.uniqueExercisesInRange}</strong></div>
          </div>
        </article>

        <article className="profile-panel stats-card">
          <header>
            <div className="panel-icon primary"><Dumbbell size={18} /></div>
            <div>
              <h3>Volumen por grupo muscular</h3>
              <p>Te muestra dónde estás enfocando más trabajo en el período.</p>
            </div>
          </header>
          <div className="stats-muscle-volume-chart">
            {stats.indicators.muscleVolumeBreakdown.length === 0 ? (
              <p className="stats-attendance-empty">Sin volumen cargado para este periodo.</p>
            ) : (
              stats.indicators.muscleVolumeBreakdown.slice(0, 8).map((item) => (
                <div
                  className="stats-muscle-volume-row"
                  key={item.muscleGroup}
                  title={`${item.muscleGroup}: ${item.volume.toFixed(0)} kg totales`}
                >
                  <div className="stats-muscle-volume-labels">
                    <span>{item.muscleGroup}</span>
                    <strong>{item.volume.toFixed(0)} kg</strong>
                  </div>
                  <div className="stats-muscle-volume-bar-bg">
                    <div
                      className="stats-muscle-volume-bar-fill"
                      style={{ width: `${(item.volume / maxMuscleVolume) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
          <p className="stats-muscle-volume-help">
            Tip: si un grupo queda muy abajo varias semanas seguidas, te conviene darle más lugar en la rutina.
          </p>
        </article>

        <article className="profile-panel stats-card">
          <header>
            <div className="panel-icon primary"><BarChart3 size={18} /></div>
            <div>
              <h3>Frecuencia por ejercicio</h3>
              <p>Top ejercicios por cantidad de sesiones</p>
            </div>
          </header>
          <div className="stats-frequency-chart">
            {stats.indicators.exerciseFrequency.length === 0 ? (
              <p className="stats-attendance-empty">Sin datos para este periodo.</p>
            ) : (
              stats.indicators.exerciseFrequency.map((item) => (
                <div
                  className="stats-frequency-row"
                  key={item.exerciseId}
                  title={`${item.name}: ${item.sessionsCount} sesiones en el periodo`}
                >
                  <div className="stats-frequency-labels">
                    <span>{item.name}</span>
                    <strong>{item.sessionsCount}</strong>
                  </div>
                  <div className="stats-frequency-bar-bg">
                    <div
                      className="stats-frequency-bar-fill"
                      style={{ width: `${(item.sessionsCount / maxExerciseFrequency) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="profile-panel stats-card">
          <header>
            <div className="panel-icon warning"><CircleOff size={18} /></div>
            <div>
              <h3>Ejercicios abandonados</h3>
              <p>Entrenados antes y no trabajados en este periodo</p>
            </div>
          </header>
          <div className="stats-abandoned-list">
            {stats.indicators.abandonedExercises.length === 0 ? (
              <p className="stats-attendance-empty">No hay ejercicios abandonados. Excelente constancia.</p>
            ) : (
              stats.indicators.abandonedExercises.map((exercise) => (
                <div
                  className="stats-abandoned-row"
                  key={exercise.exerciseId}
                  title={`${exercise.name}: antes ${exercise.previousSessions} sesiones, ahora ${exercise.currentSessions}. Caída ${exercise.dropPercent.toFixed(1)}%`}
                >
                  <div>
                    <strong>{exercise.name}</strong>
                    <span>
                      Antes: {exercise.previousSessions} sesiones - Ahora: {exercise.currentSessions}
                    </span>
                  </div>
                  <em>{exercise.dropPercent.toFixed(1)}%</em>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="profile-panel stats-exercise-panel">
        <header>
          <div className="panel-icon primary"><Dumbbell size={18} /></div>
          <div>
            <h3>Progresion por ejercicio</h3>
            <p>Selecciona un ejercicio para ver cómo escaló el peso.</p>
          </div>
        </header>

        <div className="stats-exercise-toolbar">
          <label htmlFor="exerciseSelect">Ejercicio</label>
          <select
            id="exerciseSelect"
            value={selectedExerciseId || ''}
            onChange={(event) => {
              const value = Number(event.target.value);
              setSelectedExerciseId(value);
              loadStats(value, undefined, filters);
            }}
            disabled={exerciseLoading || stats.exercises.length === 0}
          >
            {stats.exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name} {exercise.muscleGroup ? `(${exercise.muscleGroup})` : ''}
              </option>
            ))}
          </select>
        </div>

        {stats.exercises.length > 0 ? (
          <>
            {selectedExercise ? (
              <div className="stats-exercise-overview">
                <div><Scale size={16} /><span>Peso maximo</span><strong>{formatWeight(stats.exerciseSnapshot.maxWeight)}</strong></div>
                <div><TrendingUp size={16} /><span>Peso inicial</span><strong>{formatWeight(stats.exerciseSnapshot.initialWeight)}</strong></div>
                <div><TrendingUp size={16} /><span>Peso actual</span><strong>{formatWeight(stats.exerciseSnapshot.latestWeight)}</strong></div>
                <div><ChartNoAxesCombined size={16} /><span>Cambio total</span><strong>{stats.exerciseSnapshot.progressPercent === null ? '-' : `${stats.exerciseSnapshot.progressPercent.toFixed(1)}%`}</strong></div>
              </div>
            ) : null}

            {stats.exerciseSnapshot.referenceReps !== null ? (
              <p className="stats-snapshot-note">
                Resumen calculado sobre la serie de {stats.exerciseSnapshot.referenceReps} reps (la más consistente en el período).
              </p>
            ) : null}

            {exerciseLoading ? <p className="stats-loading-inline">Actualizando gráfica...</p> : null}

            <div className="stats-charts-grid">
              {progressionByReps.map((group, index) => (
                <article key={group.reps} className="stats-chart-card">
                  <div className="stats-chart-head">
                    <h4>{group.reps} reps</h4>
                    <span>{group.points.length} registros</span>
                  </div>
                  <ProgressionChart
                    points={group.points}
                    color={index % 2 === 0 ? '#22c55e' : '#38bdf8'}
                    gradientId={`exercise-gradient-${group.reps}`}
                  />
                </article>
              ))}
              {progressionByReps.length === 0 ? (
                <div className="stats-empty-chart">Aún no hay series con peso para este ejercicio.</div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="stats-empty-chart">Todavía no hay registros de peso. Completa tus entrenamientos y vuelve a revisar.</div>
        )}
      </section>
    </div>
  );
};

export default UserStats;
