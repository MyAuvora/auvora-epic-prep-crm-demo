import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Mail, MailOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Message {
  message_id: string;
  campus_id?: string;
  sender_type: string;
  sender_id: string;
  recipient_type: string;
  recipient_id: string;
  student_id: string | null;
  subject?: string;
  content?: string;
  date_time: string;
  content_preview: string;
  read: boolean;
}

interface StaffMember {
  staff_id: string;
  first_name: string;
  last_name: string;
  role: string;
  campus_ids: string[];
  email: string;
}

interface Parent {
  parent_id: string;
  first_name: string;
  last_name: string;
  email: string;
  student_ids: string[];
}

interface MessagingPlatformProps {
  role: 'owner' | 'admin' | 'coach' | 'parent';
  userId: string;
  userType: string;
  onUnreadCountChange?: (count: number) => void;
}

export const MessagingPlatform: React.FC<MessagingPlatformProps> = ({ role, userId, userType, onUnreadCountChange }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [selectedRecipientType, setSelectedRecipientType] = useState<'staff' | 'parent'>('parent');
  const [userCampusId, setUserCampusId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages`);
      const data = await response.json();

      const filteredMessages = data.filter((msg: Message) =>
        msg.sender_id === userId || msg.recipient_id === userId
      );

      setMessages(filteredMessages.sort((a: Message, b: Message) =>
        new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
      ));

      if (onUnreadCountChange) {
        const unreadCount = filteredMessages.filter(
          (msg: Message) => msg.recipient_id === userId && !msg.read
        ).length;
        onUnreadCountChange(unreadCount);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, onUnreadCountChange]);

  useEffect(() => {
    fetchMessages();
    fetchStaffMembers();
    fetchParents();
    fetchUserCampus();
  }, [userId, fetchMessages]);

  const fetchStaffMembers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/staff`);
      const data = await response.json();
      setStaffMembers(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchParents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/parents`);
      const data = await response.json();
      setParents(data);
    } catch (error) {
      console.error('Error fetching parents:', error);
    }
  };

  const fetchUserCampus = async () => {
    try {
      if (role === 'parent') {
        const response = await fetch(`${API_URL}/api/parents/${userId}`);
        const data = await response.json();
        if (data.student_ids && data.student_ids.length > 0) {
          const studentResponse = await fetch(`${API_URL}/api/students/${data.student_ids[0]}`);
          const studentData = await studentResponse.json();
          setUserCampusId(studentData.campus_id);
        } else {
          // No enrolled students — try to find campus from lead data
          const leadsResponse = await fetch(`${API_URL}/api/admissions/leads`);
          const leads = await leadsResponse.json();
          const parentData = data;
          const parentLead = leads.find((l: { parent_email?: string; email?: string }) =>
            l.parent_email === parentData.email || l.email === parentData.email
          );
          if (parentLead?.campus_id) {
            setUserCampusId(parentLead.campus_id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user campus:', error);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`${API_URL}/api/messages/${messageId}/read`, {
        method: 'PATCH',
      });
      setMessages(prev => prev.map(m =>
        m.message_id === messageId ? { ...m, read: true } : m
      ));
      if (onUnreadCountChange) {
        const newUnread = messages.filter(
          m => m.recipient_id === userId && !m.read && m.message_id !== messageId
        ).length;
        onUnreadCountChange(newUnread);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleOpenMessage = (message: Message) => {
    setSelectedMessage(message);
    setShowReplyBox(false);
    setReplyContent('');
    if (!isMessageFromMe(message) && !message.read) {
      markAsRead(message.message_id);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRecipient) return;

    try {
      const recipientType = role === 'parent' ? 'Staff' :
        selectedRecipientType === 'staff' ? 'Staff' : 'Parent';

      await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: `msg_${Date.now()}`,
          campus_id: userCampusId || null,
          sender_type: userType,
          sender_id: userId,
          recipient_type: recipientType,
          recipient_id: selectedRecipient,
          student_id: null,
          subject: newSubject.trim() || null,
          content: newMessage,
          date_time: new Date().toISOString(),
          content_preview: newMessage.substring(0, 100),
          read: false,
        })
      });

      setNewMessage('');
      setNewSubject('');
      setSelectedRecipient('');
      setSelectedRecipientType('parent');
      setShowCompose(false);
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSendReply = async () => {
    if (!replyContent.trim() || !selectedMessage) return;
    setSendingReply(true);

    try {
      const replyToId = isMessageFromMe(selectedMessage)
        ? selectedMessage.recipient_id
        : selectedMessage.sender_id;
      const replyToType = isMessageFromMe(selectedMessage)
        ? selectedMessage.recipient_type
        : selectedMessage.sender_type;

      await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: `msg_${Date.now()}`,
          campus_id: userCampusId || selectedMessage.campus_id || null,
          sender_type: userType,
          sender_id: userId,
          recipient_type: replyToType,
          recipient_id: replyToId,
          student_id: selectedMessage.student_id,
          subject: selectedMessage.subject ? `Re: ${selectedMessage.subject.replace(/^Re: /, '')}` : null,
          content: replyContent,
          date_time: new Date().toISOString(),
          content_preview: replyContent.substring(0, 100),
          read: false,
        })
      });

      setReplyContent('');
      setShowReplyBox(false);
      setSelectedMessage(null);
      fetchMessages();
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setSendingReply(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const isMessageFromMe = (message: Message) => {
    return message.sender_id === userId;
  };

  const getMessageSenderName = (message: Message) => {
    if (isMessageFromMe(message)) return 'You';
    if (message.sender_type === 'Parent') {
      const parent = parents.find(p => p.parent_id === message.sender_id);
      return parent ? `${parent.first_name} ${parent.last_name}` : 'Parent';
    }
    const staff = staffMembers.find(s => s.staff_id === message.sender_id);
    return staff ? `${staff.first_name} ${staff.last_name}` : 'Staff';
  };

  const getRecipientName = (message: Message) => {
    if (message.recipient_id === userId) return 'You';
    if (message.recipient_type === 'Parent') {
      const parent = parents.find(p => p.parent_id === message.recipient_id);
      return parent ? `${parent.first_name} ${parent.last_name}` : 'Parent';
    }
    const staff = staffMembers.find(s => s.staff_id === message.recipient_id);
    return staff ? `${staff.first_name} ${staff.last_name}` : 'Staff';
  };

  const sentMessages = messages.filter(m => isMessageFromMe(m));
  const receivedMessages = messages.filter(m => !isMessageFromMe(m));
  const unreadCount = receivedMessages.filter(m => !m.read).length;

  const getAvailableStaff = () => {
    const messageableRoles = ['Coach', 'Center Manager'];
    if (role === 'parent' && userCampusId) {
      return staffMembers.filter(staff =>
        messageableRoles.includes(staff.role) && staff.campus_ids.includes(userCampusId)
      );
    }
    if (role === 'parent') {
      return staffMembers.filter(staff => messageableRoles.includes(staff.role));
    }
    return staffMembers.filter(staff => staff.staff_id !== userId);
  };

  if (loading) {
    return <div className="text-center py-8">Loading messages...</div>;
  }

  const displayMessages = activeTab === 'inbox' ? receivedMessages : sentMessages;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Messages</h2>
        <Button onClick={() => setShowCompose(true)}>
          <Send className="w-4 h-4 mr-2" />
          New Message
        </Button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'inbox'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('inbox')}
        >
          Inbox ({receivedMessages.length})
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'sent'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('sent')}
        >
          Sent ({sentMessages.length})
        </button>
      </div>

      {/* Message list */}
      {displayMessages.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">
              {activeTab === 'inbox' ? 'No messages in inbox' : 'No sent messages'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {displayMessages.map((message) => {
            const isUnread = !isMessageFromMe(message) && !message.read;
            return (
              <Card
                key={message.message_id}
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  isUnread ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                }`}
                onClick={() => handleOpenMessage(message)}
              >
                <CardHeader className="pb-2 pt-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {isUnread ? (
                        <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      ) : (
                        <MailOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <CardTitle className={`text-sm ${isUnread ? 'font-bold' : 'font-medium'}`}>
                          {activeTab === 'inbox'
                            ? getMessageSenderName(message)
                            : `To: ${getRecipientName(message)}`
                          }
                        </CardTitle>
                        {message.subject && (
                          <p className={`text-sm truncate ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {message.subject}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0 ml-2">
                      {formatDateTime(message.date_time)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <p className={`text-sm line-clamp-1 ${isUnread ? 'text-gray-800' : 'text-gray-500'}`}>
                    {message.content_preview}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View message dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => { setSelectedMessage(null); setShowReplyBox(false); setReplyContent(''); }}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl max-h-[80vh] overflow-y-auto p-4">
          {selectedMessage && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <DialogTitle className="text-lg">
                      {isMessageFromMe(selectedMessage)
                        ? `To: ${getRecipientName(selectedMessage)}`
                        : `From: ${getMessageSenderName(selectedMessage)}`
                      }
                    </DialogTitle>
                    {selectedMessage.subject && (
                      <p className="text-sm font-semibold text-gray-700 mt-1">{selectedMessage.subject}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="flex-shrink-0 ml-2">
                    {formatDateTime(selectedMessage.date_time)}
                  </Badge>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedMessage.content || selectedMessage.content_preview}
                  </p>
                </div>
                {!showReplyBox ? (
                  <Button
                    className="w-full"
                    onClick={() => setShowReplyBox(true)}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Reply
                  </Button>
                ) : (
                  <div className="space-y-3 border-t pt-3">
                    <p className="text-sm font-medium text-gray-600">Reply:</p>
                    <Textarea
                      placeholder="Type your reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={4}
                      className="w-full"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => { setShowReplyBox(false); setReplyContent(''); }}>
                        Cancel
                      </Button>
                      <Button onClick={handleSendReply} disabled={!replyContent.trim() || sendingReply}>
                        <Send className="w-4 h-4 mr-2" />
                        {sendingReply ? 'Sending...' : 'Send Reply'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Compose dialog */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl max-h-[80vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>
              {role === 'parent'
                ? 'Send a message to staff members'
                : 'Send a message to parents or staff members'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {role !== 'parent' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Recipient Type:</label>
                <Select
                  value={selectedRecipientType}
                  onValueChange={(value: 'staff' | 'parent') => {
                    setSelectedRecipientType(value);
                    setSelectedRecipient('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="staff">Staff Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">To:</label>
              {role === 'parent' ? (
                <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a staff member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableStaff().map(staff => (
                      <SelectItem key={staff.staff_id} value={staff.staff_id}>
                        {staff.first_name} {staff.last_name} - {staff.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : selectedRecipientType === 'parent' ? (
                <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {parents.map(parent => (
                      <SelectItem key={parent.parent_id} value={parent.parent_id}>
                        {parent.first_name} {parent.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a staff member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableStaff().map(staff => (
                      <SelectItem key={staff.staff_id} value={staff.staff_id}>
                        {staff.first_name} {staff.last_name} - {staff.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Subject:</label>
              <Input
                placeholder="Message subject (optional)"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Message:</label>
              <Textarea
                placeholder="Type your message here..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={6}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCompose(false); setNewMessage(''); setNewSubject(''); setSelectedRecipient(''); setSelectedRecipientType('parent'); }}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={!newMessage.trim() || !selectedRecipient}>
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
