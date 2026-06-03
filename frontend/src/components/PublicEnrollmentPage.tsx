import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Users,
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Check,
  GraduationCap,
  CheckCircle,
} from 'lucide-react';

interface StudentInfo {
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
  stepUpAmount: string;
  gradeLevel: string;
  campusType: string;
  sessionPreference: string;
}

interface ParentInfo {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
  email: string;
  phone: string;
  workPhone: string;
  employer: string;
  isPrimary: boolean;
}

interface AuthorizedPickup {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

const emptyStudent: StudentInfo = {
  id: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  allergies: '',
  medication: '',
  addressLine: '',
  city: '',
  state: '',
  zipcode: '',
  iepInfo: '',
  academicInfo: '',
  stepUpApplied: '',
  stepUpAmount: '',
  gradeLevel: '',
  campusType: '',
  sessionPreference: ''
};

const emptyParent: ParentInfo = {
  id: '',
  firstName: '',
  lastName: '',
  relationship: '',
  email: '',
  phone: '',
  workPhone: '',
  employer: '',
  isPrimary: false
};


export function PublicEnrollmentPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [students, setStudents] = useState<StudentInfo[]>([{ ...emptyStudent, id: `student_${Date.now()}` }]);
  const [parents, setParents] = useState<ParentInfo[]>([{ ...emptyParent, id: `parent_${Date.now()}`, isPrimary: true }]);
  const [authorizedPickups] = useState<AuthorizedPickup[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedNames, setSubmittedNames] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || '';

  const steps = [
    { number: 1, title: 'Student Info', icon: User },
    { number: 2, title: 'Parent Info', icon: Users },
    { number: 3, title: 'Review & Confirm', icon: ClipboardCheck }
  ];

  const addStudent = () => {
    setStudents([...students, { ...emptyStudent, id: `student_${Date.now()}` }]);
  };

  const removeStudent = (id: string) => {
    if (students.length > 1) {
      setStudents(students.filter(s => s.id !== id));
    }
  };

