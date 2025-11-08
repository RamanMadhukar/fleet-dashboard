import React from 'react'

const MetricCard = ({ icon, label, value, color, subtitle }) => (
    <div className="metric-card">
        <div className={`metric-icon ${color}`}>
            {icon}
            <span className="metric-label">{label}</span>
        </div>
        <div className="metric-value">{value}</div>
        {subtitle && <div className="metric-subtitle">{subtitle}</div>}
    </div>
);

export default MetricCard