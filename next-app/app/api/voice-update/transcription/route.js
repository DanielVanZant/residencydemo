// Handle Twilio transcription callbacks
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory transcription storage (use Redis/DB in production)
const transcriptions = new Map();

function storeTranscription(callSid, recordingSid, text) {
  if (!transcriptions.has(callSid)) {
    transcriptions.set(callSid, new Map());
  }
  transcriptions.get(callSid).set(recordingSid, text);
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const transcriptionText = formData.get('TranscriptionText');
    const recordingSid = formData.get('RecordingSid');
    const callSid = formData.get('CallSid');
    
    console.log('Transcription received:', { transcriptionText, recordingSid, callSid });
    
    // Store transcription using local storage
    storeTranscription(callSid, recordingSid, transcriptionText);
    
    return new NextResponse('OK');
    
  } catch (error) {
    console.error('Transcription webhook error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}