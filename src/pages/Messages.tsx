import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Send, Search, MoreVertical, ArrowLeft, User as UserIcon, Trash2, Ban, BellOff, BellRing } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  const { t, language, dir } = useLanguage();
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
        .select('owner_id, is_example')
        .eq('id', businessId)
        .maybeSingle();
      
      if (businessError || !business) {
        toast({
          title: t('messages.businessNotFound'),
          description: t('messages.businessNotFound'),
          variant: 'destructive',
        });
        navigate('/browse');
        return;
      }

      // Messaging now allowed for all businesses except your own (handled below)

      // Check if user is trying to message their own non-demo business
      if (business.owner_id === user.id && !business.is_example) {
        toast({
          title: t('messages.cannotMessageOwnBusiness'),
          description: t('messages.cannotMessageOwnBusiness'),
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
          title: t('messages.failedToCreateConversation'),
          description: t('messages.failedToCreateConversation'),
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
        title: t('messages.failedToSendMessage'),
        description: t('messages.failedToSendMessage'),
        variant: 'destructive',
      });
    }
    
    setMessage('');
    setSending(false);
  };

  const renderMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return t('messages.yesterday');
    } else if (days < 7) {
      return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getParticipantName = (conv: ConversationWithDetails) => {
    if (conv.otherParticipantBusiness) {
      return language === 'en' 
        ? conv.otherParticipantBusiness.name_en 
        : conv.otherParticipantBusiness.name_ar;
    }
    return conv.otherParticipantProfile?.full_name || 'Unknown User';
  };

  const getParticipantInitials = (conv: ConversationWithDetails) => {
    const name = getParticipantName(conv);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUnreadCount = (conv: Conversation) => {
    if (!user) return 0;
    return conv.participant_1_id === user.id 
      ? conv.participant_1_unread || 0
      : conv.participant_2_unread || 0;
  };

  const filteredConversations = conversations.filter(conv => 
    getParticipantName(conv).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteConversation = async () => {
    if (!selectedConversation || !user) return;
    
    try {
      const { error } = await supabase.rpc('delete_conversation_for_user', {
        _conversation_id: selectedConversation.id,
        _user_id: user.id,
      });
      
      if (error) throw error;
      
      toast({
        title: t('messages.conversationDeleted'),
        description: t('messages.conversationDeleted'),
      });
      
      setConversations(prev => prev.filter(c => c.id !== selectedConversation.id));
      setSelectedConversation(null);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: t('messages.failedToDelete'),
        description: t('messages.failedToDelete'),
        variant: 'destructive',
      });
    }
  };

  const handleBlockUser = async () => {
    if (!selectedConversation || !user) return;
    
    const isBlocked = selectedConversation.participant_1_id === user.id
      ? selectedConversation.participant_1_blocked
      : selectedConversation.participant_2_blocked;
    
    try {
      const { error } = await supabase.rpc('set_conversation_block', {
        _conversation_id: selectedConversation.id,
        _user_id: user.id,
        _blocked: !isBlocked,
      });
      
      if (error) throw error;
      
      toast({
        title: isBlocked ? t('messages.userUnblocked') : t('messages.userBlocked'),
        description: isBlocked ? t('messages.userUnblocked') : t('messages.userBlocked'),
      });
      
      // Update local state
      setConversations(prev => prev.map(c => {
        if (c.id === selectedConversation.id) {
          if (c.participant_1_id === user.id) {
            return { ...c, participant_1_blocked: !isBlocked };
          } else {
            return { ...c, participant_2_blocked: !isBlocked };
          }
        }
        return c;
      }));
      
      if (selectedConversation.participant_1_id === user.id) {
        setSelectedConversation({ ...selectedConversation, participant_1_blocked: !isBlocked });
      } else {
        setSelectedConversation({ ...selectedConversation, participant_2_blocked: !isBlocked });
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      toast({
        title: t('messages.failedToBlock'),
        description: t('messages.failedToBlock'),
        variant: 'destructive',
      });
    }
  };

  const handleMuteConversation = async () => {
    if (!selectedConversation || !user) return;
    
    const isMuted = selectedConversation.participant_1_id === user.id
      ? selectedConversation.participant_1_muted
      : selectedConversation.participant_2_muted;
    
    try {
      const { error } = await supabase.rpc('set_conversation_mute', {
        _conversation_id: selectedConversation.id,
        _user_id: user.id,
        _muted: !isMuted,
      });
      
      if (error) throw error;
      
      toast({
        title: isMuted ? t('messages.conversationUnmuted') : t('messages.conversationMuted'),
        description: isMuted ? t('messages.conversationUnmuted') : t('messages.conversationMuted'),
      });
      
      // Update local state
      setConversations(prev => prev.map(c => {
        if (c.id === selectedConversation.id) {
          if (c.participant_1_id === user.id) {
            return { ...c, participant_1_muted: !isMuted };
          } else {
            return { ...c, participant_2_muted: !isMuted };
          }
        }
        return c;
      }));
      
      if (selectedConversation.participant_1_id === user.id) {
        setSelectedConversation({ ...selectedConversation, participant_1_muted: !isMuted });
      } else {
        setSelectedConversation({ ...selectedConversation, participant_2_muted: !isMuted });
      }
    } catch (error) {
      console.error('Error muting conversation:', error);
      toast({
        title: t('messages.failedToMute'),
        description: t('messages.failedToMute'),
        variant: 'destructive',
      });
    }
  };

  const isBlocked = selectedConversation && user && (
    selectedConversation.participant_1_id === user.id
      ? selectedConversation.participant_1_blocked
      : selectedConversation.participant_2_blocked
  );

  const isMuted = selectedConversation && user && (
    selectedConversation.participant_1_id === user.id
      ? selectedConversation.participant_1_muted
      : selectedConversation.participant_2_muted
  );

  if (!user) return null;

  return (
    <div className={`flex h-[calc(100vh-3.5rem)] bg-background ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
      {/* Conversations Sidebar */}
      <div className={`w-80 bg-card flex flex-col ${dir === 'rtl' ? 'border-l' : 'border-r'} border-border shadow-lg`}>
        {/* Search Header */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${dir === 'rtl' ? 'right-3' : 'left-3'}`} />
            <Input
              placeholder={t('messages.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={dir === 'rtl' ? 'pr-9' : 'pl-9'}
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              {t('messages.loading')}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-muted-foreground mb-4">
                {searchQuery ? t('messages.noConversationsFound') : t('messages.noConversations')}
              </div>
              {!searchQuery && (
                <Button asChild size="sm">
                  <Link to="/browse">{t('messages.browseBusiness')}</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredConversations.map((convo) => {
                const isActive = selectedConversation?.id === convo.id;
                const unreadCount = getUnreadCount(convo);
                
                return (
                  <div
                      key={convo.id}
                      onClick={() => {
                        setSelectedConversation(convo);
                      }}
                      className={`
                        flex items-start gap-3 p-4 cursor-pointer transition-all duration-300 rounded-xl mx-2
                        ${isActive ? 'bg-muted/50 shadow-md' : 'hover:bg-muted/30 hover:shadow-sm'}
                      `}
                    >
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {getParticipantInitials(convo)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm truncate">
                          {getParticipantName(convo)}
                        </h3>
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                          {convo.lastMessage ? renderMessageTime(convo.lastMessage.created_at) : ''}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {convo.lastMessage?.content || t('messages.noMessages')}
                        </p>
                        {unreadCount > 0 && (
                          <Badge variant="default" className="h-5 min-w-5 px-1.5 flex items-center justify-center text-xs">
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-border bg-card px-6 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {getParticipantInitials(selectedConversation)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold truncate">
                    {getParticipantName(selectedConversation)}
                  </h2>
                  {selectedConversation.otherParticipantBusiness && (
                    <p className="text-xs text-muted-foreground truncate">
                      {t('messages.business')}
                    </p>
                  )}
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleMuteConversation}>
                    {isMuted ? (
                      <>
                        <BellRing className="h-4 w-4 mr-2" />
                        {language === 'ar' ? 'إلغاء كتم الصوت' : 'Unmute'}
                      </>
                    ) : (
                      <>
                        <BellOff className="h-4 w-4 mr-2" />
                        {language === 'ar' ? 'كتم الصوت' : 'Mute'}
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBlockUser}>
                    <Ban className="h-4 w-4 mr-2" />
                    {isBlocked 
                      ? (language === 'ar' ? 'إلغاء الحظر' : 'Unblock')
                      : (language === 'ar' ? 'حظر' : 'Block')
                    }
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'حذف المحادثة' : 'Delete Conversation'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <UserIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">{t('messages.startConversation')}</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {t('messages.sendMessageTo')} {getParticipantName(selectedConversation)} {t('messages.toBegin')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-w-4xl mx-auto">
                  {messages.map((msg) => {
                    const isCurrentUser = msg.sender_id === user?.id;
                    
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex gap-3 ${isCurrentUser ? (dir === 'rtl' ? 'flex-row' : 'flex-row-reverse') : (dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}`}
                      >
                        {!isCurrentUser && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getParticipantInitials(selectedConversation)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`flex flex-col gap-1 max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                          <div 
                            className={`rounded-2xl px-4 py-2.5 ${
                              isCurrentUser 
                                ? `bg-primary text-primary-foreground ${dir === 'rtl' ? 'rounded-bl-sm' : 'rounded-br-sm'}` 
                                : `bg-muted ${dir === 'rtl' ? 'rounded-br-sm' : 'rounded-bl-sm'}`
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                          <span className="text-xs text-muted-foreground px-2">
                            {renderMessageTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t border-border bg-card p-4">
              {isBlocked ? (
                <div className="text-center text-muted-foreground text-sm py-2">
                  {language === 'ar' ? 'لقد قمت بحظر هذا المستخدم' : 'You have blocked this user'}
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto">
                  <Input
                    placeholder={t('messages.writeMessage')}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button type="submit" size="icon" disabled={!message.trim() || sending}>
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              )}
            </div>
            
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {language === 'ar' ? 'حذف المحادثة' : 'Delete Conversation'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {language === 'ar'
                      ? 'هل أنت متأكد من حذف هذه المحادثة؟ سيتم حذف جميع الرسائل ولا يمكن التراجع عن هذا الإجراء.'
                      : 'Are you sure you want to delete this conversation? All messages will be deleted and this action cannot be undone.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteConversation} className="bg-red-600 hover:bg-red-700">
                    {language === 'ar' ? 'حذف' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <UserIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your Messages</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Select a conversation from the sidebar or start a new one by browsing businesses.
            </p>
            <Button asChild>
              <Link to="/browse">Browse Businesses</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
