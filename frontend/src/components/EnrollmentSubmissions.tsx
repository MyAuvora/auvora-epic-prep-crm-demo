import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  User,
  Users,
  Calendar,
  Phone,
  Mail,
  GraduationCap
} from 'lucide-react';

// Enrollment submission interface
export interface EnrollmentSubmission {
  id: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'denied';
  adminNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  students: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    allergies: string;
    medication: string;
    addressLine: string;
    city: string;
    state: string;
    zipcode: string;
    iepInfo: string;
    academicInfo: string;
    stepUpApplied: string;
    gradeLevel: string;
    sessionPreference: string;
  }[];
  parents: {
    id: string;
    firstName: string;
    lastName: string;
    relationship: string;
    email: string;
    phone: string;
    workPhone: string;
    employer: string;
    isPrimary: boolean;
  }[];
  authorizedPickups: {
    id: string;
    name: string;
    relationship: string;
    phone: string;
  }[];
  policyAgreements: {
    photoRelease: boolean;
    liabilityWaiver: boolean;
    medicalAuthorization: boolean;
    parentHandbook: boolean;
    electronicSignature: string;
    signatureDate: string;
  };
}

// Global store for enrollment submissions (in-memory for demo)
let enrollmentSubmissions: EnrollmentSubmission[] = [];

// Helper functions to manage submissions
export const addEnrollmentSubmission = (submission: Omit<EnrollmentSubmission, 'id' | 'submittedAt' | 'status'>) => {
  const newSubmission: EnrollmentSubmission = {
    ...submission,
    id: `enrollment_${Date.now()}`,
    submittedAt: new Date().toISOString(),
    status: 'pending'
  };
  enrollmentSubmissions = [...enrollmentSubmissions, newSubmission];
  return newSubmission;
};

export const getEnrollmentSubmissions = () => enrollmentSubmissions;

export const updateEnrollmentStatus = (
  id: string, 
  status: 'approved' | 'denied', 
  adminNotes?: string
) => {
  enrollmentSubmissions = enrollmentSubmissions.map(sub => 
    sub.id === id 
      ? { 
          ...sub, 
          status, 
          adminNotes, 
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'Admin'
        } 
      : sub
  );
};

// Component for Parents to view their enrollment submissions
interface ParentEnrollmentSubmissionsProps {
  parentEmail?: string;
}

