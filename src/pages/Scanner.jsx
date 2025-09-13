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
  Loader,
  Upload,
} from "lucide-react";
import { BrowserMultiFormatReader } from '@zxing/library';
import Sidebar from "../components/Sidebar";
import apiService from "../services/api";

const Scanner = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [scannedItem, setScannedItem] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanningError, setScanningError] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const codeReader = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Initialize barcode reader
    codeReader.current = new BrowserMultiFormatReader();
    
    // Load scan history on component mount
    loadScanHistory();
    
    if (isScanning) {
      startBarcodeScanning();
    } else {
      stopBarcodeScanning();
    }
    
    return () => {
      stopBarcodeScanning();
      if (codeReader.current) {
        codeReader.current.reset();
      }
    };
  }, [isScanning]);
  
  const loadScanHistory = async () => {
    if (!apiService.isAuthenticated()) {
      // Load from localStorage for demo
      const savedHistory = localStorage.getItem('scanHistory');
      if (savedHistory) {
        setScanHistory(JSON.parse(savedHistory));
      }
      return;
    }
    
    try {
      const response = await apiService.getRecentScans();
      setScanHistory(response.recentFoods || []);
    } catch (error) {
      console.error('Error loading scan history:', error);
    }
  };

  const startBarcodeScanning = async () => {
    try {
      setError(null);
      setScanningError(null);
      
      // Start scanning with the video element
      await codeReader.current.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (result) {
          // Barcode detected
          const barcode = result.getText();
          console.log('Barcode detected:', barcode);
          handleBarcodeDetected(barcode);
        }
        if (err && !(err.name === 'NotFoundException')) {
          console.error('Scanning error:', err);
          setScanningError('Scanning error occurred');
        }
      });
    } catch (err) {
      console.error('Error starting barcode scanner:', err);
      setError('Failed to start camera. Please check permissions.');
    }
  };

  const stopBarcodeScanning = () => {
    try {
      if (codeReader.current) {
        codeReader.current.reset();
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
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

  const handleBarcodeDetected = async (barcode) => {
    if (isLoading) return; // Prevent multiple calls
    
    setIsLoading(true);
    setIsScanning(false);
    stopBarcodeScanning();
    
    try {
      const response = await apiService.scanBarcode(barcode);
      
      // Transform API response to match our UI structure
      const foodData = response.food;
      const transformedItem = {
        id: foodData._id || Date.now(),
        name: foodData.name,
        brand: foodData.brand || '',
        barcode: barcode,
        calories: foodData.nutrition?.calories || 0,
        protein: foodData.nutrition?.protein || 0,
        carbs: foodData.nutrition?.carbs || 0,
        fat: foodData.nutrition?.fat || 0,
        fiber: foodData.nutrition?.fiber || 0,
        sugar: foodData.nutrition?.sugar || 0,
        servingSize: `${foodData.nutrition?.servingSize || 100}${foodData.nutrition?.servingUnit || 'g'}`,
        ingredients: [], // May not be available from all sources
        nutrition: {
          sodium: foodData.nutrition?.sodium || 0,
          potassium: foodData.nutrition?.potassium || 0,
          calcium: foodData.nutrition?.calcium || 0,
          iron: foodData.nutrition?.iron || 0,
        },
        source: response.source
      };
      
      setScannedItem(transformedItem);
      setError(null);
      
    } catch (error) {
      console.error('Error scanning barcode:', error);
      setError(`Product not found: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleManualBarcodeScan = async () => {
    if (!manualBarcode.trim()) return;
    
    await handleBarcodeDetected(manualBarcode.trim());
    setManualBarcode('');
    setShowManualEntry(false);
  };
  
  const simulateScan = () => {
    // Use a real barcode for testing - Coca Cola
    handleBarcodeDetected('0049000028911');
  };

  const addToFoodLog = async (item) => {
    try {
      // Add to scan history
      const historyItem = { ...item, time: new Date(), scannedAt: new Date() };
      
      if (apiService.isAuthenticated()) {
        // The backend should already have this item from the scan, 
        // so we just need to update our local history
        await loadScanHistory();
      } else {
        // Save to localStorage for demo
        const newHistory = [historyItem, ...scanHistory];
        setScanHistory(newHistory);
        localStorage.setItem('scanHistory', JSON.stringify(newHistory));
      }
      
      // Show success message
      setSuccessMessage(`${item.name} added to your food log!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Clear the scanned item
      setScannedItem(null);
      
      console.log('Food added to log:', item.name);
      
    } catch (error) {
      console.error('Error adding to food log:', error);
      setError('Failed to add item to food log');
    }
  };
  
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert file to base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      
      // Try to scan barcode from image
      const result = await codeReader.current.decodeFromImage(undefined, base64);
      if (result) {
        await handleBarcodeDetected(result.getText());
      }
    } catch (error) {
      console.error('Error scanning image:', error);
      setError('Could not detect barcode in image. Try a clearer photo.');
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatTime = (date) => {
    if (!date) return "Unknown time";

    // Convert to Date object if it's not already
    const dateObj = date instanceof Date ? date : new Date(date);

    // Check if it's a valid date
    if (isNaN(dateObj.getTime())) return "Invalid date";

    const now = new Date();
    const diff = now - dateObj;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return dateObj.toLocaleDateString();
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
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="flex items-center gap-3 bg-gray-800 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                    Upload Image
                  </button>
                  <button 
                    onClick={() => setShowManualEntry(true)}
                    className="flex items-center gap-3 bg-gray-800 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    <Search className="w-5 h-5" />
                    Manual Entry
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
                      {scanHistory.slice(0, 5).map((item) => (
                        <div
                          key={item.id || item._id}
                          className="bg-gray-800/60 rounded-xl p-4 hover:bg-gray-700/60 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="text-white font-medium text-lg mb-1">
                                {item.name}
                              </div>
                              {item.brand && (
                                <div className="text-gray-500 text-sm mb-1">
                                  {item.brand}
                                </div>
                              )}
                              <div className="text-gray-400 text-sm">
                                {item.nutrition?.calories || item.calories || 0} cal
                                {item.nutrition?.protein && (
                                  <span className="ml-2">• {Math.round(item.nutrition.protein)}g protein</span>
                                )}
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                {formatTime(item.time || item.scannedAt || item.lastUsed)}
                              </div>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <button 
                                onClick={() => {
                                  setScannedItem({
                                    ...item,
                                    id: item.id || item._id,
                                    calories: item.nutrition?.calories || item.calories || 0,
                                    protein: item.nutrition?.protein || item.protein || 0,
                                    carbs: item.nutrition?.carbs || item.carbs || 0,
                                    fat: item.nutrition?.fat || item.fat || 0,
                                    fiber: item.nutrition?.fiber || item.fiber || 0,
                                    sugar: item.nutrition?.sugar || item.sugar || 0,
                                    servingSize: `${item.nutrition?.servingSize || 100}${item.nutrition?.servingUnit || 'g'}`,
                                    nutrition: item.nutrition || {}
                                  });
                                }}
                                className="text-blue-400 hover:bg-blue-500/10 p-1.5 rounded-lg transition-colors"
                                title="View details"
                              >
                                <Search className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => addToFoodLog({
                                  ...item,
                                  id: item.id || item._id,
                                  calories: item.nutrition?.calories || item.calories || 0,
                                  nutrition: item.nutrition || {}
                                })}
                                className="text-green-400 hover:bg-green-500/10 p-1.5 rounded-lg transition-colors"
                                title="Add to food log"
                              >
                                <ShoppingCart className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ScanLine className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400">No recent scans</p>
                      <p className="text-gray-500 text-sm">Start scanning to see your history</p>
                    </div>
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
                      disabled={isLoading}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? <Loader className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                      {isLoading ? 'Processing...' : 'Test Scan'}
                    </button>
                    
                    <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                      <RotateCcw className="w-5 h-5" />
                      Switch Camera
                    </button>
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-700">
                  <div className="text-center text-gray-400 text-sm">
                  {scanningError ? (
                    <div className="text-red-400">{scanningError}</div>
                  ) : (
                    <div>Scanner ready • Camera active</div>
                  )}
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
                      {scannedItem?.source && (
                        <p className="text-green-100 text-sm mt-2">
                          Source: {scannedItem.source === 'local' ? 'Database' : 'External API'}
                        </p>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-8">
                      <div className="text-center mb-8">
                        <h3 className="text-3xl font-bold text-gray-900 mb-3">
                          {scannedItem?.name}
                        </h3>
                        <p className="text-gray-500 text-lg mb-2">{scannedItem?.brand}</p>
                        <p className="text-gray-400 font-mono">
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
                        onClick={() => {
                          // Navigate to meal planner with this item
                          // For now, we'll save to localStorage and show a message
                          localStorage.setItem('pendingMealItem', JSON.stringify(scannedItem));
                          window.location.href = '/meal-planner';
                        }}
                        className="px-8 bg-blue-500 hover:bg-blue-600 text-white py-6 rounded-2xl text-xl font-bold transition-colors flex items-center justify-center gap-2"
                        title="Add to meal plan"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        Add to Meal
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
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4">
                <Loader className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing...</h3>
                <p className="text-gray-600">Looking up product information</p>
              </div>
            </div>
          )}
          
          {/* Error Alert */}
          {error && (
            <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Scan Error</div>
                  <div className="text-sm opacity-90">{error}</div>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="ml-2 hover:bg-red-600 p-1 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          {/* Success Alert */}
          {successMessage && (
            <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Success!</div>
                  <div className="text-sm opacity-90">{successMessage}</div>
                </div>
                <button 
                  onClick={() => setSuccessMessage(null)}
                  className="ml-2 hover:bg-green-600 p-1 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          {/* Manual Entry Modal */}
          {showManualEntry && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Manual Barcode Entry</h3>
                  <button
                    onClick={() => {
                      setShowManualEntry(false);
                      setManualBarcode('');
                    }}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Barcode Number
                  </label>
                  <input
                    type="text"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualBarcodeScan()}
                    placeholder="e.g., 1234567890123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-mono"
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowManualEntry(false);
                      setManualBarcode('');
                    }}
                    className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleManualBarcodeScan}
                    disabled={!manualBarcode.trim() || isLoading}
                    className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <><Loader className="w-4 h-4 animate-spin" /> Scanning...</>
                    ) : (
                      <><Search className="w-4 h-4" /> Scan Product</>
                    )}
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