import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calculator,
  Building,
  Home,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Truck,
  Plus,
  Minus,
  ShoppingCart,
  Printer,
  Share2,
  ChevronRight,
  ChevronDown,
  Info,
  ShieldCheck,
  TrendingUp,
  Hammer,
  Zap,
  Droplets,
  Paintbrush,
  Maximize2,
  ArrowRight,
  Sliders,
  Grid,
  DoorClosed,
  Utensils,
  HardHat,
  RotateCcw,
  Bookmark,
  FileText,
  X,
  ExternalLink,
  MessageSquare,
  Compass
} from 'lucide-react';
import {
  calculateFullConstructionEstimate,
  SUPPORTED_INDIAN_LOCATIONS,
  PROPERTY_TYPE_MULTIPLIERS,
  STAGE_MULTIPLIERS,
  GLOBAL_BASE_RATES,
  CATEGORY_BASE_CONFIG,
  formatCurrency
} from '@buildora/utils';
import {
  ConstructionQualityTier,
  ConstructionPropertyType,
  ConstructionStageType,
  ConstructionAreaUnit,
  ConstructionCategoryKey,
  ConstructionCalculatorInput,
  ConstructionCalculatorResult,
  SavedConstructionProject
} from '@buildora/types';
import { SEED_PRODUCTS } from '@buildora/constants';
import { Product } from '@buildora/types';
import { useCartStore } from '../store/useCartStore';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';

// Map icon names to Lucide icons
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Package: PackageIcon,
  Hammer: Hammer,
  Grid: Grid,
  Layers: Layers,
  Maximize2: Maximize2,
  DoorClosed: DoorClosed,
  Zap: Zap,
  Paintbrush: Paintbrush,
  Droplets: Droplets,
  Utensils: Utensils,
  HardHat: HardHat
};

function PackageIcon(props: any) {
  return <Layers {...props} />;
}

