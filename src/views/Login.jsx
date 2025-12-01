import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { ShieldCheck } from 'lucide-react';

const Login = () => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-slate-200 dark:border-slate-800">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6 shadow-lg shadow-blue-600/30">r</div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome to re4b</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">Sign in to sync your renovation plans, budget, and designs across all your devices.</p>
        
        <button 
          onClick={handleLogin}
          className="w-full py-3.5 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-3 group hover:shadow-md"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google" />
          Continue with Google
        </button>
        
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={14} />
          <span>Your data is private and secure.</span>
        </div>
      </div>
    </div>
  );
};

export default Login;