import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, Shield, CheckCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import apiService from "../services/api";
import { useToast } from "../components/Toast";
import NutriBG from "../assets/Nutri_BG.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();
  const [searchParams] = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const resetToken = searchParams.get('token');
    if (!resetToken) {
      showToast("Invalid reset link. Please request a new password reset.", "error", 6000);
      navigate('/login');
    } else {
      setToken(resetToken);
    }
  }, [searchParams, navigate, showToast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await apiService.resetPassword(token, formData.password);

      setIsSuccess(true);
      showToast(
        "Password reset successfully! You can now log in with your new password.",
        "success",
        5000
      );

      // Redirect to login after a delay
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (error) {
      console.error("Reset password error:", error);
      showToast(
        error.message || "Failed to reset password. Please try again.",
        "error",
        6000
      );
      setErrors({
        submit: error.message || "Failed to reset password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div
        className="min-h-screen relative overflow-hidden flex items-center justify-center"
        style={{
          backgroundImage: `url(${NutriBG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="w-full max-w-md">
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mb-4 shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Password Reset Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your password has been successfully reset. You will be redirected to the login page shortly.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02]"
            >
              Continue to Login
            </button>
          </div>
        </div>
        <ToastComponent />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url(${NutriBG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Glassmorphism Reset Password Card */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
            {/* Logo and Branding */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mb-4 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Reset Your Password</h1>
              <p className="text-gray-600">
                Enter your new password below
              </p>
            </div>

            {/* Reset Password Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder="New password"
                  />
                  <label className="absolute left-10 top-3 text-gray-500 transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-[-8px] peer-focus:text-xs peer-focus:text-green-500 peer-focus:bg-white/80 peer-focus:px-1 peer-focus:rounded pointer-events-none peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-green-500">
                    New password
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

              {/* Confirm Password Input */}
              <div className="relative">
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
                    placeholder="Confirm new password"
                  />
                  <label className="absolute left-10 top-3 text-gray-500 transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-[-8px] peer-focus:text-xs peer-focus:text-green-500 peer-focus:bg-white/80 peer-focus:px-1 peer-focus:rounded pointer-events-none peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-green-500">
                    Confirm new password
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-green-400/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Resetting password...
                  </div>
                ) : (
                  "Reset Password"
                )}
              </button>

              {/* Error Message */}
              {errors.submit && (
                <p className="text-sm text-red-500 text-center animate-fade-in">
                  {errors.submit}
                </p>
              )}
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-gray-600 hover:text-gray-700 font-medium transition-colors duration-200"
              >
                ← Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastComponent />

      {/* Additional Styles */}
      <style>{`
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

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ResetPassword;