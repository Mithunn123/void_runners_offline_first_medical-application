import React, { useMemo, useState } from 'react';
import { type Visit } from './data';

interface HeatmapProps {
  visits: Visit[];
  onSelectDate: (dateStr: string, events: Array<{
    facility: string;
    provider: string;
    notes: string;
    medications: Array<{ name: string; dosage: string; frequency: string; prescriber: string }>;
  }>) => void;
  selectedDate: string | null;
}

// Robust date key normalizer: extracts month (3-letter) and day number
function getNormalizedKey(dateStr: string): string {
  if (!dateStr) return '';
  const match = dateStr.match(/([A-Za-z]+)\s+(\d{1,2})/);
  if (!match) return '';
  const month = match[1].toLowerCase().slice(0, 3);
  const day = parseInt(match[2], 10);
  return `${month}-${day}`;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MedicationHeatmap: React.FC<HeatmapProps> = ({ visits, onSelectDate, selectedDate }) => {
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number; x: number; y: number } | null>(null);
  const [todayTimestamp] = useState(() => Date.now());

  // Generate 52 weeks (364 days) leading up to current real-time today
  const daysData = useMemo(() => {
    const today = new Date(todayTimestamp);
    const totalDays = 52 * 7;
    const days: Array<{
      dateStr: string;
      isoDate: string;
      monthShort: string;
      events: Array<{
        facility: string;
        provider: string;
        notes: string;
        medications: Array<{ name: string; dosage: string; frequency: string; prescriber: string }>;
      }>;
      hasEncounter: boolean;
    }> = [];

    // Map visits using robust date normalizer
    const visitDateMap = new Map<string, Visit[]>();
    visits.forEach(v => {
      const key = getNormalizedKey(v.date);
      if (key) {
        const existing = visitDateMap.get(key) || [];
        existing.push(v);
        visitDateMap.set(key, existing);
      }
    });

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = d.getDate();
      const year = d.getFullYear();
      const dateLabel = `${monthShort} ${dayNum < 10 ? '0' + dayNum : dayNum}, ${year}`;
      const lookupKey = `${monthShort.toLowerCase().slice(0, 3)}-${dayNum}`;

      const matchedVisits = visitDateMap.get(lookupKey) || [];
      const hasEncounter = matchedVisits.length > 0;

      const events = matchedVisits.map(v => ({
        facility: v.facility,
        provider: v.provider,
        notes: v.notes,
        medications: v.medications || []
      }));

      days.push({
        dateStr: dateLabel,
        isoDate: iso,
        monthShort,
        events,
        hasEncounter
      });
    }

    // Chunk into 52 columns of 7 days
    const weeks: typeof days[] = [];
    for (let w = 0; w < 52; w++) {
      weeks.push(days.slice(w * 7, (w + 1) * 7));
    }

    // Calculate month labels above columns
    const monthHeaders: Array<{ label: string; colIndex: number }> = [];
    let lastMonth = '';
    weeks.forEach((week, wIdx) => {
      const firstDayOfMonth = week[0];
      if (firstDayOfMonth && firstDayOfMonth.monthShort !== lastMonth) {
        lastMonth = firstDayOfMonth.monthShort;
        monthHeaders.push({ label: lastMonth, colIndex: wIdx });
      }
    });

    return { days, weeks, monthHeaders };
  }, [visits, todayTimestamp]);

  const totalPrescriptions = visits.flatMap(v => v.medications).length;

  return (
    <div style={{ position: 'relative' }}>
      {/* Metric Bar */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div className="clinical-card" style={{ flex: '1 1 180px', padding: '14px 18px', marginBottom: 0 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase' }}>
            Total Encounters
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>
            {visits.length}
          </div>
        </div>

        <div className="clinical-card" style={{ flex: '1 1 180px', padding: '14px 18px', marginBottom: 0 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase' }}>
            Prescriptions Recorded
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>
            {totalPrescriptions}
          </div>
        </div>
      </div>

      {/* Heatmap Card */}
      <div className="clinical-card" style={{ padding: '22px 20px', background: '#0f172a', color: '#f8fafc', border: '1px solid #334155' }}>
        <div style={{ marginBottom: '14px' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
            Medication Activity
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0' }}>
            Consultation calendar. Green tiles denote days with verified clinical consultations.
          </p>
        </div>

        {/* Scrollable Heatmap with Month Header & Day-of-Week Left Column */}
        <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
          <div style={{ minWidth: '820px' }}>
            {/* Month Labels Row */}
            <div style={{ display: 'flex', marginLeft: '32px', marginBottom: '6px', height: '16px', position: 'relative' }}>
              {daysData.monthHeaders.map((m, idx) => (
                <span
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `${m.colIndex * 15}px`,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#94a3b8',
                    fontFamily: 'var(--font-mono)'
                  }}>
                  {m.label}
                </span>
              ))}
            </div>

            {/* Grid Area with Day Labels */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              {/* Day of Week Labels (Mon, Wed, Fri) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '24px', flexShrink: 0 }}>
                {DAY_LABELS.map((dayLabel, dIdx) => (
                  <span
                    key={dIdx}
                    style={{
                      height: '11px',
                      lineHeight: '11px',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      color: dIdx % 2 === 1 ? '#64748b' : 'transparent',
                      fontFamily: 'var(--font-mono)',
                      userSelect: 'none'
                    }}>
                    {dayLabel}
                  </span>
                ))}
              </div>

              {/* 52 Columns of 7 Days */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {daysData.weeks.map((week, wIndex) => (
                  <div key={wIndex} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {week.map(day => {
                      const isSelected = selectedDate === day.dateStr;

                      return (
                        <button
                          key={day.isoDate}
                          onClick={() => {
                            if (day.hasEncounter) {
                              onSelectDate(day.dateStr, day.events);
                            }
                          }}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredCell({
                              date: day.dateStr,
                              count: day.events.length,
                              x: rect.left + rect.width / 2,
                              y: rect.top - 8
                            });
                          }}
                          onMouseLeave={() => setHoveredCell(null)}
                          style={{
                            width: '11px',
                            height: '11px',
                            borderRadius: '2.5px',
                            backgroundColor: isSelected
                              ? '#38bdf8'
                              : day.hasEncounter
                              ? '#10b981' // Clean verified green tile
                              : '#1e293b', // Slate inactive tile
                            border: isSelected
                              ? '2px solid #38bdf8'
                              : day.hasEncounter
                              ? '1px solid #34d399'
                              : '1px solid rgba(255,255,255,0.04)',
                            cursor: day.hasEncounter ? 'pointer' : 'default',
                            padding: 0,
                            outline: 'none',
                            transition: 'transform 0.12s ease',
                            transform: isSelected ? 'scale(1.35)' : day.hasEncounter ? 'scale(1.15)' : 'none',
                            boxShadow: day.hasEncounter ? '0 0 6px rgba(16, 185, 129, 0.55)' : 'none'
                          }}
                          title={`${day.dateStr}${day.hasEncounter ? ': Consulted' : ''}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend: Inactive vs Consulted */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.74rem', color: '#94a3b8', marginTop: '12px', borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '11px', height: '11px', borderRadius: '2.5px', background: '#1e293b', border: '1px solid #334155', display: 'inline-block' }}></span>
            <span>No Consultation</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '11px', height: '11px', borderRadius: '2.5px', background: '#10b981', border: '1px solid #34d399', boxShadow: '0 0 4px #10b981', display: 'inline-block' }}></span>
            <span style={{ color: '#34d399', fontWeight: 700 }}>Consultation Day</span>
          </div>
        </div>
      </div>

      {/* Floating Tooltip */}
      {hoveredCell && (
        <div style={{
          position: 'fixed',
          left: hoveredCell.x,
          top: hoveredCell.y,
          transform: 'translate(-50%, -100%)',
          backgroundColor: '#020617',
          color: '#f8fafc',
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid #334155',
          fontSize: '0.72rem',
          fontWeight: 700,
          pointerEvents: 'none',
          zIndex: 100000,
          whiteSpace: 'nowrap',
          boxShadow: '0 8px 18px rgba(0,0,0,0.35)'
        }}>
          <div>{hoveredCell.date}</div>
          <div style={{ color: hoveredCell.count > 0 ? '#34d399' : '#94a3b8', fontSize: '0.68rem', fontWeight: 500 }}>
            {hoveredCell.count > 0 ? `${hoveredCell.count} clinical consultation(s)` : 'No consultation'}
          </div>
        </div>
      )}
    </div>
  );
};
