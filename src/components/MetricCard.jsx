import React from 'react'

const MetricCard = ({ icon, label, value, color }) => (
    <div className="metric-card">
        <div className={`metric-icon ${color}`}>
            {icon}
            <span className="metric-label">{label}</span>
        </div>
        <div className="metric-value">{value}</div>
    </div>
);

export default MetricCard