// Simple voice-based weekly update system
import { NextRequest, NextResponse } from 'next/server';

// Phone to user mapping (import from call-user endpoint)
const userMappings = new Map();
function getUserByPhone(phoneNumber) {
  return userMappings.get(phoneNumber) || 'voice-user';
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const digits = formData.get('Digits');
    const recordingUrl = formData.get('RecordingUrl');
    const callSid = formData.get('CallSid');
    const from = formData.get('From');
    
    // Get or create call state
    let callState = getCallState(callSid);
    
    console.log('Voice call webhook:', { digits, recordingUrl, callSid, from, currentQuestion: callState.currentQuestion });
    
    // Start of call
    if (!callState.currentQuestion) {
      callState = {
        callSid,
        currentQuestion: 1,
        responses: {},
        userPhone: from
      };
      setCallState(callSid, callState);
      
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">Hi! This is your weekly update call. I'll ask you 5 questions about your week. Let's start.</Say>
          <Say voice="alice">Question 1: What did you accomplish this week?</Say>
          <Record timeout="30" maxLength="120" action="/api/voice-update" transcribe="true"/>
        </Response>`,
        {
          headers: { 'Content-Type': 'text/xml' }
        }
      );
    }
    
    // Handle recording response
    if (recordingUrl && callState.currentQuestion <= 5) {
      // Store the recording URL for this question
      callState.responses[`question${callState.currentQuestion}`] = recordingUrl;
      callState.currentQuestion++;
      setCallState(callSid, callState);
      
      // Ask next question
      if (callState.currentQuestion === 2) {
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="alice">Question 2: What's blocking you right now, and what will you focus on next week to move forward?</Say>
            <Record timeout="30" maxLength="120" action="/api/voice-update" transcribe="true"/>
          </Response>`,
          {
            headers: { 'Content-Type': 'text/xml' }
          }
        );
      }
      
      if (callState.currentQuestion === 3) {
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="alice">Question 3: What's your north star metric value this week, and any notes about your progress?</Say>
            <Record timeout="30" maxLength="120" action="/api/voice-update" transcribe="true"/>
          </Response>`,
          {
            headers: { 'Content-Type': 'text/xml' }
          }
        );
      }
      
      if (callState.currentQuestion === 4) {
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="alice">Question 4: Can you provide more specific details about your most significant accomplishment or challenge this week?</Say>
            <Record timeout="30" maxLength="120" action="/api/voice-update" transcribe="true"/>
          </Response>`,
          {
            headers: { 'Content-Type': 'text/xml' }
          }
        );
      }
      
      if (callState.currentQuestion === 5) {
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="alice">Question 5: Any updates on ongoing projects or initiatives we haven't covered yet?</Say>
            <Record timeout="30" maxLength="120" action="/api/voice-update" transcribe="true"/>
          </Response>`,
          {
            headers: { 'Content-Type': 'text/xml' }
          }
        );
      }
      
      // All questions done
      if (callState.currentQuestion > 5) {
        // Process all recordings and create draft
        processCallAndCreateDraft(callState);
        
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="alice">Thank you! I'm processing your responses and creating your weekly update draft. You'll receive a text message with the link when it's ready.</Say>
            <Hangup/>
          </Response>`,
          {
            headers: { 'Content-Type': 'text/xml' }
          }
        );
      }
    }
    
    // Fallback
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="alice">Sorry, something went wrong. Please try again.</Say>
        <Hangup/>
      </Response>`,
      {
        headers: { 'Content-Type': 'text/xml' }
      }
    );
    
  } catch (error) {
    console.error('Voice webhook error:', error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="alice">Sorry, there was an error. Please try again later.</Say>
        <Hangup/>
      </Response>`,
      {
        headers: { 'Content-Type': 'text/xml' }
      }
    );
  }
}

// Simple in-memory call state storage (use Redis/DB in production)
const callStates = new Map();

function getCallState(callSid) {
  return callStates.get(callSid) || {};
}

function setCallState(callSid, state) {
  callStates.set(callSid, state);
}

// Transcription storage (shared with transcription webhook)
const transcriptions = new Map();

function getTranscriptions(callSid) {
  return transcriptions.get(callSid) || new Map();
}

function storeTranscription(callSid, recordingSid, text) {
  if (!transcriptions.has(callSid)) {
    transcriptions.set(callSid, new Map());
  }
  transcriptions.get(callSid).set(recordingSid, text);
}

// Export for use in transcription webhook
export { storeTranscription };

// Process recordings and create draft
async function processCallAndCreateDraft(callState) {
  try {
    console.log('Processing call and creating draft for:', callState.callSid);
    
    // Get transcriptions from Twilio (they come via transcription webhook)
    const transcriptions = getTranscriptions(callState.callSid);
    
    const responses = {
      accomplishments: transcriptions.get(callState.responses.question1) || "Voice response from question 1",
      'challenges-priorities': transcriptions.get(callState.responses.question2) || "Voice response from question 2", 
      northStarNote: transcriptions.get(callState.responses.question3) || "Voice response from question 3",
      'dynamic-followup-detail': transcriptions.get(callState.responses.question4) || "Voice response from question 4",
      'dynamic-followup-previous': transcriptions.get(callState.responses.question5) || "Voice response from question 5"
    };
    
    const username = getUserByPhone(callState.userPhone);
    
    // Create draft using existing system
    const draftResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/drafts/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        weekDate: new Date().toISOString().split('T')[0],
        questionResponses: responses,
        stage: 'editing'
      })
    });
    
    if (draftResponse.ok) {
      const draftResult = await draftResponse.json();
      console.log('Draft created:', draftResult.draftId);
      
      // TODO: Send SMS with draft link
      // await sendSMS(callState.userPhone, `Your weekly update draft is ready: ${process.env.NEXT_PUBLIC_BASE_URL}/draft/${draftResult.draftId}`);
    }
    
  } catch (error) {
    console.error('Error processing call:', error);
  }
}