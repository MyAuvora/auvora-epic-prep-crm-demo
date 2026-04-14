import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Users,
  UserCheck,
  FileText,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Check,
  GraduationCap,
  CheckCircle,
  MapPin,
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
  gradeLevel: string;
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

interface CampusOption {
  campus_id: string;
  name: string;
  location: string;
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
  gradeLevel: '',
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

const emptyPickup: AuthorizedPickup = {
  id: '',
  name: '',
  relationship: '',
  phone: ''
};

export function PublicEnrollmentPage() {
  const [currentStep, setCurrentStep] = useState(0); // 0 = campus selection
  const [campuses, setCampuses] = useState<CampusOption[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState('');
  const [students, setStudents] = useState<StudentInfo[]>([{ ...emptyStudent, id: `student_${Date.now()}` }]);
  const [parents, setParents] = useState<ParentInfo[]>([{ ...emptyParent, id: `parent_${Date.now()}`, isPrimary: true }]);
  const [authorizedPickups, setAuthorizedPickups] = useState<AuthorizedPickup[]>([]);
  const [policyAgreements, setPolicyAgreements] = useState({
    photoRelease: false,
    liabilityWaiver: false,
    medicalAuthorization: false,
    parentHandbook: false,
    electronicSignature: '',
    signatureDate: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedNames, setSubmittedNames] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || '';

  // Load campuses on mount
  useEffect(() => {
    fetch(`${API_URL}/api/public/campuses`)
      .then(r => r.json())
      .then(data => {
        setCampuses(data);
        // Check URL for pre-selected campus
        const hash = window.location.hash;
        const campusMatch = hash.match(/campus=([^&]+)/);
        if (campusMatch) {
          setSelectedCampusId(campusMatch[1]);
          setCurrentStep(1); // Skip campus selection
        }
      })
      .catch(() => {});
  }, [API_URL]);

  const steps = [
    { number: 0, title: 'Campus', icon: MapPin },
    { number: 1, title: 'Student Info', icon: User },
    { number: 2, title: 'Parent Info', icon: Users },
    { number: 3, title: 'Authorized Pickup', icon: UserCheck },
    { number: 4, title: 'Policy & Waiver', icon: FileText }
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
        remaining[0].isPrimary = true;
      }
      setParents([...remaining]);
    }
  };

  const updateParent = (id: string, field: keyof ParentInfo, value: string | boolean) => {
    setParents(parents.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addPickup = () => {
    setAuthorizedPickups([...authorizedPickups, { ...emptyPickup, id: `pickup_${Date.now()}` }]);
  };

  const removePickup = (id: string) => {
    setAuthorizedPickups(authorizedPickups.filter(p => p.id !== id));
  };

  const updatePickup = (id: string, field: keyof AuthorizedPickup, value: string) => {
    setAuthorizedPickups(authorizedPickups.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/public/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campus_id: selectedCampusId || 'campus_1',
          students,
          parents,
          authorizedPickups,
          policyAgreements,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Submission failed' }));
        throw new Error(err.detail || 'Submission failed');
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
      case 0:
        return !!selectedCampusId;
      case 1:
        return students.every(s => s.firstName && s.lastName && s.dateOfBirth && s.gradeLevel);
      case 2:
        return parents.every(p => p.firstName && p.lastName && p.email && p.phone);
      case 3:
        return true;
      case 4:
        return policyAgreements.photoRelease &&
               policyAgreements.liabilityWaiver &&
               policyAgreements.medicalAuthorization &&
               policyAgreements.parentHandbook &&
               policyAgreements.electronicSignature;
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
                      {currentStep > step.number ? <Check className="w-5 h-5" /> : step.number + 1}
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

            {/* Step 0: Campus Selection */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Campus</h2>
                  <p className="text-gray-500">Select the EPIC Prep Academy location you would like to enroll at</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {campuses.map((campus) => (
                    <Card
                      key={campus.campus_id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedCampusId === campus.campus_id
                          ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedCampusId(campus.campus_id)}
                    >
                      <CardContent className="p-6 text-center">
                        <MapPin className={`w-8 h-8 mx-auto mb-3 ${
                          selectedCampusId === campus.campus_id ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <h3 className="font-semibold text-lg">{campus.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{campus.location}</p>
                        {selectedCampusId === campus.campus_id && (
                          <Badge className="mt-3 bg-blue-100 text-blue-800">Selected</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {campuses.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Loading campuses...</p>
                  </div>
                )}
              </div>
            )}

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
                          Allergies
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
                          Medication
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
                          Address Line
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                          <input
                            type="text"
                            value={student.city}
                            onChange={(e) => updateStudent(student.id, 'city', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                          <input
                            type="text"
                            value={student.state}
                            onChange={(e) => updateStudent(student.id, 'state', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="State"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Zipcode</label>
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
                          Academic Information
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
                          Step-Up for Students Applied and Approved?
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Which Session Do You Prefer?
                          </label>
                          <select
                            value={student.sessionPreference}
                            onChange={(e) => updateStudent(student.id, 'sessionPreference', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select session preference</option>
                            <option value="morning">Morning Session</option>
                            <option value="afternoon">Afternoon Session</option>
                            <option value="no_preference">No Preference</option>
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

            {/* Step 3: Authorized Pickup */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Parents/Guardians listed in the previous section are automatically authorized for pickup.
                    Add any additional people who are authorized to pick up your child(ren) below.
                  </p>
                </div>

                {authorizedPickups.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <UserCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No additional authorized pickup persons added</p>
                    <p className="text-sm">Click the button below to add someone</p>
                  </div>
                ) : (
                  authorizedPickups.map((pickup, index) => (
                    <Card key={pickup.id} className="border-gray-200">
                      <CardHeader className="bg-gray-50 py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Authorized Person #{index + 1}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePickup(pickup.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={pickup.name}
                            onChange={(e) => updatePickup(pickup.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter full name"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Relationship to Student <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={pickup.relationship}
                              onChange={(e) => updatePickup(pickup.id, 'relationship', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select relationship</option>
                              <option value="grandparent">Grandparent</option>
                              <option value="aunt_uncle">Aunt/Uncle</option>
                              <option value="sibling">Sibling (18+)</option>
                              <option value="family_friend">Family Friend</option>
                              <option value="nanny">Nanny/Caregiver</option>
                              <option value="neighbor">Neighbor</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="tel"
                              value={pickup.phone}
                              onChange={(e) => updatePickup(pickup.id, 'phone', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="(555) 123-4567"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}

                <Button
                  variant="outline"
                  onClick={addPickup}
                  className="w-full border-dashed border-2 text-blue-600 hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Authorized Pickup Person
                </Button>
              </div>
            )}

            {/* Step 4: Policy & Waiver */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <Card className="border-gray-200">
                  <CardHeader className="bg-gray-50 py-3">
                    <CardTitle className="text-lg">Policies and Agreements</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="photoRelease"
                          checked={policyAgreements.photoRelease}
                          onChange={(e) => setPolicyAgreements({...policyAgreements, photoRelease: e.target.checked})}
                          className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="photoRelease" className="ml-3 text-sm text-gray-700">
                          <span className="font-medium">Photo/Video Release</span> <span className="text-red-500">*</span>
                          <p className="text-gray-500 mt-1">
                            I grant EPIC Prep Academy permission to use photographs and/or video of my child(ren)
                            for educational, promotional, and marketing purposes including but not limited to
                            the school website, social media, newsletters, and promotional materials.
                          </p>
                        </label>
                      </div>

                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="liabilityWaiver"
                          checked={policyAgreements.liabilityWaiver}
                          onChange={(e) => setPolicyAgreements({...policyAgreements, liabilityWaiver: e.target.checked})}
                          className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="liabilityWaiver" className="ml-3 text-sm text-gray-700">
                          <span className="font-medium">Liability Waiver</span> <span className="text-red-500">*</span>
                          <p className="text-gray-500 mt-1">
                            I understand that participation in school activities involves inherent risks.
                            I agree to release and hold harmless EPIC Prep Academy, its staff, and volunteers
                            from any claims arising from my child's participation in school activities.
                          </p>
                        </label>
                      </div>

                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="medicalAuthorization"
                          checked={policyAgreements.medicalAuthorization}
                          onChange={(e) => setPolicyAgreements({...policyAgreements, medicalAuthorization: e.target.checked})}
                          className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="medicalAuthorization" className="ml-3 text-sm text-gray-700">
                          <span className="font-medium">Medical Authorization</span> <span className="text-red-500">*</span>
                          <p className="text-gray-500 mt-1">
                            In case of emergency, I authorize EPIC Prep Academy staff to seek emergency medical
                            treatment for my child if I cannot be reached. I understand I am responsible for
                            any medical expenses incurred.
                          </p>
                        </label>
                      </div>

                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="parentHandbook"
                          checked={policyAgreements.parentHandbook}
                          onChange={(e) => setPolicyAgreements({...policyAgreements, parentHandbook: e.target.checked})}
                          className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="parentHandbook" className="ml-3 text-sm text-gray-700">
                          <span className="font-medium">Parent Handbook Agreement</span> <span className="text-red-500">*</span>
                          <p className="text-gray-500 mt-1">
                            I have read and agree to abide by the policies and procedures outlined in the
                            EPIC Prep Academy Parent Handbook, including attendance policies, dress code,
                            discipline procedures, and tuition payment terms.
                          </p>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200">
                  <CardHeader className="bg-gray-50 py-3">
                    <CardTitle className="text-lg">Electronic Signature</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type Your Full Legal Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={policyAgreements.electronicSignature}
                        onChange={(e) => setPolicyAgreements({...policyAgreements, electronicSignature: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your full legal name as signature"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        By typing your name above, you are signing this form electronically and agree to all terms and conditions.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={policyAgreements.signatureDate}
                        onChange={(e) => setPolicyAgreements({...policyAgreements, signatureDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
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
                {currentStep < 4 ? (
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
                        Submit Enrollment
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
