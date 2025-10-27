import type { ReactNode } from 'react';

// ========== Types ==========
type UUID = string;

export type FilterBarProps = {
  // Filter values
  region: string;
  city: string;
  market: string;
  branch: UUID | null;
  teamLeader: UUID | null;
  dateFrom?: string; // YYYY-MM-DD format
  dateTo?: string; // YYYY-MM-DD format

  // Options
  regionOptions: string[];
  cityOptions: string[];
  marketOptions: string[];
  branchOptions: Array<{ id: UUID; label: string }>;
  teamLeaderOptions: Array<{ 
    id: UUID; 
    name?: string | null; 
    arabic_name?: string | null; 
    username?: string | null;
  }>;

  // Locked state
  isRegionLocked?: boolean;
  isCityLocked?: boolean;
  isMarketLocked?: boolean;
  isTeamLeaderLocked?: boolean;

  // Handlers
  onRegionChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onMarketChange: (value: string) => void;
  onBranchChange: (value: UUID | null) => void;
  onTeamLeaderChange: (value: UUID | null) => void;
  onDateFromChange?: (date: string) => void; // YYYY-MM-DD
  onDateToChange?: (date: string) => void; // YYYY-MM-DD
  onReset: () => void;

  // Config
  showBranch?: boolean;
  showTeamLeader?: boolean;
  showDates?: boolean;
  isArabic?: boolean;
  loading?: boolean;
};

// ========== Styles ==========
const capsuleStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'var(--card)',
  border: '1px solid var(--divider)',
  borderRadius: 9999,
  padding: 6,
  whiteSpace: 'nowrap',
};

const itemShell: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  borderRadius: 9999,
  padding: '6px 10px',
  whiteSpace: 'nowrap',
};

const itemLabel: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--muted)',
  whiteSpace: 'nowrap',
};

const chevronStyle: React.CSSProperties = {
  fontSize: 10,
  opacity: 0.7,
  marginInlineStart: 2,
};

const baseField: React.CSSProperties = {
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  color: 'var(--input-text)',
  fontSize: 13,
  minWidth: 90,
};

const capsuleSelect: React.CSSProperties = {
  ...baseField,
  appearance: 'none',
  paddingInlineEnd: 14,
};

const capsuleDateInput: React.CSSProperties = {
  ...baseField,
  minWidth: 120,
  cursor: 'pointer',
};

const resetBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  borderRadius: '50%',
  width: 38,
  height: 38,
  color: 'var(--muted)',
  cursor: 'pointer',
  flexShrink: 0,
};

// ========== Sub-components ==========
function CapsuleItem({ 
  label, 
  locked, 
  children 
}: { 
  label: string; 
  locked?: boolean; 
  children: ReactNode;
}) {
  return (
    <div style={itemShell}>
      <span style={itemLabel}>
        {label} {locked && '🔒'}
      </span>
      <span style={chevronStyle}>▾</span>
      {children}
    </div>
  );
}

