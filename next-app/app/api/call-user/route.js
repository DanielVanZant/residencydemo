// Simple endpoint to initiate a voice weekly update call
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { phoneNumber, username } = await request.json();
    
    console.log('Initiating call to:', phoneNumber, 'for user:', username);
    
    // Simple mapping of phone numbers to users
    setUserMapping(phoneNumber, username);
    
    // In a real implementation, this would use Twilio to initiate the call
    const callResult = await initiateVoiceCall(phoneNumber);
    
    return NextResponse.json({
      success: true,
      message: 'Call initiated successfully',
      callSid: callResult.callSid
    });
    
  } catch (error) {
    console.error('Error initiating call:', error);
    return NextResponse.json(
      { error: 'Failed to initiate call' },
      { status: 500 }
    );
  }
}

// Simple user mapping (use database in production)
const userMappings = new Map();

function setUserMapping(phoneNumber, username) {
  userMappings.set(phoneNumber, username);
}

function getUserByPhone(phoneNumber) {
  return userMappings.get(phoneNumber) || 'unknown-user';
}

// Real Twilio call initiation
async function initiateVoiceCall(phoneNumber) {
  const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  const call = await client.calls.create({
    to: phoneNumber,
    from: process.env.TWILIO_PHONE_NUMBER,
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/voice-update`
  });
  
  console.log(`Real call initiated to ${phoneNumber}, SID: ${call.sid}`);
  return { callSid: call.sid };
}

// Export for use in other files
export { getUserByPhone };