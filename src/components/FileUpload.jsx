import React from 'react'
import { Truck, AlertTriangle, Upload } from 'lucide-react';

const FileUpload = ({ onFilesLoaded }) => {
    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files);
        const allLoadedEvents = [];

        for (const file of files) {
            try {
                const text = await file.text();
                const events = JSON.parse(text);

                const tripName = file.name.replace('.json', '').replace(/_/g, ' ');
                events.forEach(event => {
                    event.tripName = tripName;
                    event.parsedTimestamp = new Date(event.timestamp).getTime();
                });

                allLoadedEvents.push(...events);
            } catch (error) {
                console.error(`Error loading ${file.name}:`, error);
            }
        }

        allLoadedEvents.sort((a, b) => a.parsedTimestamp - b.parsedTimestamp);
        onFilesLoaded(allLoadedEvents);
    };

    return (
        <div className="upload-container">
            <div className="upload-header">
                <Truck className="upload-icon" />
                <h1>Fleet Tracking Dashboard</h1>
                <p>Upload your trip JSON files to begin</p>
            </div>

            <div className="upload-box">
                <label className="upload-label">
                    <input
                        type="file"
                        multiple
                        accept=".json"
                        onChange={handleFileUpload}
                        className="upload-input"
                    />
                    <div className="upload-content">
                        <Upload className="upload-icon-large" />
                        <p className="upload-title">Click to upload JSON files</p>
                        <p className="upload-subtitle">
                            Upload trip_1.json, trip_2.json, etc. (multiple files supported)
                        </p>
                    </div>
                </label>
            </div>

            <div className="upload-info">
                <h3 className="info-title">
                    <AlertTriangle size={18} />
                    Expected File Format
                </h3>
                <pre className="info-code">
                    {`[
                        {
                            "event_type": "location_ping",
                            "timestamp": "2025-11-07T05:54:52.363Z",
                            "vehicle_id": "VH_001",
                            "trip_id": "trip_20251103_080000",
                            "location": { "lat": 34.052336, "lng": -118.243564 },
                            ...
                        }
                    ]`}
                </pre>
            </div>
        </div>
    );
};

export default FileUpload