// ========== Main Component ==========
export function FilterBar({
  region,
  city,
  market,
  branch,
  teamLeader,
  dateFrom = '',
  dateTo = '',
  regionOptions,
  cityOptions,
  marketOptions,
  branchOptions,
  teamLeaderOptions,
  isRegionLocked = false,
  isCityLocked = false,
  isMarketLocked = false,
  isTeamLeaderLocked = false,
  onRegionChange,
  onCityChange,
  onMarketChange,
  onBranchChange,
  onTeamLeaderChange,
  onDateFromChange,
  onDateToChange,
  onReset,
  showBranch = false,
  showTeamLeader = true,
  showDates = false,
  isArabic = false,
  loading = false,
}: FilterBarProps) {
  const handleDateFromChange = (date: string) => {
    if (onDateFromChange) {
      onDateFromChange(date);
    }
    // If "from" date is after "to" date, clear "to" date
    if (dateTo && date && date > dateTo) {
      if (onDateToChange) {
        onDateToChange('');
      }
    }
  };

  const displayName = (tl: FilterBarProps['teamLeaderOptions'][0]) => {
    return (isArabic ? tl.arabic_name : tl.name) || tl.username || '—';
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
      <div className="filtersRow no-scrollbar">
        <div style={capsuleStyle}>
          {/* Region */}
          <CapsuleItem label={isArabic ? 'المنطقة' : 'Region'} locked={isRegionLocked}>
            <select
              value={region}
              onChange={(e) => onRegionChange(e.target.value)}
              style={capsuleSelect}
              disabled={loading || isRegionLocked}
            >
              {!isRegionLocked && <option value="">{isArabic ? 'الكل' : 'All'}</option>}
              {regionOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </CapsuleItem>

          {/* City */}
          <CapsuleItem label={isArabic ? 'المدينة' : 'City'} locked={isCityLocked}>
            <select
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              style={capsuleSelect}
              disabled={loading || isCityLocked}
            >
              {!isCityLocked && <option value="">{isArabic ? 'الكل' : 'All'}</option>}
              {cityOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </CapsuleItem>

          {/* Market */}
          <CapsuleItem label={isArabic ? 'السوق' : 'Market'} locked={isMarketLocked}>
            <select
              value={market}
              onChange={(e) => onMarketChange(e.target.value)}
              style={capsuleSelect}
              disabled={loading || isMarketLocked}
            >
              {!isMarketLocked && <option value="">{isArabic ? 'الكل' : 'All'}</option>}
              {marketOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </CapsuleItem>

          {/* Branch (optional) */}
          {showBranch && (
            <CapsuleItem label={isArabic ? 'الفرع' : 'Branch'}>
              <select
                value={branch || ''}
                onChange={(e) => onBranchChange(e.target.value || null)}
                style={capsuleSelect}
                disabled={loading}
              >
                <option value="">{isArabic ? 'الكل' : 'All'}</option>
                {branchOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </CapsuleItem>
          )}

          {/* Team Leader (optional) */}
          {showTeamLeader && (
            <CapsuleItem label={isArabic ? 'قائد الفريق' : 'Team Leader'} locked={isTeamLeaderLocked}>
              <select
                value={teamLeader || ''}
                onChange={(e) => onTeamLeaderChange(e.target.value || null)}
                style={capsuleSelect}
                disabled={loading || isTeamLeaderLocked}
              >
                {!isTeamLeaderLocked && <option value="">{isArabic ? 'الكل' : 'All'}</option>}
                {teamLeaderOptions.map((tl) => (
                  <option key={tl.id} value={tl.id}>
                    {displayName(tl)}
                  </option>
                ))}
              </select>
            </CapsuleItem>
          )}

          {/* Date From (optional) */}
          {showDates && onDateFromChange && (
            <CapsuleItem label={isArabic ? 'من' : 'From'}>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                style={capsuleDateInput}
                disabled={loading}
              />
            </CapsuleItem>
          )}

          {/* Date To (optional) */}
          {showDates && onDateToChange && (
            <CapsuleItem label={isArabic ? 'إلى' : 'To'}>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                min={dateFrom || undefined}
                style={capsuleDateInput}
                disabled={loading}
              />
            </CapsuleItem>
          )}

          {/* Reset Button */}
          <button 
            onClick={onReset} 
            style={resetBtnStyle} 
            title={isArabic ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 0 1-9 9m-9-9a9 9 0 0 1 9-9 9 9 0 0 1 6.2 2.7L12 9H5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .filtersRow {
          width: min(1100px, 94vw);
          display: flex;
          overflow-x: auto;
          padding: 6px 8px;
          scroll-snap-type: x mandatory;
        }
        .filtersRow > * {
          scroll-snap-align: start;
        }
        @media (min-width: 640px) {
          .filtersRow {
            overflow-x: visible;
          }
        }
        select option {
          color: #000;
          background: #fff;
        }
        .filtersRow select {
          color: var(--input-text);
          background-color: transparent;
        }
        .filtersRow input[type='date'] {
          color: var(--input-text);
          background-color: transparent;
        }
        .filtersRow input[type='date']::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 0.6;
          filter: invert(0.5);
        }
      `}</style>
    </div>
  );
}