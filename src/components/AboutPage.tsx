import { Calendar, Sparkles, Users, ShieldCheck, CheckCircle, Globe, Stethoscope, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";

export function AboutPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F2FF] to-white flex flex-col">
      <header className="bg-white/80 backdrop-blur border-b border-[#0066CC]/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0066CC] to-[#0052A3] rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">TrialFlowAI</h1>
              <p className="text-sm text-gray-600">About the Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate({ to: "/" })} className="text-[#0066CC] hover:bg-[#E6F2FF] rounded-md">Home</Button>
            <Button onClick={() => navigate({ to: "/signin" })} className="bg-[#0066CC] hover:bg-[#0052A3] text-white rounded-md shadow-sm">Sign in</Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 md:py-32 max-w-6xl">
          <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 text-center leading-tight tracking-tight">
            Streamlining Clinical Trial Scheduling with
            <span className="block text-[#2563EB]">Linked Calendars and AI</span>
          </h2>
          <p className="mt-6 mb-10 text-gray-700 text-lg text-center leading-relaxed max-w-3xl mx-auto">
            TrialFlowAI transforms dense, static protocols into interactive, data-driven visualizations for
            clinicians, patients, and trial managers. Coordinate time windows, reduce burden, and keep trials on track.
          </p>

          <div className="mt-12 grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-2xl border border-[#0066CC]/20 ring-1 ring-blue-50 shadow-md hover:shadow-2xl transition-shadow border-l-4 border-l-[#0066CC]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-[#0066CC]" />
                </div>
                <span className="text-gray-900 font-semibold">For Clinicians</span>
              </div>
              <ul className="text-gray-700 text-sm space-y-2">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#10B981] mt-0.5"/> Visualize timelines and procedures</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#10B981] mt-0.5"/> Create and publish time windows</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#10B981] mt-0.5"/> Google Calendar integration</li>
              </ul>
            </div>
            <div className="p-8 bg-white rounded-2xl border border-[#0066CC]/20 ring-1 ring-blue-50 shadow-md hover:shadow-2xl transition-shadow border-l-4 border-l-green-500/70">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-green-700" />
                </div>
                <span className="text-gray-900 font-semibold">AI Assistance</span>
              </div>
              <ul className="text-gray-700 text-sm space-y-2">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#10B981] mt-0.5"/> Bundle procedures to reduce visits</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#10B981] mt-0.5"/> Optimize time window utilization</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#10B981] mt-0.5"/> Surface scheduling recommendations</li>
              </ul>
            </div>
            <div className="p-8 bg-white rounded-2xl border border-[#0066CC]/20 ring-1 ring-blue-50 shadow-md hover:shadow-2xl transition-shadow border-l-4 border-l-purple-500/70">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-700" />
                </div>
                <span className="text-gray-900 font-semibold">For Patients</span>
              </div>
              <ul className="text-gray-700 text-sm space-y-2">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#10B981] mt-0.5"/> Pick slots that fit your schedule</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#10B981] mt-0.5"/> Track trial progress and upcoming visits</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#10B981] mt-0.5"/> Email reminders keep you on track</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 bg-[#E6F2FF]/50 border border-[#0066CC]/20 ring-1 ring-blue-50 rounded-2xl p-8 shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Our Vision</h3>
            <p className="text-gray-700 leading-relaxed">
              Complex protocols shouldn’t slow down science. TrialFlowAI enables proactive planning, reduces patient burden,
              and gives trial teams real-time visibility to intervene before issues escalate.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Button onClick={() => navigate({ to: "/signin" })} className="bg-[#0066CC] hover:bg-[#0052A3] text-white rounded-lg px-8 py-4 text-lg shadow-lg transition-shadow">Get started</Button>
            <button onClick={() => navigate({ to: "/" })} className="text-[#0066CC] hover:text-[#0052A3] font-medium transition-colors">Back to Home</button>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-[#0066CC]/10">
        <div className="container mx-auto px-4 py-6 text-sm text-gray-600 flex items-center justify-between">
          <span>© {new Date().getFullYear()} TrialFlowAI</span>
          <a href="#" className="hover:underline flex items-center gap-1"><Globe className="w-4 h-4"/> trialflow.ai</a>
        </div>
      </footer>
    </div>
  );
}
