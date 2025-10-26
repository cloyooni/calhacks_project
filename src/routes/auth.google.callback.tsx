import { useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { exchangeCodeForTokens, getGoogleUserInfo } from '@/lib/google-oauth';

export const Route = createFileRoute('/auth/google/callback')({
	component: GoogleCallback,
});

function GoogleCallback() {
	const navigate = useNavigate();

	useEffect(() => {
		// Get the authorization code from URL parameters
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');
		const error = urlParams.get('error');

		if (error) {
			console.error('Google OAuth error:', error);
			navigate({ to: '/', replace: true });
			return;
		}

		if (code) {
			// Exchange the authorization code for tokens
			exchangeCodeForTokens(code)
				.then(async (tokens) => {
					// Get user info from Google
					const userInfo = await getGoogleUserInfo(tokens.access_token);
					
					// Create user object
					const googleUser = {
						id: userInfo.id,
						email: userInfo.email,
						name: userInfo.name,
						picture: userInfo.picture,
						provider: 'google' as const
					};

					// Store the user in localStorage
					localStorage.setItem('trialflow_user', JSON.stringify(googleUser));
					
					// Redirect to main app
					navigate({ to: '/', replace: true });
				})
				.catch((error) => {
					console.error('Error processing Google OAuth:', error);
					navigate({ to: '/', replace: true });
				});
		} else {
			// No code received, redirect back to sign-in
			navigate({ to: '/', replace: true });
		}
	}, [navigate]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#E6F2FF] to-white flex items-center justify-center">
			<div className="text-center">
				<div className="w-12 h-12 bg-gradient-to-br from-[#0066CC] to-[#0052A3] rounded-lg flex items-center justify-center mx-auto mb-4">
					<div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
				</div>
				<p className="text-gray-600">Completing Google sign-in...</p>
			</div>
		</div>
	);
}
