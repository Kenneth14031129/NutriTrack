import { useState } from "react";
import {
  Home,
  Search,
  Calendar,
  BarChart3,
  Target,
  Settings,
  Book,
  Heart,
  TrendingUp,
  Award,
  Users,
  HelpCircle,
  ChevronRight,
  Apple,
  Utensils,
  Activity,
  Scan,
  Bot,
  Lightbulb,
  Scale,
  Ruler,
  Droplet,
  UserPlus,
  Trophy,
  MessageCircle,
  Flame,
  Crown,
  BookOpen,
  User,
  Shield,
  Download,
  CreditCard,
} from "lucide-react";

const Sidebar = ({ isOpen, onClose, currentPage = "dashboard" }) => {
  const [activeSection, setActiveSection] = useState(currentPage);
  const [expandedMenus, setExpandedMenus] = useState(new Set());

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      href: "/dashboard",
      badge: null,
    },
    {
      id: "meals",
      label: "Meals",
      icon: Utensils,
      href: "/meals",
      badge: "2",
      submenu: [
        { id: "breakfast", label: "Breakfast", icon: Apple },
        { id: "lunch", label: "Lunch", icon: Utensils },
        { id: "dinner", label: "Dinner", icon: Utensils },
        { id: "snacks", label: "Snacks", icon: Heart },
      ],
    },
    {
      id: "food-search",
      label: "Food Search",
      icon: Search,
      href: "/food-search",
      badge: null,
    },
    {
      id: "progress",
      label: "Progress",
      icon: TrendingUp,
      href: "/progress",
      badge: null,
    },
    {
      id: "scanner",
      label: "Scanner",
      icon: Scan,
      href: "/scanner",
      badge: "New",
    },
  ];

  const aiItems = [
    {
      id: "ai-coach",
      label: "AI Coach",
      icon: Bot,
      href: "/ai-coach",
      badge: "3",
    },
    {
      id: "meal-suggestions",
      label: "Meal Suggestions",
      icon: Lightbulb,
      href: "/meal-suggestions",
      badge: null,
    },
    {
      id: "meal-planner",
      label: "Meal Planner",
      icon: Calendar,
      href: "/meal-planner",
      badge: null,
    },
    {
      id: "smart-goals",
      label: "Smart Goals",
      icon: Target,
      href: "/smart-goals",
      badge: null,
    },
  ];

  const analyticsItems = [
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      href: "/analytics",
      badge: null,
      submenu: [
        { id: "nutrition-trends", label: "Nutrition Trends", icon: TrendingUp },
        { id: "reports", label: "Reports", icon: BarChart3 },
        { id: "insights", label: "Insights", icon: Lightbulb },
      ],
    },
    {
      id: "weight-tracker",
      label: "Weight Tracker",
      icon: Scale,
      href: "/weight-tracker",
      badge: null,
    },
    {
      id: "measurements",
      label: "Measurements",
      icon: Ruler,
      href: "/measurements",
      badge: null,
    },
    {
      id: "water-intake",
      label: "Water Intake",
      icon: Droplet,
      href: "/water-intake",
      badge: "6/8",
    },
    {
      id: "exercise-log",
      label: "Exercise Log",
      icon: Activity,
      href: "/exercise-log",
      badge: null,
    },
  ];

  const resourceItems = [
    {
      id: "nutrition-guide",
      label: "Nutrition Guide",
      icon: BookOpen,
      href: "/nutrition-guide",
      badge: null,
    },
    {
      id: "recipes",
      label: "Recipes",
      icon: Book,
      href: "/recipes",
      badge: "24",
    },
    {
      id: "meal-templates",
      label: "Meal Templates",
      icon: Calendar,
      href: "/meal-templates",
      badge: null,
    },
    {
      id: "favorites",
      label: "Favorites",
      icon: Heart,
      href: "/favorites",
      badge: "18",
    },
  ];

  const accountItems = [
    {
      id: "profile",
      label: "Profile",
      icon: User,
      href: "/profile",
      badge: null,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: "/settings",
      badge: null,
      submenu: [
        { id: "preferences", label: "Preferences", icon: Settings },
        { id: "notifications", label: "Notifications", icon: MessageCircle },
        { id: "privacy", label: "Privacy", icon: Shield },
      ],
    },
    {
      id: "data-export",
      label: "Data Export",
      icon: Download,
      href: "/data-export",
      badge: null,
    },
    {
      id: "subscription",
      label: "Subscription",
      icon: CreditCard,
      href: "/subscription",
      badge: null,
    },
    {
      id: "help",
      label: "Help & Support",
      icon: HelpCircle,
      href: "/help",
      badge: null,
    },
  ];

  const toggleSubmenu = (itemId) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedMenus(newExpanded);
  };

  const NavItem = ({ item, isSubmenu = false, depth = 0 }) => {
    const Icon = item.icon;
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedMenus.has(item.id);
    const isActive = activeSection === item.id;

    return (
      <div>
        <button
          onClick={() => {
            if (hasSubmenu) {
              toggleSubmenu(item.id);
            } else {
              setActiveSection(item.id);
              // Close mobile sidebar when item is clicked
              if (window.innerWidth < 1024) {
                onClose();
              }
            }
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
            isActive
              ? "bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg"
              : isSubmenu
              ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 ml-4"
              : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          } ${depth > 0 ? `ml-${depth * 4}` : ""}`}
        >
          <div className="flex items-center space-x-3">
            <Icon
              className={`w-5 h-5 ${
                isActive
                  ? "text-white"
                  : "text-gray-500 group-hover:text-gray-700"
              }`}
            />
            <span className={`font-medium ${isSubmenu ? "text-sm" : ""}`}>
              {item.label}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {item.badge && (
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  isActive
                    ? "bg-white/20 text-white"
                    : item.badge === "New"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {item.badge}
              </span>
            )}
            {hasSubmenu && (
              <ChevronRight
                className={`w-4 h-4 transition-transform duration-200 ${
                  isExpanded ? "rotate-90" : ""
                } ${isActive ? "text-white" : "text-gray-400"}`}
              />
            )}
          </div>
        </button>

        {/* Submenu */}
        {hasSubmenu && isExpanded && (
          <div className="mt-2 space-y-1 ml-4">
            {item.submenu.map((subItem) => (
              <NavItem
                key={subItem.id}
                item={subItem}
                isSubmenu={true}
                depth={1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white/90 backdrop-blur-lg border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:z-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo section */}
          <div className="flex items-center space-x-3 p-6 border-b border-gray-200">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">NutriTrack</h1>
              <p className="text-sm text-gray-500">Your AI health companion</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            {/* Core Features */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                🏠 Core Features
              </div>
              {navigationItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </div>

            {/* AI-Powered Features */}
            <div className="mt-8 space-y-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                🤖 AI Assistant
              </div>
              {aiItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </div>

            {/* Analytics & Tracking */}
            <div className="mt-8 space-y-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                📊 Analytics
              </div>
              {analyticsItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </div>

            {/* Resources & Education */}
            <div className="mt-8 space-y-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                📚 Resources
              </div>
              {resourceItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </div>

            {/* Settings & Account */}
            <div className="mt-8 space-y-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                ⚙️ Account
              </div>
              {accountItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </div>
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-gray-200">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-4 text-white">
              <div className="flex items-center space-x-3 mb-3">
                <Award className="w-6 h-6" />
                <div>
                  <div className="font-semibold">Premium Plan</div>
                  <div className="text-sm opacity-90">Unlock AI features</div>
                </div>
              </div>
              <button className="w-full bg-white/20 hover:bg-white/30 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all duration-200">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
