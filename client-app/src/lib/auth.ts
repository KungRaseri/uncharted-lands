import { SvelteKitAuth } from "sk-auth";
import { GitHubOAuth2Provider, GoogleOAuth2Provider, OAuth2Provider } from "sk-auth/providers";

export const appAuth = new SvelteKitAuth({
    providers: [
        new GoogleOAuth2Provider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            profile(profile) {
                return { ...profile, provider: "google" };
            },
        }),
        new GitHubOAuth2Provider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            profile(profile) {
                return { ...profile, provider: "github" };
            },
        }),
        new OAuth2Provider({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            authorizeUrl: "https://discord.com/api/oauth2/authorize",
            responseType: "code",
            scope: ["identify", "email"],
            redirect_uri: "/auth/callback",
            profile(profile) {
                return { ...profile, provider: "discord" };
            },
        }),
    ],
    //https://discord.com/api/oauth2/authorize?client_id=1025190689111285761&redirect_uri=localhost%3A5173%2Fauth%2Fcallback&response_type=code&scope=identify%20email
    callbacks: {
        jwt(token, profile) {
            if (profile?.provider) {
                const { provider, ...account } = profile;
                token = {
                    ...token,
                    user: {
                        ...(token.user ?? {}),
                        connections: { ...(token.user?.connections ?? {}), [provider]: account },
                    }
                }
            }
            return token;
        },
    },
    jwtSecret: process.env.JWT_SECRET_KEY,
});