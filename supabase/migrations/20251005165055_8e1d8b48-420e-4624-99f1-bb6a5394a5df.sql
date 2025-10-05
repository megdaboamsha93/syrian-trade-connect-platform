-- Enable realtime for conversations and messages tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON public.conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON public.conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Function to create or get existing conversation
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  _participant_1_id uuid,
  _participant_2_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conversation_id uuid;
BEGIN
  -- Check if conversation already exists (in either direction)
  SELECT id INTO _conversation_id
  FROM public.conversations
  WHERE (participant_1_id = _participant_1_id AND participant_2_id = _participant_2_id)
     OR (participant_1_id = _participant_2_id AND participant_2_id = _participant_1_id)
  LIMIT 1;
  
  -- If conversation doesn't exist, create it
  IF _conversation_id IS NULL THEN
    INSERT INTO public.conversations (participant_1_id, participant_2_id)
    VALUES (_participant_1_id, _participant_2_id)
    RETURNING id INTO _conversation_id;
  END IF;
  
  RETURN _conversation_id;
END;
$$;

-- Function to update conversation timestamp and unread count
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conversation record;
BEGIN
  -- Get conversation details
  SELECT * INTO _conversation
  FROM public.conversations
  WHERE id = NEW.conversation_id;
  
  -- Update last_message_at and increment unread count for receiver
  IF _conversation.participant_1_id = NEW.sender_id THEN
    UPDATE public.conversations
    SET last_message_at = NEW.created_at,
        participant_2_unread = participant_2_unread + 1
    WHERE id = NEW.conversation_id;
  ELSE
    UPDATE public.conversations
    SET last_message_at = NEW.created_at,
        participant_1_unread = participant_1_unread + 1
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_message();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_read(
  _conversation_id uuid,
  _user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conversation record;
BEGIN
  -- Get conversation details
  SELECT * INTO _conversation
  FROM public.conversations
  WHERE id = _conversation_id;
  
  -- Verify user is a participant
  IF _conversation.participant_1_id != _user_id AND _conversation.participant_2_id != _user_id THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;
  
  -- Mark messages as read
  UPDATE public.messages
  SET is_read = true
  WHERE conversation_id = _conversation_id
    AND sender_id != _user_id
    AND is_read = false;
  
  -- Reset unread count
  IF _conversation.participant_1_id = _user_id THEN
    UPDATE public.conversations
    SET participant_1_unread = 0
    WHERE id = _conversation_id;
  ELSE
    UPDATE public.conversations
    SET participant_2_unread = 0
    WHERE id = _conversation_id;
  END IF;
END;
$$;