import { useState } from "react";
import {
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Calendar,
  Target,
  Award,
} from "lucide-react";

const Header = ({ onMenuToggle, isSidebarOpen }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifications = [
    {
      id: 1,
      title: "Daily Goal Achieved!",
      message: "You've reached your protein target for today",
      time: "2 minutes ago",
      type: "success",
      unread: true,
    },
    {
      id: 2,
      title: "Meal Reminder",
      message: "Time for your afternoon snack",
      time: "1 hour ago",
      type: "reminder",
      unread: true,
    },
    {
      id: 3,
      title: "Weekly Report Ready",
      message: "Your nutrition summary is available",
      time: "3 hours ago",
      type: "info",
      unread: false,
    },
  ];

  const userStats = {
    name: "John Doe",
    email: "john@example.com",
    avatar: "👨‍💼",
    dailyCalories: 1847,
    goalCalories: 2200,
    streak: 5,
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return <Target className="w-4 h-4 text-green-500" />;
      case "reminder":
        return <Calendar className="w-4 h-4 text-orange-500" />;
      case "info":
        return <Award className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <>
      <header>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left section */}
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={onMenuToggle}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 lg:hidden"
              >
                {isSidebarOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-2">
              {/* Daily Progress - Hidden on small screens */}
              <div className="hidden lg:flex items-center space-x-4 mr-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700">
                    {userStats.dailyCalories} / {userStats.goalCalories}
                  </div>
                  <div className="text-xs text-gray-500">Calories today</div>
                </div>
                <div className="w-12 h-12 relative">
                  <svg className="w-12 h-12 transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      className="text-gray-200"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${
                        2 *
                        Math.PI *
                        20 *
                        (1 - userStats.dailyCalories / userStats.goalCalories)
                      }`}
                      className="text-green-500 transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-700">
                      {Math.round(
                        (userStats.dailyCalories / userStats.goalCalories) * 100
                      )}
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 relative"
                >
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <span className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                            Mark all read
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors duration-150 ${
                            notification.unread ? "bg-blue-50/30" : ""
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                  {notification.title}
                                </p>
                                {notification.unread && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-100">
                      <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-lg">
                    {userStats.avatar}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-gray-700">
                      {userStats.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {userStats.streak} day streak
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-xl">
                          {userStats.avatar}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {userStats.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {userStats.email}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-gray-600">Daily Progress</span>
                        <span className="font-medium text-green-600">
                          {Math.round(
                            (userStats.dailyCalories / userStats.goalCalories) *
                              100
                          )}
                          %
                        </span>
                      </div>
                    </div>
                    <div className="py-2">
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
                        <User className="w-4 h-4" />
                        <span>Profile Settings</span>
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
                        <Settings className="w-4 h-4" />
                        <span>Preferences</span>
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
                        <Target className="w-4 h-4" />
                        <span>Goals & Targets</span>
                      </button>
                    </div>
                    <div className="border-t border-gray-100 py-2">
                      <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3">
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Overlay for mobile */}
      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </>
  );
};

export default Header;
