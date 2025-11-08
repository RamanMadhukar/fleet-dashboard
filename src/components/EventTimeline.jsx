import React from 'react'
import { AlertTriangle, Clock, Battery, Signal, Fuel, Zap } from 'lucide-react';

const EventTimeline = ({ trip }) => {
    const importantEvents = trip.alerts.slice(-10).reverse();

    const getEventIcon = (type) => {
        switch (type) {
            case 'speed_violation': return <Zap size={16} />;
            case 'vehicle_stopped': return <Clock size={16} />;
            case 'refueling_started':
            case 'refueling_completed': return <Fuel size={16} />;
            case 'signal_lost':
            case 'signal_recovered': return <Signal size={16} />;
            case 'battery_low': return <Battery size={16} />;
            default: return <AlertTriangle size={16} />;
        }
    };

    const formatEventType = (type) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="event-timeline">
            <h4><Clock size={18} /> Event Timeline</h4>
            {importantEvents.length === 0 ? (
                <p className="timeline-empty">No significant events yet</p>
            ) : (
                <div className="timeline-items">
                    {importantEvents.map((alert, idx) => (
                        <div key={idx} className="timeline-item">
                            <div className="timeline-icon">{getEventIcon(alert.type)}</div>
                            <div className="timeline-content">
                                <div className="timeline-title">{formatEventType(alert.type)}</div>
                                <div className="timeline-time">{new Date(alert.time).toLocaleString()}</div>
                                {alert.data?.stop_duration_minutes && (
                                    <div className="timeline-detail">Duration: {alert.data.stop_duration_minutes} min</div>
                                )}
                                {alert.data?.fuel_added_percent && (
                                    <div className="timeline-detail">Fuel added: {alert.data.fuel_added_percent}%</div>
                                )}
                                {alert.data?.signal_lost_duration_seconds && (
                                    <div className="timeline-detail">Signal lost: {alert.data.signal_lost_duration_seconds}s</div>
                                )}
                                {alert.data?.violation_amount_kmh && (
                                    <div className="timeline-detail">Over limit by: {alert.data.violation_amount_kmh} km/h</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventTimeline