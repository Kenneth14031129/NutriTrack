import { useState, useEffect } from "react";
import {
  User,
  Save,
  Menu,
  AlertCircle,
  CheckCircle,
  Scale,
  Target,
  Activity,
  Heart,
  Shield,
  Edit3,
  X,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import apiService from "../services/api";
import userContextService from "../services/userContextService";

const Profile = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [originalFormData, setOriginalFormData] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    age: "",
    gender: "prefer-not-to-say",
    height: {
      value: "",
      unit: "cm"
    },
    weight: {
      current: "",
      target: "",
      unit: "kg"
    },
    activityLevel: "moderately-active",
    dietaryPreferences: [],
    allergies: [],
    primaryGoal: "improve-health",
    units: {
      weight: "kg",
      height: "cm",
      liquid: "ml"
    },
    notifications: {
      email: true,
      push: true,
      reminders: true
    }
  });

  const [calculatedStats, setCalculatedStats] = useState({
    bmi: null,
    dailyCalories: null
  });

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
    { value: "prefer-not-to-say", label: "Prefer not to say" }
  ];

  const activityLevels = [
    { value: "sedentary", label: "Sedentary", description: "Little to no exercise" },
    { value: "lightly-active", label: "Lightly Active", description: "Light exercise 1-3 days/week" },
    { value: "moderately-active", label: "Moderately Active", description: "Moderate exercise 3-5 days/week" },
    { value: "very-active", label: "Very Active", description: "Hard exercise 6-7 days/week" },
    { value: "extremely-active", label: "Extremely Active", description: "Very hard exercise, physical job" }
  ];

  const primaryGoals = [
    { value: "lose-weight", label: "Lose Weight", icon: Scale },
    { value: "gain-weight", label: "Gain Weight", icon: Target },
    { value: "maintain-weight", label: "Maintain Weight", icon: Activity },
    { value: "build-muscle", label: "Build Muscle", icon: Target },
    { value: "improve-health", label: "Improve Health", icon: Heart }
  ];

  const dietaryOptions = [
    "vegetarian", "vegan", "keto", "paleo",
    "gluten-free", "dairy-free", "low-carb", "high-protein"
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [formData.age, formData.gender, formData.height, formData.weight, formData.activityLevel]);

  const loadProfile = async () => {
    try {
      const response = await apiService.getProfile();

      // Handle case where profile data exists
      if (response && response.profile) {
        // Merge with default form data to ensure all fields exist
        const mergedFormData = {
          ...formData, // Default structure
          ...response.profile, // Override with actual profile data
          // Ensure nested objects exist
          height: {
            ...formData.height,
            ...response.profile.height
          },
          weight: {
            ...formData.weight,
            ...response.profile.weight
          },
          units: {
            ...formData.units,
            ...response.profile.units
          },
          notifications: {
            ...formData.notifications,
            ...response.profile.notifications
          }
        };

        setFormData(mergedFormData);
        setOriginalFormData(mergedFormData); // Store original data for cancel functionality
        setCalculatedStats(response.profile.calculatedStats || {});
      } else {
        // Profile exists but has no data - keep default form data
        setOriginalFormData(formData);
        console.log('Profile loaded but no data found, using defaults');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
      // Keep default form data if profile fails to load
      setOriginalFormData(formData);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (!formData.age || !formData.height.value || !formData.weight.current ||
        formData.gender === 'prefer-not-to-say') {
      setCalculatedStats({ bmi: null, dailyCalories: null });
      return;
    }

    try {
      // Calculate BMI
      let weightInKg = parseFloat(formData.weight.current);
      let heightInM = parseFloat(formData.height.value);

      if (formData.weight.unit === 'lbs') {
        weightInKg = weightInKg * 0.453592;
      }
      if (formData.height.unit === 'ft') {
        heightInM = heightInM * 0.3048;
      } else {
        heightInM = heightInM / 100; // cm to m
      }

      const bmi = parseFloat((weightInKg / (heightInM * heightInM)).toFixed(1));

      // Calculate daily calories (Mifflin-St Jeor Equation)
      let heightInCm = parseFloat(formData.height.value);
      if (formData.height.unit === 'ft') {
        heightInCm = heightInCm * 30.48;
      }

      let bmr;
      if (formData.gender === 'male') {
        bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * formData.age + 5;
      } else {
        bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * formData.age - 161;
      }

      const activityFactors = {
        'sedentary': 1.2,
        'lightly-active': 1.375,
        'moderately-active': 1.55,
        'very-active': 1.725,
        'extremely-active': 1.9
      };

      const dailyCalories = Math.round(bmr * activityFactors[formData.activityLevel]);

      setCalculatedStats({ bmi, dailyCalories });
    } catch (error) {
      console.error('Error calculating stats:', error);
      setCalculatedStats({ bmi: null, dailyCalories: null });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleAllergiesChange = (value) => {
    const allergies = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({
      ...prev,
      allergies
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    setMessage(null);
  };

  const handleCancel = () => {
    if (originalFormData) {
      setFormData(originalFormData); // Reset to original data
    }
    setIsEditing(false);
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await apiService.updateProfile(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setCalculatedStats(response.calculatedStats || {});
      setOriginalFormData(formData); // Update original data after successful save
      setIsEditing(false); // Exit edit mode

      // Clear user context cache to get fresh data
      userContextService.clearCache();

      // Hide message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to save profile'
      });
    } finally {
      setSaving(false);
    }
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return null;
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-500' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-500' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-500' };
    return { category: 'Obese', color: 'text-red-500' };
  };

  const getInputClassName = (additionalClasses = '') => {
    const baseClasses = additionalClasses.includes('flex-1')
      ? 'flex-1 px-3 py-2 border rounded-lg focus:outline-none text-white'
      : 'w-full px-3 py-2 border rounded-lg focus:outline-none text-white';
    const editingClasses = 'bg-gray-700/90 border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    const disabledClasses = 'bg-gray-800/50 border-gray-700 cursor-not-allowed';

    return `${baseClasses} ${isEditing ? editingClasses : disabledClasses} ${additionalClasses.replace('flex-1', '')}`.trim();
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentPage="profile"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading profile...</div>
        </div>
      </div>
    );
  }

  const bmiInfo = getBMICategory(calculatedStats.bmi);

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage="profile"
      />
      <div className="flex flex-col flex-1 lg:ml-0">
        {/* Header */}
        <div className="bg-gray-900 text-white border-b border-gray-800 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-300" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                  <User className="text-green-400 w-6 h-6 sm:w-8 sm:h-8" />
                  <span className="hidden sm:inline">User Profile</span>
                  <span className="sm:hidden">Profile</span>
                </h1>
                <p className="text-gray-400 mt-1 text-sm sm:text-base">
                  <span className="hidden sm:inline">
                    Manage your personal information and preferences
                  </span>
                  <span className="sm:hidden">
                    Personal settings
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit Profile</span>
                  <span className="sm:hidden">Edit</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center gap-2 bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Cancel</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                  >
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Changes'}</span>
                    <span className="sm:hidden">{saving ? '...' : 'Save'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-green-500/20 border border-green-500/30 text-green-400'
              : 'bg-red-500/20 border border-red-500/30 text-red-400'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
          {!isEditing ? (
            // VIEW MODE - Card-based layout
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-3 gap-4 md:gap-6">

                {/* Profile Card */}
                <div className="lg:col-span-2 xl:col-span-1 order-1">
                  <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 md:p-6 text-center">
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-green-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <User className="w-8 h-8 md:w-12 md:h-12 text-white" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-white mb-2">{formData.name || 'User Name'}</h3>
                    <p className="text-gray-300 text-xs md:text-sm mb-4 px-2">{formData.bio || 'No bio added yet'}</p>

                    {/* Basic Info */}
                    <div className="space-y-2 text-xs md:text-sm">
                      {formData.age && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Age</span>
                          <span className="text-white">{formData.age} years</span>
                        </div>
                      )}
                      {formData.gender && formData.gender !== 'prefer-not-to-say' && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Gender</span>
                          <span className="text-white capitalize">{formData.gender}</span>
                        </div>
                      )}
                      {calculatedStats.bmi && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">BMI</span>
                          <div className="text-right">
                            <span className="text-white">{calculatedStats.bmi}</span>
                            {bmiInfo && <span className={`block text-xs ${bmiInfo.color}`}>{bmiInfo.category}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Cards */}
                <div className="lg:col-span-2 xl:col-span-2 order-2 space-y-4 md:space-y-6">

                  {/* Physical Stats Card */}
                  <div className="bg-gray-800/90 backdrop-blur-sm border border-green-500/20 rounded-xl p-4 md:p-6">
                    <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4 flex items-center">
                      <Scale className="w-4 h-4 md:w-5 md:h-5 mr-2 text-green-400" />
                      Physical Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      {formData.height?.value && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                          <div className="text-green-300 text-xs md:text-sm font-medium">Height</div>
                          <div className="text-white font-semibold text-sm md:text-base">{formData.height.value} {formData.height.unit}</div>
                        </div>
                      )}
                      {formData.weight?.current && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                          <div className="text-green-300 text-xs md:text-sm font-medium">Current Weight</div>
                          <div className="text-white font-semibold text-sm md:text-base">{formData.weight.current} {formData.weight.unit}</div>
                        </div>
                      )}
                      {formData.weight?.target && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                          <div className="text-blue-300 text-xs md:text-sm font-medium">Target Weight</div>
                          <div className="text-white font-semibold text-sm md:text-base">{formData.weight.target} {formData.weight.unit}</div>
                        </div>
                      )}
                      {formData.activityLevel && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:col-span-2">
                          <div className="text-blue-300 text-xs md:text-sm font-medium">Activity Level</div>
                          <div className="text-white font-semibold text-sm md:text-base capitalize">{formData.activityLevel.replace('-', ' ')}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Goals & Preferences Card */}
                  <div className="bg-gray-800/90 backdrop-blur-sm border border-green-500/20 rounded-xl p-4 md:p-6">
                    <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4 flex items-center">
                      <Target className="w-4 h-4 md:w-5 md:h-5 mr-2 text-green-400" />
                      Goals & Preferences
                    </h3>

                    {/* Primary Goal */}
                    {formData.primaryGoal && (
                      <div className="mb-4">
                        <div className="text-gray-400 text-xs md:text-sm mb-2 font-medium">Primary Goal</div>
                        <div className="inline-flex items-center px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                          {(() => {
                            const goal = primaryGoals.find(g => g.value === formData.primaryGoal);
                            const Icon = goal?.icon || Target;
                            return (
                              <>
                                <Icon className="w-3 h-3 md:w-4 md:h-4 mr-2 text-green-400" />
                                <span className="text-green-400 text-xs md:text-sm font-medium">{goal?.label || 'Unknown Goal'}</span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Dietary Preferences */}
                    {formData.dietaryPreferences?.length > 0 && (
                      <div className="mb-4">
                        <div className="text-gray-400 text-xs md:text-sm mb-2 font-medium">Dietary Preferences</div>
                        <div className="flex flex-wrap gap-1 md:gap-2">
                          {formData.dietaryPreferences.map(pref => (
                            <span key={pref} className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-xs font-medium capitalize">
                              {pref.replace('-', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Allergies */}
                    {formData.allergies?.length > 0 && (
                      <div>
                        <div className="text-gray-400 text-xs md:text-sm mb-2 font-medium">Allergies</div>
                        <div className="flex flex-wrap gap-1 md:gap-2">
                          {formData.allergies.map(allergy => (
                            <span key={allergy} className="px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-xs font-medium">
                              {allergy}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notifications Card */}
                  <div className="bg-gray-800/90 backdrop-blur-sm border border-green-500/20 rounded-xl p-4 md:p-6">
                    <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4 flex items-center">
                      <Shield className="w-4 h-4 md:w-5 md:h-5 mr-2 text-green-400" />
                      Notification Settings
                    </h3>
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm md:text-base">Email Notifications</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${formData.notifications.email ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {formData.notifications.email ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm md:text-base">Push Notifications</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${formData.notifications.push ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {formData.notifications.push ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm md:text-base">Reminders</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${formData.notifications.reminders ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {formData.notifications.reminders ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // EDIT MODE - Form-based layout with green/blue theme
            <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">

              {/* Edit Mode Header */}
              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-3 md:p-4">
                <div className="flex items-center">
                  <Edit3 className="w-4 h-4 md:w-5 md:h-5 text-green-400 mr-2 md:mr-3" />
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-white">Edit Profile</h2>
                    <p className="text-green-300 text-xs md:text-sm">Update your personal information and preferences</p>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="bg-gray-800/90 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6 flex items-center">
                  <User className="w-4 h-4 md:w-5 md:h-5 mr-2 text-green-400" />
                  Basic Information
                </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    className={getInputClassName()}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', parseInt(e.target.value) || '')}
                    disabled={!isEditing}
                    className={getInputClassName()}
                    placeholder="25"
                    min="13"
                    max="120"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    disabled={!isEditing}
                    className={getInputClassName()}
                  >
                    {genderOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    className={getInputClassName()}
                    placeholder="Tell us about yourself..."
                    rows="3"
                    maxLength="500"
                  />
                </div>
              </div>
            </div>

              {/* Physical Stats */}
              <div className="bg-gray-800/90 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6 flex items-center">
                  <Scale className="w-4 h-4 md:w-5 md:h-5 mr-2 text-green-400" />
                  Physical Information
                </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Height</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={formData.height.value}
                      onChange={(e) => handleInputChange('height.value', parseFloat(e.target.value) || '')}
                      disabled={!isEditing}
                      className={getInputClassName('flex-1')}
                      placeholder="170"
                    />
                    <select
                      value={formData.height.unit}
                      onChange={(e) => handleInputChange('height.unit', e.target.value)}
                      disabled={!isEditing}
                      className={getInputClassName('')}
                    >
                      <option value="cm">cm</option>
                      <option value="ft">ft</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Current Weight</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={formData.weight.current}
                      onChange={(e) => handleInputChange('weight.current', parseFloat(e.target.value) || '')}
                      disabled={!isEditing}
                      className={getInputClassName('flex-1')}
                      placeholder="70"
                    />
                    <select
                      value={formData.weight.unit}
                      onChange={(e) => handleInputChange('weight.unit', e.target.value)}
                      disabled={!isEditing}
                      className={getInputClassName('')}
                    >
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Weight</label>
                  <input
                    type="number"
                    value={formData.weight.target}
                    onChange={(e) => handleInputChange('weight.target', parseFloat(e.target.value) || '')}
                    disabled={!isEditing}
                    className={getInputClassName()}
                    placeholder="65"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Activity Level</label>
                  <select
                    value={formData.activityLevel}
                    onChange={(e) => handleInputChange('activityLevel', e.target.value)}
                    disabled={!isEditing}
                    className={getInputClassName()}
                  >
                    {activityLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label} - {level.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

              {/* Goals */}
              <div className="bg-gray-800/90 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6 flex items-center">
                  <Target className="w-4 h-4 md:w-5 md:h-5 mr-2 text-green-400" />
                  Primary Goal
                </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                {primaryGoals.map(goal => {
                  const Icon = goal.icon;
                  return (
                    <button
                      key={goal.value}
                      onClick={() => isEditing && handleInputChange('primaryGoal', goal.value)}
                      disabled={!isEditing}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        formData.primaryGoal === goal.value
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                          : isEditing
                          ? 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                          : 'border-gray-700 bg-gray-800/50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Icon className="w-8 h-8 mx-auto mb-2" />
                      <div className="font-medium">{goal.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

              {/* Dietary Preferences */}
              <div className="bg-gray-800/90 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6 flex items-center">
                  <Heart className="w-4 h-4 md:w-5 md:h-5 mr-2 text-green-400" />
                  Dietary Preferences
                </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
                {dietaryOptions.map(option => (
                  <button
                    key={option}
                    onClick={() => isEditing && handleArrayToggle('dietaryPreferences', option)}
                    disabled={!isEditing}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      formData.dietaryPreferences.includes(option)
                        ? 'border-green-500 bg-green-500/20 text-green-400'
                        : isEditing
                        ? 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                        : 'border-gray-700 bg-gray-800/50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="font-medium capitalize">{option.replace('-', ' ')}</div>
                  </button>
                ))}
              </div>
            </div>

              {/* Allergies */}
              <div className="bg-gray-800/90 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6 flex items-center">
                  <Shield className="w-4 h-4 md:w-5 md:h-5 mr-2 text-green-400" />
                  Allergies
                </h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  List your allergies (separated by commas)
                </label>
                <input
                  type="text"
                  value={formData.allergies.join(', ')}
                  onChange={(e) => handleAllergiesChange(e.target.value)}
                  disabled={!isEditing}
                  className={getInputClassName()}
                  placeholder="nuts, dairy, shellfish"
                />
              </div>
            </div>

              {/* Notifications */}
              <div className="bg-gray-800/90 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6 flex items-center">
                  <Shield className="w-4 h-4 md:w-5 md:h-5 mr-2 text-green-400" />
                  Notification Preferences
                </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Email Notifications</div>
                    <div className="text-sm text-gray-400">Receive updates via email</div>
                  </div>
                  <button
                    onClick={() => isEditing && handleInputChange('notifications.email', !formData.notifications.email)}
                    disabled={!isEditing}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.notifications.email ? 'bg-blue-600' : 'bg-gray-600'
                    } ${!isEditing ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.notifications.email ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Push Notifications</div>
                    <div className="text-sm text-gray-400">Receive push notifications</div>
                  </div>
                  <button
                    onClick={() => isEditing && handleInputChange('notifications.push', !formData.notifications.push)}
                    disabled={!isEditing}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.notifications.push ? 'bg-blue-600' : 'bg-gray-600'
                    } ${!isEditing ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.notifications.push ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Reminders</div>
                    <div className="text-sm text-gray-400">Get reminded about your goals</div>
                  </div>
                  <button
                    onClick={() => isEditing && handleInputChange('notifications.reminders', !formData.notifications.reminders)}
                    disabled={!isEditing}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.notifications.reminders ? 'bg-blue-600' : 'bg-gray-600'
                    } ${!isEditing ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.notifications.reminders ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;