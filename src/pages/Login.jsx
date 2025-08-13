import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Leaf, Apple, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: "yuan@nutritrack.com",
    password: "123456",
    confirmPassword: "",
    fullName: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation for signup
    if (isSignUp && !formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Confirm password validation for signup
    if (isSignUp) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    // Simulate login/signup process
    setTimeout(() => {
      setIsLoading(false);
      console.log(`${isSignUp ? "Signup" : "Login"} attempted with:`, formData);
      navigate("/food-search");
    }, 2000);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrors({}); // Clear errors when switching modes
    setFormData((prev) => ({
      ...prev,
      confirmPassword: "",
      fullName: "",
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Floating Health Icons */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 text-green-300 animate-bounce">
          <Leaf className="w-6 h-6" />
        </div>
        <div className="absolute top-32 right-32 text-blue-300 animate-bounce animation-delay-1000">
          <Apple className="w-5 h-5" />
        </div>
        <div className="absolute bottom-40 left-32 text-green-400 animate-bounce animation-delay-2000">
          <Leaf className="w-4 h-4" />
        </div>
        <div className="absolute bottom-32 right-20 text-blue-400 animate-bounce animation-delay-3000">
          <Apple className="w-6 h-6" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Glassmorphism Login/Signup Card with smooth height transition */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 transform transition-all duration-500 overflow-hidden">
            {/* Logo and Branding */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mb-4 shadow-lg">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2 transition-all duration-300">
                NutriTrack
              </h1>
              <p className="text-gray-600 transition-all duration-300">
                {isSignUp
                  ? "Start your healthy journey today"
                  : "Welcome back to your healthy journey"}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name Input - Only for Signup */}
              <div
                className={`relative transition-all duration-500 ${
                  isSignUp
                    ? "opacity-100 max-h-20 translate-y-0"
                    : "opacity-0 max-h-0 -translate-y-4 overflow-hidden"
                }`}
              >
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-sm border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-400/20 placeholder-transparent peer ${
                      errors.fullName
                        ? "border-red-400 focus:border-red-400"
                        : "border-white/30 focus:border-green-400"
                    }`}
                    placeholder="Full name"
                  />
                  <label className="absolute left-10 top-3 text-gray-500 transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-[-8px] peer-focus:text-xs peer-focus:text-green-500 peer-focus:bg-white/80 peer-focus:px-1 peer-focus:rounded pointer-events-none peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-green-500">
                    Full name
                  </label>
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-500 animate-fade-in">
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email Input */}
              <div className="relative">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-sm border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-400/20 placeholder-transparent peer ${
                      errors.email
                        ? "border-red-400 focus:border-red-400"
                        : "border-white/30 focus:border-green-400"
                    }`}
                    placeholder="Email address"
                  />
                  <label className="absolute left-10 top-3 text-gray-500 transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-[-8px] peer-focus:text-xs peer-focus:text-green-500 peer-focus:bg-white/80 peer-focus:px-1 peer-focus:rounded pointer-events-none peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-green-500">
                    Email address
                  </label>
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500 animate-fade-in">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-12 py-3 bg-white/50 backdrop-blur-sm border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-400/20 placeholder-transparent peer ${
                      errors.password
                        ? "border-red-400 focus:border-red-400"
                        : "border-white/30 focus:border-green-400"
                    }`}
                    placeholder="Password"
                  />
                  <label className="absolute left-10 top-3 text-gray-500 transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-[-8px] peer-focus:text-xs peer-focus:text-green-500 peer-focus:bg-white/80 peer-focus:px-1 peer-focus:rounded pointer-events-none peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-green-500">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500 animate-fade-in">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Input - Only for Signup */}
              <div
                className={`relative transition-all duration-500 ${
                  isSignUp
                    ? "opacity-100 max-h-20 translate-y-0"
                    : "opacity-0 max-h-0 -translate-y-4 overflow-hidden"
                }`}
              >
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-12 py-3 bg-white/50 backdrop-blur-sm border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-400/20 placeholder-transparent peer ${
                      errors.confirmPassword
                        ? "border-red-400 focus:border-red-400"
                        : "border-white/30 focus:border-green-400"
                    }`}
                    placeholder="Confirm password"
                  />
                  <label className="absolute left-10 top-3 text-gray-500 transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-[-8px] peer-focus:text-xs peer-focus:text-green-500 peer-focus:bg-white/80 peer-focus:px-1 peer-focus:rounded pointer-events-none peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-green-500">
                    Confirm password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500 animate-fade-in">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password - Only for Login */}
              <div
                className={`flex items-center justify-between transition-all duration-500 ${
                  !isSignUp
                    ? "opacity-100 max-h-6 translate-y-0"
                    : "opacity-0 max-h-0 -translate-y-4 overflow-hidden"
                }`}
              >
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div
                    className={`relative w-5 h-5 rounded border-2 transition-all duration-200 ${
                      formData.rememberMe
                        ? "bg-green-400 border-green-400"
                        : "bg-white/50 border-white/50 hover:border-green-400"
                    }`}
                  >
                    {formData.rememberMe && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-sm"></div>
                      </div>
                    )}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    Remember me
                  </span>
                </label>
                <a
                  href="#"
                  className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors duration-200"
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-green-400/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    {isSignUp ? "Creating account..." : "Signing in..."}
                  </div>
                ) : isSignUp ? (
                  "Create account"
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            {/* Divider - Only show for Login */}
            <div
              className={`my-6 flex items-center transition-all duration-500 ${
                !isSignUp
                  ? "opacity-100 max-h-6 translate-y-0"
                  : "opacity-0 max-h-0 -translate-y-4 overflow-hidden"
              }`}
            >
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-gray-500 text-sm">
                or continue with
              </span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Social Login - Only show for Login */}
            <div
              className={`grid grid-cols-2 gap-4 transition-all duration-500 ${
                !isSignUp
                  ? "opacity-100 max-h-12 translate-y-0"
                  : "opacity-0 max-h-0 -translate-y-4 overflow-hidden"
              }`}
            >
              <button className="flex items-center justify-center py-3 px-4 bg-white/60 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/80 transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-gray-400/20">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
              <button className="flex items-center justify-center py-3 px-4 bg-white/60 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/80 transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-gray-400/20">
                <Apple className="w-5 h-5 mr-2 text-gray-700" />
                Apple
              </button>
            </div>

            {/* Sign Up/Login Link */}
            <p className="mt-6 text-center text-gray-600">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={toggleMode}
                className="text-green-600 hover:text-green-700 font-semibold transition-colors duration-200"
              >
                {isSignUp ? "Sign in" : "Sign up free"}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Additional Styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-3000 {
          animation-delay: 3s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Login;
