import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Leaf, Apple, User, Shield, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import apiService from "../services/api";
import { useToast } from "../components/Toast";
import NutriBG from "../assets/Nutri_BG.png";

const Login = () => {
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [otpData, setOtpData] = useState({
    userId: '',
    email: '',
    otp: ''
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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

  const handleOTPChange = (e, index) => {
    const { value } = e.target;
    // Only allow numbers
    const numericValue = value.replace(/\D/g, '');

    if (numericValue.length <= 1) {
      const newOtp = otpData.otp.split('');
      newOtp[index] = numericValue;
      const updatedOtp = newOtp.join('');

      setOtpData((prev) => ({
        ...prev,
        otp: updatedOtp,
      }));

      // Auto-focus next input
      if (numericValue && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }

    // Clear error when user starts typing
    if (errors.otp) {
      setErrors((prev) => ({ ...prev, otp: "" }));
    }
  };

  const handleOTPKeyDown = (e, index) => {
    // Handle backspace to move to previous input
    if (e.key === 'Backspace' && !otpData.otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        // Clear the previous input
        const newOtp = otpData.otp.split('');
        newOtp[index - 1] = '';
        setOtpData((prev) => ({
          ...prev,
          otp: newOtp.join(''),
        }));
      }
    }
  };

  const handleOTPPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setOtpData((prev) => ({
      ...prev,
      otp: pastedData,
    }));

    // Focus the last filled input or the first empty one
    const nextIndex = Math.min(pastedData.length, 5);
    const nextInput = document.getElementById(`otp-${nextIndex}`);
    if (nextInput) nextInput.focus();
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

    try {
      if (isSignUp) {
        // Register new user
        const response = await apiService.register({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
        });

        if (response.requiresVerification) {
          // Show OTP verification screen
          setOtpData({
            userId: response.userId,
            email: response.email,
            otp: ''
          });
          setShowOTPVerification(true);
          showToast(
            "Registration successful! Please check your email for the verification code.",
            "success",
            5000
          );
        } else {
          // Registration complete
          showToast(
            `Welcome to NutriTrack, ${formData.fullName}! 🎉`,
            "success",
            5000
          );
          setTimeout(() => {
            navigate("/homepage");
          }, 1500);
        }
      } else {
        // Login existing user
        try {
          await apiService.login({
            email: formData.email,
            password: formData.password,
          });
          showToast("Welcome back! Login successful 👋", "success", 4000);
          setTimeout(() => {
            navigate("/homepage");
          }, 1500);
        } catch (loginError) {
          // Check if user needs email verification
          if (loginError.message.includes('verify your email') && loginError.requiresVerification) {
            setOtpData({
              userId: loginError.userId,
              email: loginError.email,
              otp: ''
            });
            setShowOTPVerification(true);
            showToast(
              "Please verify your email address to continue.",
              "warning",
              5000
            );
          } else {
            throw loginError;
          }
        }
      }
    } catch (error) {
      console.error(`${isSignUp ? "Registration" : "Login"} error:`, error);
      showToast(
        error.message ||
          `${isSignUp ? "Registration" : "Login"} failed. Please try again.`,
        "error",
        6000
      );
      setErrors({
        submit:
          error.message ||
          `${isSignUp ? "Registration" : "Login"} failed. Please try again.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();

    if (!otpData.otp || otpData.otp.length !== 6) {
      setErrors({ otp: "Please enter a valid 6-digit OTP" });
      return;
    }

    setIsLoading(true);

    try {
      await apiService.verifyOTP({
        userId: otpData.userId,
        otp: otpData.otp,
      });

      showToast(
        "Email verified successfully! Welcome to NutriTrack! 🎉",
        "success",
        5000
      );

      // Navigate to homepage on success
      setTimeout(() => {
        navigate("/homepage");
      }, 1500);
    } catch (error) {
      console.error("OTP verification error:", error);
      showToast(
        error.message || "Invalid verification code. Please try again.",
        "error",
        6000
      );
      setErrors({
        otp: error.message || "Invalid verification code. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);

    try {
      await apiService.resendOTP({
        userId: otpData.userId,
      });

      showToast(
        "Verification code resent successfully! Please check your email.",
        "success",
        5000
      );
    } catch (error) {
      console.error("Resend OTP error:", error);
      showToast(
        error.message || "Failed to resend verification code. Please try again.",
        "error",
        6000
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!forgotEmail) {
      setErrors({ forgotEmail: "Please enter your email address" });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(forgotEmail)) {
      setErrors({ forgotEmail: "Please enter a valid email address" });
      return;
    }

    setIsLoading(true);

    try {
      await apiService.forgotPassword(forgotEmail);
      showToast(
        "Password reset instructions have been sent to your email address.",
        "success",
        5000
      );
      setShowForgotPassword(false);
      setForgotEmail('');
      setErrors({});
    } catch (error) {
      console.error("Forgot password error:", error);
      showToast(
        error.message || "Failed to send reset email. Please try again.",
        "error",
        6000
      );
      setErrors({
        forgotEmail: error.message || "Failed to send reset email. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setShowOTPVerification(false); // Hide OTP screen when switching modes
    setShowForgotPassword(false); // Hide forgot password screen
    setErrors({}); // Clear errors when switching modes
    setFormData((prev) => ({
      ...prev,
      confirmPassword: "",
      fullName: "",
    }));
    setOtpData({
      userId: '',
      email: '',
      otp: ''
    });
    setForgotEmail('');
  };

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
          {/* Glassmorphism Login/Signup Card with smooth height transition */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 transform transition-all duration-500 overflow-hidden">
            {/* Logo and Branding */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mb-4 shadow-lg">
                {showOTPVerification ? (
                  <Shield className="w-8 h-8 text-white" />
                ) : showForgotPassword ? (
                  <Mail className="w-8 h-8 text-white" />
                ) : (
                  <Leaf className="w-8 h-8 text-white" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2 transition-all duration-300">
                {showOTPVerification
                  ? "Verify Your Email"
                  : showForgotPassword
                  ? "Reset Password"
                  : "NutriTrack"}
              </h1>
              <p className="text-gray-600 transition-all duration-300">
                {showOTPVerification
                  ? `We've sent a verification code to ${otpData.email}`
                  : showForgotPassword
                  ? "Enter your email to receive reset instructions"
                  : isSignUp
                  ? "Start your healthy journey today"
                  : "Welcome back to your healthy journey"}
              </p>
            </div>

            {/* Conditional Forms */}
            {showOTPVerification ? (
              /* OTP Verification Form */
              <form onSubmit={handleOTPSubmit} className="space-y-6">
                {/* OTP Input */}
                <div className="relative">
                  <div className="text-center mb-4">
                    <label className="block text-gray-600 text-sm font-medium mb-3">
                      <Shield className="inline w-4 h-4 mr-2" />
                      Enter Verification Code
                    </label>
                    <div className="flex justify-center gap-3" onPaste={handleOTPPaste}>
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          value={otpData.otp[index] || ''}
                          onChange={(e) => handleOTPChange(e, index)}
                          onKeyDown={(e) => handleOTPKeyDown(e, index)}
                          className={`w-12 h-12 text-center text-xl font-mono font-bold bg-white/50 backdrop-blur-sm border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-400/20 ${
                            errors.otp
                              ? "border-red-400 focus:border-red-400"
                              : "border-white/30 focus:border-green-400"
                          }`}
                          maxLength="1"
                        />
                      ))}
                    </div>
                  </div>
                  {errors.otp && (
                    <p className="mt-1 text-sm text-red-500 animate-fade-in text-center">
                      {errors.otp}
                    </p>
                  )}
                </div>

                {/* OTP Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || otpData.otp.length !== 6}
                  className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-green-400/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Verifying...
                    </div>
                  ) : (
                    "Verify Email"
                  )}
                </button>

                {/* Resend OTP */}
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-2">
                    Didn't receive the code?
                  </p>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-green-600 hover:text-green-700 font-semibold transition-colors duration-200 flex items-center justify-center mx-auto disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Resend Code
                  </button>
                </div>

                {/* Back to Login */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowOTPVerification(false)}
                    className="text-gray-600 hover:text-gray-700 font-medium transition-colors duration-200"
                  >
                    ← Back to Login
                  </button>
                </div>
              </form>
            ) : showForgotPassword ? (
              /* Forgot Password Form */
              <form onSubmit={handleForgotPassword} className="space-y-6">
                {/* Email Input */}
                <div className="relative">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        if (errors.forgotEmail) {
                          setErrors((prev) => ({ ...prev, forgotEmail: "" }));
                        }
                      }}
                      className={`w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-sm border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-400/20 placeholder-transparent peer ${
                        errors.forgotEmail
                          ? "border-red-400 focus:border-red-400"
                          : "border-white/30 focus:border-green-400"
                      }`}
                      placeholder="Email address"
                    />
                    <label className="absolute left-10 top-3 text-gray-500 transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-[-8px] peer-focus:text-xs peer-focus:text-green-500 peer-focus:bg-white/80 peer-focus:px-1 peer-focus:rounded pointer-events-none peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-green-500">
                      Email address
                    </label>
                  </div>
                  {errors.forgotEmail && (
                    <p className="mt-1 text-sm text-red-500 animate-fade-in">
                      {errors.forgotEmail}
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
                      Sending reset email...
                    </div>
                  ) : (
                    "Send Reset Instructions"
                  )}
                </button>

                {/* Back to Login */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="text-gray-600 hover:text-gray-700 font-medium transition-colors duration-200"
                  >
                    ← Back to Login
                  </button>
                </div>
              </form>
            ) : (
              /* Login/Signup Form */
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
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors duration-200"
                >
                  Forgot password?
                </button>
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
            )}

            {/* Sign Up/Login Link - Only show when not in OTP verification or forgot password */}
            {!showOTPVerification && !showForgotPassword && (
              <p className="mt-6 text-center text-gray-600">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  onClick={toggleMode}
                  className="text-green-600 hover:text-green-700 font-semibold transition-colors duration-200"
                >
                  {isSignUp ? "Sign in" : "Sign up free"}
                </button>
              </p>
            )}
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
