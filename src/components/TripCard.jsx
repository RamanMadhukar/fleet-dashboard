import React from 'react'
import { AlertTriangle, Gauge, Clock, Battery, Signal, Fuel, Map as MapIcon } from 'lucide-react';

const TripCard = ({ trip, isSelected, onClick }) => {
    const statusColors = {
        active: 'status-active',
        completed: 'status-completed',
        cancelled: 'status-cancelled'
    };

    const signalColors = {
        excellent: 'signal-excellent',
        good: 'signal-good',
        fair: 'signal-fair',
        poor: 'signal-poor',
        unknown: 'signal-unknown'
    };

    return (
        <div
            onClick={onClick}
            className={`trip-card ${isSelected ? statusColors[trip.status] : ''}`}
        >
            <div className="trip-header">
                <div>
                    <h3 className="trip-name">{trip.name}</h3>
                    <p className="trip-vehicle">{trip.vehicle}</p>
                </div>
                <div className={`trip-status ${statusColors[trip.status]}`}>
                    {trip.status.toUpperCase()}
                </div>
            </div>

            <div className="progress-section">
                <div className="progress-header">
                    <span>Progress</span>
                    <span className="progress-percent">{Math.round(trip.progress)}%</span>
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${trip.progress}%` }}
                    />
                </div>
            </div>

            <div className="trip-stats">
                <div className="stat">
                    <div className="stat-label"><Gauge size={12} /> Speed</div>
                    <div className="stat-value">{Math.round(trip.speed)} km/h</div>
                </div>
                <div className="stat">
                    <div className="stat-label"><MapIcon size={12} /> Distance</div>
                    <div className="stat-value">{Math.round(trip.distance)} km</div>
                </div>
                <div className="stat">
                    <div className="stat-label"><Battery size={12} /> Battery</div>
                    <div className="stat-value">{Math.round(trip.battery)}%</div>
                </div>
                <div className="stat">
                    <div className="stat-label"><Signal size={12} /> Signal</div>
                    <div className={`stat-value ${signalColors[trip.signalQuality]}`}>
                        {trip.signalQuality.toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Enhanced Stats */}
            <div className="trip-enhanced-stats">
                <div className="enhanced-stat">
                    <Clock size={14} />
                    <span>{trip.stopDuration} min stopped</span>
                </div>
                <div className="enhanced-stat">
                    <Fuel size={14} />
                    <span>{trip.refuelingCount} refuelings</span>
                </div>
                <div className="enhanced-stat">
                    <AlertTriangle size={14} />
                    <span>{trip.speedViolations} violations</span>
                </div>
            </div>

            {trip.alerts.length > 0 && (
                <div className="trip-alerts">
                    <AlertTriangle size={16} />
                    <span>{trip.alerts.length} alert(s)</span>
                </div>
            )}

            <div className="trip-footer">
                <span>{trip.eventCount} events</span>
                {trip.lastUpdate && <span>{new Date(trip.lastUpdate).toLocaleTimeString()}</span>}
            </div>
        </div>
    );
};

export default TripCard