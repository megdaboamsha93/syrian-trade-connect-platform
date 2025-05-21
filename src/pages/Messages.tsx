
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { conversations, businesses, Conversation, Message } from '../data/businesses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Send, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Messages: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { businessId } = useParams<{ businessId: string }>();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [message, setMessage] = useState('');
  const currentUserId = '1'; // This would normally come from auth context

  useEffect(() => {
    if (businessId) {
      // Simulating a new conversation with the selected business
      const existingConversation = conversations.find(c => 
        c.participants.includes(businessId) && c.participants.includes(currentUserId)
      );
      
      if (existingConversation) {
        setSelectedConversation(existingConversation);
      } else {
        // Create a new conversation object but don't add it to the global conversations array
        setSelectedConversation({
          id: `new-${businessId}`,
          participants: [currentUserId, businessId],
          messages: []
        });
      }
    } else if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [businessId, currentUserId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedConversation) return;

    // In a real app, this would send to backend API
    const newMessage: Message = {
      id: `new-${Date.now()}`,
      senderId: currentUserId,
      receiverId: selectedConversation.participants.find(p => p !== currentUserId) || '',
      content: message,
      timestamp: new Date().toISOString(),
      read: false
    };

    // Update local state for UI
    setSelectedConversation(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, newMessage]
      };
    });
    
    // Clear input
    setMessage('');
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

  const getBusinessName = (id: string) => {
    const business = businesses.find(b => b.id === id);
    return business ? (t('language') === 'en' ? business.nameEn : business.nameAr) : id;
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">{t('messages.title')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Conversations List */}
        <div className="md:col-span-1 bg-card rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 bg-muted/30 border-b font-medium">
            {t('messages.title')}
          </div>
          <div className="divide-y">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                {t('messages.noMessages')}
              </div>
            ) : (
              conversations.map((convo) => {
                const otherParticipantId = convo.participants.find(id => id !== currentUserId) || '';
                const otherBusinessName = getBusinessName(otherParticipantId);
                const lastMessage = convo.messages[convo.messages.length - 1];
                const isActive = selectedConversation?.id === convo.id;
                
                return (
                  <div
                    key={convo.id}
                    className={`p-4 cursor-pointer hover:bg-muted/30 ${isActive ? 'bg-muted/30' : ''}`}
                    onClick={() => {
                      navigate('/messages');
                      setSelectedConversation(convo);
                    }}
                  >
                    <div className="font-medium mb-1">{otherBusinessName}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {lastMessage?.content || ''}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {lastMessage ? renderMessageTime(lastMessage.timestamp) : ''}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="md:col-span-2 lg:col-span-3 bg-card rounded-lg shadow-sm overflow-hidden flex flex-col h-[70vh]">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-muted/30 border-b">
                <div className="font-medium">
                  {getBusinessName(selectedConversation.participants.find(id => id !== currentUserId) || '')}
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {t('messages.noMessages')}
                  </div>
                ) : (
                  selectedConversation.messages.map((msg) => {
                    const isCurrentUser = msg.senderId === currentUserId;
                    
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] rounded-lg p-3 ${
                            isCurrentUser ? 'bg-primary text-white' : 'bg-muted'
                          }`}
                        >
                          <div className="text-sm">{msg.content}</div>
                          <div 
                            className={`text-xs mt-1 ${
                              isCurrentUser ? 'text-white/70' : 'text-muted-foreground'
                            }`}
                          >
                            {renderMessageTime(msg.timestamp)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
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
                      <Button type="submit" disabled={!message.trim()}>
                        <Send className="h-4 w-4 mr-2" />
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
