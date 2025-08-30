// Handle Twilio transcription callbacks
import { NextRequest, NextResponse } from 'next/server';
import { storeTranscription } from '../route.js';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const transcriptionText = formData.get('TranscriptionText');
    const recordingSid = formData.get('RecordingSid');
    const callSid = formData.get('CallSid');
    
    console.log('Transcription received:', { transcriptionText, recordingSid, callSid });
    
    // Store transcription using shared storage
    storeTranscription(callSid, recordingSid, transcriptionText);
    
    return new NextResponse('OK');
    
  } catch (error) {
    console.error('Transcription webhook error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}