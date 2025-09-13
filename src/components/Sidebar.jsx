import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../services/api";
import {
  Settings,
  ChevronRight,
  Scan,
  Bot,
  User,
  Shield,
  ChefHat,
  Home,
  LogOut,
} from "lucide-react";

const Sidebar = ({ isOpen, onClose, currentPage = "scanner" }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(currentPage);
  const [expandedMenus, setExpandedMenus] = useState(new Set());

  const navigationItems = [
    {
      id: "homepage",
      label: "Homepage",
      icon: Home,
      href: "/homepage",
      badge: null,
    },
    {
      id: "scanner",
      label: "Scanner",
      icon: Scan,
      href: "/scanner",
      badge: "New",
    },
    {
      id: "meal-planner",
      label: "Meal Planner",
      icon: ChefHat,
      href: "/meal-planner",
      badge: null,
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
  ];

  const handleLogout = () => {
    apiService.logout();
    navigate("/login");
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const accountItems = [
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: "/settings",
      badge: null,
      submenu: [
        { id: "preferences", label: "Preferences", icon: Settings },
        { id: "privacy", label: "Privacy", icon: Shield },
      ],
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
            } else if (item.onClick) {
              // Handle custom onClick function
              item.onClick();
            } else {
              setActiveSection(item.id);
              // Navigate to the route if it exists
              if (item.href) {
                navigate(item.href);
              }
              // Close mobile sidebar when item is clicked
              if (window.innerWidth < 1024) {
                onClose();
              }
            }
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
            isActive
              ? "bg-white/20 text-white shadow-lg"
              : isSubmenu
              ? "text-white/70 hover:text-white hover:bg-white/10 ml-4"
              : "text-white/80 hover:text-white hover:bg-white/10"
          } ${depth > 0 ? `ml-${depth * 4}` : ""}`}
        >
          <div className="flex items-center space-x-3">
            <Icon
              className={`w-5 h-5 ${
                isActive ? "text-white" : "text-white/60 group-hover:text-white"
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
                    ? "bg-white/20 text-white"
                    : "bg-white/20 text-white"
                }`}
              >
                {item.badge}
              </span>
            )}
            {hasSubmenu && (
              <ChevronRight
                className={`w-4 h-4 transition-transform duration-200 ${
                  isExpanded ? "rotate-90" : ""
                } ${isActive ? "text-white" : "text-white/60"}`}
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
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-gradient-to-r from-green-500 to-blue-500 backdrop-blur-lg border-r border-blue-600 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:z-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo section */}
          <div className="flex items-center space-x-3 p-6 border-b border-white/20">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">NutriTrack</h1>
              <p className="text-sm text-white/70">Your AI health companion</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            {/* Core Features */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">
                🏠 Core Features
              </div>
              {navigationItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </div>

            {/* AI-Powered Features */}
            <div className="mt-8 space-y-2">
              <div className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">
                🤖 AI Assistant
              </div>
              {aiItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </div>

            {/* Settings & Account */}
            <div className="mt-8 space-y-2">
              <div className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">
                ⚙️ Account
              </div>
              {accountItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </div>
          </nav>

          {/* Logout Button - Fixed at bottom */}
          <div className="p-4 border-t border-white/20">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 text-white/80 hover:text-white hover:bg-white/10"
            >
              <LogOut className="w-5 h-5 text-white/60" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