  const updateStudent = (id: string, field: keyof StudentInfo, value: string) => {
    setStudents(students.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addParent = () => {
    setParents([...parents, { ...emptyParent, id: `parent_${Date.now()}` }]);
  };

  const removeParent = (id: string) => {
    if (parents.length > 1) {
      const remaining = parents.filter(p => p.id !== id);
      if (!remaining.some(p => p.isPrimary)) {
        remaining[0] = { ...remaining[0], isPrimary: true };
      }
      setParents([...remaining]);
    }
  };

  const updateParent = (id: string, field: keyof ParentInfo, value: string | boolean) => {
    setParents(parents.map(p => p.id === id ? { ...p, [field]: value } : p));
  };


  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/public/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campus_id: 'campus_1',
          students,
          parents,
          authorizedPickups,
          policyAgreements: {
            photoRelease: null,
            liabilityWaiver: false,
            medicalAuthorization: false,
            parentHandbook: false,
            electronicSignature: '',
            signatureDate: new Date().toISOString().split('T')[0]
          },
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Submission failed' }));
        const detail = err.detail;
        const message = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((d: { msg?: string }) => d.msg || '').join(', ') : 'Submission failed';
        throw new Error(message || 'Submission failed');
      }
      const result = await response.json();
      setSubmittedNames(result.message || 'Enrollment submitted successfully!');
      setSubmitted(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to submit enrollment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return students.every(s => s.firstName && s.lastName && s.dateOfBirth && s.allergies && s.medication && s.addressLine && s.city && s.state && s.zipcode && s.academicInfo && s.stepUpApplied && s.gradeLevel && s.campusType && s.sessionPreference);
      case 2:
        return parents.every(p => p.firstName && p.lastName && p.email && p.phone);
      case 3:
        return true;
      default:
        return false;
    }
  };

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="border-green-200 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Enrollment Submitted!</h2>
              <p className="text-lg text-gray-600 mb-2">{submittedNames}</p>
              <p className="text-gray-500 mb-8">
                Thank you for your enrollment application. EPIC Prep Academy will review your submission
                and contact you regarding next steps. You should hear back within 2-3 business days.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>What happens next?</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 text-left list-disc list-inside">
                  <li>Our admissions team will review your application</li>
                  <li>You will be contacted by email or phone to schedule a tour</li>
                  <li>Once approved, you will receive enrollment confirmation and next steps</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A2463] to-[#1E3A8A] text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-2">
            <GraduationCap className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold">EPIC Prep Academy</h1>
              <p className="text-blue-200">Student Enrollment Application</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <CardTitle className="text-2xl">Enrollment Application</CardTitle>
            <p className="text-blue-100">Complete all sections to enroll your student(s)</p>
          </CardHeader>
          <CardContent className="p-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8 overflow-x-auto">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[60px]">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        currentStep === step.number
                          ? 'bg-blue-600 text-white'
                          : currentStep > step.number
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {currentStep > step.number ? <Check className="w-5 h-5" /> : step.number}
                    </div>
                    <span className={`text-xs mt-1 ${currentStep === step.number ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-1 mx-1 ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Student Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {students.map((student, index) => (
                  <Card key={student.id} className="border-gray-200">
                    <CardHeader className="bg-gray-50 py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Student #{index + 1}</CardTitle>
                        {students.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStudent(student.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={student.firstName}
                            onChange={(e) => updateStudent(student.id, 'firstName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter first name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={student.lastName}
                            onChange={(e) => updateStudent(student.id, 'lastName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter last name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Birth <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={student.dateOfBirth}
                          onChange={(e) => updateStudent(student.id, 'dateOfBirth', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Allergies <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={student.allergies}
                          onChange={(e) => updateStudent(student.id, 'allergies', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter allergies (or 'None')"
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Medication <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={student.medication}
                          onChange={(e) => updateStudent(student.id, 'medication', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="List any medications and conditions here (or 'None')"
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address Line <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={student.addressLine}
                          onChange={(e) => updateStudent(student.id, 'addressLine', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Street address"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={student.city}
                            onChange={(e) => updateStudent(student.id, 'city', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={student.state}
                            onChange={(e) => updateStudent(student.id, 'state', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="State"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Zipcode <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={student.zipcode}
                            onChange={(e) => updateStudent(student.id, 'zipcode', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Zipcode"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          IEP or 504 Plan Information
                        </label>
                        <textarea
                          value={student.iepInfo}
                          onChange={(e) => updateStudent(student.id, 'iepInfo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Describe IEP/504 accommodations here (if applicable)"
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Academic Information <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={student.academicInfo}
                          onChange={(e) => updateStudent(student.id, 'academicInfo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Last school attended, date withdrawn, and reason for withdrawal"
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Step-Up for Students Applied and Approved? <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={student.stepUpApplied}
                          onChange={(e) => updateStudent(student.id, 'stepUpApplied', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Have you applied for and accepted your Step-Up Scholarship?</option>
                          <option value="yes_approved">Yes - Applied and Approved</option>
                          <option value="yes_pending">Yes - Applied, Pending Approval</option>
                          <option value="no_planning">No - Planning to Apply</option>
                          <option value="no_not_eligible">No - Not Eligible</option>
                          <option value="no_not_interested">No - Not Interested</option>
                        </select>
                      </div>

                      {student.stepUpApplied === 'yes_approved' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount Approved
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <input
                              type="number"
                              value={student.stepUpAmount}
                              onChange={(e) => updateStudent(student.id, 'stepUpAmount', e.target.value)}
                              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter approved amount"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Grade Level <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={student.gradeLevel}
                          onChange={(e) => updateStudent(student.id, 'gradeLevel', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select grade level</option>
                          <option value="K">Kindergarten</option>
                          <option value="1">1st Grade</option>
                          <option value="2">2nd Grade</option>
                          <option value="3">3rd Grade</option>
                          <option value="4">4th Grade</option>
                          <option value="5">5th Grade</option>
                          <option value="6">6th Grade</option>
                          <option value="7">7th Grade</option>
                          <option value="8">8th Grade</option>
                          <option value="9">9th Grade</option>
                          <option value="10">10th Grade</option>
                          <option value="11">11th Grade</option>
                          <option value="12">12th Grade</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Campus Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={student.campusType}
                            onChange={(e) => updateStudent(student.id, 'campusType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select campus</option>
                            <option value="classroom">Classroom</option>
                            <option value="online_only">Online Only</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Session <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={student.sessionPreference}
                            onChange={(e) => updateStudent(student.id, 'sessionPreference', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select session</option>
                            <option value="AM">AM (8:00am - 11:30am)</option>
                            <option value="PM">PM (12:30pm - 4:00pm)</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  variant="outline"
                  onClick={addStudent}
                  className="w-full border-dashed border-2 text-blue-600 hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Student
                </Button>
              </div>
            )}

            {/* Step 2: Parent Info */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {parents.map((parent, index) => (
                  <Card key={parent.id} className="border-gray-200">
                    <CardHeader className="bg-gray-50 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">Parent/Guardian #{index + 1}</CardTitle>
                          {parent.isPrimary && (
                            <Badge className="bg-blue-100 text-blue-800">Primary Contact</Badge>
                          )}
                        </div>
                        {parents.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeParent(parent.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={parent.firstName}
                            onChange={(e) => updateParent(parent.id, 'firstName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter first name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={parent.lastName}
                            onChange={(e) => updateParent(parent.id, 'lastName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter last name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Relationship to Student <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={parent.relationship}
                          onChange={(e) => updateParent(parent.id, 'relationship', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select relationship</option>
                          <option value="mother">Mother</option>
                          <option value="father">Father</option>
                          <option value="stepmother">Stepmother</option>
                          <option value="stepfather">Stepfather</option>
                          <option value="grandmother">Grandmother</option>
                          <option value="grandfather">Grandfather</option>
                          <option value="legal_guardian">Legal Guardian</option>
                          <option value="foster_parent">Foster Parent</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            value={parent.email}
                            onChange={(e) => updateParent(parent.id, 'email', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="email@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cell Phone <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            value={parent.phone}
                            onChange={(e) => updateParent(parent.id, 'phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="(555) 123-4567"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Work Phone</label>
                          <input
                            type="tel"
                            value={parent.workPhone}
                            onChange={(e) => updateParent(parent.id, 'workPhone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Employer</label>
                          <input
                            type="text"
                            value={parent.employer}
                            onChange={(e) => updateParent(parent.id, 'employer', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Company name"
                          />
                        </div>
                      </div>

                      {!parent.isPrimary && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`primary_${parent.id}`}
                            checked={parent.isPrimary}
                            onChange={(e) => {
                              setParents(parents.map(p => ({
                                ...p,
                                isPrimary: p.id === parent.id ? e.target.checked : false
                              })));
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor={`primary_${parent.id}`} className="ml-2 text-sm text-gray-700">
                            Set as primary contact
                          </label>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                <Button
                  variant="outline"
                  onClick={addParent}
                  className="w-full border-dashed border-2 text-blue-600 hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Parent/Guardian
                </Button>
              </div>
            )}

            {/* Step 3: Review & Confirm */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 font-medium">
                    Please review all information below before submitting. Click &quot;Previous&quot; to go back and make changes.
                  </p>
                </div>

                {/* Student Information Review */}
                {students.map((student, index) => (
                  <Card key={student.id} className="border-gray-200">
                    <CardHeader className="bg-gray-50 py-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Student #{index + 1}: {student.firstName} {student.lastName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Full Name</span>
                          <p className="text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Date of Birth</span>
                          <p className="text-sm font-medium text-gray-900">{student.dateOfBirth ? new Date(student.dateOfBirth + 'T00:00:00').toLocaleDateString() : '-'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Grade Level</span>
                          <p className="text-sm font-medium text-gray-900">{student.gradeLevel === 'K' ? 'Kindergarten' : student.gradeLevel ? `${student.gradeLevel}${['1','2','3'].includes(student.gradeLevel) ? ['st','nd','rd'][parseInt(student.gradeLevel)-1] : 'th'} Grade` : '-'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Campus Type</span>
                          <p className="text-sm font-medium text-gray-900">{student.campusType === 'classroom' ? 'Classroom' : student.campusType === 'online_only' ? 'Online Only' : '-'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Session</span>
                          <p className="text-sm font-medium text-gray-900">{student.sessionPreference === 'AM' ? 'AM (8:00am - 11:30am)' : student.sessionPreference === 'PM' ? 'PM (12:30pm - 4:00pm)' : '-'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Step-Up Scholarship</span>
                          <p className="text-sm font-medium text-gray-900">
                            {student.stepUpApplied === 'yes_approved' ? 'Applied & Approved' :
                             student.stepUpApplied === 'yes_pending' ? 'Applied, Pending' :
                             student.stepUpApplied === 'no_planning' ? 'Planning to Apply' :
                             student.stepUpApplied === 'no_not_eligible' ? 'Not Eligible' :
                             student.stepUpApplied === 'no_not_interested' ? 'Not Interested' : '-'}
                            {student.stepUpAmount ? ` ($${student.stepUpAmount})` : ''}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Address</span>
                          <p className="text-sm font-medium text-gray-900">{student.addressLine}, {student.city}, {student.state} {student.zipcode}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Allergies</span>
                          <p className="text-sm font-medium text-gray-900">{student.allergies || '-'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Medication</span>
                          <p className="text-sm font-medium text-gray-900">{student.medication || '-'}</p>
                        </div>
                        {student.iepInfo && (
                          <div className="md:col-span-2">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">IEP / 504 Plan</span>
                            <p className="text-sm font-medium text-gray-900">{student.iepInfo}</p>
                          </div>
                        )}
                        <div className="md:col-span-2">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Academic Information</span>
                          <p className="text-sm font-medium text-gray-900">{student.academicInfo || '-'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Parent/Guardian Information Review */}
                {parents.map((parent, index) => (
                  <Card key={parent.id} className="border-gray-200">
                    <CardHeader className="bg-gray-50 py-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Parent/Guardian #{index + 1}: {parent.firstName} {parent.lastName}
                        {parent.isPrimary && <Badge className="bg-blue-100 text-blue-700 text-xs ml-2">Primary Contact</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Full Name</span>
                          <p className="text-sm font-medium text-gray-900">{parent.firstName} {parent.lastName}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Relationship</span>
                          <p className="text-sm font-medium text-gray-900 capitalize">{parent.relationship || '-'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Email</span>
                          <p className="text-sm font-medium text-gray-900">{parent.email || '-'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Cell Phone</span>
                          <p className="text-sm font-medium text-gray-900">{parent.phone || '-'}</p>
                        </div>
                        {parent.workPhone && (
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Work Phone</span>
                            <p className="text-sm font-medium text-gray-900">{parent.workPhone}</p>
                          </div>
                        )}
                        {parent.employer && (
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Employer</span>
                            <p className="text-sm font-medium text-gray-900">{parent.employer}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Required Fields Note */}
            <p className="text-center text-sm text-red-500 mt-6"><span className="text-red-500">*</span> Required</p>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-4 pt-6 border-t">
              <div>
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}
              </div>
              <div>
                {currentStep < 3 ? (
                  <Button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!canProceed()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canProceed() || submitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {submitting ? (
                      <>Submitting...</>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} EPIC Prep Academy &middot; Auvora LLC. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
