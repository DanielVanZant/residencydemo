// Simple test page for voice weekly updates
'use client';

import { useState } from 'react';

export default function VoiceTestPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('steve-wozniak');
  const [status, setStatus] = useState('');

  const initiateCall = async () => {
    try {
      setStatus('Initiating call...');
      
      const response = await fetch('/api/call-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, username })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStatus(`Call initiated! Call SID: ${result.callSid}`);
      } else {
        setStatus('Error: ' + result.error);
      }
    } catch (error: any) {
      setStatus('Error: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Voice Weekly Update Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Phone Number (with +1):</label><br/>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+1234567890"
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Username:</label><br/>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>
      
      <button
        onClick={initiateCall}
        disabled={!phoneNumber || !username}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: phoneNumber && username ? 'pointer' : 'not-allowed'
        }}
      >
        Start Voice Weekly Update
      </button>
      
      {status && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px'
        }}>
          {status}
        </div>
      )}
      
      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <h3>How it works:</h3>
        <ol>
          <li>Enter your phone number and username</li>
          <li>Click "Start Voice Weekly Update"</li>
          <li>You'll receive a call asking 5 questions</li>
          <li>Answer each question after the beep</li>
          <li>Your responses will be transcribed and a draft will be created</li>
        </ol>
        
        <p><strong>Note:</strong> This is a test implementation. In production, you'd need real Twilio credentials configured.</p>
      </div>
    </div>
  );
}