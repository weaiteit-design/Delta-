import React, { useState } from 'react';
import { UserRole, UserGoal, AIFamiliarity, LearningStyle, UserContext } from '../types';
import { ArrowRight, Check, User as UserIcon } from 'lucide-react';

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
    className={`w-full text-left p-4 mb-3 border transition-all duration-200 ${
      selected 
        ? 'bg-neutral-100 text-black border-neutral-100' 
        : 'bg-transparent border-neutral-800 text-neutral-400 hover:border-neutral-600'
    }`}
  >
    <div className="flex justify-between items-center">
      <span className="font-medium tracking-wide text-sm">{children}</span>
      {selected && <Check size={16} />}
    </div>
  </button>
);

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0); // Start at step 0 for Name
  const [data, setData] = useState<Partial<UserContext>>({
    name: '',
    goals: [],
  });

  const handleNext = () => {
    // There are 5 steps (0, 1, 2, 3, 4).
    // If we are at step 4, we are done.
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Finalize
      onComplete({
        name: data.name || 'Explorer',
        role: data.role as UserRole,
        goals: data.goals as UserGoal[],
        aiLevel: data.aiLevel as AIFamiliarity,
        learningStyle: data.learningStyle as LearningStyle,
        difficultyCeiling: 3, // Default start
        onboardingComplete: true
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-6 max-w-md mx-auto pt-20">
      <div className="flex-1">
        <div className="mb-8">
          <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
            Setup 0{step + 1} / 05
          </span>
          <h1 className="text-2xl font-light mt-4 leading-tight text-neutral-100">
            {step === 0 && "What should we call you?"}
            {step === 1 && "What describes your role best?"}
            {step === 2 && "Select your primary goals."}
            {step === 3 && "How familiar are you with AI?"}
            {step === 4 && "How do you prefer to learn?"}
          </h1>
        </div>

        <div className="space-y-2">
          {step === 0 && (
            <div className="mt-8">
               <div className="relative">
                 <UserIcon className="absolute left-4 top-4 text-neutral-500" size={20} />
                 <input 
                   type="text" 
                   value={data.name}
                   onChange={(e) => setData({ ...data, name: e.target.value })}
                   placeholder="Enter your name"
                   className="w-full bg-neutral-900 border border-neutral-800 p-4 pl-12 text-white focus:outline-none focus:border-neutral-600 placeholder:text-neutral-600 rounded-none"
                   autoFocus
                 />
               </div>
               <p className="text-xs text-neutral-500 mt-4">This helps Delta personalize your briefing.</p>
            </div>
          )}

          {step === 1 && Object.values(UserRole).map((role) => (
            <OptionButton 
              key={role} 
              selected={data.role === role} 
              onClick={() => setData({ ...data, role })}
            >
              {role}
            </OptionButton>
          ))}

          {step === 2 && Object.values(UserGoal).map((goal) => (
            <OptionButton 
              key={goal} 
              selected={data.goals?.includes(goal) || false} 
              onClick={() => {
                const current = data.goals || [];
                const updated = current.includes(goal) 
                  ? current.filter(g => g !== goal)
                  : [...current, goal].slice(0, 3); // Max 3
                setData({ ...data, goals: updated });
              }}
            >
              {goal}
            </OptionButton>
          ))}

          {step === 3 && Object.values(AIFamiliarity).map((level) => (
            <OptionButton 
              key={level} 
              selected={data.aiLevel === level} 
              onClick={() => setData({ ...data, aiLevel: level })}
            >
              {level}
            </OptionButton>
          ))}

          {step === 4 && Object.values(LearningStyle).map((style) => (
            <OptionButton 
              key={style} 
              selected={data.learningStyle === style} 
              onClick={() => setData({ ...data, learningStyle: style })}
            >
              {style}
            </OptionButton>
          ))}
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={
          (step === 0 && !data.name) ||
          (step === 1 && !data.role) ||
          (step === 2 && (!data.goals || data.goals.length === 0)) ||
          (step === 3 && !data.aiLevel) ||
          (step === 4 && !data.learningStyle)
        }
        className="w-full bg-neutral-100 text-black py-4 font-semibold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
      >
        {step === 4 ? "Initialize Delta" : "Continue"}
        <ArrowRight size={16} />
      </button>
    </div>
  );
};