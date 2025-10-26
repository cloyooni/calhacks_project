import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { Calendar, Users, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

function LogoTF({ size = 48, className = "" }: { size?: number; className?: string }) {
  const deepBlue = "#1e40af";
  return (
    <div
      className={`rounded-lg flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size, background: "transparent" }}
      aria-label="TrialFlow logo"
    >
      <span
        style={{
          fontFamily:
            "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          fontWeight: 700,
          fontStyle: "italic",
          fontSize: Math.round(size * 0.56),
          lineHeight: 1,
          color: deepBlue,
          letterSpacing: -1.5,
        }}
      >
        <span style={{ position: "relative", left: -2 }}>t</span>
        <span style={{ position: "relative", marginLeft: -6 }}>f</span>
      </span>
    </div>
  );
}

export function OnboardingPage() {
  const { user, setUserRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'clinician' | 'patient' | null>(null);
  const [error, setError] = useState('');

  const handleRoleSelect = async (role: 'clinician' | 'patient') => {
    setSelectedRole(role);
    setError('');

    try {
      // Update user role in auth context
      if (user) {
        // Update the user role through the auth context
        setUserRole(role);
        
        // Navigate to role-specific page
        navigate({ to: role === 'clinician' ? '/clinician' : '/patient' });
      }
    } catch (error) {
      console.error('Error setting user role:', error);
      setError('Failed to set role. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F2FF] to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/signin' })}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-1 mb-4">
            <LogoTF size={96} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">TrialFlow</h1>
              <p className="text-sm text-gray-600">Clinical Trial Scheduling</p>
            </div>
          </div>
        </div>

        {/* Onboarding Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to TrialFlow!</CardTitle>
            <CardDescription>
              Choose your role to get started with clinical trial management
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Role Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Clinician Card */}
              <Card 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedRole === 'clinician' ? 'ring-2 ring-[#5191c4] bg-[#5191c4]/5' : ''
                }`}
                onClick={() => handleRoleSelect('clinician')}
              >
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-[#5191c4] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Clinician</CardTitle>
                  <CardDescription>
                    Schedule appointments, manage patients, and coordinate trials
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      Manage patient schedules
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      Create and edit time windows
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      View appointments and availability
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Patient Card */}
              <Card 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedRole === 'patient' ? 'ring-2 ring-[#5191c4] bg-[#5191c4]/5' : ''
                }`}
                onClick={() => handleRoleSelect('patient')}
              >
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-[#5191c4] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Patient</CardTitle>
                  <CardDescription>
                    Schedule appointments and manage your trial participation
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      Book and manage appointments
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      View your schedule
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      See available time slots
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-4">
                <div className="inline-block w-6 h-6 border-2 border-[#5191c4] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>You can change your role anytime in your profile settings</p>
        </div>
      </div>
    </div>
  );
}
