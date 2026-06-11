import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CheckCircle,
  Circle,
  Camera,
  Shield,
  Heart,
  BookOpen,
  UserCheck,
  PenTool,
  Plus,
  Trash2,
  ClipboardCheck,
  Loader2,
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface AuthorizedPickup {
  name: string
  relationship: string
  phone: string
}

interface ChecklistData {
  checklist_id: string
  lead_id: string
  family_id: string | null
  photo_release: string | null
  liability_waiver: boolean
  medical_authorization: boolean
  parent_handbook: boolean
  authorized_pickups: AuthorizedPickup[] | null
  electronic_signature: string | null
  signature_date: string | null
  completed: boolean
  completed_at: string | null
}

interface EnrollmentChecklistProps {
  familyId: string
}

export function EnrollmentChecklist({ familyId }: EnrollmentChecklistProps) {
  const [checklists, setChecklists] = useState<ChecklistData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Local form state
  const [photoRelease, setPhotoRelease] = useState<string | null>(null)
  const [liabilityWaiver, setLiabilityWaiver] = useState(false)
  const [medicalAuth, setMedicalAuth] = useState(false)
  const [parentHandbook, setParentHandbook] = useState(false)
  const [authorizedPickups, setAuthorizedPickups] = useState<AuthorizedPickup[]>([])
  const [electronicSignature, setElectronicSignature] = useState('')
  const [signatureDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchChecklists()
  }, [familyId])

  const fetchChecklists = async () => {
    try {
      const res = await fetch(`${API_URL}/api/enrollment-checklist/by-family/${familyId}`)
      if (res.ok) {
        const data = await res.json()
        setChecklists(data)
        if (data.length > 0) {
          const cl = data[0]
          setPhotoRelease(cl.photo_release)
          setLiabilityWaiver(cl.liability_waiver)
          setMedicalAuth(cl.medical_authorization)
          setParentHandbook(cl.parent_handbook)
          setAuthorizedPickups(cl.authorized_pickups || [])
          setElectronicSignature(cl.electronic_signature || '')
        }
      }
    } catch (e) {
      console.error('Error fetching checklists:', e)
    } finally {
      setLoading(false)
    }
  }

  const saveChecklist = async (checklistId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/api/enrollment-checklist/${checklistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_release: photoRelease,
          liability_waiver: liabilityWaiver,
          medical_authorization: medicalAuth,
          parent_handbook: parentHandbook,
          authorized_pickups: authorizedPickups,
          electronic_signature: electronicSignature || null,
          signature_date: signatureDate,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setChecklists(prev => prev.map(c => c.checklist_id === checklistId ? updated : c))
        if (updated.completed) {
          alert('Enrollment checklist completed! Your enrollment is now being reviewed.')
          fetchChecklists()
        }
      }
    } catch (e) {
      console.error('Error saving checklist:', e)
      alert('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const addPickup = () => {
    setAuthorizedPickups([...authorizedPickups, { name: '', relationship: '', phone: '' }])
  }

  const removePickup = (index: number) => {
    setAuthorizedPickups(authorizedPickups.filter((_, i) => i !== index))
  }

  const updatePickup = (index: number, field: keyof AuthorizedPickup, value: string) => {
    setAuthorizedPickups(authorizedPickups.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  const completedCount = [
    photoRelease !== null,
    liabilityWaiver,
    medicalAuth,
    parentHandbook,
    electronicSignature.length > 0,
  ].filter(Boolean).length
  const totalRequired = 5

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading enrollment checklist...</span>
      </div>
    )
  }

  if (checklists.length === 0) {
    return null
  }

  const checklist = checklists[0]

  if (checklist.completed) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-800">Enrollment Checklist Complete!</h3>
          <p className="text-green-600 mt-1">All required forms have been submitted. Your enrollment is being reviewed by the school.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="border-blue-200">
        <CardHeader className="bg-blue-50 py-4">
          <CardTitle className="flex items-center gap-3">
            <ClipboardCheck className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-blue-800">Enrollment Checklist</h2>
              <p className="text-sm text-blue-600 font-normal mt-1">
                Complete all required forms to finalize your enrollment.
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / totalRequired) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600">
              {completedCount} / {totalRequired} complete
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 1. Photo/Video Release */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {photoRelease !== null ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-gray-300" />
            )}
            <Camera className="h-5 w-5 text-gray-500" />
            Photo/Video Release
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            EPIC Prep Academy occasionally takes photos and videos of students for school publications,
            social media, marketing materials, and classroom documentation. Please indicate your preference below.
          </p>
          <div className="flex gap-4">
            <label className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors ${
              photoRelease === 'accept' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="photoRelease"
                checked={photoRelease === 'accept'}
                onChange={() => setPhotoRelease('accept')}
                className="sr-only"
              />
              <CheckCircle className={`h-5 w-5 ${photoRelease === 'accept' ? 'text-green-600' : 'text-gray-300'}`} />
              <span className="font-medium">I Accept</span>
            </label>
            <label className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors ${
              photoRelease === 'deny' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="photoRelease"
                checked={photoRelease === 'deny'}
                onChange={() => setPhotoRelease('deny')}
                className="sr-only"
              />
              <Circle className={`h-5 w-5 ${photoRelease === 'deny' ? 'text-red-600' : 'text-gray-300'}`} />
              <span className="font-medium">I Deny</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 2. Liability Waiver */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {liabilityWaiver ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-gray-300" />
            )}
            <Shield className="h-5 w-5 text-gray-500" />
            Liability Waiver
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto text-sm text-gray-700">
            <p className="mb-2">
              I, the undersigned parent/guardian, acknowledge that participation in EPIC Prep Academy
              programs involves certain risks. I agree to release, discharge, and hold harmless EPIC Prep
              Academy, its officers, employees, and agents from any and all liability, claims, demands,
              or causes of action arising out of my child&apos;s participation in school programs and activities.
            </p>
            <p>
              I understand that EPIC Prep Academy will take reasonable precautions to ensure the safety
              and well-being of all students, but that no environment is entirely risk-free.
            </p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={liabilityWaiver}
              onChange={(e) => setLiabilityWaiver(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              I have read and agree to the Liability Waiver
            </span>
          </label>
        </CardContent>
      </Card>

      {/* 3. Medical Authorization */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {medicalAuth ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-gray-300" />
            )}
            <Heart className="h-5 w-5 text-gray-500" />
            Medical Authorization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto text-sm text-gray-700">
            <p className="mb-2">
              I authorize EPIC Prep Academy to seek emergency medical treatment for my child in the event
              of an illness or injury while under the school&apos;s supervision. I understand that the school will
              make every effort to contact me or my designated emergency contacts first.
            </p>
            <p>
              I also authorize school staff to administer basic first aid and any prescribed medications
              (with proper documentation) as needed during school hours.
            </p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={medicalAuth}
              onChange={(e) => setMedicalAuth(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              I have read and agree to the Medical Authorization
            </span>
          </label>
        </CardContent>
      </Card>

      {/* 4. Parent Handbook Agreement */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {parentHandbook ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-gray-300" />
            )}
            <BookOpen className="h-5 w-5 text-gray-500" />
            Parent Handbook Agreement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto text-sm text-gray-700">
            <p className="mb-2">
              I acknowledge that I have received, read, and understand the EPIC Prep Academy Parent Handbook.
              I agree to abide by the policies, procedures, and guidelines outlined in the handbook.
            </p>
            <p>
              I understand that EPIC Prep Academy reserves the right to update the handbook and that I will
              be notified of any significant changes.
            </p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={parentHandbook}
              onChange={(e) => setParentHandbook(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              I have read and agree to the Parent Handbook
            </span>
          </label>
        </CardContent>
      </Card>

      {/* 5. Authorized Pickup */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-5 w-5 text-gray-500" />
            Authorized Pickup Persons
            <span className="text-xs font-normal text-gray-400 ml-1">(Optional)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Parents/Guardians are automatically authorized for pickup. Add any additional people who are
            authorized to pick up your child(ren) below.
          </p>

          {authorizedPickups.map((pickup, index) => (
            <div key={index} className="border rounded-lg p-4 mb-3 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Person {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePickup(index)}
                  className="text-red-500 hover:text-red-700 h-8 px-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Full Name</Label>
                  <Input
                    value={pickup.name}
                    onChange={(e) => updatePickup(index, 'name', e.target.value)}
                    placeholder="Full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Relationship</Label>
                  <Input
                    value={pickup.relationship}
                    onChange={(e) => updatePickup(index, 'relationship', e.target.value)}
                    placeholder="e.g., Grandparent"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Phone Number</Label>
                  <Input
                    value={pickup.phone}
                    onChange={(e) => updatePickup(index, 'phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addPickup}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Authorized Pickup Person
          </Button>
        </CardContent>
      </Card>

      {/* 6. Electronic Signature */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {electronicSignature.length > 0 ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-gray-300" />
            )}
            <PenTool className="h-5 w-5 text-gray-500" />
            Electronic Signature
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            By typing your full legal name below, you are electronically signing this enrollment agreement
            and acknowledging that all information provided is accurate and complete.
          </p>
          <div className="space-y-3">
            <div>
              <Label>Full Legal Name <span className="text-red-500">*</span></Label>
              <Input
                value={electronicSignature}
                onChange={(e) => setElectronicSignature(e.target.value)}
                placeholder="Type your full legal name"
                className="mt-1 text-lg"
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input
                value={signatureDate}
                disabled
                className="mt-1 bg-gray-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="sticky bottom-0 bg-white border-t py-4 px-4 -mx-4">
        <Button
          onClick={() => saveChecklist(checklist.checklist_id)}
          disabled={saving || completedCount < totalRequired}
          className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : completedCount < totalRequired ? (
            `Complete All Required Items (${completedCount}/${totalRequired})`
          ) : (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Submit Enrollment Forms
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
