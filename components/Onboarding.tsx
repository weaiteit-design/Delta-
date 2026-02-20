import React, { useState } from 'react';
import { UserRole, UserGoal, AIFamiliarity, LearningStyle, UserContext } from '../types';
import { ArrowRight, Check, User as UserIcon, Shield, Zap, Layout, Lock, Mail, Briefcase } from 'lucide-react';
import { storageService } from '../services/storageService';

interface OnboardingProps {
  onComplete: (context: UserContext) => void;
}

interface OptionButtonProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const OptionButton: React.FC<OptionButtonProps> = ({ selected, onClick, children }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-6 mb-3 border transition-all duration-200 rounded-xl ${selected
      ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-[1.02]'
      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:bg-neutral-800'
      }`}
  >
    <div className="flex justify-between items-center mr-0">
      <span className="font-medium tracking-wide text-base">{children}</span>
      {selected && <Check size={20} className="text-black" />}
    </div>
  </button>
);

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  // Step 0: Auth
  // Step 1: Role (New)
  // Step 2: Framing
  // Step 3: Level
  // Step 4: Ready

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<Partial<UserContext> & { email?: string, password?: string }>({
    name: '',
    role: UserRole.NonTechnicalPro,
    goals: [UserGoal.Productivity],
    email: '',
    password: ''
  });

  const handleAuth = async () => {
    if (!data.email || !data.password) return;
    setLoading(true);
    setError(null);

    try {
      if (authMode === 'signup') {
        const { user, error } = await storageService.signUp(data.email, data.password, data.name || 'Explorer');
        if (error) throw error;
        if (user) {
          setData(prev => ({ ...prev, id: user.id }));
          setStep(1); // Go to Role Selection
        }
      } else {
        const { user, profile, error } = await storageService.signIn(data.email, data.password);
        if (error) throw error;
        if (profile) {
          onComplete(profile);
        } else if (user) {
          setData(prev => ({ ...prev, id: user.id }));
          setStep(1);
        }
      }
    } catch (e: any) {
      setError(e.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // Save progress incrementally
    const partialUser: any = {
      ...data,
      id: data.id || 'local-user',
      name: data.name || 'Explorer',
      role: data.role as UserRole,
      goals: data.goals as UserGoal[],
      aiLevel: data.aiLevel || AIFamiliarity.Beginner,
      // Keep onboardingComplete false until the end
      onboardingComplete: step === 4
    };
    storageService.saveUser(partialUser);

    if (step < 4) {
      setStep(step + 1);
    } else {
      // Finalize
      const finalUser: UserContext = {
        ...partialUser,
        onboardingComplete: true
      };

      storageService.saveUser(finalUser);
      onComplete(finalUser);
    }
  };

  // Screen 0: Auth
  const renderAuth = () => (
    <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
      <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-8 border border-blue-500/20">
        <Shield className="text-blue-400" size={32} />
      </div>

      <h1 className="text-3xl md:text-4xl font-light text-white mb-2 leading-tight">
        {authMode === 'signup' ? 'Secure your advantage.' : 'Welcome back.'}
      </h1>
      <p className="text-neutral-400 mb-8 leading-relaxed">
        {authMode === 'signup'
          ? "AI is moving fast. Create an account so you won't fall behind."
          : "Sign in to resume your progress."}
      </p>

      <div className="space-y-4 mb-6">
        {authMode === 'signup' && (
          <div className="relative">
            <UserIcon className="absolute left-4 top-4 text-neutral-500" size={20} />
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="Full Name"
              className="w-full bg-neutral-900 border border-neutral-800 p-4 pl-12 text-white focus:outline-none focus:border-blue-500 rounded-xl transition-all"
            />
          </div>
        )}
        <div className="relative">
          <Mail className="absolute left-4 top-4 text-neutral-500" size={20} />
          <input
            type="email"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
            placeholder="Email Address"
            className="w-full bg-neutral-900 border border-neutral-800 p-4 pl-12 text-white focus:outline-none focus:border-blue-500 rounded-xl transition-all"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-4 text-neutral-500" size={20} />
          <input
            type="password"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
            placeholder="Password"
            className="w-full bg-neutral-900 border border-neutral-800 p-4 pl-12 text-white focus:outline-none focus:border-blue-500 rounded-xl transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleAuth}
        disabled={loading || !data.email || !data.password}
        className="w-full bg-white text-black py-4 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-neutral-200 disabled:opacity-50 rounded-xl transition-colors mb-4"
      >
        {loading ? "Processing..." : (authMode === 'signup' ? "Create Account" : "Sign In")}
      </button>

      <p className="text-center text-sm text-neutral-500">
        {authMode === 'signup' ? "Already have an account? " : "New to Delta? "}
        <button
          onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
          className="text-white underline hover:text-blue-400"
        >
          {authMode === 'signup' ? "Sign In" : "Sign Up"}
        </button>
      </p>
    </div>
  );

  // Screen 1: Role Selection (NEW)
  const renderStep1 = () => (
    <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
      <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-8 border border-orange-500/20">
        <Briefcase className="text-orange-400" size={32} />
      </div>
      <h1 className="text-3xl font-light text-white mb-2 leading-tight">
        What do you do?
      </h1>
      <p className="text-neutral-400 mb-8 leading-relaxed">
        We'll filter the noise and only show what helps YOU.
      </p>

      <div className="space-y-1">
        <OptionButton selected={data.role === UserRole.Student} onClick={() => setData({ ...data, role: UserRole.Student })}>
          Student / Learning
        </OptionButton>
        <OptionButton selected={data.role === UserRole.NonTechnicalPro} onClick={() => setData({ ...data, role: UserRole.NonTechnicalPro })}>
          Business / Operations
        </OptionButton>
        <OptionButton selected={data.role === UserRole.Creator} onClick={() => setData({ ...data, role: UserRole.Creator })}>
          Creative / Design
        </OptionButton>
        <OptionButton selected={data.role === UserRole.TechnicalPro} onClick={() => setData({ ...data, role: UserRole.TechnicalPro })}>
          Developer / Tech
        </OptionButton>
      </div>
    </div>
  );

  // Screen 2: Framing
  const renderStep2 = () => (
    <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
      <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-8 border border-green-500/20">
        <Layout className="text-green-400" size={32} />
      </div>
      <h1 className="text-3xl md:text-3xl font-light text-white mb-6 leading-tight">
        You don’t need to learn <span className="text-neutral-500 line-through decoration-red-500/50">everything</span>.
      </h1>
      <p className="text-xl text-neutral-300 mb-10 leading-relaxed border-l-2 border-green-500 pl-6">
        You only need to learn what helps a <span className="text-green-400 font-bold">{data.role}</span>.
      </p>
    </div>
  );

  // Screen 3: User Level
  const renderStep3 = () => (
    <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
      <h1 className="text-2xl font-light text-white mb-2">
        Where are you starting?
      </h1>
      <p className="text-neutral-500 mb-8">This defines your initial difficulty.</p>

      <div className="space-y-1">
        <OptionButton selected={data.aiLevel === AIFamiliarity.Beginner} onClick={() => setData({ ...data, aiLevel: AIFamiliarity.Beginner })}>
          I’m completely new to AI
        </OptionButton>
        <OptionButton selected={data.aiLevel === AIFamiliarity.Familiar} onClick={() => setData({ ...data, aiLevel: AIFamiliarity.Familiar })}>
          I’ve used a few AI tools
        </OptionButton>
        <OptionButton selected={data.aiLevel === AIFamiliarity.Regular} onClick={() => setData({ ...data, aiLevel: AIFamiliarity.Regular })}>
          I use AI regularly
        </OptionButton>
        <OptionButton selected={data.aiLevel === AIFamiliarity.Advanced} onClick={() => setData({ ...data, aiLevel: AIFamiliarity.Advanced })}>
          I want to go deeper
        </OptionButton>
      </div>
    </div>
  );

  // Screen 4: Ready
  const renderStep4 = () => (
    <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
      <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-8 border border-purple-500/20">
        <Zap className="text-purple-400" size={32} />
      </div>
      <h1 className="text-3xl md:text-4xl font-light text-white mb-6 leading-tight">
        Use Delta regularly and you’ll stay ahead.
      </h1>
      <p className="text-xl text-neutral-400 mb-10 leading-relaxed">
        Even if others don’t.
      </p>

      <div className="p-6 bg-neutral-900 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-mono text-neutral-400 uppercase tracking-widest">System Ready</span>
        </div>
        <p className="text-white text-lg">Your briefing is ready, {data.name}.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-6 max-w-lg mx-auto pt-20">
      <div className="flex-1 flex flex-col justify-center">
        {step === 0 && renderAuth()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      {step > 0 && (
        <button
          onClick={handleNext}
          disabled={(step === 3 && !data.aiLevel)}
          className="w-full bg-white text-black py-5 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors mb-10"
        >
          {step === 4 ? "Initialize Delta" : "Continue"}
          <ArrowRight size={18} />
        </button>
      )}

      {/* Progress Dots */}
      <div className="flex justify-center gap-3 mb-6">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-white w-4' : 'bg-neutral-800'}`} />
        ))}
      </div>
    </div>
  );
};