export function ParentEnrollmentSubmissions({ parentEmail }: ParentEnrollmentSubmissionsProps) {
  const [submissions, setSubmissions] = useState<EnrollmentSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<EnrollmentSubmission | null>(null);

  useEffect(() => {
    // Filter submissions by parent email if provided
    const allSubmissions = getEnrollmentSubmissions();
    if (parentEmail) {
      setSubmissions(allSubmissions.filter(s => 
        s.parents.some(p => p.email.toLowerCase() === parentEmail.toLowerCase())
      ));
    } else {
      setSubmissions(allSubmissions);
    }
  }, [parentEmail]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Denied</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Enrollment Submissions</h3>
          <p className="text-gray-500">You haven't submitted any enrollment forms yet.</p>
          <p className="text-gray-500 text-sm mt-2">Go to the Enrollment tab to submit a new enrollment form.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Enrollment Submissions</h2>
        <Badge className="bg-blue-100 text-blue-800">{submissions.length} Submission(s)</Badge>
      </div>

      <div className="grid gap-4">
        {submissions.map((submission) => (
          <Card key={submission.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-lg">
                      Enrollment Application - {submission.students.map(s => `${s.firstName} ${s.lastName}`).join(', ')}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {submission.students.length} Student(s)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(submission.status)}
                    {submission.reviewedAt && (
                      <span className="text-xs text-gray-500">
                        Reviewed: {new Date(submission.reviewedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {submission.adminNotes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Admin Notes:</strong> {submission.adminNotes}
                      </p>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Enrollment Application Details</h2>
              <Button variant="ghost" onClick={() => setSelectedSubmission(null)}>Close</Button>
            </div>
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-4">
                {getStatusBadge(selectedSubmission.status)}
                <span className="text-sm text-gray-500">
                  Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}
                </span>
              </div>

              {/* Students */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  Student Information
                </h3>
                {selectedSubmission.students.map((student, index) => (
                  <Card key={student.id} className="mb-3">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Student #{index + 1}: {student.firstName} {student.lastName}</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><strong>Date of Birth:</strong> {student.dateOfBirth}</div>
                        <div><strong>Grade Level:</strong> {student.gradeLevel}</div>
                        <div><strong>Session:</strong> {student.sessionPreference}</div>
                        <div><strong>Step-Up Status:</strong> {student.stepUpApplied}</div>
                        <div className="col-span-2"><strong>Address:</strong> {student.addressLine}, {student.city}, {student.state} {student.zipcode}</div>
                        <div><strong>Allergies:</strong> {student.allergies || 'None'}</div>
                        <div><strong>Medication:</strong> {student.medication || 'None'}</div>
                        {student.iepInfo && <div className="col-span-2"><strong>IEP/504:</strong> {student.iepInfo}</div>}
                        {student.academicInfo && <div className="col-span-2"><strong>Academic Info:</strong> {student.academicInfo}</div>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Parents */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Parent/Guardian Information
                </h3>
                                {selectedSubmission.parents.map((parent) => (
                                  <Card key={parent.id} className="mb-3">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{parent.firstName} {parent.lastName}</h4>
                        {parent.isPrimary && <Badge className="bg-blue-100 text-blue-800">Primary</Badge>}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><strong>Relationship:</strong> {parent.relationship}</div>
                        <div className="flex items-center gap-1"><Mail className="w-4 h-4" /> {parent.email}</div>
                        <div className="flex items-center gap-1"><Phone className="w-4 h-4" /> {parent.phone}</div>
                        {parent.workPhone && <div><strong>Work:</strong> {parent.workPhone}</div>}
                        {parent.employer && <div><strong>Employer:</strong> {parent.employer}</div>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Authorized Pickups */}
              {selectedSubmission.authorizedPickups.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Authorized Pickup Persons</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedSubmission.authorizedPickups.map((pickup) => (
                      <Card key={pickup.id}>
                        <CardContent className="p-3">
                          <div className="font-medium">{pickup.name}</div>
                          <div className="text-sm text-gray-500">{pickup.relationship}</div>
                          <div className="text-sm">{pickup.phone}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Policy Agreements */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Policy Agreements</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Photo/Video Release: Agreed
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Liability Waiver: Agreed
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Medical Authorization: Agreed
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Parent Handbook: Agreed
                  </div>
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div><strong>Electronic Signature:</strong> {selectedSubmission.policyAgreements.electronicSignature}</div>
                    <div><strong>Date:</strong> {selectedSubmission.policyAgreements.signatureDate}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Component for Admin to review all enrollment submissions
export function AdminEnrollmentSubmissions() {
  const [submissions, setSubmissions] = useState<EnrollmentSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<EnrollmentSubmission | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = () => {
    setSubmissions(getEnrollmentSubmissions());
  };

  const handleApprove = (id: string) => {
    updateEnrollmentStatus(id, 'approved', adminNotes);
    setAdminNotes('');
    loadSubmissions();
    setSelectedSubmission(null);
  };

  const handleDeny = (id: string) => {
    updateEnrollmentStatus(id, 'denied', adminNotes);
    setAdminNotes('');
    loadSubmissions();
    setSelectedSubmission(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Denied</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredSubmissions = filter === 'all' 
    ? submissions 
    : submissions.filter(s => s.status === filter);

  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enrollment Applications</h2>
          <p className="text-gray-500">Review and manage enrollment submissions</p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-red-100 text-red-800 text-lg px-4 py-2">
            {pendingCount} Pending Review
          </Badge>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-blue-600' : ''}
        >
          All ({submissions.length})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
          className={filter === 'pending' ? 'bg-yellow-600' : ''}
        >
          Pending ({submissions.filter(s => s.status === 'pending').length})
        </Button>
        <Button
          variant={filter === 'approved' ? 'default' : 'outline'}
          onClick={() => setFilter('approved')}
          className={filter === 'approved' ? 'bg-green-600' : ''}
        >
          Approved ({submissions.filter(s => s.status === 'approved').length})
        </Button>
        <Button
          variant={filter === 'denied' ? 'default' : 'outline'}
          onClick={() => setFilter('denied')}
          className={filter === 'denied' ? 'bg-red-600' : ''}
        >
          Denied ({submissions.filter(s => s.status === 'denied').length})
        </Button>
      </div>

      {filteredSubmissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Enrollment Submissions</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'No enrollment applications have been submitted yet.'
                : `No ${filter} applications found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-lg">
                        {submission.students.map(s => `${s.firstName} ${s.lastName}`).join(', ')}
                      </h3>
                      {getStatusBadge(submission.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-4 h-4" />
                        Grade {submission.students.map(s => s.gradeLevel).join(', ')}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {submission.parents[0]?.firstName} {submission.parents[0]?.lastName}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {submission.parents[0]?.email}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                    {submission.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setSelectedSubmission(submission);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Review Enrollment Application</h2>
              <Button variant="ghost" onClick={() => { setSelectedSubmission(null); setAdminNotes(''); }}>Close</Button>
            </div>
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-4">
                {getStatusBadge(selectedSubmission.status)}
                <span className="text-sm text-gray-500">
                  Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}
                </span>
              </div>

              {/* Students */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  Student Information
                </h3>
                {selectedSubmission.students.map((student, index) => (
                  <Card key={student.id} className="mb-3">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Student #{index + 1}: {student.firstName} {student.lastName}</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><strong>Date of Birth:</strong> {student.dateOfBirth}</div>
                        <div><strong>Grade Level:</strong> {student.gradeLevel}</div>
                        <div><strong>Session:</strong> {student.sessionPreference}</div>
                        <div><strong>Step-Up Status:</strong> {student.stepUpApplied}</div>
                        <div className="col-span-2"><strong>Address:</strong> {student.addressLine}, {student.city}, {student.state} {student.zipcode}</div>
                        <div><strong>Allergies:</strong> {student.allergies || 'None'}</div>
                        <div><strong>Medication:</strong> {student.medication || 'None'}</div>
                        {student.iepInfo && <div className="col-span-2"><strong>IEP/504:</strong> {student.iepInfo}</div>}
                        {student.academicInfo && <div className="col-span-2"><strong>Academic Info:</strong> {student.academicInfo}</div>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Parents */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Parent/Guardian Information
                </h3>
                {selectedSubmission.parents.map((parent) => (
                  <Card key={parent.id} className="mb-3">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{parent.firstName} {parent.lastName}</h4>
                        {parent.isPrimary && <Badge className="bg-blue-100 text-blue-800">Primary</Badge>}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><strong>Relationship:</strong> {parent.relationship}</div>
                        <div className="flex items-center gap-1"><Mail className="w-4 h-4" /> {parent.email}</div>
                        <div className="flex items-center gap-1"><Phone className="w-4 h-4" /> {parent.phone}</div>
                        {parent.workPhone && <div><strong>Work:</strong> {parent.workPhone}</div>}
                        {parent.employer && <div><strong>Employer:</strong> {parent.employer}</div>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Authorized Pickups */}
              {selectedSubmission.authorizedPickups.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Authorized Pickup Persons</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedSubmission.authorizedPickups.map((pickup) => (
                      <Card key={pickup.id}>
                        <CardContent className="p-3">
                          <div className="font-medium">{pickup.name}</div>
                          <div className="text-sm text-gray-500">{pickup.relationship}</div>
                          <div className="text-sm">{pickup.phone}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Policy Agreements */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Policy Agreements</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Photo/Video Release: Agreed
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Liability Waiver: Agreed
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Medical Authorization: Agreed
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Parent Handbook: Agreed
                  </div>
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div><strong>Electronic Signature:</strong> {selectedSubmission.policyAgreements.electronicSignature}</div>
                    <div><strong>Date:</strong> {selectedSubmission.policyAgreements.signatureDate}</div>
                  </div>
                </div>
              </div>

              {/* Admin Actions */}
              {selectedSubmission.status === 'pending' && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-3">Admin Actions</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Admin Notes (optional)
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add notes about this application..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        className="bg-green-600 hover:bg-green-700 flex-1"
                        onClick={() => handleApprove(selectedSubmission.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Application
                      </Button>
                      <Button
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50 flex-1"
                        onClick={() => handleDeny(selectedSubmission.id)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Deny Application
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Show existing admin notes if already reviewed */}
              {selectedSubmission.status !== 'pending' && selectedSubmission.adminNotes && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-3">Admin Notes</h3>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p>{selectedSubmission.adminNotes}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Reviewed by {selectedSubmission.reviewedBy} on {new Date(selectedSubmission.reviewedAt!).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
