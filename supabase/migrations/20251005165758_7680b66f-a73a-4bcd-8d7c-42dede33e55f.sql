-- Order participants in conversation RPC and prevent self-conversations
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
  _p1 uuid;
  _p2 uuid;
BEGIN
  -- Order participants to satisfy conversations_check constraint
  IF _participant_1_id < _participant_2_id THEN
    _p1 := _participant_1_id;
    _p2 := _participant_2_id;
  ELSE
    _p1 := _participant_2_id;
    _p2 := _participant_1_id;
  END IF;

  -- Disallow creating conversation with self
  IF _p1 = _p2 THEN
    RAISE EXCEPTION 'Cannot create a conversation with yourself';
  END IF;

  -- Find existing conversation
  SELECT id INTO _conversation_id
  FROM public.conversations
  WHERE participant_1_id = _p1 AND participant_2_id = _p2
  LIMIT 1;

  -- Create if not exists
  IF _conversation_id IS NULL THEN
    INSERT INTO public.conversations (participant_1_id, participant_2_id)
    VALUES (_p1, _p2)
    RETURNING id INTO _conversation_id;
  END IF;

  RETURN _conversation_id;
END;
$$;