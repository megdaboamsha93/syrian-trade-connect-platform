-- Update all example businesses to be owned by an existing different user
-- This prevents the current user from "messaging themselves" when trying example businesses
UPDATE businesses 
SET owner_id = '7e83deec-f372-42b2-962a-6eb0ba6ef21d'
WHERE is_example = true;

-- Add conversation management columns
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS participant_1_blocked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS participant_1_muted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS participant_2_blocked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS participant_2_muted boolean DEFAULT false;

-- Create function to delete conversation for a user
CREATE OR REPLACE FUNCTION delete_conversation_for_user(_conversation_id uuid, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conversation record;
BEGIN
  SELECT * INTO _conversation
  FROM conversations
  WHERE id = _conversation_id;
  
  IF _conversation.participant_1_id != _user_id AND _conversation.participant_2_id != _user_id THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;
  
  DELETE FROM conversations WHERE id = _conversation_id;
END;
$$;

-- Create function to block/unblock a user in conversation
CREATE OR REPLACE FUNCTION set_conversation_block(_conversation_id uuid, _user_id uuid, _blocked boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conversation record;
BEGIN
  SELECT * INTO _conversation
  FROM conversations
  WHERE id = _conversation_id;
  
  IF _conversation.participant_1_id != _user_id AND _conversation.participant_2_id != _user_id THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;
  
  IF _conversation.participant_1_id = _user_id THEN
    UPDATE conversations
    SET participant_1_blocked = _blocked
    WHERE id = _conversation_id;
  ELSE
    UPDATE conversations
    SET participant_2_blocked = _blocked
    WHERE id = _conversation_id;
  END IF;
END;
$$;

-- Create function to mute/unmute a conversation
CREATE OR REPLACE FUNCTION set_conversation_mute(_conversation_id uuid, _user_id uuid, _muted boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conversation record;
BEGIN
  SELECT * INTO _conversation
  FROM conversations
  WHERE id = _conversation_id;
  
  IF _conversation.participant_1_id != _user_id AND _conversation.participant_2_id != _user_id THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;
  
  IF _conversation.participant_1_id = _user_id THEN
    UPDATE conversations
    SET participant_1_muted = _muted
    WHERE id = _conversation_id;
  ELSE
    UPDATE conversations
    SET participant_2_muted = _muted
    WHERE id = _conversation_id;
  END IF;
END;
$$;