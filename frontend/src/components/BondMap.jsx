import React, { useState, useMemo } from 'react';
import { MapPin, X } from 'lucide-react';

// Simplified Ohio county polygons (approximate SVG paths)
// Positioned in a ~400x500 viewBox representing Ohio's shape
const OHIO_COUNTIES = [
  { name: 'Franklin', path: 'M180,230 L220,230 L220,260 L180,260 Z', cx: 200, cy: 245 },
  { name: 'Delaware', path: 'M175,200 L225,200 L225,230 L175,230 Z', cx: 200, cy: 215 },
  { name: 'Licking', path: 'M220,225 L265,225 L265,260 L220,260 Z', cx: 242, cy: 242 },
  { name: 'Fairfield', path: 'M210,260 L255,260 L255,290 L210,290 Z', cx: 232, cy: 275 },
  { name: 'Pickaway', path: 'M175,260 L210,260 L210,295 L175,295 Z', cx: 192, cy: 277 },
  { name: 'Madison', path: 'M140,245 L180,245 L180,280 L140,280 Z', cx: 160, cy: 262 },
  { name: 'Union', path: 'M145,200 L180,200 L180,235 L145,235 Z', cx: 162, cy: 217 },
  { name: 'Marion', path: 'M155,170 L195,170 L195,200 L155,200 Z', cx: 175, cy: 185 },
  { name: 'Morrow', path: 'M195,170 L230,170 L230,200 L195,200 Z', cx: 212, cy: 185 },
  { name: 'Knox', path: 'M225,185 L265,185 L265,220 L225,220 Z', cx: 245, cy: 202 },
  { name: 'Coshocton', path: 'M265,200 L305,200 L305,235 L265,235 Z', cx: 285, cy: 217 },
  { name: 'Ross', path: 'M170,295 L215,295 L215,330 L170,330 Z', cx: 192, cy: 312 },
  { name: 'Hocking', path: 'M215,285 L255,285 L255,315 L215,315 Z', cx: 235, cy: 300 },
  { name: 'Perry', path: 'M250,260 L290,260 L290,290 L250,290 Z', cx: 270, cy: 275 },
  { name: 'Muskingum', path: 'M275,230 L320,230 L320,268 L275,268 Z', cx: 297, cy: 249 },
  { name: 'Clark', path: 'M100,240 L140,240 L140,270 L100,270 Z', cx: 120, cy: 255 },
  { name: 'Champaign', path: 'M110,205 L150,205 L150,240 L110,240 Z', cx: 130, cy: 222 },
  { name: 'Logan', path: 'M120,175 L160,175 L160,205 L120,205 Z', cx: 140, cy: 190 },
  { name: 'Hardin', path: 'M110,145 L150,145 L150,178 L110,178 Z', cx: 130, cy: 161 },
  { name: 'Wyandot', path: 'M150,140 L190,140 L190,172 L150,172 Z', cx: 170, cy: 156 },
  { name: 'Crawford', path: 'M190,135 L230,135 L230,170 L190,170 Z', cx: 210, cy: 152 },
  { name: 'Richland', path: 'M225,145 L265,145 L265,185 L225,185 Z', cx: 245, cy: 165 },
  { name: 'Athens', path: 'M245,310 L290,310 L290,345 L245,345 Z', cx: 267, cy: 327 },
  { name: 'Washington', path: 'M305,260 L350,260 L350,305 L305,305 Z', cx: 327, cy: 282 },
  { name: 'Hamilton', path: 'M50,320 L95,320 L95,360 L50,360 Z', cx: 72, cy: 340 },
  { name: 'Montgomery', path: 'M70,270 L110,270 L110,310 L70,310 Z', cx: 90, cy: 290 },
  { name: 'Greene', path: 'M110,270 L145,270 L145,305 L110,305 Z', cx: 127, cy: 287 },
  { name: 'Butler', path: 'M55,290 L90,290 L90,325 L55,325 Z', cx: 72, cy: 307 },
  { name: 'Cuyahoga', path: 'M210,70 L250,70 L250,100 L210,100 Z', cx: 230, cy: 85 },
  { name: 'Summit', path: 'M240,95 L280,95 L280,130 L240,130 Z', cx: 260, cy: 112 },
  { name: 'Stark', path: 'M270,120 L310,120 L310,158 L270,158 Z', cx: 290, cy: 139 },
  { name: 'Lucas', path: 'M100,55 L145,55 L145,88 L100,88 Z', cx: 122, cy: 71 },
  { name: 'Wood', path: 'M110,85 L155,85 L155,118 L110,118 Z', cx: 132, cy: 101 },
  { name: 'Lorain', path: 'M170,72 L215,72 L215,105 L170,105 Z', cx: 192, cy: 88 },
  { name: 'Medina', path: 'M210,100 L245,100 L245,135 L210,135 Z', cx: 227, cy: 117 },
  { name: 'Wayne', path: 'M240,130 L275,130 L275,165 L240,165 Z', cx: 257, cy: 147 },
  { name: 'Tuscarawas', path: 'M290,155 L330,155 L330,195 L290,195 Z', cx: 310, cy: 175 },
  { name: 'Scioto', path: 'M150,340 L195,340 L195,380 L150,380 Z', cx: 172, cy: 360 },
  { name: 'Lawrence', path: 'M195,355 L240,355 L240,390 L195,390 Z', cx: 217, cy: 372 },
];

