import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Trash2,
  ShoppingCart,
  Calendar,
  MapPin,
  CheckCircle2,
  Building2,
  ArrowRight
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { formatCurrency } from '@buildora/utils';
import { ProjectType } from '@buildora/types';
import { Button } from '../components/ui/Button';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    projects,
    createProject,
    deleteProject,
    removeMaterialFromProject,
    addProjectMaterialsToCart
  } = useProjectStore();

  const [isCreating, setIsCreating] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ProjectType>('HOME_RENOVATION');
  const [location, setLocation] = useState('Indiranagar, Bengaluru');
  const [pincode, setPincode] = useState('560038');
  const [budget, setBudget] = useState(250000);
  const [notes, setNotes] = useState('');

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newProj = createProject({
      title,
      type,
      location,
      pincode,
      startDate: new Date().toISOString().split('T')[0],
      budget,
      notes
    });

    setSelectedProjectId(newProj.id);
    setIsCreating(false);
    setTitle('');
    setNotes('');
  };

  const handleAddToCart = (projId: string) => {
    const count = addProjectMaterialsToCart(projId);
    if (count > 0) {
      setSuccessToast(`Added ${count} material items to your cart!`);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Project Shopping Lists</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize materials by renovation job, track site budgets, and dispatch complete bills of materials with one click.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreating(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Project
        </Button>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successToast}
          </span>
          <button onClick={() => navigate('/cart')} className="underline font-bold">
            View Cart &rarr;
          </button>
        </div>
      )}

      {/* Create Project Modal/Form */}
      {isCreating && (
        <form onSubmit={handleCreateProject} className="bg-white p-6 rounded-2xl border border-brand-blue-200 shadow-card space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">Create New Project Site</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1">Project Name</label>
              <input
                type="text"
                placeholder="e.g. Whitefield Villa Extension"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Project Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full p-2 border rounded"
              >
                <option value="NEW_HOUSE_CONSTRUCTION">New House Construction</option>
                <option value="HOME_RENOVATION">Home Renovation</option>
                <option value="BATHROOM_RENOVATION">Bathroom Renovation</option>
                <option value="KITCHEN_RENOVATION">Kitchen Renovation</option>
                <option value="PAINTING">Painting &amp; Polishing</option>
                <option value="ELECTRICAL_WORK">Electrical Work</option>
                <option value="PLUMBING">Plumbing Work</option>
                <option value="FLOORING">Flooring Work</option>
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">Site Location &amp; Pincode</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex-1 p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-24 p-2 border rounded"
                />
              </div>
            </div>
            <div>
              <label className="font-bold block mb-1">Estimated Materials Budget (₹)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full p-2 border rounded font-semibold"
              />
            </div>
          </div>
          <div>
            <label className="font-bold block mb-1">Project Notes</label>
            <textarea
              placeholder="Add contractor notes, site gate details, or material requirements..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border rounded h-20"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" type="submit">
              Save Project
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Projects Tabs & Details */}
      {projects.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border text-center space-y-3">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800">No Projects Created</h3>
          <p className="text-xs text-slate-500">
            Create your first project list to group materials for your house or renovation job.
          </p>
          <Button variant="primary" size="sm" onClick={() => setIsCreating(true)}>
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Projects List Selector */}
          <div className="lg:col-span-4 space-y-2">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => setSelectedProjectId(proj.id)}
                className={`cursor-pointer p-4 rounded-2xl border transition-all text-xs space-y-1.5 ${
                  selectedProjectId === proj.id
                    ? 'border-brand-blue-600 bg-white shadow-card ring-1 ring-brand-blue-600'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm truncate">{proj.title}</span>
                  <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-600">
                    {proj.materials.length} items
                  </span>
                </div>
                <div className="text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-brand-orange-500" />
                  <span>{proj.location} ({proj.pincode})</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Budget: <strong className="text-slate-800">{formatCurrency(proj.budget)}</strong>
                </div>
              </div>
            ))}
          </div>

          {/* Active Project Materials Manifest */}
          {activeProject && (
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-900">{activeProject.title}</h2>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Type: <strong className="text-slate-800">{activeProject.type.replace(/_/g, ' ')}</strong> &bull;{' '}
                    Budget: <strong className="text-emerald-700">{formatCurrency(activeProject.budget)}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAddToCart(activeProject.id)}
                    disabled={activeProject.materials.length === 0}
                    leftIcon={<ShoppingCart className="w-4 h-4" />}
                  >
                    Add All to Cart
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('Delete this project list?')) {
                        deleteProject(activeProject.id);
                      }
                    }}
                    className="text-red-600 hover:bg-red-50 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Notes */}
              {activeProject.notes && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100 italic">
                  Note: {activeProject.notes}
                </div>
              )}

              {/* Materials Table */}
              {activeProject.materials.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <p>No materials added to this project list yet.</p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/products')}>
                    Browse Catalogue &amp; Add Materials
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activeProject.materials.map((mat) => (
                    <div key={mat.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={mat.image}
                          alt={mat.productName}
                          className="w-12 h-12 rounded-lg object-cover bg-slate-50 border flex-shrink-0"
                        />
                        <div className="truncate">
                          <div className="font-bold text-slate-900 truncate">{mat.productName}</div>
                          <div className="text-[11px] text-slate-400">
                            Brand: {mat.brand} &bull; Qty: {mat.estimatedQuantity} ({mat.unit})
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">{formatCurrency(mat.totalCost)}</span>
                        <button
                          onClick={() => removeMaterialFromProject(activeProject.id, mat.id)}
                          className="text-slate-300 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 flex justify-between items-center text-sm font-bold text-slate-900">
                    <span>Estimated Materials Cost:</span>
                    <span className="text-brand-blue-900 text-base">
                      {formatCurrency(
                        activeProject.materials.reduce((acc, curr) => acc + curr.totalCost, 0)
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
