import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  Plus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { MaterialEstimators, formatCurrency } from '@buildora/utils';
import { SEED_PRODUCTS } from '@buildora/constants';
import { useCartStore } from '../store/useCartStore';
import { Button } from '../components/ui/Button';

export const MaterialEstimatorPage: React.FC = () => {
  const navigate = useNavigate();
  const { addItem } = useCartStore();

  const [activeTool, setActiveTool] = useState<'CEMENT' | 'PAINT' | 'TILES' | 'WATERPROOF' | 'PLYWOOD'>('CEMENT');

  // Cement inputs
  const [slabLength, setSlabLength] = useState(30);
  const [slabWidth, setSlabWidth] = useState(20);
  const [slabThickness, setSlabThickness] = useState(5);

  // Paint inputs
  const [carpetArea, setCarpetArea] = useState(1200);
  const [paintCoats, setPaintCoats] = useState(2);

  // Tile inputs
  const [tileRoomLength, setTileRoomLength] = useState(16);
  const [tileRoomWidth, setTileRoomWidth] = useState(14);
  const [tileSize, setTileSize] = useState(24); // 24" x 24" (2x2 ft)

  // Waterproof inputs
  const [terraceLength, setTerraceLength] = useState(40);
  const [terraceWidth, setTerraceWidth] = useState(25);

  // Plywood inputs
  const [wardrobeWidth, setWardrobeWidth] = useState(8);
  const [wardrobeHeight, setWardrobeHeight] = useState(7);

  // Live calculation results
  const cementCalc = MaterialEstimators.calculateConcrete(slabLength, slabWidth, slabThickness);
  const paintCalc = MaterialEstimators.calculatePaint(carpetArea, paintCoats);
  const tileCalc = MaterialEstimators.calculateTiles(tileRoomLength, tileRoomWidth, tileSize);
  const waterproofCalc = MaterialEstimators.calculateWaterproofing(terraceLength, terraceWidth);
  const plywoodCalc = MaterialEstimators.calculatePlywood(wardrobeWidth, wardrobeHeight);

  const [addedAlert, setAddedAlert] = useState<string | null>(null);

  const handleAddCementToCart = () => {
    const cementProd = SEED_PRODUCTS.find((p) => p.slug.includes('ultratech-super')) || SEED_PRODUCTS[0];
    addItem(cementProd, cementCalc.cementBags);
    setAddedAlert(`Added ${cementCalc.cementBags} bags of UltraTech Cement to cart!`);
    setTimeout(() => setAddedAlert(null), 3000);
  };

  const handleAddPaintToCart = () => {
    const paintProd = SEED_PRODUCTS.find((p) => p.slug.includes('asian-paints')) || SEED_PRODUCTS[0];
    const bucketsNeeded = Math.ceil(paintCalc.paintLitres / 20);
    addItem(paintProd, bucketsNeeded);
    setAddedAlert(`Added ${bucketsNeeded} bucket(s) of Asian Paints Ultima to cart!`);
    setTimeout(() => setAddedAlert(null), 3000);
  };

  const handleAddTilesToCart = () => {
    const tileProd = SEED_PRODUCTS.find((p) => p.slug.includes('kajaria')) || SEED_PRODUCTS[0];
    const adhesiveProd = SEED_PRODUCTS.find((p) => p.slug.includes('roff')) || SEED_PRODUCTS[1];
    addItem(tileProd, tileCalc.tileBoxes);
    addItem(adhesiveProd, tileCalc.adhesiveBags20Kg);
    setAddedAlert(`Added ${tileCalc.tileBoxes} boxes of Kajaria Tiles and ${tileCalc.adhesiveBags20Kg} bags of adhesive!`);
    setTimeout(() => setAddedAlert(null), 3000);
  };

  const handleAddWaterproofingToCart = () => {
    const drFixit = SEED_PRODUCTS.find((p) => p.slug.includes('dr-fixit')) || SEED_PRODUCTS[0];
    const cansNeeded = Math.ceil(waterproofCalc.waterproofingCompoundKg / 5);
    addItem(drFixit, cansNeeded);
    setAddedAlert(`Added ${cansNeeded} cans (5L) of Dr. Fixit LW+ to cart!`);
    setTimeout(() => setAddedAlert(null), 3000);
  };

  const handleAddPlywoodToCart = () => {
    const ply = SEED_PRODUCTS.find((p) => p.slug.includes('greenply')) || SEED_PRODUCTS[0];
    const fevicol = SEED_PRODUCTS.find((p) => p.slug.includes('fevicol')) || SEED_PRODUCTS[1];
    addItem(ply, plywoodCalc.plywoodSheets8x4);
    addItem(fevicol, Math.ceil(plywoodCalc.fevicolKg / 5));
    setAddedAlert(`Added ${plywoodCalc.plywoodSheets8x4} sheets of Greenply Marine Plywood to cart!`);
    setTimeout(() => setAddedAlert(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-brand-orange-100 text-brand-orange-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> Construction Quantity Calculators
        </div>
        <h1 className="text-3xl font-black text-slate-900">
          Construction Material Estimator
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Calculate precise quantities for cement, paint, floor tiles, terrace waterproofing, and plywood with industry wastage factors.
        </p>
      </div>

      {/* Calculator Mode Switcher */}
      <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl max-w-3xl mx-auto text-xs font-bold">
        {[
          { key: 'CEMENT', label: 'Cement & Concrete Slab' },
          { key: 'PAINT', label: 'Wall Paint & Primer' },
          { key: 'TILES', label: 'Vitrified Tiles & Adhesive' },
          { key: 'WATERPROOF', label: 'Terrace Waterproofing' },
          { key: 'PLYWOOD', label: 'Wardrobe Plywood' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTool(tab.key as any)}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTool === tab.key
                ? 'bg-brand-blue-900 text-white shadow'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {addedAlert && (
        <div className="max-w-xl mx-auto p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {addedAlert}
          </span>
          <button
            onClick={() => navigate('/cart')}
            className="text-emerald-900 underline font-bold"
          >
            Go to Cart &rarr;
          </button>
        </div>
      )}

      {/* 1. Cement Calculator */}
      {activeTool === 'CEMENT' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-card">
          <div className="space-y-5">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
              Slab &amp; RCC Casting Dimensions
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Slab Length (Feet): {slabLength} ft
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={slabLength}
                onChange={(e) => setSlabLength(Number(e.target.value))}
                className="w-full accent-brand-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Slab Width (Feet): {slabWidth} ft
              </label>
              <input
                type="range"
                min={10}
                max={80}
                value={slabWidth}
                onChange={(e) => setSlabWidth(Number(e.target.value))}
                className="w-full accent-brand-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Slab Thickness (Inches): {slabThickness} inches (Standard 5")
              </label>
              <input
                type="range"
                min={4}
                max={9}
                value={slabThickness}
                onChange={(e) => setSlabThickness(Number(e.target.value))}
                className="w-full accent-brand-blue-900"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-500 space-y-1">
              <div className="font-bold text-slate-700 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-brand-blue-800" /> Standard Engineering Formula:
              </div>
              <p>M20 Grade Mix (1:1.5:3). Includes 5% standard concrete casting and site handling wastage factor.</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Estimated Material Requirements
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400">Total Slab Area</span>
                  <div className="text-lg font-black text-slate-900">{cementCalc.areaSqFt} sq.ft</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400">Wet Concrete Volume</span>
                  <div className="text-lg font-black text-slate-900">{cementCalc.volumeCuM} cu.m</div>
                </div>
                <div className="bg-white p-3 rounded-xl border-2 border-brand-blue-500 col-span-2">
                  <span className="text-brand-blue-900 font-bold">Cement Bags Required (50kg)</span>
                  <div className="text-2xl font-black text-brand-blue-900">{cementCalc.cementBags} Bags</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">UltraTech Super PPC Grade Recommended</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400">Manufactured Sand (M-Sand)</span>
                  <div className="text-base font-black text-slate-900">{cementCalc.sandTons} Tons</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400">Aggregate (20mm Jelly)</span>
                  <div className="text-base font-black text-slate-900">{cementCalc.aggregateTons} Tons</div>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleAddCementToCart}
              className="w-full font-bold"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add {cementCalc.cementBags} Cement Bags to Cart
            </Button>
          </div>
        </div>
      )}

      {/* 2. Paint Calculator */}
      {activeTool === 'PAINT' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-card">
          <div className="space-y-5">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
              Apartment / House Carpet Area
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Carpet Area (Sq.ft): {carpetArea} sq.ft
              </label>
              <input
                type="range"
                min={400}
                max={4000}
                step={50}
                value={carpetArea}
                onChange={(e) => setCarpetArea(Number(e.target.value))}
                className="w-full accent-brand-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Number of Emulsion Coats: {paintCoats} Coats
              </label>
              <div className="flex gap-3">
                {[1, 2, 3].map((c) => (
                  <button
                    key={c}
                    onClick={() => setPaintCoats(c)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      paintCoats === c
                        ? 'border-brand-blue-900 bg-brand-blue-50 text-brand-blue-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {c} {c === 1 ? 'Coat' : 'Coats'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Paint &amp; Primer Breakdown
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400">Total Wall Surface Area</span>
                  <div className="text-lg font-black text-slate-900">{paintCalc.wallAreaSqFt} sq.ft</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400">Acrylic Wall Putty</span>
                  <div className="text-lg font-black text-slate-900">{paintCalc.puttyKg} kg</div>
                </div>
                <div className="bg-white p-3 rounded-xl border-2 border-brand-orange-500 col-span-2">
                  <span className="text-brand-orange-600 font-bold">Emulsion Paint Volume</span>
                  <div className="text-2xl font-black text-slate-900">{paintCalc.paintLitres} Litres</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Approx {Math.ceil(paintCalc.paintLitres / 20)} x 20L Buckets</div>
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              size="lg"
              onClick={handleAddPaintToCart}
              className="w-full font-bold"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Paint to Cart
            </Button>
          </div>
        </div>
      )}

      {/* 3. Tiles Calculator */}
      {activeTool === 'TILES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-card">
          <div className="space-y-5">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
              Floor Room Dimensions
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Room Length: {tileRoomLength} ft
              </label>
              <input
                type="range"
                min={8}
                max={50}
                value={tileRoomLength}
                onChange={(e) => setTileRoomLength(Number(e.target.value))}
                className="w-full accent-brand-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Room Width: {tileRoomWidth} ft
              </label>
              <input
                type="range"
                min={8}
                max={40}
                value={tileRoomWidth}
                onChange={(e) => setTileRoomWidth(Number(e.target.value))}
                className="w-full accent-brand-blue-900"
              />
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Tiles, Boxes &amp; Polymer Adhesive
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400">Total Net Area</span>
                  <div className="text-lg font-black text-slate-900">{tileCalc.floorAreaSqFt} sq.ft</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400">Total Tiles (10% waste)</span>
                  <div className="text-lg font-black text-slate-900">{tileCalc.totalTiles} Tiles</div>
                </div>
                <div className="bg-white p-3 rounded-xl border-2 border-brand-blue-500 col-span-2">
                  <span className="text-brand-blue-900 font-bold">Boxes Required (4 Tiles/Box)</span>
                  <div className="text-2xl font-black text-brand-blue-900">{tileCalc.tileBoxes} Boxes</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 col-span-2">
                  <span className="text-slate-500">Roff Polymer Adhesive (20kg Bags)</span>
                  <div className="text-base font-black text-slate-900">{tileCalc.adhesiveBags20Kg} Bags</div>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleAddTilesToCart}
              className="w-full font-bold"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Tiles &amp; Adhesive to Cart
            </Button>
          </div>
        </div>
      )}

      {/* 4. Waterproofing Calculator */}
      {activeTool === 'WATERPROOF' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-card">
          <div className="space-y-5">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
              Terrace Roof Dimensions
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Terrace Length: {terraceLength} ft
              </label>
              <input
                type="range"
                min={15}
                max={100}
                value={terraceLength}
                onChange={(e) => setTerraceLength(Number(e.target.value))}
                className="w-full accent-brand-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Terrace Width: {terraceWidth} ft
              </label>
              <input
                type="range"
                min={10}
                max={60}
                value={terraceWidth}
                onChange={(e) => setTerraceWidth(Number(e.target.value))}
                className="w-full accent-brand-blue-900"
              />
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Waterproofing Membrane Breakdown
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400">Total Roof Area</span>
                  <div className="text-lg font-black text-slate-900">{waterproofCalc.areaSqFt} sq.ft</div>
                </div>
                <div className="bg-white p-3 rounded-xl border-2 border-emerald-600 col-span-2">
                  <span className="text-emerald-700 font-bold">Polymer Coating Compound</span>
                  <div className="text-2xl font-black text-emerald-800">
                    {waterproofCalc.waterproofingCompoundKg} kg
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Approx {Math.ceil(waterproofCalc.waterproofingCompoundKg / 5)} x 5L Cans Dr. Fixit LW+
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              size="lg"
              onClick={handleAddWaterproofingToCart}
              className="w-full font-bold"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Waterproofing to Cart
            </Button>
          </div>
        </div>
      )}

      {/* 5. Plywood Calculator */}
      {activeTool === 'PLYWOOD' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-card">
          <div className="space-y-5">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
              Wardrobe / Cabinet Dimensions
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Wardrobe Width: {wardrobeWidth} ft
              </label>
              <input
                type="range"
                min={4}
                max={20}
                value={wardrobeWidth}
                onChange={(e) => setWardrobeWidth(Number(e.target.value))}
                className="w-full accent-brand-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Wardrobe Height: {wardrobeHeight} ft
              </label>
              <input
                type="range"
                min={4}
                max={10}
                value={wardrobeHeight}
                onChange={(e) => setWardrobeHeight(Number(e.target.value))}
                className="w-full accent-brand-blue-900"
              />
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Plywood Sheets &amp; Adhesive
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400">Total Box Surface Area</span>
                  <div className="text-lg font-black text-slate-900">{plywoodCalc.totalPanelSqFt} sq.ft</div>
                </div>
                <div className="bg-white p-3 rounded-xl border-2 border-brand-blue-500 col-span-2">
                  <span className="text-brand-blue-900 font-bold">Standard 8x4 ft Sheets (19mm)</span>
                  <div className="text-2xl font-black text-brand-blue-900">
                    {plywoodCalc.plywoodSheets8x4} Sheets
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Greenply Marine BWP Grade</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 col-span-2">
                  <span className="text-slate-400">Fevicol Marine Waterproof Adhesive</span>
                  <div className="text-base font-black text-slate-900">{plywoodCalc.fevicolKg} kg</div>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleAddPlywoodToCart}
              className="w-full font-bold"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Plywood &amp; Fevicol to Cart
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
