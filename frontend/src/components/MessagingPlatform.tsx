import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Message {
  message_id: string;
  sender_type: string;
  sender_id: string;
  recipient_type: string;
  recipient_id: string;
  student_id: string | null;
  date_time: string;
  content_preview: string;
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
}

export const MessagingPlatform: React.FC<MessagingPlatformProps> = ({ role, userId, userType }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [selectedRecipientType, setSelectedRecipientType] = useState<'staff' | 'parent'>('parent');
  const [userCampusId, setUserCampusId] = useState<string>('');

  useEffect(() => {
    fetchMessages();
    fetchStaffMembers();
    fetchParents();
    fetchUserCampus();
  }, [userId]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages`);
      const data = await response.json();
      
      const filteredMessages = data.filter((msg: Message) => 
        msg.sender_id === userId || msg.recipient_id === userId
      );
      
      setMessages(filteredMessages.sort((a: Message, b: Message) => 
        new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
      ));
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

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
        }
      }
    } catch (error) {
      console.error('Error fetching user campus:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRecipient) return;

    try {
      let recipientType: string;
      if (role === 'parent') {
        recipientType = 'Staff';
      } else {
        recipientType = selectedRecipientType === 'staff' ? 'Staff' : 'Parent';
      }
      
      await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: `msg_${Date.now()}`,
          sender_type: userType,
          sender_id: userId,
          recipient_type: recipientType,
          recipient_id: selectedRecipient,
          student_id: null,
          date_time: new Date().toISOString(),
          content_preview: newMessage.substring(0, 100)
        })
      });

      setNewMessage('');
      setSelectedRecipient('');
      setSelectedRecipientType('parent');
      setShowCompose(false);
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
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
    if (isMessageFromMe(message)) {
      return 'You';
    }
    if (message.sender_type === 'Parent') {
      const parent = parents.find(p => p.parent_id === message.sender_id);
      return parent ? `${parent.first_name} ${parent.last_name}` : 'Parent';
    }
    const staff = staffMembers.find(s => s.staff_id === message.sender_id);
    return staff ? `${staff.first_name} ${staff.last_name}` : 'Staff';
  };

  const getRecipientName = (message: Message) => {
    if (message.recipient_type === 'Parent') {
      const parent = parents.find(p => p.parent_id === message.recipient_id);
      return parent ? `${parent.first_name} ${parent.last_name}` : 'Parent';
    }
    const staff = staffMembers.find(s => s.staff_id === message.recipient_id);
    return staff ? `${staff.first_name} ${staff.last_name}` : 'Staff';
  };

  const sentMessages = messages.filter(m => isMessageFromMe(m));
  const receivedMessages = messages.filter(m => !isMessageFromMe(m));

  if (loading) {
    return <div className="text-center py-8">Loading messages...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Messages</h2>
        <Button onClick={() => setShowCompose(true)}>
          <Send className="w-4 h-4 mr-2" />
          New Message
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-xl font-semibold mb-4">Inbox ({receivedMessages.length})</h3>
          {receivedMessages.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No messages in inbox</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {receivedMessages.map((message) => (
                <Card 
                  key={message.message_id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedMessage(message)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <CardTitle className="text-base">{getMessageSenderName(message)}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {formatDateTime(message.date_time)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2">{message.content_preview}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Sent ({sentMessages.length})</h3>
          {sentMessages.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Send className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No sent messages</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sentMessages.map((message) => (
                <Card 
                  key={message.message_id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedMessage(message)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <CardTitle className="text-base">To: {getRecipientName(message)}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {formatDateTime(message.date_time)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2">{message.content_preview}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl max-h-[80vh] overflow-y-auto p-4">
          {selectedMessage && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start mb-2">
                  <DialogTitle className="text-xl">
                    {isMessageFromMe(selectedMessage) 
                      ? `To: ${getRecipientName(selectedMessage)}`
                      : `From: ${getMessageSenderName(selectedMessage)}`
                    }
                  </DialogTitle>
                  <Badge variant="outline">
                    {formatDateTime(selectedMessage.date_time)}
                  </Badge>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{selectedMessage.content_preview}</p>
                </div>
                {!isMessageFromMe(selectedMessage) && (
                  <Button className="w-full" onClick={() => { setSelectedMessage(null); setShowCompose(true); }}>
                    <Send className="w-4 h-4 mr-2" />
                    Reply
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
                    {staffMembers
                      .filter(staff => staff.campus_ids.includes(userCampusId))
                      .map(staff => (
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
                    {staffMembers
                      .filter(staff => staff.staff_id !== userId)
                      .map(staff => (
                        <SelectItem key={staff.staff_id} value={staff.staff_id}>
                          {staff.first_name} {staff.last_name} - {staff.role}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
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
            <Button variant="outline" onClick={() => { setShowCompose(false); setNewMessage(''); setSelectedRecipient(''); setSelectedRecipientType('parent'); }}>
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
