import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  record: {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    const { record } = payload;

    // For now, just log the notification
    // In production, you would:
    // 1. Get the receiver's email from the conversation
    // 2. Send email using Resend
    console.log('New message notification:', {
      conversation_id: record.conversation_id,
      sender_id: record.sender_id,
      message_preview: record.content.substring(0, 50),
    });

    /* 
    // Uncomment and configure when ready to enable email notifications
    
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Get conversation details and receiver info
    const { data: conversation } = await supabaseClient
      .from('conversations')
      .select('participant_1_id, participant_2_id')
      .eq('id', record.conversation_id)
      .single();

    const receiverId = conversation.participant_1_id === record.sender_id
      ? conversation.participant_2_id
      : conversation.participant_1_id;

    // Get receiver's email
    const { data: receiver } = await supabaseAdmin.auth.admin.getUserById(receiverId);

    if (!receiver?.user?.email) {
      console.log('Receiver email not found');
      return new Response(JSON.stringify({ success: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'notifications@yourdomain.com',
        to: receiver.user.email,
        subject: 'New Message',
        html: `
          <h2>You have a new message</h2>
          <p>${record.content.substring(0, 100)}...</p>
          <p><a href="${Deno.env.get('APP_URL')}/messages">View Message</a></p>
        `,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    */

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-message-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});