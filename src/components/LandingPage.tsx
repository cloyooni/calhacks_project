import { Button } from "@/components/ui/button";
import { Calendar, Sparkles, Users, Stethoscope, BarChart3, CheckCircle } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function LandingPage() {
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
							<p className="text-sm text-gray-600">Clinical Trial Scheduling Platform</p>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<Button
							variant="ghost"
							onClick={() => navigate({ to: "/signin" })}
							className="text-[#0066CC] hover:bg-[#E6F2FF] rounded-md"
						>
							Sign in
						</Button>
						<Button
							onClick={() => navigate({ to: "/signin" })}
							className="bg-[#0066CC] hover:bg-[#0052A3] text-white rounded-md shadow-sm"
						>
							Get started
						</Button>
					</div>
				</div>
			</header>

			<main className="flex-1">
				{/* Hero */}
				<section className="container mx-auto px-4 py-20 md:py-28">
					<div className="grid md:grid-cols-2 gap-12 items-start">
						<div className="relative group">
							<div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500" />
							<div className="relative bg-white rounded-2xl border border-[#0066CC]/20 ring-1 ring-blue-50 p-10 shadow-md hover:shadow-2xl transition-all duration-300">
								<div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full mb-6">
									<Sparkles className="w-3 h-3" />
									<span>Hackathon prototype • In active development</span>
								</div>
								<h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
									Transform static protocols into
									<span className="block mt-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">interactive, intelligent schedules</span>
								</h2>
								<p className="mt-6 mb-8 text-gray-600 text-lg leading-relaxed">
									Early prototype exploring linked calendars, basic scheduling assistance, and notification workflows for clinical trials.
								</p>
								<div className="flex flex-wrap gap-4">
									<Button 
										onClick={() => navigate({ to: "/signin" })} 
										className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg px-6 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
									>
										Get started
									</Button>
									<button 
										onClick={() => navigate({ to: "/about" })} 
										className="text-gray-700 hover:text-gray-900 font-medium transition-colors px-4"
									>
										Learn more
									</button>
								</div>
								<div className="mt-8 pt-8 border-t border-gray-100 text-sm text-gray-500">
									<span>Open-source friendly prototype for hackathons and demos</span>
								</div>
							</div>
						</div>

						<div className="relative group">
							<div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500" />
							<div className="relative bg-white rounded-2xl border border-[#0066CC]/20 ring-1 ring-blue-50 p-10 shadow-md hover:shadow-2xl transition-all duration-300">
								<div className="flex items-center gap-2 mb-6">
									<div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
										<Sparkles className="w-4 h-4 text-white" />
									</div>
									<span className="font-semibold text-gray-900">AI-powered insights</span>
								</div>
								<ul className="space-y-4">
									<li className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
										<div className="mt-0.5">
											<CheckCircle className="w-5 h-5 text-emerald-500" />
										</div>
										<div>
											<div className="font-medium text-gray-900 text-sm">Bundle procedures to reduce visits</div>
											<div className="text-gray-600 text-sm mt-0.5">Prototype assistance to combine procedures into fewer visits</div>
										</div>
									</li>
									<li className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
										<div className="mt-0.5">
											<CheckCircle className="w-5 h-5 text-emerald-500" />
										</div>
										<div>
											<div className="font-medium text-gray-900 text-sm">Linked patient–clinician calendars</div>
											<div className="text-gray-600 text-sm mt-0.5">Basic time window selection and conflict awareness</div>
										</div>
									</li>
									<li className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
										<div className="mt-0.5">
											<CheckCircle className="w-5 h-5 text-emerald-500" />
										</div>
										<div>
											<div className="font-medium text-gray-900 text-sm">Automatic reminders</div>
											<div className="text-gray-600 text-sm mt-0.5">Email reminders to keep participants on track</div>
										</div>
									</li>
									<li className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
										<div className="mt-0.5">
											<CheckCircle className="w-5 h-5 text-emerald-500" />
										</div>
										<div>
											<div className="font-medium text-gray-900 text-sm">Google Calendar integration</div>
											<div className="text-gray-600 text-sm mt-0.5">Improved accessibility and visibility</div>
										</div>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</section>

				{/* Value Props */}
				<section className="bg-white border-t border-[#0066CC]/10">
					<div className="container mx-auto px-4 py-20">
						<div className="text-center mb-12">
							<h3 className="text-3xl font-bold text-gray-900 mb-3">Designed for every stakeholder</h3>
							<p className="text-gray-600 max-w-2xl mx-auto">Purpose-built interfaces that adapt to specific workflows and requirements</p>
						</div>
						<div className="grid md:grid-cols-3 gap-8">
							<div className="group relative">
								<div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-300" />
								<div className="relative p-8 bg-white rounded-2xl border border-[#0066CC]/20 ring-1 ring-blue-50 shadow-md hover:shadow-2xl transition-all duration-300 h-full border-l-4 border-l-[#0066CC]">
									<div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-b-full"></div>
									<div className="flex items-center gap-3 mb-4 mt-2">
										<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
											<Stethoscope className="w-6 h-6 text-blue-600" />
										</div>
										<div>
											<h3 className="font-semibold text-gray-900 text-lg">For Clinical Teams</h3>
											<p className="text-xs text-gray-500">Streamline workflows</p>
										</div>
									</div>
									<p className="text-gray-600 text-sm leading-relaxed mb-4">
										Visualize protocol timelines, create time windows, and coordinate across patients in one place.
									</p>
									<div className="space-y-2">
										<div className="flex items-center gap-2 text-xs text-gray-600">
											<div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
											<span>Protocol timeline visualization</span>
										</div>
										<div className="flex items-center gap-2 text-xs text-gray-600">
											<div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
											<span>Create and manage time windows</span>
										</div>
										<div className="flex items-center gap-2 text-xs text-gray-600">
											<div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
											<span>Real-time patient tracking</span>
										</div>
									</div>
								</div>
							</div>
							
							<div className="group relative">
								<div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-300" />
								<div className="relative p-8 bg-white rounded-2xl border border-[#0066CC]/20 ring-1 ring-blue-50 shadow-md hover:shadow-2xl transition-all duration-300 h-full border-l-4 border-l-[#0066CC]">
									<div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-b-full"></div>
									<div className="flex items-center gap-3 mb-4 mt-2">
										<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
											<Users className="w-6 h-6 text-blue-600" />
										</div>
										<div>
											<h3 className="font-semibold text-gray-900 text-lg">For Patients</h3>
											<p className="text-xs text-gray-500">Empower participation</p>
										</div>
									</div>
									<p className="text-gray-600 text-sm leading-relaxed mb-4">
										Book slots that fit your schedule and track your progress through the trial.
									</p>
									<div className="space-y-2">
										<div className="flex items-center gap-2 text-xs text-gray-600">
											<div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
											<span>Flexible self-scheduling</span>
										</div>
										<div className="flex items-center gap-2 text-xs text-gray-600">
											<div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
											<span>Progress tracking</span>
										</div>
										<div className="flex items-center gap-2 text-xs text-gray-600">
											<div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
											<span>Visit preparation guides</span>
										</div>
									</div>
								</div>
							</div>
							
							<div className="group relative">
								<div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-300" />
								<div className="relative p-8 bg-white rounded-2xl border border-[#0066CC]/20 ring-1 ring-blue-50 shadow-md hover:shadow-2xl transition-all duration-300 h-full border-l-4 border-l-[#0066CC]">
									<div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-b-full"></div>
									<div className="flex items-center gap-3 mb-4 mt-2">
										<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
											<BarChart3 className="w-6 h-6 text-blue-600" />
										</div>
										<div>
											<h3 className="font-semibold text-gray-900 text-lg">For Sponsors</h3>
											<p className="text-xs text-gray-500">Drive insights</p>
										</div>
									</div>
									<p className="text-gray-600 text-sm leading-relaxed mb-4">
										Assess feasibility and burden in real-time with actionable insights.
									</p>
									<div className="space-y-2">
										<div className="flex items-center gap-2 text-xs text-gray-600">
											<div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
											<span>Real-time analytics</span>
										</div>
										<div className="flex items-center gap-2 text-xs text-gray-600">
											<div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
											<span>Feasibility snapshots</span>
										</div>
										<div className="flex items-center gap-2 text-xs text-gray-600">
											<div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
											<span>Risk mitigation alerts</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>
			</main>

			<footer className="bg-white border-t border-[#0066CC]/10">
				<div className="container mx-auto px-4 py-8">
					<div className="flex flex-col md:flex-row items-center justify-between gap-4">
						<div className="flex items-center gap-2">
							<Calendar className="w-4 h-4 text-blue-600" />
							<span className="text-sm text-gray-600"> {new Date().getFullYear()} TrialFlowAI</span>
						</div>
						<div className="flex items-center gap-6 text-sm">
							<a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Privacy Policy</a>
							<a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Terms</a>
							<a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Security</a>
							<a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}