import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A2463] to-[#163B9A] text-white py-8">
        <div className="max-w-4xl mx-auto px-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-white/80 mt-2">Effective Date: February 1, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-slate max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Company:</strong> Auvora LLC ("Auvora," "we," "us")<br />
              <strong>Location:</strong> Pace, Florida, United States<br />
              <strong>Contact:</strong> MyAuvora@gmail.com
            </p>

            <p className="text-gray-700 mb-6">
              This Privacy Policy explains how we collect, use, disclose, and protect information when you use Auvora's websites, applications, and services (collectively, the "Service").
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">1) Who This Policy Applies To</h2>
            <p className="text-gray-700 mb-4">
              This policy applies to users of the Service, including gym and studio owners and anyone using the Service on behalf of a business.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">2) Information We Collect</h2>
            <p className="text-gray-700 mb-4">We may collect the following categories of information:</p>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">A) Account Information</h3>
            <p className="text-gray-700 mb-4">Information you provide to create and manage an account, such as:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Business/studio name</li>
              <li>Login credentials (stored in a protected form)</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">B) Customer Data You Upload</h3>
            <p className="text-gray-700 mb-4">
              The Service is a CRM, so you may upload or input information about your clients/customers (for example: names, contact details, attendance history, notes, and other CRM records). This is "Customer Data."
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">C) Usage Data</h3>
            <p className="text-gray-700 mb-4">We may collect information about how you use the Service, such as:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Log data (IP address, device type, browser type, timestamps)</li>
              <li>Feature usage and interactions</li>
              <li>Diagnostic and performance data</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">D) Cookies and Similar Technologies</h3>
            <p className="text-gray-700 mb-4">
              We may use cookies and similar technologies to operate the Service and understand usage. You can control cookies through your browser settings, but some features may not function properly.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">3) How We Use Information</h2>
            <p className="text-gray-700 mb-4">We use information to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Provide, operate, and maintain the Service</li>
              <li>Create and manage accounts</li>
              <li>Process subscription payments (through our payment processor)</li>
              <li>Provide customer support and communicate with you</li>
              <li>Monitor, prevent, and address security issues, fraud, and abuse</li>
              <li>Improve and develop the Service</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">4) AI Features and Use of Data</h2>
            <p className="text-gray-700 mb-4">The Service includes AI-powered features.</p>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">A) AI Processing</h3>
            <p className="text-gray-700 mb-4">
              To provide AI features, we may process Customer Data and account information as inputs to generate outputs (for example, summaries, suggested actions, or insights).
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">B) Training and Improvement</h3>
            <p className="text-gray-700 mb-4">
              You acknowledge and agree that we may use Customer Data and account data to train, improve, and develop our models and services.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">C) Third-Party AI Providers</h3>
            <p className="text-gray-700 mb-4">
              We may use third-party AI providers, including Devin AI, to provide certain AI functionality. This may involve sending relevant inputs to those providers to generate outputs.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">5) How We Share Information</h2>
            <p className="text-gray-700 mb-4">We may share information in the following circumstances:</p>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">A) Service Providers (Subprocessors)</h3>
            <p className="text-gray-700 mb-4">
              We may share information with vendors that help us operate the Service (for example, hosting, analytics, customer support tools, and payment processing). Subprocessors are authorized to use information only as needed to provide services to us.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">B) Integrations and Third Parties You Choose</h3>
            <p className="text-gray-700 mb-4">
              If you connect third-party integrations, we may share information as needed to enable those integrations. Third-party services are governed by their own terms and privacy policies.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">C) Legal and Safety</h3>
            <p className="text-gray-700 mb-4">
              We may disclose information if we believe it is necessary to comply with law, protect rights and safety, investigate fraud, or respond to lawful requests.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">D) Business Transfers</h3>
            <p className="text-gray-700 mb-4">
              If we are involved in a merger, acquisition, financing, reorganization, or sale of assets, information may be transferred as part of that transaction.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">6) Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain information for as long as necessary to provide the Service and for legitimate business purposes, such as complying with legal obligations, resolving disputes, and enforcing agreements.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">7) Security</h2>
            <p className="text-gray-700 mb-4">
              We use reasonable administrative, technical, and organizational measures designed to protect information. However, no method of transmission or storage is 100% secure.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">8) Your Choices and Rights</h2>
            <p className="text-gray-700 mb-4">
              Because we currently operate US-only, rights may vary by state.
            </p>
            <p className="text-gray-700 mb-4">You may:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Update or correct your account information</li>
              <li>Request access to or deletion of certain information (subject to legal and contractual limitations)</li>
            </ul>
            <p className="text-gray-700 mb-4">
              To make a request, contact: <a href="mailto:MyAuvora@gmail.com" className="text-[#0A2463] hover:underline">MyAuvora@gmail.com</a>
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">9) Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              The Service is not directed to children. We do not knowingly collect personal information from children.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">10) International Users</h2>
            <p className="text-gray-700 mb-4">
              The Service is intended for users in the United States. If you access the Service from outside the US, you understand your information may be processed in the United States.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">11) Changes to This Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this policy from time to time. If changes are material, we will provide notice (for example, in-app or by email). The updated policy will be effective as of the posted effective date.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">12) Contact Us</h2>
            <p className="text-gray-700 mb-4">
              Questions or requests regarding privacy: <a href="mailto:MyAuvora@gmail.com" className="text-[#0A2463] hover:underline">MyAuvora@gmail.com</a>
            </p>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 italic">
                This document is marked as DRAFT and was last updated February 1, 2026.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
