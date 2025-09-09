import { useState, useRef, useEffect } from "react";
import {
  Camera,
  ScanLine,
  FlashlightOff,
  Flashlight,
  RotateCcw,
  X,
  Check,
  Menu,
  History,
  Search,
  Zap,
  Image as ImageIcon,
  ShoppingCart,
  AlertCircle,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

const Scanner = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [scannedItem, setScannedItem] = useState(null);
  const [scanHistory, setScanHistory] = useState([
    {
      id: 1,
      name: "Organic Banana",
      barcode: "1234567890123",
      calories: 89,
      brand: "Organic Farm",
      time: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: 2,
      name: "Greek Yogurt",
      barcode: "9876543210987",
      calories: 150,
      brand: "Mountain High",
      time: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
  ]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isScanning) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isScanning]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
  };

  const handleScanStart = () => {
    setIsScanning(true);
    setScannedItem(null);
  };

  const handleScanStop = () => {
    setIsScanning(false);
    stopCamera();
  };

  const simulateScan = () => {
    const mockItems = [
      {
        id: Date.now(),
        name: "Whole Grain Bread",
        barcode: "1122334455667",
        calories: 80,
        protein: 3,
        carbs: 15,
        fat: 1,
        fiber: 2,
        sugar: 2,
        brand: "Nature's Own",
        servingSize: "1 slice (28g)",
        ingredients: ["Whole wheat flour", "Water", "Yeast", "Salt", "Honey"],
        nutrition: {
          sodium: 150,
          potassium: 60,
          calcium: "2%",
          iron: "6%",
        },
      },
      {
        id: Date.now() + 1,
        name: "Almond Milk",
        barcode: "9988776655443",
        calories: 30,
        protein: 1,
        carbs: 1,
        fat: 2.5,
        fiber: 0,
        sugar: 0,
        brand: "Blue Diamond",
        servingSize: "1 cup (240ml)",
        ingredients: ["Almondmilk", "Calcium carbonate", "Natural flavors"],
        nutrition: {
          sodium: 170,
          potassium: 160,
          calcium: "45%",
          vitamin_e: "50%",
        },
      },
    ];
    const randomItem = mockItems[Math.floor(Math.random() * mockItems.length)];
    setScannedItem(randomItem);
    setIsScanning(false);
  };

  const addToFoodLog = (item) => {
    setScanHistory((prev) => [{ ...item, time: new Date() }, ...prev]);
    setScannedItem(null);
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage="scanner"
      />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-0">
        {/* Header */}
        <div className="bg-gray-900 text-white px-6 py-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  <ScanLine className="text-green-500" />
                  Food Scanner
                </h1>
                <p className="text-gray-400 text-sm">
                  Scan barcodes to track nutrition instantly
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <History className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!isScanning && !scannedItem ? (
            /* Landing State - Landscape Layout */
            <div className="min-h-full bg-gradient-to-r from-gray-900 to-gray-800 flex p-6">
              {/* Left Side - Main Content */}
              <div className="flex-1 flex flex-col justify-center items-center text-center pr-8">
                <div className="mb-8">
                  <div className="w-40 h-40 bg-green-500 rounded-full flex items-center justify-center mb-6 mx-auto shadow-2xl">
                    <ScanLine className="w-20 h-20 text-white" />
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-4">
                    Ready to Scan
                  </h2>
                  <p className="text-gray-300 text-xl mb-8 max-w-lg mx-auto">
                    Point your camera at any food product barcode to get instant
                    nutrition information
                  </p>
                </div>

                <button
                  onClick={handleScanStart}
                  className="bg-green-500 hover:bg-green-600 text-white px-16 py-6 rounded-2xl text-2xl font-semibold transition-all transform hover:scale-105 shadow-xl flex items-center gap-4 mb-8"
                >
                  <Camera className="w-10 h-10" />
                  Start Scanning
                </button>

                <div className="flex gap-6">
                  <button className="flex items-center gap-3 bg-gray-800 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors">
                    <ImageIcon className="w-5 h-5" />
                    Upload Image
                  </button>
                  <button className="flex items-center gap-3 bg-gray-800 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors">
                    <Search className="w-5 h-5" />
                    Manual Search
                  </button>
                </div>
              </div>

              {/* Right Side - Recent Scans */}
              <div className="w-96 flex flex-col justify-center">
                <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
                    <History className="w-6 h-6 text-green-400" />
                    Recent Scans
                  </h3>
                  {scanHistory.length > 0 ? (
                    <div className="space-y-3">
                      {scanHistory.map((item) => (
                        <div
                          key={item.id}
                          className="bg-gray-800/60 rounded-xl p-4 flex items-center justify-between hover:bg-gray-700/60 transition-colors"
                        >
                          <div>
                            <div className="text-white font-medium text-lg">
                              {item.name}
                            </div>
                            <div className="text-gray-400">
                              {item.calories} cal • {formatTime(item.time)}
                            </div>
                          </div>
                          <button className="text-green-400 hover:bg-green-500/10 p-2 rounded-lg transition-colors">
                            <ShoppingCart className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-8">No recent scans</p>
                  )}
                  
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{scanHistory.length}</div>
                        <div className="text-gray-400">Items Scanned</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">Today</div>
                        <div className="text-gray-400">Session</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : isScanning ? (
            /* Camera View - Landscape Layout */
            <div className="relative min-h-full bg-black flex-1 flex">
              {/* Camera Feed - Takes most space */}
              <div className="flex-1 relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanner Overlay - Centered on camera */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Scanner Frame - Wider for landscape */}
                    <div className="w-96 h-64 relative">
                      <div className="absolute inset-0 border-4 border-green-500 rounded-2xl opacity-80">
                        {/* Corner indicators */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                      </div>
                      
                      {/* Scanning Line Animation - Horizontal */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse"></div>
                      </div>
                    </div>

                    <div className="text-center mt-6">
                      <p className="text-white text-xl font-medium mb-2">
                        Position barcode in the frame
                      </p>
                      <p className="text-gray-300 text-lg">
                        Hold steady for automatic scanning
                      </p>
                    </div>
                  </div>
                </div>

                {/* Top Controls */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
                  <button
                    onClick={handleScanStop}
                    className="bg-black/60 backdrop-blur-sm text-white p-4 rounded-full hover:bg-black/80 transition-colors shadow-lg"
                  >
                    <X className="w-7 h-7" />
                  </button>
                  <button
                    onClick={() => setFlashOn(!flashOn)}
                    className={`p-4 rounded-full transition-colors shadow-lg backdrop-blur-sm ${
                      flashOn
                        ? "bg-yellow-500 text-black"
                        : "bg-black/60 text-white hover:bg-black/80"
                    }`}
                  >
                    {flashOn ? (
                      <Flashlight className="w-7 h-7" />
                    ) : (
                      <FlashlightOff className="w-7 h-7" />
                    )}
                  </button>
                </div>
              </div>

              {/* Right Side Panel - Controls and Info */}
              <div className="w-80 bg-black/80 backdrop-blur-sm border-l border-gray-700 flex flex-col">
                <div className="p-6 flex-1 flex flex-col justify-center">
                  <h3 className="text-white font-bold text-2xl mb-6 text-center">
                    Scanner Active
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="bg-gray-800/60 rounded-xl p-4">
                      <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                        <ScanLine className="w-4 h-4" />
                        Tips for Better Scanning
                      </h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• Keep barcode within the frame</li>
                        <li>• Ensure good lighting</li>
                        <li>• Hold device steady</li>
                        <li>• Try different angles if needed</li>
                      </ul>
                    </div>

                    <button
                      onClick={simulateScan}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-3 shadow-lg"
                    >
                      <Zap className="w-6 h-6" />
                      Simulate Scan
                    </button>
                    
                    <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                      <RotateCcw className="w-5 h-5" />
                      Switch Camera
                    </button>
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-700">
                  <div className="text-center text-gray-400 text-sm">
                    Scanner ready • Camera active
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Scanned Item Results - Landscape Layout */
            <div className="min-h-full bg-gray-50 py-8">
              <div className="max-w-7xl mx-auto p-6 flex gap-8">
                {/* Left Side - Product Image & Basic Info */}
                <div className="w-1/2 pr-4">
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-full">
                    {/* Success Header */}
                    <div className="bg-green-500 text-white p-8 text-center">
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-10 h-10" />
                      </div>
                      <h2 className="text-3xl font-bold">Product Found!</h2>
                    </div>

                    {/* Product Info */}
                    <div className="p-8">
                      <div className="text-center mb-8">
                        <h3 className="text-3xl font-bold text-gray-900 mb-3">
                          {scannedItem?.name}
                        </h3>
                        <p className="text-gray-500 text-lg mb-2">{scannedItem?.brand}</p>
                        <p className="text-gray-400">
                          Barcode: {scannedItem?.barcode}
                        </p>
                      </div>

                      {/* Main Nutrition Info */}
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8">
                        <div className="text-center mb-6">
                          <div className="text-6xl font-bold text-green-600 mb-2">
                            {scannedItem?.calories}
                          </div>
                          <div className="text-gray-600 font-medium text-lg">
                            calories per {scannedItem?.servingSize}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-6 text-center">
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="text-3xl font-bold text-blue-600 mb-1">
                              {scannedItem?.protein}g
                            </div>
                            <div className="text-gray-600 font-medium">Protein</div>
                          </div>
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="text-3xl font-bold text-orange-600 mb-1">
                              {scannedItem?.carbs}g
                            </div>
                            <div className="text-gray-600 font-medium">Carbs</div>
                          </div>
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="text-3xl font-bold text-purple-600 mb-1">
                              {scannedItem?.fat}g
                            </div>
                            <div className="text-gray-600 font-medium">Fat</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Detailed Nutrition & Actions */}
                <div className="w-1/2 pl-4">
                  <div className="bg-white rounded-2xl shadow-xl p-8 h-full flex flex-col">
                    <h4 className="text-2xl font-bold text-gray-900 mb-6">Nutrition Details</h4>
                    
                    {/* Additional Nutrition */}
                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-2xl font-bold text-gray-900 mb-1">{scannedItem?.fiber}g</div>
                        <div className="text-gray-600 font-medium">Fiber</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-2xl font-bold text-gray-900 mb-1">{scannedItem?.sugar}g</div>
                        <div className="text-gray-600 font-medium">Sugar</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-2xl font-bold text-gray-900 mb-1">{scannedItem?.nutrition?.sodium}mg</div>
                        <div className="text-gray-600 font-medium">Sodium</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-2xl font-bold text-gray-900 mb-1">{scannedItem?.nutrition?.potassium}mg</div>
                        <div className="text-gray-600 font-medium">Potassium</div>
                      </div>
                    </div>

                    {/* Ingredients */}
                    <div className="mb-8 flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-3">Ingredients</h4>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-gray-700 leading-relaxed">
                          {scannedItem?.ingredients?.join(", ")}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <button
                        onClick={() => addToFoodLog(scannedItem)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-6 rounded-2xl text-xl font-bold transition-colors flex items-center justify-center gap-3 shadow-lg"
                      >
                        <Check className="w-6 h-6" />
                        Add to Food Log
                      </button>
                      <button
                        onClick={() => setScannedItem(null)}
                        className="px-8 bg-gray-200 hover:bg-gray-300 text-gray-800 py-6 rounded-2xl text-xl font-bold transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Options */}
                <div className="mt-8 text-center">
                  <button
                    onClick={handleScanStart}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold transition-colors flex items-center gap-3 mx-auto"
                  >
                    <ScanLine className="w-5 h-5" />
                    Scan Another Item
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scanner;