export const HomeConstructionCalculatorPage: React.FC = () => {
  const navigate = useNavigate();
  const { addItem } = useCartStore();

  // 1. Form Inputs State
  const [selectedState, setSelectedState] = useState<string>('Karnataka');
  const [selectedCity, setSelectedCity] = useState<string>('Bengaluru');
  const [builtUpArea, setBuiltUpArea] = useState<number>(1200);
  const [areaUnit, setAreaUnit] = useState<ConstructionAreaUnit>('SQ_FT');
  const [propertyType, setPropertyType] = useState<ConstructionPropertyType>('INDEPENDENT_HOUSE');
  const [floors, setFloors] = useState<number>(2); // Default G+1
  const [stage, setStage] = useState<ConstructionStageType>('FULL_CONSTRUCTION');
  const [globalQuality, setGlobalQuality] = useState<ConstructionQualityTier>('STANDARD');

  // Advanced Inputs State (Expandable)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [bedrooms, setBedrooms] = useState<number>(3);
  const [bathrooms, setBathrooms] = useState<number>(3);
  const [kitchens, setKitchens] = useState<number>(1);
  const [siteCondition, setSiteCondition] = useState<'PLAIN' | 'SLOPED_ROCKY' | 'BLACK_COTTON'>('PLAIN');
  const [brandPreference, setBrandPreference] = useState<string>('ANY');
  const [additional, setAdditional] = useState({
    compoundWall: true,
    sumpAndTank: true,
    rooftopSolar: false,
    falseCeiling: false
  });

  // Individual Category Overrides & Exclusions
  const [categoryOverrides, setCategoryOverrides] = useState<Partial<Record<ConstructionCategoryKey, ConstructionQualityTier>>>({});
  const [excludedCategories, setExcludedCategories] = useState<ConstructionCategoryKey[]>([]);

  // Calculation Visibility State
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);

  // Material Filter Tab ('ALL' vs 'DELIVERABLE')
  const [materialFilter, setMaterialFilter] = useState<'ALL' | 'DELIVERABLE'>('ALL');

  // Hovered Chart Segment
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  // Modals & Drawers
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [saveProjectName, setSaveProjectName] = useState<string>('My Home Construction — Bengaluru');
  const [isSavedProjectsDrawerOpen, setIsSavedProjectsDrawerOpen] = useState<boolean>(false);
  const [savedProjects, setSavedProjects] = useState<SavedConstructionProject[]>([]);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState<boolean>(false);
  const [quoteCategory, setQuoteCategory] = useState<string>('Bricks & Blocks');
  const [quoteForm, setQuoteForm] = useState({ name: 'Arjun Verma', phone: '9876543210', email: 'arjun@apexinfra.com', notes: '' });
  const [quoteSuccess, setQuoteSuccess] = useState<boolean>(false);

  // Buy Materials Drawer
  const [isBuyModalOpen, setIsBuyModalOpen] = useState<boolean>(false);
  const [selectedBuyCategory, setSelectedBuyCategory] = useState<ConstructionCategoryKey | null>(null);
  const [customQuantities, setCustomQuantities] = useState<Record<string, number>>({});

  // Feedback Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Available cities for selected state
  const availableCities = useMemo(() => {
    const stateObj = SUPPORTED_INDIAN_LOCATIONS.find((s) => s.state === selectedState);
    return stateObj ? stateObj.cities : [];
  }, [selectedState]);

  // Sync city when state changes
  useEffect(() => {
    if (availableCities.length > 0 && !availableCities.some((c) => c.name === selectedCity)) {
      setSelectedCity(availableCities[0].name);
    }
  }, [selectedState, availableCities, selectedCity]);

  // Load saved projects on mount
  useEffect(() => {
    api.getSavedConstructionProjects().then((list) => {
      setSavedProjects(list);
    });
  }, []);

  // Conversion hint for unit toggle
  const conversionHint = useMemo(() => {
    if (areaUnit === 'SQ_FT') {
      const sqM = (builtUpArea * 0.092903).toFixed(2);
      return `${builtUpArea.toLocaleString()} Sq. Feet ≈ ${sqM} Sq. Meter`;
    } else {
      const sqFt = Math.round(builtUpArea * 10.7639);
      return `${builtUpArea.toLocaleString()} Sq. Meter ≈ ${sqFt.toLocaleString()} Sq. Feet`;
    }
  }, [builtUpArea, areaUnit]);

  // Handle Area Unit Switch with conversion option
  const handleUnitSwitch = (newUnit: ConstructionAreaUnit) => {
    if (newUnit === areaUnit) return;
    if (newUnit === 'SQ_M') {
      const converted = Math.round(builtUpArea * 0.092903);
      setBuiltUpArea(converted > 0 ? converted : 110);
    } else {
      const converted = Math.round(builtUpArea * 10.7639);
      setBuiltUpArea(converted > 0 ? converted : 1200);
    }
    setAreaUnit(newUnit);
    showToast(`Converted built-up area to ${newUnit === 'SQ_M' ? 'Sq. Meters' : 'Sq. Feet'}`);
  };

  // Dynamic Calculation Engine Result
  const calculationResult: ConstructionCalculatorResult = useMemo(() => {
    return calculateFullConstructionEstimate({
      state: selectedState,
      city: selectedCity,
      builtUpArea,
      areaUnit,
      propertyType,
      floors,
      stage,
      globalQuality,
      categoryOverrides,
      excludedCategories,
      advancedDetails: {
        bedrooms,
        bathrooms,
        kitchens,
        siteCondition,
        brandPreference,
        additionalInclusions: additional
      }
    });
  }, [
    selectedState,
    selectedCity,
    builtUpArea,
    areaUnit,
    propertyType,
    floors,
    stage,
    globalQuality,
    categoryOverrides,
    excludedCategories,
    bedrooms,
    bathrooms,
    kitchens,
    siteCondition,
    brandPreference,
    additional
  ]);

  // Execute Calculation Click
  const handleCalculate = () => {
    if (!builtUpArea || builtUpArea <= 0) {
      showToast('Please enter a valid built-up area.');
      return;
    }
    setHasCalculated(true);
    showToast('Calculated construction estimate successfully!');
    // Smooth scroll down to results
    setTimeout(() => {
      const el = document.getElementById('calculation-results-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  // Reset Calculator to initial pre-calc state
  const handleReset = () => {
    setBuiltUpArea(1200);
    setAreaUnit('SQ_FT');
    setSelectedState('Karnataka');
    setSelectedCity('Bengaluru');
    setPropertyType('INDEPENDENT_HOUSE');
    setFloors(2);
    setStage('FULL_CONSTRUCTION');
    setGlobalQuality('STANDARD');
    setCategoryOverrides({});
    setExcludedCategories([]);
    setShowAdvanced(false);
    setAdditional({ compoundWall: true, sumpAndTank: true, rooftopSolar: false, falseCeiling: false });
    setHasCalculated(false);
    showToast('Calculator reset to default settings.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Per-category Quality Override Handler
  const handleCategoryQualityChange = (key: ConstructionCategoryKey, newQuality: ConstructionQualityTier) => {
    setCategoryOverrides((prev) => {
      const updated = { ...prev };
      if (newQuality === globalQuality) {
        delete updated[key];
      } else {
        updated[key] = newQuality;
      }
      return updated;
    });
    showToast(`Updated ${CATEGORY_BASE_CONFIG[key].name} quality to ${newQuality}`);
  };

  // Reset single category override
  const handleResetSingleOverride = (key: ConstructionCategoryKey) => {
    setCategoryOverrides((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    showToast(`Reset ${CATEGORY_BASE_CONFIG[key].name} to global ${globalQuality} quality`);
  };

  // Reset all overrides
  const handleResetAllOverrides = () => {
    setCategoryOverrides({});
    showToast('Reset all categories to global quality.');
  };

  // Toggle Category Exclusion
  const handleToggleExclude = (key: ConstructionCategoryKey) => {
    setExcludedCategories((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  // Filtered Categories based on tab
  const displayedCategories = useMemo(() => {
    if (materialFilter === 'DELIVERABLE') {
      return calculationResult.categories.filter((c) => c.isDeliverable);
    }
    return calculationResult.categories;
  }, [calculationResult, materialFilter]);

  // Matched products for a specific deliverable category
  const getProductsForCategory = (catKey: ConstructionCategoryKey) => {
    const config = CATEGORY_BASE_CONFIG[catKey];
    if (!config.categorySlug) return [];
    return SEED_PRODUCTS.filter((p) => p.categorySlug === config.categorySlug || p.slug === config.recommendedProductSlug);
  };

  // Add individual product from drawer to cart
  const handleAddProductToCart = (prod: Product, defaultQty: number) => {
    const qty = customQuantities[prod.id] !== undefined ? customQuantities[prod.id] : defaultQty;
    addItem(prod, qty);
    showToast(`Added ${qty} × "${prod.name}" to your cart!`);
  };

  // Add all deliverable materials to cart
  const handleAddAllDeliverablesToCart = () => {
    let count = 0;
    calculationResult.categories
      .filter((c) => c.isDeliverable && !c.isExcluded && c.recommendedProductSlug)
      .forEach((cat) => {
        const prod = SEED_PRODUCTS.find((p) => p.slug === cat.recommendedProductSlug);
        if (prod) {
          const qty = customQuantities[prod.id] !== undefined ? customQuantities[prod.id] : cat.quantity;
          addItem(prod, qty);
          count += 1;
        }
      });
    showToast(`Added ${count} key materials with calculated quantities to cart!`);
  };

  // Save Project
  const handleSaveProject = async () => {
    if (!saveProjectName.trim()) return;
    const newProj = await api.saveConstructionProject({
      projectName: saveProjectName.trim(),
      input: {
        state: selectedState,
        city: selectedCity,
        builtUpArea,
        areaUnit,
        propertyType,
        floors,
        stage,
        globalQuality,
        categoryOverrides,
        excludedCategories,
        advancedDetails: { bedrooms, bathrooms, kitchens, siteCondition, brandPreference, additionalInclusions: additional }
      }
    });
    setSavedProjects((prev) => [newProj, ...prev]);
    setIsSaveModalOpen(false);
    showToast(`Project "${newProj.projectName}" saved successfully!`);
  };

  // Load Saved Project
  const handleLoadProject = (proj: SavedConstructionProject) => {
    setSelectedState(proj.input.state);
    setSelectedCity(proj.input.city);
    setBuiltUpArea(proj.input.builtUpArea);
    setAreaUnit(proj.input.areaUnit);
    setPropertyType(proj.input.propertyType);
    setFloors(proj.input.floors);
    setStage(proj.input.stage);
    setGlobalQuality(proj.input.globalQuality);
    setCategoryOverrides(proj.input.categoryOverrides || {});
    setExcludedCategories(proj.input.excludedCategories || []);
    if (proj.input.advancedDetails?.additionalInclusions) {
      setAdditional({
        compoundWall: !!proj.input.advancedDetails.additionalInclusions.compoundWall,
        sumpAndTank: !!proj.input.advancedDetails.additionalInclusions.sumpAndTank,
        rooftopSolar: !!proj.input.advancedDetails.additionalInclusions.rooftopSolar,
        falseCeiling: !!proj.input.advancedDetails.additionalInclusions.falseCeiling
      });
    }
    setHasCalculated(true);
    setIsSavedProjectsDrawerOpen(false);
    showToast(`Loaded project: "${proj.projectName}"`);
  };

  // Delete Saved Project
  const handleDeleteProject = async (id: string) => {
    await api.deleteConstructionProject(id);
    setSavedProjects((prev) => prev.filter((p) => p.id !== id));
    showToast('Saved project deleted.');
  };

  // Submit Quotation Request
  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.requestConstructionQuotation({
      customerName: quoteForm.name,
      phone: quoteForm.phone,
      email: quoteForm.email,
      state: selectedState,
      city: selectedCity,
      builtUpArea,
      categoriesRequested: [quoteCategory],
      notes: quoteForm.notes
    });
    setQuoteSuccess(true);
    setTimeout(() => {
      setQuoteSuccess(false);
      setIsQuoteModalOpen(false);
      showToast('Quotation request submitted! Our partner engineer will call you.');
    }, 2000);
  };

  // Number of active overrides
  const activeOverrideCount = Object.keys(categoryOverrides).length;

  return (
    <div className="min-h-screen bg-slate-50/70 pb-24 text-slate-900 selection:bg-brand-orange-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-blue-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-brand-orange-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/cart')}
            className="ml-2 text-xs py-1 px-3"
          >
            Cart
          </Button>
        </div>
      )}

      {/* Top Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link to="/" className="hover:text-brand-blue-700 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600">Tools</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-900">Home Construction Calculator</span>
          </div>
        </div>
      </div>

      {/* HERO HEADER */}
      <div className="bg-gradient-to-r from-brand-blue-950 via-slate-900 to-indigo-950 text-white border-b border-white/10 relative overflow-hidden py-10 sm:py-14">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange-500/20 text-brand-orange-400 border border-brand-orange-500/30 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>BUILD SMARTER · ORDER IN 60 MIN</span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Home Construction Cost Calculator
              </h1>
              <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Estimate complete construction costs, quantities, labour expenses, and category-wise budgets for your dream home across India. Powered by IS 456 civil engineering benchmarks.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSavedProjectsDrawerOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition-all shadow-xs"
              >
                <Bookmark className="w-4 h-4 text-brand-orange-400" />
                <span>Saved Projects ({savedProjects.length})</span>
              </button>
              {hasCalculated && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-slate-300 hover:text-white transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ========================================================
              INPUT FORM CONTAINER (Phases 4 & 5)
             ======================================================== */}
          <div className="lg:col-span-12">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200/80 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-orange-500/10 text-brand-orange-600 flex items-center justify-center font-black">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Project Specifications &amp; Location</h2>
                    <p className="text-xs text-slate-500">Configure your building dimensions, location rates, and stage</p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Transparent Civil Rates</span>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* 1. State */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    1. State / UT
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-600 shadow-xs"
                  >
                    {SUPPORTED_INDIAN_LOCATIONS.map((s) => (
                      <option key={s.state} value={s.state}>
                        {s.state}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. City */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    2. City (Regional Rates)
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-600 shadow-xs"
                  >
                    {availableCities.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.multiplier >= 1 ? `+${Math.round((c.multiplier - 1) * 100)}%` : `${Math.round((c.multiplier - 1) * 100)}%`})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Built-up Area */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      3. Built-up Area
                    </label>
                    {/* Unit Toggle */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => handleUnitSwitch('SQ_FT')}
                        className={`px-2 py-0.5 rounded-md transition-all ${
                          areaUnit === 'SQ_FT' ? 'bg-white text-brand-blue-900 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Sq.Feet
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUnitSwitch('SQ_M')}
                        className={`px-2 py-0.5 rounded-md transition-all ${
                          areaUnit === 'SQ_M' ? 'bg-white text-brand-blue-900 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Sq.Meter
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={200}
                      max={50000}
                      step={50}
                      value={builtUpArea}
                      onChange={(e) => setBuiltUpArea(Math.max(0, Number(e.target.value)))}
                      className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-slate-200 text-xs font-black text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-600 shadow-xs"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {areaUnit === 'SQ_FT' ? 'Sq.Ft' : 'Sq.M'}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-blue-700 font-semibold">{conversionHint}</p>
                </div>

                {/* 4. Property Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    4. Property Type
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as ConstructionPropertyType)}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-600 shadow-xs"
                  >
                    {Object.entries(PROPERTY_TYPE_MULTIPLIERS).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Number of Floors */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    5. Number of Floors
                  </label>
                  <select
                    value={floors}
                    onChange={(e) => setFloors(Number(e.target.value))}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-600 shadow-xs"
                  >
                    <option value={1}>Ground Floor Only (G+0)</option>
                    <option value={2}>Ground + 1 Floor (G+1)</option>
                    <option value={3}>Ground + 2 Floors (G+2)</option>
                    <option value={4}>Ground + 3 Floors (G+3)</option>
                    <option value={5}>Ground + 4 Floors (G+4)</option>
                  </select>
                </div>

                {/* 6. Construction Stage */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    6. Construction Stage
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as ConstructionStageType)}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-600 shadow-xs"
                  >
                    {Object.entries(STAGE_MULTIPLIERS).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 7. Global Build Quality */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    7. Construction Quality Tier
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'BASIC', label: 'Basic', tag: 'Economical', rate: 1650 },
                      { id: 'STANDARD', label: 'Standard', tag: 'Recommended', rate: 2050 },
                      { id: 'PREMIUM', label: 'Premium', tag: 'Luxury Turnkey', rate: 2650 }
                    ].map((tier) => {
                      const active = globalQuality === tier.id;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setGlobalQuality(tier.id as ConstructionQualityTier)}
                          className={`py-2 px-3 rounded-xl border text-left transition-all ${
                            active
                              ? 'bg-brand-blue-900 border-brand-blue-900 text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black">{tier.label}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              {tier.tag}
                            </span>
                          </div>
                          <span className={`text-[11px] block mt-0.5 ${active ? 'text-amber-300' : 'text-slate-500'}`}>
                            {formatCurrency(tier.rate)}/sq.ft
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Advanced Expandable Accordion */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-xs font-bold text-brand-blue-700 hover:text-brand-blue-900"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  <span>{showAdvanced ? 'Hide Advanced Civil Options' : 'Show Advanced Civil Options (Rooms, Solar, Compound Wall)'}</span>
                </button>

                {showAdvanced && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 mt-2 animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Bedrooms</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={bedrooms}
                        onChange={(e) => setBedrooms(Number(e.target.value))}
                        className="w-full py-1.5 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Bathrooms</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={bathrooms}
                        onChange={(e) => setBathrooms(Number(e.target.value))}
                        className="w-full py-1.5 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Site Soil Condition</label>
                      <select
                        value={siteCondition}
                        onChange={(e) => setSiteCondition(e.target.value as any)}
                        className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 bg-white"
                      >
                        <option value="PLAIN">Plain Ground</option>
                        <option value="SLOPED_ROCKY">Sloped / Rocky</option>
                        <option value="BLACK_COTTON">Black Cotton Soil</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Preferred Brand Group</label>
                      <select
                        value={brandPreference}
                        onChange={(e) => setBrandPreference(e.target.value)}
                        className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 bg-white"
                      >
                        <option value="ANY">Any Recommended Brand</option>
                        <option value="ULTRATECH">UltraTech + Havells + Asian Paints</option>
                        <option value="PREMIUM_TIER">Birla + Finolex + Kohler</option>
                      </select>
                    </div>

                    {/* Extra inclusions checkboxes */}
                    <div className="sm:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={additional.compoundWall}
                          onChange={(e) => setAdditional((p) => ({ ...p, compoundWall: e.target.checked }))}
                          className="rounded text-brand-orange-500 focus:ring-brand-orange-500"
                        />
                        <span>Compound Wall (+₹1.2L)</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={additional.sumpAndTank}
                          onChange={(e) => setAdditional((p) => ({ ...p, sumpAndTank: e.target.checked }))}
                          className="rounded text-brand-orange-500 focus:ring-brand-orange-500"
                        />
                        <span>Sump &amp; Tank (+₹95K)</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={additional.rooftopSolar}
                          onChange={(e) => setAdditional((p) => ({ ...p, rooftopSolar: e.target.checked }))}
                          className="rounded text-brand-orange-500 focus:ring-brand-orange-500"
                        />
                        <span>Rooftop Solar Ready (+₹75K)</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={additional.falseCeiling}
                          onChange={(e) => setAdditional((p) => ({ ...p, falseCeiling: e.target.checked }))}
                          className="rounded text-brand-orange-500 focus:ring-brand-orange-500"
                        />
                        <span>False Ceiling (+₹85/sq.ft)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleCalculate}
                    className="font-black text-xs sm:text-sm px-8 py-3 bg-brand-orange-500 hover:bg-brand-orange-600 text-white shadow-lg shadow-orange-500/25"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Calculate Construction Cost
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleReset}
                    className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 border-slate-200"
                  >
                    Reset
                  </Button>
                </div>

                <div className="text-right text-[11px] text-slate-500">
                  <span>*Indicative civil planning estimate based on IS 456 &amp; NBC standards</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              PRE-CALCULATION ONBOARDING & 13 CATEGORIES PREVIEW (Phases 5 & 8)
             ======================================================== */}
          {!hasCalculated && (
            <div className="lg:col-span-12 space-y-8 animate-in fade-in duration-300">
              {/* 3 Step Guidance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-blue-50 text-brand-blue-800 font-black text-sm flex items-center justify-center">
                    1
                  </div>
                  <h3 className="text-sm font-black text-slate-900">Pick Your Location</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Regional material indices and contractor wages are automatically calibrated for {selectedCity}, {selectedState}.
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-orange-50 text-brand-orange-600 font-black text-sm flex items-center justify-center">
                    2
                  </div>
                  <h3 className="text-sm font-black text-slate-900">Enter Built-up Area</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Enter the total structural slab area in Sq.Feet or Sq.Meter. Typical Indian independent houses range from 1,000 to 2,500 sq.ft.
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-black text-sm flex items-center justify-center">
                    3
                  </div>
                  <h3 className="text-sm font-black text-slate-900">Tune Quality per Category</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Customize quality individually for Cement, TMT Steel, Tiles, Paint, Modular Kitchen, and more after initial calculation.
                  </p>
                </div>
              </div>

              {/* 13 Categories Preview Grid */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
                <div>
                  <span className="text-[11px] font-bold text-brand-orange-600 uppercase tracking-wider block">
                    Comprehensive Build Scope
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                    13 Essential Construction Categories Estimated
                  </h3>
                  <p className="text-xs text-slate-500">
                    From deep footing excavation to modular kitchen cabinets and electrical switchboards.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {Object.entries(CATEGORY_BASE_CONFIG).map(([key, config]) => {
                    const Icon = CATEGORY_ICONS[config.iconName] || Layers;
                    return (
                      <div
                        key={key}
                        className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: config.color }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          {config.isDeliverable && (
                            <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                              60m Dispatch
                            </span>
                          )}
                        </div>
                        <div className="mt-3">
                          <h4 className="text-xs font-black text-slate-900 line-clamp-1">{config.name}</h4>
                          <span className="text-[10px] text-slate-500 block mt-0.5">{config.unit}</span>
                          <span className="text-[10px] font-bold text-brand-blue-800 block mt-1">
                            ~{config.weightPercentage}% of budget
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              AFTER CALCULATION DASHBOARD (Phases 9 to 20)
             ======================================================== */}
          {hasCalculated && (
            <div id="calculation-results-section" className="lg:col-span-12 space-y-8 animate-in fade-in duration-300">
              {/* 1. RESULTS SUMMARY BANNER (Phase 9) */}
              <div className="bg-gradient-to-br from-brand-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-card border border-white/10 relative overflow-hidden">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-brand-orange-400">
                      <span>ESTIMATED TOTAL BUILD</span>
                      <span>•</span>
                      <span>
                        {calculationResult.summary.builtUpAreaSqFt.toLocaleString()} Sq.Ft in {selectedCity}, {selectedState}
                      </span>
                    </div>
                    <div className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                      {formatCurrency(calculationResult.summary.totalEstimatedCost)}
                    </div>
                    <p className="text-xs text-slate-300">
                      {globalQuality} Quality Tier · {calculationResult.summary.categoriesIncludedCount} of 13 Categories Included · GST &amp; Transport Included
                    </p>
                  </div>

                  {/* Actions: Save, PDF, Share */}
                  <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsSaveModalOpen(true)}
                      className="font-bold text-xs"
                      leftIcon={<Bookmark className="w-3.5 h-3.5" />}
                    >
                      Save Project
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.print()}
                      className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs font-bold"
                      leftIcon={<Printer className="w-3.5 h-3.5" />}
                    >
                      Print PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: 'Buildora Home Construction Estimate',
                            text: `Estimated cost for ${calculationResult.summary.builtUpAreaSqFt} sq.ft in ${selectedCity} is ${formatCurrency(calculationResult.summary.totalEstimatedCost)} (${formatCurrency(calculationResult.summary.costPerSqFt)}/sq.ft).`,
                            url: window.location.href
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          showToast('Estimate link copied to clipboard!');
                        }
                      }}
                      className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs font-bold"
                      leftIcon={<Share2 className="w-3.5 h-3.5" />}
                    >
                      Share
                    </Button>
                  </div>
                </div>

                {/* 4 Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <span className="text-[11px] text-slate-400 block font-semibold">Cost Per Sq.Ft</span>
                    <span className="text-lg sm:text-2xl font-black text-amber-300 block mt-1">
                      {formatCurrency(calculationResult.summary.costPerSqFt)}
                    </span>
                    <span className="text-[10px] text-slate-400">Total Structural Rate</span>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <span className="text-[11px] text-slate-400 block font-semibold">Materials Share (62%)</span>
                    <span className="text-lg sm:text-2xl font-black text-orange-300 block mt-1">
                      {formatCurrency(calculationResult.summary.materialCost)}
                    </span>
                    <span className="text-[10px] text-slate-400">Raw Civil &amp; Finishes</span>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <span className="text-[11px] text-slate-400 block font-semibold">Labour Share (28%)</span>
                    <span className="text-lg sm:text-2xl font-black text-blue-300 block mt-1">
                      {formatCurrency(calculationResult.summary.labourCost)}
                    </span>
                    <span className="text-[10px] text-slate-400">Masons, Trades &amp; Supervision</span>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <span className="text-[11px] text-slate-400 block font-semibold">Approvals &amp; Arch (10%)</span>
                    <span className="text-lg sm:text-2xl font-black text-emerald-300 block mt-1">
                      {formatCurrency(calculationResult.summary.architecturalCost)}
                    </span>
                    <span className="text-[10px] text-slate-400">Sanctions &amp; Structural Plan</span>
                  </div>
                </div>
              </div>

              {/* 2. COST DISTRIBUTION CHART (Phase 10) */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Cost Distribution Breakdown</h3>
                    <p className="text-xs text-slate-500">
                      Hover over any segment to inspect category allocation for {calculationResult.summary.builtUpAreaSqFt} sq.ft
                    </p>
                  </div>
                  <span className="text-xs font-bold text-brand-blue-700 bg-brand-blue-50 px-3 py-1 rounded-full border border-brand-blue-100">
                    {calculationResult.chartData.length} Categories Included
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left: SVG Donut Chart (5 Cols) */}
                  <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                    <svg viewBox="0 0 100 100" className="w-56 h-56 sm:w-64 sm:h-64 -rotate-90">
                      {(() => {
                        let cumulativePercent = 0;
                        return calculationResult.chartData.map((seg) => {
                          const strokeDasharray = `${seg.percentage} ${100 - seg.percentage}`;
                          const strokeDashoffset = -cumulativePercent;
                          cumulativePercent += seg.percentage;
                          const isHovered = hoveredSegment === seg.key;

                          return (
                            <circle
                              key={seg.key}
                              cx="50"
                              cy="50"
                              r="38"
                              fill="transparent"
                              stroke={seg.color}
                              strokeWidth={isHovered ? '14' : '10'}
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              pathLength="100"
                              className="transition-all duration-200 cursor-pointer"
                              onMouseEnter={() => setHoveredSegment(seg.key)}
                              onMouseLeave={() => setHoveredSegment(null)}
                            />
                          );
                        });
                      })()}
                    </svg>

                    {/* Donut Center Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      {hoveredSegment ? (() => {
                        const hovered = calculationResult.chartData.find((s) => s.key === hoveredSegment);
                        return hovered ? (
                          <>
                            <span className="text-[11px] font-bold text-slate-500 uppercase">{hovered.name}</span>
                            <span className="text-lg font-black text-slate-900">{formatCurrency(hovered.amount)}</span>
                            <span className="text-xs font-black text-brand-orange-600">{hovered.percentage}% of build</span>
                          </>
                        ) : null;
                      })() : (
                        <>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL BUILD</span>
                          <span className="text-sm sm:text-base font-black text-slate-900">
                            {formatCurrency(calculationResult.summary.totalEstimatedCost)}
                          </span>
                          <span className="text-[10px] text-slate-500">{calculationResult.chartData.length} Categories</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Legend Grid (7 Cols) */}
                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs">
                    {calculationResult.chartData.map((seg) => {
                      const isHovered = hoveredSegment === seg.key;
                      return (
                        <div
                          key={seg.key}
                          onMouseEnter={() => setHoveredSegment(seg.key)}
                          onMouseLeave={() => setHoveredSegment(null)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isHovered
                              ? 'bg-slate-100 border-slate-400 shadow-xs ring-1 ring-slate-400/30'
                              : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-md flex-shrink-0"
                              style={{ backgroundColor: seg.color }}
                            />
                            <span className="font-bold text-slate-900 line-clamp-1">{seg.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-slate-900 block">{formatCurrency(seg.amount)}</span>
                            <span className="text-[10px] text-slate-500">{seg.percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. MATERIAL CATEGORY CUSTOMIZATION SECTION (Phases 12, 13, 14, 15) */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Resource Allocation &amp; Customization</h3>
                    <p className="text-xs text-slate-500">
                      Override quality per material category or exclude items not needed for your project
                    </p>
                  </div>

                  {/* Filter Tabs: ALL (13) vs BUILDORA DELIVERS */}
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setMaterialFilter('ALL')}
                      className={`px-3 py-1.5 rounded-xl transition-all ${
                        materialFilter === 'ALL' ? 'bg-white text-brand-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All Materials (13)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMaterialFilter('DELIVERABLE')}
                      className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                        materialFilter === 'DELIVERABLE'
                          ? 'bg-brand-orange-500 text-white shadow-xs'
                          : 'text-slate-600 hover:text-brand-orange-600'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>BUILDORA Materials ({calculationResult.summary.deliverableCategoriesCount})</span>
                    </button>
                  </div>
                </div>

                {/* Overrides notice */}
                {activeOverrideCount > 0 && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-orange-500" />
                      <span>
                        <strong>{activeOverrideCount}</strong> category quality override(s) active.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetAllOverrides}
                      className="font-bold underline text-brand-orange-600 hover:text-brand-orange-700"
                    >
                      Reset all to global {globalQuality}
                    </button>
                  </div>
                )}

                {/* Batch Add All Deliverables to Cart Banner */}
                {materialFilter === 'DELIVERABLE' && (
                  <div className="bg-gradient-to-r from-brand-orange-500 to-amber-600 rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                        1-Click Site Order
                      </span>
                      <h4 className="text-sm sm:text-base font-black">Add All Available Materials to Cart</h4>
                      <p className="text-xs text-orange-100">
                        Dispatched from our nearest Bengaluru dark store network in 60 minutes.
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={handleAddAllDeliverablesToCart}
                      className="font-black text-xs whitespace-nowrap shadow-md"
                      leftIcon={<ShoppingCart className="w-4 h-4" />}
                    >
                      Add All to Cart
                    </Button>
                  </div>
                )}

                {/* 13 Categories Cards List */}
                <div className="space-y-3">
                  {displayedCategories.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat.iconName] || Layers;
                    const isExcl = cat.isExcluded;

                    return (
                      <div
                        key={cat.key}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                          isExcl
                            ? 'bg-slate-100/60 border-slate-200 opacity-60'
                            : cat.hasOverride
                            ? 'bg-amber-50/40 border-amber-300 shadow-xs'
                            : 'bg-white border-slate-200/90 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Left: Icon, Category Name, Badges & Specs */}
                          <div className="flex items-start gap-3.5">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5"
                              style={{ backgroundColor: CATEGORY_BASE_CONFIG[cat.key].color }}
                            >
                              <Icon className="w-5 h-5" />
                            </div>

                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm font-black text-slate-900">{cat.name}</h4>
                                {cat.isDeliverable ? (
                                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                    <Truck className="w-3 h-3" /> BUILDORA 60m Delivery
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                    Truckload / Partner Quote
                                  </span>
                                )}
                                {cat.hasOverride && (
                                  <span className="text-[9px] font-black text-brand-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                                    Customized
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                                <span className="font-bold text-brand-blue-900">
                                  {cat.quantity.toLocaleString()} {cat.unit}
                                </span>
                                <span>•</span>
                                <span className="text-slate-500">{cat.specification}</span>
                              </div>
                            </div>
                          </div>

                          {/* Middle: Basic / Standard / Premium Controls */}
                          <div className="flex items-center gap-3">
                            {/* Quality Tier Selector */}
                            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                              {(['BASIC', 'STANDARD', 'PREMIUM'] as ConstructionQualityTier[]).map((q) => (
                                <button
                                  key={q}
                                  type="button"
                                  disabled={isExcl}
                                  onClick={() => handleCategoryQualityChange(cat.key, q)}
                                  className={`px-2.5 py-1 rounded-lg transition-all ${
                                    cat.quality === q
                                      ? 'bg-brand-blue-900 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  {q.charAt(0) + q.slice(1).toLowerCase()}
                                </button>
                              ))}
                            </div>

                            {/* Reset override button if overridden */}
                            {cat.hasOverride && (
                              <button
                                type="button"
                                onClick={() => handleResetSingleOverride(cat.key)}
                                className="text-[10px] font-bold text-slate-500 hover:text-brand-orange-600 underline"
                                title="Reset to global quality"
                              >
                                Reset
                              </button>
                            )}

                            {/* Include/Exclude Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleExclude(cat.key)}
                              className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition-all ${
                                isExcl
                                  ? 'bg-slate-200 text-slate-600 border-slate-300'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {isExcl ? 'Excluded' : 'Included'}
                            </button>
                          </div>

                          {/* Right: Cost & Buy / Quote CTA */}
                          <div className="flex items-center justify-between lg:justify-end gap-4 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                            <div className="text-left lg:text-right">
                              <span className="text-xs sm:text-sm font-black text-slate-900 block">
                                {isExcl ? '₹0' : formatCurrency(cat.cost)}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {isExcl ? '0%' : `${cat.percentage}% of build`}
                              </span>
                            </div>

                            {/* Primary Action Button */}
                            {cat.isDeliverable ? (
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={isExcl}
                                onClick={() => {
                                  setSelectedBuyCategory(cat.key);
                                  setIsBuyModalOpen(true);
                                }}
                                className="font-bold text-xs bg-brand-orange-500 hover:bg-brand-orange-600 text-white"
                                leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                              >
                                Buy Materials
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isExcl}
                                onClick={() => {
                                  setQuoteCategory(cat.name);
                                  setIsQuoteModalOpen(true);
                                }}
                                className="font-bold text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
                                leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                              >
                                Request Quote
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            METHODOLOGY, TRUST & DISCLAIMER SECTION (Phase 22)
           ======================================================== */}
        <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-blue-50 text-brand-blue-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Civil Engineering Standards &amp; Calculation Methodology
              </h3>
              <p className="text-xs text-slate-500">
                Transparent formulas, IS 456 M20 concrete design, and regional cost calibration
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-slate-600 leading-relaxed">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
              <h4 className="font-black text-slate-900 flex items-center gap-1.5">
                <Hammer className="w-4 h-4 text-brand-orange-500" />
                IS 456 Structural Mix
              </h4>
              <p>
                Concrete volume assumes M20 grade (1:1.5:3) with Fe 550D rebar. Approx 0.42 bags of cement and 3.8 kg TMT steel per sq.ft built-up.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
              <h4 className="font-black text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-brand-blue-600" />
                62 / 28 / 10 Budget Ratio
              </h4>
              <p>
                In Indian urban residential construction, raw materials account for ~62%, labour &amp; supervision ~28%, and structural sanction fees ~10%.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
              <h4 className="font-black text-slate-900 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-600" />
                Location Rate Indexing
              </h4>
              <p>
                Regional multipliers reflect city-specific sand mining bans, state GST differences, and local transport distances.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
              <h4 className="font-black text-slate-900 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-brand-orange-600" />
                60-Min Site Dispatch
              </h4>
              <p>
                Materials marked with the 60-min badge are stocked mill-fresh in BUILDORA dark stores with crane and tail-lift offloading trucks.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
            <p className="leading-relaxed">
              <strong>Official Disclaimer:</strong> This calculator provides an indicative planning estimate only. Actual construction costs may vary depending on site soil conditions, architectural complexity, brand preferences, contractor pricing, labour rates, municipal setbacks, and live raw material fluctuations. Final quotations should be confirmed with qualified structural engineers and suppliers.
            </p>
          </div>
        </div>

        {/* ========================================================
            FAQ ACCORDION SECTION (Phase 23)
           ======================================================== */}
        <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div>
            <span className="text-[11px] font-bold text-brand-orange-600 uppercase tracking-wider block">
              Clear Answers
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-1">Frequently Asked Questions</h3>
            <p className="text-xs text-slate-500">Everything you need to know about house construction budgeting</p>
          </div>

          <div className="divide-y divide-slate-100">
            {[
              {
                q: 'How is the construction cost calculated?',
                a: 'The calculation combines your total built-up area with city-specific material rates, selected construction stage, floor count, and quality tier. It applies empirical civil engineering consumption rates (such as 0.42 bags cement/sq.ft and 3.8 kg TMT steel/sq.ft) according to IS 456 standards.'
              },
              {
                q: 'How much does it cost to construct a house per square foot in 2026?',
                a: 'In urban India (such as Bengaluru, Mumbai, and Delhi NCR), average construction rates range from ₹1,650 to ₹1,850/sq.ft for Basic quality, ₹1,950 to ₹2,250/sq.ft for Standard quality, and ₹2,600 to ₹3,500+/sq.ft for Premium turnkey construction with branded fixtures and luxury flooring.'
              },
              {
                q: 'How much cement is required for a 1,000 sq.ft house?',
                a: 'A typical 1,000 sq.ft residential house with columns, beams, brickwork, and roof slab requires approximately 400 to 450 bags (50kg) of Portland Pozzolana Cement (PPC) and OPC 53 grade cement.'
              },
              {
                q: 'How much TMT steel rebar is required?',
                a: 'Around 3.5 to 4.2 metric tonnes (3,500–4,200 kg) of Fe 550D TMT steel rebar is needed for a 1,000 sq.ft home across footings, columns, lintels, and roof slabs.'
              },
              {
                q: 'What is the difference between OPC and PPC cement?',
                a: 'OPC (Ordinary Portland Cement) 53 grade achieves high early strength and is suitable for RCC columns and commercial structural frameworks. PPC (Portland Pozzolana Cement) contains fly-ash, releases lower heat of hydration, provides superior crack resistance, and is optimal for slabs, masonry, and plastering.'
              },
              {
                q: 'How do Basic, Standard, and Premium quality tiers differ?',
                a: 'Basic uses economical materials (solid blocks, Fe 500 steel, ceramic tiles, tractor paint). Standard uses balanced branded materials (UltraTech PPC, Fe 550D steel, Kajaria 2x2 vitrified tiles, Havells FRLS wires, Asian Paints Royale). Premium includes luxury specifications (AAC blocks, Italian marble, smart touch automation, Jaquar/Kohler thermostatic sanitaryware, and teakwood doors).'
              },
              {
                q: 'Can I change the quality of individual materials separately?',
                a: 'Yes! You can set global quality to Basic, and customize Cement to Premium, Steel to Standard, and exclude the Modular Kitchen. The estimate recalculates instantly.'
              },
              {
                q: 'Can I purchase the estimated materials directly on BUILDORA 60?',
                a: 'Yes! For all deliverable categories (Cement, Tiles, Wires, Conduits, Paint, Sanitaryware, Hardware), you can click "Buy Materials", adjust quantities, and dispatch to your job site in 60 minutes.'
              },
              {
                q: 'Can I download and share my estimate as a PDF?',
                a: 'Yes! Click "Print PDF" or "Save Project" to generate a clean, branded estimate document to share with your family, contractor, or bank for home loan documentation.'
              },
              {
                q: 'Are labour and contractor costs included in this estimate?',
                a: 'Yes, the estimate includes comprehensive material (62%), skilled and unskilled labour (28%), and architectural approvals allowance (10%).'
              }
            ].map((faq, idx) => (
              <details key={idx} className="group py-4 cursor-pointer">
                <summary className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-900 group-hover:text-brand-blue-800 transition-colors list-none">
                  <span>{faq.q}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0" />
                </summary>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed pl-1">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL: BUY MATERIALS DRAWER (Phase 16)
         ======================================================== */}
      {isBuyModalOpen && selectedBuyCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase text-brand-orange-600 tracking-wider">
                  Store Dispatch
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Shop {CATEGORY_BASE_CONFIG[selectedBuyCategory].name} Products
                </h3>
                <p className="text-xs text-slate-500">
                  Calculated requirement:{' '}
                  <strong>
                    {calculationResult.categories.find((c) => c.key === selectedBuyCategory)?.quantity.toLocaleString()}{' '}
                    {CATEGORY_BASE_CONFIG[selectedBuyCategory].unit}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBuyModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {getProductsForCategory(selectedBuyCategory).map((prod) => {
                const estQty = calculationResult.categories.find((c) => c.key === selectedBuyCategory)?.quantity || 1;
                const currentQty = customQuantities[prod.id] !== undefined ? customQuantities[prod.id] : estQty;

                return (
                  <div
                    key={prod.id}
                    className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={prod.images[0] || 'https://placehold.co/100x100?text=Buildora'}
                        alt={prod.name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-100 flex-shrink-0 bg-slate-50"
                      />
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-brand-blue-700 bg-brand-blue-50 px-2 py-0.5 rounded">
                          {prod.brand}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">{prod.name}</h4>
                        <div className="text-xs font-black text-slate-900">
                          {formatCurrency(prod.price)}
                          <span className="text-[10px] font-normal text-slate-500"> / {prod.unit}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Stepper */}
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => setCustomQuantities((prev) => ({ ...prev, [prod.id]: Math.max(1, currentQty - 1) }))}
                          className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-10 text-center text-xs font-black text-slate-900">{currentQty}</span>
                        <button
                          type="button"
                          onClick={() => setCustomQuantities((prev) => ({ ...prev, [prod.id]: currentQty + 1 }))}
                          className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAddProductToCart(prod, estQty)}
                        className="font-bold text-xs"
                        leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REQUEST QUOTE FOR NON-DELIVERABLES (Phase 17)
         ======================================================== */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase text-brand-orange-600 tracking-wider">
                  Direct Trade Quotation
                </span>
                <h3 className="text-lg font-black text-slate-900">Request Quote for {quoteCategory}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuoteModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quoteSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="text-base font-black text-slate-900">Quotation Submitted!</h4>
                <p className="text-xs text-slate-500">
                  Our engineering representative will contact you with wholesale pricing.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitQuote} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={quoteForm.name}
                    onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    value={quoteForm.phone}
                    onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={quoteForm.email}
                    onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Project Notes / Quantity Requirements</label>
                  <textarea
                    rows={3}
                    placeholder={`e.g. Need 4,000 AAC blocks delivered to ${selectedCity} site.`}
                    value={quoteForm.notes}
                    onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs text-slate-900"
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" variant="primary" size="md" className="w-full font-bold">
                    Submit Quotation Request
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: SAVE PROJECT (Phase 18)
         ======================================================== */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Save Construction Project</h3>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Save your current estimate, quality overrides, and material specs so you can reopen them anytime.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Project Name</label>
              <input
                type="text"
                value={saveProjectName}
                onChange={(e) => setSaveProjectName(e.target.value)}
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <Button variant="primary" size="md" onClick={handleSaveProject} className="flex-1 font-bold">
                Save Estimate
              </Button>
              <Button variant="outline" size="md" onClick={() => setIsSaveModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          DRAWER: SAVED PROJECTS LIST (Phase 18)
         ======================================================== */}
      {isSavedProjectsDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 sm:p-8 space-y-6 overflow-y-auto animate-in slide-in-from-right duration-200 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-brand-orange-500" />
                  <h3 className="text-lg font-black text-slate-900">Saved Projects</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSavedProjectsDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {savedProjects.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Bookmark className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs">No saved construction projects yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedProjects.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-slate-900">{p.projectName}</h4>
                          <span className="text-[10px] text-slate-500">
                            {p.input.city}, {p.input.state} · {p.input.builtUpArea} {p.input.areaUnit === 'SQ_FT' ? 'sq.ft' : 'sq.m'}
                          </span>
                        </div>
                        <span className="text-xs font-black text-brand-blue-900">
                          {formatCurrency(p.resultSnapshot.summary.totalEstimatedCost)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleLoadProject(p)}
                          className="text-xs font-bold text-brand-orange-600 hover:underline"
                        >
                          Load in Calculator &rarr;
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(p.id)}
                          className="text-xs text-rose-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={() => setIsSavedProjectsDrawerOpen(false)}
              className="w-full text-xs font-bold"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
