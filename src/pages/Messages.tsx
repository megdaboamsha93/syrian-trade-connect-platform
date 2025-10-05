
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Send, ChevronRight, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { Tables } from '@/integrations/supabase/types';

type Conversation = Tables<'conversations'>;
type Message = Tables<'messages'>;
type Profile = Tables<'profiles'>;
type Business = Tables<'businesses'>;

interface ConversationWithDetails extends Conversation {
  otherParticipantProfile?: Profile;
  otherParticipantBusiness?: Business;
  lastMessage?: Message;
}

const Messages: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { businessId } = useParams<{ businessId: string }>();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;
    
    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching conversations:', error);
        return;
      }
      
      // Fetch details for each conversation
      const conversationsWithDetails = await Promise.all(
        data.map(async (conv) => {
          const otherParticipantId = conv.participant_1_id === user.id 
            ? conv.participant_2_id 
            : conv.participant_1_id;
          
          // Fetch profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherParticipantId)
            .maybeSingle();
          
          // Fetch business if owner
          const { data: business } = await supabase
            .from('businesses')
            .select('*')
            .eq('owner_id', otherParticipantId)
            .maybeSingle();
          
          // Fetch last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          return {
            ...conv,
            otherParticipantProfile: profile || undefined,
            otherParticipantBusiness: business || undefined,
            lastMessage: lastMsg || undefined,
          };
        })
      );
      
      setConversations(conversationsWithDetails);
      setLoading(false);
    };
    
    fetchConversations();
  }, [user]);

  // Handle businessId parameter - create/find conversation
  useEffect(() => {
    if (!user || !businessId) return;
    
    const handleBusinessConversation = async () => {
      // Get business owner
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('owner_id')
        .eq('id', businessId)
        .maybeSingle();
      
      if (businessError || !business) {
        toast({
          title: 'Error',
          description: 'Business not found',
          variant: 'destructive',
        });
        navigate('/browse');
        return;
      }
      
      // Create or get conversation
      const { data: conversationId, error } = await supabase
        .rpc('get_or_create_conversation', {
          _participant_1_id: user.id,
          _participant_2_id: business.owner_id,
        });
      
      if (error || !conversationId) {
        console.error('Error creating conversation:', error);
        toast({
          title: 'Error',
          description: 'Failed to create conversation',
          variant: 'destructive',
        });
        return;
      }
      
      // Fetch the conversation
      const { data: conv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
      
      if (conv) {
        const otherParticipantId = conv.participant_1_id === user.id 
          ? conv.participant_2_id 
          : conv.participant_1_id;
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherParticipantId)
          .maybeSingle();
        
        const { data: businessData } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', businessId)
          .maybeSingle();
        
        setSelectedConversation({
          ...conv,
          otherParticipantProfile: profile || undefined,
          otherParticipantBusiness: businessData || undefined,
        });
      }
    };
    
    handleBusinessConversation();
  }, [businessId, user]);

  // Fetch messages when conversation selected
  useEffect(() => {
    if (!selectedConversation || !user) return;
    
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation.id)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }
      
      setMessages(data);
      
      // Mark messages as read
      await supabase.rpc('mark_messages_read', {
        _conversation_id: selectedConversation.id,
        _user_id: user.id,
      });
    };
    
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`conversation:${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
          
          // Mark as read if not from current user
          if (newMessage.sender_id !== user.id) {
            supabase.rpc('mark_messages_read', {
              _conversation_id: selectedConversation.id,
              _user_id: user.id,
            });
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedConversation || !user || sending) return;

    setSending(true);
    
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: message.trim(),
      });
    
    if (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
    
    setMessage('');
    setSending(false);
  };

  const renderMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const messageTemplates = [
    {
      id: 'inquiry',
      title: t('messages.template.inquiry'),
      content: 'I am interested in your products. Could you please provide more information about availability and pricing?'
    },
    {
      id: 'pricing',
      title: t('messages.template.pricing'),
      content: 'I would like to request a price quotation for your products. What are your current rates?'
    },
    {
      id: 'partnership',
      title: t('messages.template.partnership'),
      content: 'I am interested in discussing a potential business partnership. When would be a good time to schedule a call?'
    }
  ];

  const getParticipantName = (conv: ConversationWithDetails) => {
    if (conv.otherParticipantBusiness) {
      return language === 'en' 
        ? conv.otherParticipantBusiness.name_en 
        : conv.otherParticipantBusiness.name_ar;
    }
    return conv.otherParticipantProfile?.full_name || 'Unknown';
  };

  const getUnreadCount = (conv: Conversation) => {
    if (!user) return 0;
    return conv.participant_1_id === user.id 
      ? conv.participant_1_unread || 0
      : conv.participant_2_unread || 0;
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-6 py-4 h-screen flex flex-col">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">{t('messages.title')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Conversations List */}
        <div className="md:col-span-1 bg-card rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-muted/30 border-b font-medium">
            {t('messages.title')}
          </div>
          <div className="divide-y overflow-y-auto flex-1">
            {loading ? (
              <div className="p-6 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              conversations.map((convo) => {
                const isActive = selectedConversation?.id === convo.id;
                const unreadCount = getUnreadCount(convo);
                
                return (
                  <div
                    key={convo.id}
                    className={`p-4 cursor-pointer hover:bg-muted/30 transition-colors ${isActive ? 'bg-muted/30' : ''}`}
                    onClick={() => {
                      navigate('/messages');
                      setSelectedConversation(convo);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium">{getParticipantName(convo)}</div>
                      {unreadCount > 0 && (
                        <Badge variant="default" className="ml-2">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {convo.lastMessage?.content || 'No messages yet'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {convo.lastMessage ? renderMessageTime(convo.lastMessage.created_at) : ''}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="md:col-span-2 lg:col-span-3 bg-card rounded-lg shadow-sm overflow-hidden flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-muted/30 border-b">
                <div className="font-medium">
                  {getParticipantName(selectedConversation)}
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isCurrentUser = msg.sender_id === user?.id;
                    
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] rounded-lg p-3 ${
                            isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                          <div 
                            className={`text-xs mt-1 ${
                              isCurrentUser ? 'opacity-70' : 'text-muted-foreground'
                            }`}
                          >
                            {renderMessageTime(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Templates Tab */}
              <div className="bg-muted/30 p-3 border-t">
                <Tabs defaultValue="message">
                  <TabsList>
                    <TabsTrigger value="message">Message</TabsTrigger>
                    <TabsTrigger value="templates">{t('messages.templates')}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="message" className="pt-3">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        placeholder={t('messages.writeMessage')}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="submit" disabled={!message.trim() || sending}>
                        {sending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        {t('messages.send')}
                      </Button>
                    </form>
                  </TabsContent>
                  <TabsContent value="templates" className="pt-3">
                    <div className="grid grid-cols-1 gap-2">
                      {messageTemplates.map(template => (
                        <Button 
                          key={template.id}
                          variant="outline" 
                          className="justify-between"
                          onClick={() => setMessage(template.content)}
                        >
                          <span>{template.title}</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-muted-foreground">
                {t('messages.noMessages')}
              </div>
              <Button asChild className="mt-4">
                <Link to="/browse">
                  {t('browse.title')}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