function BondMap({ bonds, onCountySelect, selectedCounty }) {
  const [hoveredCounty, setHoveredCounty] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Aggregate bond data per county
  const countyData = useMemo(() => {
    const map = {};
    for (const bond of bonds) {
      const county = (bond.county || '').replace(/\s*county\s*/i, '').trim();
      if (!county) continue;
      if (!map[county]) {
        map[county] = { count: 0, totalRaised: 0, riskScores: [] };
      }
      map[county].count += 1;
      map[county].totalRaised += bond.amount_raised || bond.total_invested || 0;
      map[county].riskScores.push(bond.risk_score || bond.risk_assessment?.risk_score || 50);
    }
    return map;
  }, [bonds]);

  const getCountyOpacity = (name) => {
    const d = countyData[name];
    if (!d) return 0;
    if (d.count >= 6) return 1;
    if (d.count >= 3) return 0.6;
    return 0.3;
  };

  const getCountyInfo = (name) => {
    const d = countyData[name];
    if (!d) return { count: 0, totalRaised: 0, avgRisk: 0 };
    const avgRisk = d.riskScores.length > 0
      ? Math.round(d.riskScores.reduce((a, b) => a + b, 0) / d.riskScores.length)
      : 0;
    return { count: d.count, totalRaised: d.totalRaised, avgRisk };
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amt || 0);

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
          <MapPin className="inline h-4 w-4 mr-1" style={{ color: 'var(--accent-green)' }} />
          Ohio Bond Map
        </h2>
        {selectedCounty && (
          <button
            onClick={() => onCountySelect(null)}
            className="btn-secondary !px-3 !py-1.5 !text-xs !rounded-lg !h-auto"
          >
            <X className="h-3 w-3" /> View All
          </button>
        )}
      </div>

      <div className="relative">
        <svg viewBox="30 40 340 370" className="w-full max-w-lg mx-auto" style={{ maxHeight: 420 }}>
          {/* Ohio outline approximation */}
          <path
            d="M80,50 L170,45 L250,55 L300,65 L340,80 L355,120 L350,160 L340,200 L330,240 L340,280 L330,320 L300,350 L260,370 L220,390 L180,385 L150,370 L120,340 L90,310 L60,290 L50,260 L55,220 L65,180 L70,140 L75,100 Z"
            fill="var(--bg-elevated)"
            stroke="var(--border)"
            strokeWidth="1"
          />

          {/* County polygons */}
          {OHIO_COUNTIES.map((county) => {
            const opacity = getCountyOpacity(county.name);
            const isSelected = selectedCounty === county.name;
            const isHovered = hoveredCounty === county.name;
            return (
              <g key={county.name}>
                <path
                  d={county.path}
                  fill={opacity > 0 ? 'var(--accent-green)' : 'var(--bg-elevated)'}
                  fillOpacity={isSelected ? 1 : isHovered ? Math.max(opacity, 0.4) : opacity || 0.05}
                  stroke={isSelected ? 'var(--accent-green)' : isHovered ? 'var(--text-secondary)' : 'var(--border)'}
                  strokeWidth={isSelected ? 2 : 0.5}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={(e) => {
                    setHoveredCounty(county.name);
                    const rect = e.currentTarget.closest('svg').getBoundingClientRect();
                    const pt = e.currentTarget.getBoundingClientRect();
                    setTooltipPos({
                      x: pt.left - rect.left + pt.width / 2,
                      y: pt.top - rect.top - 10,
                    });
                  }}
                  onMouseLeave={() => setHoveredCounty(null)}
                  onClick={() => onCountySelect(isSelected ? null : county.name)}
                />
                {opacity > 0 && (
                  <text
                    x={county.cx}
                    y={county.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="7"
                    fill={opacity >= 0.6 ? '#ffffff' : 'var(--text-muted)'}
                    className="pointer-events-none"
                    fontWeight="500"
                  >
                    {county.name.slice(0, 4)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredCounty && (() => {
          const info = getCountyInfo(hoveredCounty);
          return (
            <div
              className="absolute pointer-events-none rounded-lg px-3 py-2 text-xs"
              style={{
                left: `50%`,
                top: 0,
                transform: 'translateX(-50%)',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                color: 'var(--text-primary)',
                zIndex: 10,
              }}
            >
              <p className="font-medium">{hoveredCounty} County</p>
              <p style={{ color: 'var(--text-muted)' }}>
                {info.count} bond{info.count !== 1 ? 's' : ''} · {formatCurrency(info.totalRaised)} raised
                {info.avgRisk > 0 && ` · Risk: ${info.avgRisk}`}
              </p>
            </div>
          );
        })()}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 justify-center">
        {[
          { label: 'No bonds', opacity: 0.05 },
          { label: '1-2', opacity: 0.3 },
          { label: '3-5', opacity: 0.6 },
          { label: '6+', opacity: 1 },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <div
              className="h-3 w-3 rounded-sm"
              style={{
                backgroundColor: item.opacity > 0.05 ? 'var(--accent-green)' : 'var(--bg-elevated)',
                opacity: item.opacity > 0.05 ? item.opacity : 1,
                border: '1px solid var(--border)',
              }}
            />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BondMap;
