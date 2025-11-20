import React, { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Document {
  document_id: string;
  title: string;
  document_type: string;
  description: string;
  required_for: string;
  status: string;
  created_date: string;
  expiration_date: string | null;
  file_url: string | null;
}

interface DocumentSignature {
  signature_id: string;
  document_id: string;
  parent_id: string;
  student_id: string | null;
  signed_date: string;
  signature_data: string;
}

interface DocumentManagementProps {
  role: 'admin' | 'teacher' | 'parent';
  parentId?: string;
  studentId?: string;
  userId?: string;
}

export const DocumentManagement: React.FC<DocumentManagementProps> = ({ role, parentId, studentId, userId }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [signatures, setSignatures] = useState<DocumentSignature[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newDocument, setNewDocument] = useState({
    title: '',
    document_type: 'Permission Slip',
    description: '',
    required_for: 'All Students'
  });

  useEffect(() => {
    fetchDocuments();
    if (parentId) {
      fetchSignatures();
    }
  }, [studentId, parentId]);

  const fetchDocuments = async () => {
    try {
      const url = studentId 
        ? `${API_URL}/api/documents?student_id=${studentId}`
        : `${API_URL}/api/documents`;
      const response = await fetch(url);
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSignatures = async () => {
    try {
      const response = await fetch(`${API_URL}/api/signatures?parent_id=${parentId}`);
      const data = await response.json();
      setSignatures(data);
    } catch (error) {
      console.error('Error fetching signatures:', error);
    }
  };

  const handleCreateDocument = async () => {
    if (!userId) return;
    
    try {
      await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: `doc_${Date.now()}`,
          status: 'Active',
          created_date: new Date().toISOString().split('T')[0],
          expiration_date: null,
          file_url: `document_${Date.now()}.pdf`,
          ...newDocument
        })
      });
      
      setShowUploadModal(false);
      setNewDocument({
        title: '',
        document_type: 'Permission Slip',
        description: '',
        required_for: 'All Students'
      });
      fetchDocuments();
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const handleSign = async (documentId: string) => {
    if (!parentId) return;

    try {
      await fetch(`${API_URL}/api/signatures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature_id: `sig_${Date.now()}`,
          document_id: documentId,
          parent_id: parentId,
          student_id: studentId || null,
          signed_date: new Date().toISOString(),
          signature_data: 'Electronic Signature'
        })
      });
      
      setShowSignatureDialog(false);
      fetchSignatures();
      fetchDocuments();
      
      const doc = documents.find(d => d.document_id === documentId);
      if (doc?.document_type === 'Permission Slip') {
        window.location.href = '#/store';
      }
    } catch (error) {
      console.error('Error signing document:', error);
    }
  };

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Permission Slip': 'bg-blue-100 text-blue-800',
      'Enrollment Contract': 'bg-purple-100 text-purple-800',
      'Emergency Contact': 'bg-red-100 text-red-800',
      'Medical Form': 'bg-green-100 text-green-800',
      'Policy Acknowledgment': 'bg-yellow-100 text-yellow-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors['Other'];
  };

  const isDocumentSigned = (documentId: string) => {
    return signatures.some(s => s.document_id === documentId);
  };

  const getSignatureDate = (documentId: string) => {
    const signature = signatures.find(s => s.document_id === documentId);
    return signature ? new Date(signature.signed_date).toLocaleDateString() : null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const isExpiringSoon = (expirationDate: string | null) => {
    if (!expirationDate) return false;
    const daysUntilExpiration = Math.floor((new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration <= 30 && daysUntilExpiration > 0;
  };

  const isExpired = (expirationDate: string | null) => {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
  };

  const pendingDocuments = documents.filter(d => role === 'parent' ? !isDocumentSigned(d.document_id) : d.status === 'Pending');
  const completedDocuments = documents.filter(d => role === 'parent' ? isDocumentSigned(d.document_id) : d.status === 'Signed');

  if (loading) {
    return <div className="text-center py-8">Loading documents...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Pending Documents</h2>
        {pendingDocuments.length === 0 ? (
          <p className="text-gray-500">No pending documents</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingDocuments.map((doc) => (
              <Card key={doc.document_id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedDocument(doc)}>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{doc.title}</CardTitle>
                    <Badge className={getDocumentTypeColor(doc.document_type)}>{doc.document_type}</Badge>
                  </div>
                  <CardDescription>{doc.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>Created: {formatDate(doc.created_date)}</span>
                    </div>
                    {doc.expiration_date && (
                      <div className="flex items-center gap-2">
                        {isExpired(doc.expiration_date) ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : isExpiringSoon(doc.expiration_date) ? (
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-500" />
                        )}
                        <span className={isExpired(doc.expiration_date) ? 'text-red-500' : isExpiringSoon(doc.expiration_date) ? 'text-yellow-500' : ''}>
                          Expires: {formatDate(doc.expiration_date)}
                        </span>
                      </div>
                    )}
                    {role === 'parent' && (
                      <div className="mt-4">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
                          Action Required
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {completedDocuments.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Completed Documents</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedDocuments.map((doc) => (
              <Card key={doc.document_id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedDocument(doc)}>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{doc.title}</CardTitle>
                    <Badge className={getDocumentTypeColor(doc.document_type)}>{doc.document_type}</Badge>
                  </div>
                  <CardDescription>{doc.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-600">Signed</span>
                    </div>
                    {role === 'parent' && getSignatureDate(doc.document_id) && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>Signed: {getSignatureDate(doc.document_id)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!selectedDocument && !showSignatureDialog} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-2xl">
          {selectedDocument && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start mb-2">
                  <DialogTitle className="text-2xl">{selectedDocument.title}</DialogTitle>
                  <Badge className={getDocumentTypeColor(selectedDocument.document_type)}>{selectedDocument.document_type}</Badge>
                </div>
                <DialogDescription>{selectedDocument.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2"><strong>Required For:</strong> {selectedDocument.required_for}</p>
                  <p className="text-sm text-gray-600 mb-2"><strong>Created:</strong> {formatDate(selectedDocument.created_date)}</p>
                  {selectedDocument.expiration_date && (
                    <p className="text-sm text-gray-600"><strong>Expires:</strong> {formatDate(selectedDocument.expiration_date)}</p>
                  )}
                </div>

                {role === 'parent' && !isDocumentSigned(selectedDocument.document_id) && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-medium mb-2">Action Required</p>
                    <p className="text-sm text-gray-600 mb-4">Please review and sign this document.</p>
                    <Button onClick={() => setShowSignatureDialog(true)} className="w-full">
                      Sign Document
                    </Button>
                  </div>
                )}

                {role === 'parent' && isDocumentSigned(selectedDocument.document_id) && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="font-medium text-green-800">Document Signed</p>
                    </div>
                    <p className="text-sm text-gray-600">Signed on {getSignatureDate(selectedDocument.document_id)}</p>
                  </div>
                )}

                {selectedDocument.file_url && (
                  <Button variant="outline" className="w-full" onClick={() => window.open(selectedDocument.file_url!, '_blank')}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Document
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Document</DialogTitle>
            <DialogDescription>
              By clicking "Sign", you electronically sign this document and agree to its terms.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600">Electronic Signature</p>
              <p className="text-lg font-semibold mt-2">{parentId || 'Parent Name'}</p>
              <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignatureDialog(false)}>Cancel</Button>
            <Button onClick={() => selectedDocument && handleSign(selectedDocument.document_id)}>
              Sign Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload New Document</DialogTitle>
            <DialogDescription>
              Add a new document or form for parents to sign
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                value={newDocument.title}
                onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                placeholder="Field Trip Permission Slip"
              />
            </div>

            <div>
              <Label htmlFor="document_type">Document Type</Label>
              <Select value={newDocument.document_type} onValueChange={(value) => setNewDocument({ ...newDocument, document_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Permission Slip">Permission Slip</SelectItem>
                  <SelectItem value="Enrollment Contract">Enrollment Contract</SelectItem>
                  <SelectItem value="Emergency Contact">Emergency Contact</SelectItem>
                  <SelectItem value="Medical Form">Medical Form</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newDocument.description}
                onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                placeholder="Describe the document..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="required_for">Required For</Label>
              <Select value={newDocument.required_for} onValueChange={(value) => setNewDocument({ ...newDocument, required_for: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Students">All Students</SelectItem>
                  <SelectItem value="Specific Event">Specific Event</SelectItem>
                  <SelectItem value="New Enrollments">New Enrollments</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateDocument}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={!newDocument.title || !newDocument.description}
            >
              Upload Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
