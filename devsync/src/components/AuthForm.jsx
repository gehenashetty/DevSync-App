<<<<<<< HEAD
import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { auth } from "../firebase";
import Button from "./ui/Button";
import { LogIn, UserPlus, Mail, Lock, AlertCircle, Github, Chrome } from "lucide-react";

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      setError(error.message);
=======
import { useState } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import "./AuthForm.css"; // 👈 CSS we'll define next

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message.replace("Firebase:", "").trim());
    } finally {
>>>>>>> 3e0cddf5af44c378e561d6f6c28dd324ebd0d7f4
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-blue/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-purple/20 rounded-full blur-3xl"></div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="glass-card p-8 backdrop-blur-xl">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
              <span className="text-white text-2xl font-bold">DS</span>
            </div>
          </div>
          
          <motion.h2 
            className="text-2xl font-display font-bold text-center gradient-text-blue mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {isLogin ? "Welcome back to DevSync" : "Join DevSync"}
          </motion.h2>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 mb-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 flex items-center"
            >
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-text-secondary mb-1">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background-lighter border border-white/10 rounded-lg py-2 pl-10 pr-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm text-text-secondary mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background-lighter border border-white/10 rounded-lg py-2 pl-10 pr-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              icon={isLogin ? <LogIn size={16} /> : <UserPlus size={16} />}
              isLoading={loading}
            >
              {isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-background-card text-text-secondary">Or continue with</span>
              </div>
            </div>
            
            <div className="mt-6">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                icon={<Chrome size={16} />}
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                Google
              </Button>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-accent-blue hover:text-accent-blue-light transition-colors"
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
        
        <p className="mt-4 text-center text-text-secondary text-sm">
          DevSync - Unified Development Dashboard
        </p>
      </motion.div>
    </div>
  );
};

export default AuthForm;
=======
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-icon">➕</div>
        <h2>{isSignUp ? "Create Account" : "Login to DevSync"}</h2>

        {error && <div className="error">{error}</div>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Login"}
        </button>

        <p className="toggle-link" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp
            ? "Already have an account? Log in"
            : "New user? Create an account"}
        </p>
      </form>
    </div>
  );
}
>>>>>>> 3e0cddf5af44c378e561d6f6c28dd324ebd0d7f4
