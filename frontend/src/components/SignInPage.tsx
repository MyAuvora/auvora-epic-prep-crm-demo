import { SignIn } from '@clerk/clerk-react'

export function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <img 
          src="/epic-lion-white-64.png" 
          alt="EPIC Prep Academy Logo" 
          className="h-20 w-auto mx-auto mb-4 bg-[#1e3a5f] p-3 rounded-full"
        />
        <h1 className="text-3xl font-bold text-gray-900">EPIC Prep Academy</h1>
        <p className="text-gray-600 italic mt-1">"Educating Lions not Sheep"</p>
      </div>
      
      <SignIn 
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-xl',
            headerTitle: 'text-[#1e3a5f]',
            headerSubtitle: 'text-gray-600',
            socialButtonsBlockButton: 'hidden',
            socialButtonsBlockButtonArrow: 'hidden',
            socialButtonsProviderIcon: 'hidden',
            dividerRow: 'hidden',
            formButtonPrimary: 'bg-gradient-to-r from-[#1e3a5f] to-[#dc3545] hover:opacity-90',
            footerActionLink: 'text-[#1e3a5f] hover:text-[#dc3545]',
          }
        }}
        routing="hash"
        signUpUrl="#/sign-up"
        forceRedirectUrl="/"
      />
    </div>
  )
}
