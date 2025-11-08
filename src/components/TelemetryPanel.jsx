import React from 'react'
import { Activity } from 'lucide-react';

const TelemetryPanel = ({ trip }) => {
    if (!trip.lastTelemetry) {
        return (
            <div className="telemetry-empty">
                <Activity size={32} />
                <p>No telemetry data available</p>
            </div>
        );
    }

    const telemetry = trip.lastTelemetry;

    return (
        <div className="telemetry-panel">
            <h4><Activity size={18} /> Vehicle Telemetry</h4>
            <div className="telemetry-grid">
                <div className="telemetry-item">
                    <span className="telemetry-label">Odometer</span>
                    <span className="telemetry-value">{telemetry.odometer_km?.toLocaleString()} km</span>
                </div>
                <div className="telemetry-item">
                    <span className="telemetry-label">Engine Hours</span>
                    <span className="telemetry-value">{telemetry.engine_hours?.toLocaleString()} hrs</span>
                </div>
                <div className="telemetry-item">
                    <span className="telemetry-label">Coolant Temp</span>
                    <span className="telemetry-value">{telemetry.coolant_temp_celsius}°C</span>
                </div>
                <div className="telemetry-item">
                    <span className="telemetry-label">Oil Pressure</span>
                    <span className="telemetry-value">{telemetry.oil_pressure_kpa} kPa</span>
                </div>
                <div className="telemetry-item">
                    <span className="telemetry-label">Battery Voltage</span>
                    <span className="telemetry-value">{telemetry.battery_voltage}V</span>
                </div>
                <div className="telemetry-item">
                    <span className="telemetry-label">Fuel Level</span>
                    <span className="telemetry-value">{telemetry.fuel_level_percent}%</span>
                </div>
            </div>
        </div>
    );
};

export default TelemetryPanel