import { useEffect, useRef } from 'react';
import { ClerkProvider, Show, SignIn, SignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter, Redirect, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import Home from '@/pages/home';
import AdminDashboard from '@/pages/admin';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#b57b2c',
    colorForeground: '#20323a',
    colorMutedForeground: '#667277',
    colorDanger: '#9a4335',
    colorBackground: '#f1eee6',
    colorInput: '#faf8f1',
    colorInputForeground: '#20323a',
    colorNeutral: '#d0c7b8',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    borderRadius: '0.65rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#f1eee6] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#20323a] font-semibold',
    headerSubtitle: 'text-[#667277]',
    socialButtonsBlockButtonText: 'text-[#20323a]',
    formFieldLabel: 'text-[#20323a]',
    footerActionLink: 'text-[#9a5c22]',
    footerActionText: 'text-[#667277]',
    dividerText: 'text-[#667277]',
    identityPreviewEditButton: 'text-[#9a5c22]',
    formFieldSuccessText: 'text-[#537a5c]',
    alertText: 'text-[#9a4335]',
    logoBox: 'rounded-full',
    logoImage: 'rounded-full',
    socialButtonsBlockButton: 'border-[#d0c7b8] bg-[#faf8f1]',
    formButtonPrimary: 'bg-[#20323a] hover:bg-[#2c4650] text-[#f1eee6]',
    formFieldInput: 'border-[#d0c7b8] bg-[#faf8f1] text-[#20323a]',
    footerAction: 'text-[#667277]',
    dividerLine: 'bg-[#d0c7b8]',
    alert: 'border-[#d0c7b8] bg-[#ebe4d8]',
    otpCodeFieldInput: 'border-[#d0c7b8] bg-[#faf8f1]',
    formFieldRow: 'text-[#20323a]',
    main: 'bg-transparent',
  },
};

function SignInPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[hsl(var(--background))] px-4 py-8"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>;
}

function SignUpPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[hsl(var(--background))] px-4 py-8"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}

function SignedOutAdmin() {
  return <main className="texture-noise flex min-h-[100dvh] items-center justify-center bg-[hsl(var(--primary))] px-5 py-12 text-[hsl(var(--card))]"><div className="max-w-md text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[hsl(var(--secondary)/.75)] font-display text-3xl text-[hsl(var(--secondary))]">L</div><p className="eyebrow mt-8 text-[hsl(var(--secondary))]">Leather &amp; Sealskin Creations</p><h1 className="mt-4 font-display text-5xl leading-[.9]">The owner desk is private.</h1><p className="mt-6 text-sm leading-7 text-[hsl(var(--card)/.68)]">Sign in with the owner account to manage pieces, images, and customer notes.</p><a href={`${basePath}/sign-in`} className="focus-ring mt-8 inline-flex rounded-full bg-[hsl(var(--secondary))] px-6 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--primary))]" data-testid="link-admin-sign-in">Owner sign in</a><a href="/" className="focus-ring mt-5 block text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--card)/.6)] hover:text-[hsl(var(--secondary))]" data-testid="link-admin-back-home">Return to the public shop</a></div></main>;
}

function AdminRoute() {
  return <><Show when="signed-in"><AdminDashboard /></Show><Show when="signed-out"><SignedOutAdmin /></Show></>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClientInstance = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const currentUserId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== currentUserId) queryClientInstance.clear();
      previousUserId.current = currentUserId;
    });
    return unsubscribe;
  }, [addListener, queryClientInstance]);
  return null;
}

function Routes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to the studio desk' } }, signUp: { start: { title: 'Create your owner account', subtitle: 'Keep the studio close' } } }} routerPush={(to) => setLocation(stripBase(to))} routerReplace={(to) => setLocation(stripBase(to), { replace: true })}><QueryClientProvider client={queryClient}><ClerkQueryClientCacheInvalidator /><Switch><Route path="/" component={Home} /><Route path="/admin" component={AdminRoute} /><Route path="/sign-in/*?" component={SignInPage} /><Route path="/sign-up/*?" component={SignUpPage} /><Route><Redirect to="/" /></Route></Switch></QueryClientProvider></ClerkProvider>;
}

export default function App() {
  if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
  return <ErrorBoundary><TooltipProvider><WouterRouter base={basePath}><Routes /></WouterRouter><Toaster /></TooltipProvider></ErrorBoundary>;
}