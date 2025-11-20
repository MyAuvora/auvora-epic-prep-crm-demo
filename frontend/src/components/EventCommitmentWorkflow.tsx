import { useState, useEffect } from 'react'
import { Check, FileText, CreditCard, CheckCircle, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Event {
  event_id: string
  campus_id: string
  title: string
  description: string
  event_type: string
  date: string
  time: string
  location: string
  capacity?: number
  registered_count?: number
  requires_rsvp: boolean
  requires_permission_slip: boolean
  requires_payment: boolean
  permission_slip_content?: string | null
  payment_amount: number | null
  payment_description?: string | null
  created_by_staff_id: string
}

interface Student {
  student_id: string
  first_name: string
  last_name: string
  grade: string
  campus_id: string
}

interface Parent {
  parent_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
}

interface EventCommitmentWorkflowProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  event: Event
  familyId: string
  parentId: string
}

export function EventCommitmentWorkflow({
  isOpen,
  onClose,
  onComplete,
  event,
  familyId,
  parentId
}: EventCommitmentWorkflowProps) {
  const [step, setStep] = useState(1)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [signature, setSignature] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [isProcessing, setIsProcessing] = useState(false)
  const [workflowIds, setWorkflowIds] = useState<Record<string, string>>({})
  const [students, setStudents] = useState<Student[]>([])
  const [parent, setParent] = useState<Parent | null>(null)

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setSelectedStudents(new Set())
      setSignature('')
      setAgreedToTerms(false)
      setPaymentMethod('card')
      setWorkflowIds({})
      fetchFamilyData()
    }
  }, [isOpen, familyId, parentId])

  const fetchFamilyData = async () => {
    try {
      const [studentsRes, parentRes] = await Promise.all([
        fetch(`${API_URL}/api/students?family_id=${familyId}`),
        fetch(`${API_URL}/api/parents/${parentId}`)
      ])
      const studentsData = await studentsRes.json()
      const parentData = await parentRes.json()
      setStudents(studentsData)
      setParent(parentData)
    } catch (error) {
      console.error('Error fetching family data:', error)
    }
  }

  const handleStudentToggle = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleNextStep = async () => {
    if (step === 1) {
      if (selectedStudents.size === 0) {
        alert('Please select at least one student')
        return
      }
      
      const workflows: Record<string, string> = {}
      for (const studentId of selectedStudents) {
        const workflowId = `workflow_${Date.now()}_${studentId}`
        workflows[studentId] = workflowId
        
        await fetch(`${API_URL}/api/event-workflows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflow_id: workflowId,
            event_id: event.event_id,
            rsvp_id: `rsvp_${Date.now()}_${studentId}`,
            family_id: familyId,
            student_id: studentId,
            status: 'Pending',
            permission_slip_signed: false,
            permission_slip_signature_id: null,
            payment_complete: false,
            payment_order_id: null,
            created_date: new Date().toISOString().split('T')[0],
            completed_date: null
          })
        })
      }
      setWorkflowIds(workflows)
      
      if (event.requires_permission_slip) {
        setStep(2)
      } else if (event.payment_amount && event.payment_amount > 0) {
        setStep(3)
      } else {
        await completeWorkflow()
      }
    } else if (step === 2) {
      if (!signature.trim()) {
        alert('Please provide your signature')
        return
      }
      if (!agreedToTerms) {
        alert('Please agree to the terms')
        return
      }
      
      for (const studentId of selectedStudents) {
        const workflowId = workflowIds[studentId]
        await fetch(`${API_URL}/api/event-workflows/${workflowId}/sign-permission-slip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signature_id: `sig_${Date.now()}_${studentId}`
          })
        })
      }
      
      if (event.payment_amount && event.payment_amount > 0) {
        setStep(3)
      } else {
        await completeWorkflow()
      }
    } else if (step === 3) {
      await handlePayment()
    }
  }

  const handlePayment = async () => {
    setIsProcessing(true)
    try {
      // const totalAmount = (event.payment_amount || 0) * selectedStudents.size
      
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      for (const studentId of selectedStudents) {
        const workflowId = workflowIds[studentId]
        const orderId = `order_${Date.now()}_${studentId}`
        
        await fetch(`${API_URL}/api/event-workflows/${workflowId}/complete-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderId
          })
        })
        
        await fetch(`${API_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderId,
            campus_id: event.campus_id,
            family_id: familyId,
            parent_id: parent?.parent_id || parentId,
            order_date: new Date().toISOString().split('T')[0],
            total_amount: event.payment_amount || 0,
            status: 'Completed',
            items: [{
              product_name: event.title,
              quantity: 1,
              price: event.payment_amount || 0
            }]
          })
        })
      }
      
      await completeWorkflow()
    } catch (error) {
      console.error('Error processing payment:', error)
      alert('Error processing payment')
    } finally {
      setIsProcessing(false)
    }
  }

  const completeWorkflow = async () => {
    setStep(4)
    setTimeout(() => {
      onComplete()
      onClose()
    }, 3000)
  }

  const totalCost = (event.payment_amount || 0) * selectedStudents.size

  const getStepStatus = (stepNum: number) => {
    if (step > stepNum) return 'complete'
    if (step === stepNum) return 'active'
    return 'pending'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[80vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="text-2xl">Event Registration: {event.title}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map((stepNum) => {
            const status = getStepStatus(stepNum)
            const labels = ['Select Students', 'Permission Slip', 'Payment', 'Confirmation']
            
            if (stepNum === 2 && !event.requires_permission_slip) return null
            if (stepNum === 3 && (!event.payment_amount || event.payment_amount === 0)) return null
            
            return (
              <div key={stepNum} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    status === 'complete' ? 'bg-green-500 text-white' :
                    status === 'active' ? 'bg-amber-600 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {status === 'complete' ? <Check className="h-5 w-5" /> : stepNum}
                  </div>
                  <p className="text-xs mt-1 text-center">{labels[stepNum - 1]}</p>
                </div>
                {stepNum < 4 && (
                  <ChevronRight className="h-5 w-5 text-gray-400 mx-2" />
                )}
              </div>
            )
          })}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Select Students</h3>
              <p className="text-sm text-gray-600 mb-4">
                Which of your children will be attending this event?
              </p>
            </div>

            <div className="space-y-2">
              {students.map((student) => (
                <Card
                  key={student.student_id}
                  className={`cursor-pointer transition-all ${
                    selectedStudents.has(student.student_id)
                      ? 'border-amber-600 bg-amber-50'
                      : 'hover:border-amber-300'
                  }`}
                  onClick={() => handleStudentToggle(student.student_id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedStudents.has(student.student_id)}
                          onCheckedChange={() => handleStudentToggle(student.student_id)}
                        />
                        <div>
                          <p className="font-medium">{student.first_name} {student.last_name}</p>
                          <p className="text-sm text-gray-500">Grade {student.grade}</p>
                        </div>
                      </div>
                      {event.payment_amount && event.payment_amount > 0 && (
                        <p className="text-sm font-medium text-gray-700">
                          ${event.payment_amount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {event.payment_amount && event.payment_amount > 0 && selectedStudents.size > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="font-medium">Total Cost:</p>
                  <p className="text-xl font-bold text-amber-600">${totalCost.toFixed(2)}</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleNextStep}
              disabled={selectedStudents.size === 0}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 2 && event.requires_permission_slip && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Permission Slip
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please review and sign the permission slip below
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border max-h-64 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">
                {event.permission_slip_content || `Permission Slip for ${event.title}

I, ${parent?.first_name || ''} ${parent?.last_name || ''}, give permission for my child(ren) to participate in ${event.title} on ${new Date(event.date).toLocaleDateString()}.

Event Details:
- Date: ${new Date(event.date).toLocaleDateString()}
- Time: ${event.time}
- Location: ${event.location}

Students Attending:
${Array.from(selectedStudents).map(id => {
  const student = students.find(s => s.student_id === id)
  return `- ${student?.first_name} ${student?.last_name} (Grade ${student?.grade})`
}).join('\n')}

I understand that my child(ren) will be supervised by school staff during this event. I agree to pick up my child(ren) promptly at the end of the event.

Emergency Contact: ${parent?.phone || ''}
Email: ${parent?.email || ''}`}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Parent/Guardian Signature (Type your full name)</Label>
                <Input
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Type your full name"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="cursor-pointer text-sm">
                  I have read and agree to the terms above
                </Label>
              </div>
            </div>

            <Button
              onClick={handleNextStep}
              disabled={!signature.trim() || !agreedToTerms}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              Sign & Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 3 && event.payment_amount && event.payment_amount > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Complete payment to finalize your registration
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium">Event Fee:</p>
                <p className="font-semibold">${event.payment_amount.toFixed(2)} per student</p>
              </div>
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium">Number of Students:</p>
                <p className="font-semibold">{selectedStudents.size}</p>
              </div>
              <div className="border-t border-amber-300 mt-2 pt-2">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-bold">Total Amount:</p>
                  <p className="text-2xl font-bold text-amber-600">${totalCost.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Payment Method</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Button
                    variant={paymentMethod === 'card' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('card')}
                    className={paymentMethod === 'card' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                  >
                    Credit/Debit Card
                  </Button>
                  <Button
                    variant={paymentMethod === 'account' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('account')}
                    className={paymentMethod === 'account' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                  >
                    Account Balance
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This is a demo payment. No actual charges will be made.
                </p>
              </div>
            </div>

            <Button
              onClick={handleNextStep}
              disabled={isProcessing}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>Processing Payment...</>
              ) : (
                <>
                  Complete Payment
                  <CreditCard className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-8">
            <div className="mb-6">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</h3>
            <p className="text-gray-600 mb-4">
              Your registration for {event.title} has been confirmed.
            </p>
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
              <p className="text-sm text-green-800">
                <strong>Students Registered:</strong> {selectedStudents.size}
              </p>
              {event.payment_amount && event.payment_amount > 0 && (
                <p className="text-sm text-green-800 mt-1">
                  <strong>Amount Paid:</strong> ${totalCost.toFixed(2)}
                </p>
              )}
            </div>
            <p className="text-sm text-gray-500">
              A confirmation email has been sent to {parent?.email || 'your email'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
