import { ArrowLeft } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

export function TermsOfService({ onBack }: TermsOfServiceProps) {
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
          <h1 className="text-3xl font-bold">Terms of Service</h1>
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

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">1) Acceptance of These Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing or using Auvora's websites, applications, and services (collectively, the "Service"), you agree to these Terms of Service ("Terms"). If you do not agree, do not use the Service.
            </p>
            <p className="text-gray-700 mb-4">
              If you use the Service on behalf of a business, you represent that you have authority to bind that business, and "you" includes the business.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">2) Who the Service Is For</h2>
            <p className="text-gray-700 mb-4">
              The Service is intended for gym and studio owners and their businesses. We do not set a minimum age requirement, but you must be legally able to enter into a binding contract where you live.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">3) Accounts and Security</h2>
            <p className="text-gray-700 mb-4">You are responsible for:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Providing accurate account information</li>
              <li>Maintaining the confidentiality of your login credentials</li>
              <li>All activity that occurs under your account</li>
            </ul>
            <p className="text-gray-700 mb-4">Notify us promptly if you suspect unauthorized access.</p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">4) Subscriptions, Billing, and No Refunds</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Plans</h3>
            <p className="text-gray-700 mb-4">
              We may offer monthly and annual subscription plans and may change plan features and pricing from time to time.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Billing</h3>
            <p className="text-gray-700 mb-4">
              By starting a paid subscription, you authorize us (and our payment processor) to charge your payment method on a recurring basis until you cancel.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">No Refunds</h3>
            <p className="text-gray-700 mb-4">
              All fees are non-refundable to the maximum extent permitted by law, including for partial months/years, unused features, or if you stop using the Service.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Taxes</h3>
            <p className="text-gray-700 mb-4">
              You are responsible for any applicable taxes, duties, or similar governmental assessments.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">5) Customer Data and Your Responsibilities</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Customer Data</h3>
            <p className="text-gray-700 mb-4">
              "Customer Data" means data you or your users submit to the Service, including information about your clients/customers.
            </p>
            <p className="text-gray-700 mb-4">You represent and warrant that:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>You have all rights and permissions necessary to provide Customer Data to us</li>
              <li>Your collection and use of Customer Data complies with applicable laws and your own privacy notices</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Your Instructions</h3>
            <p className="text-gray-700 mb-4">
              You control what Customer Data you upload and how you use the Service. You are responsible for ensuring the Service is appropriate for your business needs.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">6) AI Features and Model Training</h2>
            <p className="text-gray-700 mb-4">The Service may include AI-powered features.</p>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Use of Data for AI</h3>
            <p className="text-gray-700 mb-4">
              You acknowledge and agree that we may use Customer Data and account data to provide the AI features and to train, improve, and develop our models and services.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Third-Party AI Providers</h3>
            <p className="text-gray-700 mb-4">
              We may use third-party AI providers (including Devin AI) to provide certain AI functionality. Your use of AI features may involve sending relevant inputs to such providers as described in our Privacy Policy.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">7) Acceptable Use</h2>
            <p className="text-gray-700 mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Use the Service for unlawful, harmful, or fraudulent purposes</li>
              <li>Upload or transmit malware or attempt to disrupt the Service</li>
              <li>Attempt to access accounts or data you do not have permission to access</li>
              <li>Reverse engineer or attempt to extract source code (except where prohibited by law)</li>
              <li>Use the Service to violate others' privacy or applicable marketing/communications laws</li>
            </ul>
            <p className="text-gray-700 mb-4">We may suspend or terminate access if we believe you violated these Terms.</p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">8) Third-Party Services and Integrations</h2>
            <p className="text-gray-700 mb-4">
              The Service may support integrations with third-party services. Your use of third-party services is governed by their terms and policies. We are not responsible for third-party services, their availability, or their actions.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">9) Intellectual Property</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Our IP</h3>
            <p className="text-gray-700 mb-4">
              We own the Service, including its software, design, and content, and all related intellectual property rights.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Your Content</h3>
            <p className="text-gray-700 mb-4">
              You retain ownership of Customer Data. You grant us a limited license to host, process, transmit, and display Customer Data solely to operate, maintain, and improve the Service and as otherwise described in these Terms and our Privacy Policy.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Feedback</h3>
            <p className="text-gray-700 mb-4">
              If you provide suggestions or feedback, you grant us the right to use it without restriction or compensation.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">10) Confidentiality</h2>
            <p className="text-gray-700 mb-4">
              You agree not to disclose non-public information about the Service that we share with you and mark or reasonably treat as confidential, except as required by law.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">11) Service Availability and Changes</h2>
            <p className="text-gray-700 mb-4">
              We may modify, suspend, or discontinue the Service (in whole or in part) at any time. We do not guarantee uninterrupted availability.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">12) Disclaimers</h2>
            <p className="text-gray-700 mb-4 uppercase font-medium">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="text-gray-700 mb-4">
              AI outputs may be inaccurate or incomplete. You are responsible for reviewing outputs and decisions made using the Service.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">13) Limitation of Liability</h2>
            <p className="text-gray-700 mb-4 uppercase font-medium">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, AUVORA WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL.
            </p>
            <p className="text-gray-700 mb-4 uppercase font-medium">
              IN ANY EVENT, AUVORA'S TOTAL LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICE WILL NOT EXCEED THE AMOUNT YOU PAID TO AUVORA FOR THE SERVICE IN THE 12 MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM (OR $100 IF YOU HAVE NOT PAID ANY AMOUNTS).
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">14) Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify and hold harmless Auvora from claims, damages, losses, and expenses (including reasonable attorneys' fees) arising out of:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Your use of the Service</li>
              <li>Your Customer Data</li>
              <li>Your violation of these Terms or applicable law</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">15) Termination</h2>
            <p className="text-gray-700 mb-4">
              You may stop using the Service at any time. We may suspend or terminate your access if you violate these Terms or if required to comply with law.
            </p>
            <p className="text-gray-700 mb-4">
              Upon termination, your right to use the Service stops. We may delete Customer Data after a reasonable period, subject to legal requirements.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">16) Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms are governed by the laws of the State of Florida, without regard to conflict of laws rules.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">17) Dispute Resolution (Courts in Florida)</h2>
            <p className="text-gray-700 mb-4">
              If a dispute arises out of or relates to these Terms or the Service, you and Auvora agree to try to resolve it informally first by contacting the other party.
            </p>
            <p className="text-gray-700 mb-4">
              If the dispute is not resolved, you and Auvora agree that any legal action will be brought in the state or federal courts located in Florida, and you consent to personal jurisdiction and venue in those courts.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">18) Changes to These Terms</h2>
            <p className="text-gray-700 mb-4">
              We may update these Terms from time to time. If changes are material, we will provide notice (e.g., in-app or by email). Continued use after the effective date means you accept the updated Terms.
            </p>

            <h2 className="text-xl font-semibold text-[#0A2463] mt-8 mb-4">19) Contact</h2>
            <p className="text-gray-700 mb-4">
              Questions about these Terms: <a href="mailto:MyAuvora@gmail.com" className="text-[#0A2463] hover:underline">MyAuvora@gmail.com</a>
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
