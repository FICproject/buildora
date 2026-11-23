import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { dbStore } from '../../../database/store';
import {
  calculateFullConstructionEstimate,
  SUPPORTED_INDIAN_LOCATIONS,
  PROPERTY_TYPE_MULTIPLIERS,
  STAGE_MULTIPLIERS,
  GLOBAL_BASE_RATES,
  CATEGORY_BASE_CONFIG
} from '@buildora/utils';
import {
  ConstructionCalculatorInput,
  ConstructionCalculatorResult,
  SavedConstructionProject,
  ConstructionQuotationRequest
} from '@buildora/types';

@Injectable()
export class ConstructionCalculatorService {
  /**
   * Return master configuration, supported locations, categories, and rates
   */
  getConfig() {
    return {
      success: true,
      locations: SUPPORTED_INDIAN_LOCATIONS,
      propertyTypes: Object.entries(PROPERTY_TYPE_MULTIPLIERS).map(([key, val]) => ({
        id: key,
        name: val.name,
        multiplier: val.multiplier
      })),
      stages: Object.entries(STAGE_MULTIPLIERS).map(([key, val]) => ({
        id: key,
        name: val.name,
        multiplier: val.multiplier,
        relevantCategories: val.relevantCategories
      })),
      baseRates: GLOBAL_BASE_RATES,
      categories: Object.entries(CATEGORY_BASE_CONFIG).map(([key, val]) => ({
        key,
        name: val.name,
        iconName: val.iconName,
        weightPercentage: val.weightPercentage,
        unit: val.unit,
        color: val.color,
        isDeliverable: val.isDeliverable,
        categorySlug: val.categorySlug,
        recommendedProductSlug: val.recommendedProductSlug,
        specs: val.specs
      }))
    };
  }

  /**
   * Perform calculation with validation
   */
  calculate(input: ConstructionCalculatorInput): { success: boolean; data: ConstructionCalculatorResult } {
    if (!input) {
      throw new BadRequestException('Calculation input payload is required.');
    }
    if (!input.builtUpArea || input.builtUpArea <= 0) {
      throw new BadRequestException('Built-up area must be a positive number greater than 0.');
    }
    if (!input.state || !input.city) {
      throw new BadRequestException('State and City are required.');
    }

    const result = calculateFullConstructionEstimate({
      state: input.state || 'Karnataka',
      city: input.city || 'Bengaluru',
      builtUpArea: Number(input.builtUpArea) || 1200,
      areaUnit: input.areaUnit || 'SQ_FT',
      propertyType: input.propertyType || 'INDEPENDENT_HOUSE',
      floors: Number(input.floors) || 2,
      stage: input.stage || 'FULL_CONSTRUCTION',
      globalQuality: input.globalQuality || 'STANDARD',
      categoryOverrides: input.categoryOverrides || {},
      excludedCategories: input.excludedCategories || [],
      advancedDetails: input.advancedDetails || {}
    });

    return {
      success: true,
      data: result
    };
  }

  /**
   * Get all saved construction projects
   */
  getProjects(userId?: string): { success: boolean; count: number; data: SavedConstructionProject[] } {
    const list = userId
      ? dbStore.constructionProjects.filter((p) => p.userId === userId)
      : dbStore.constructionProjects;

    return {
      success: true,
      count: list.length,
      data: list
    };
  }

  /**
   * Get project by ID
   */
  getProjectById(id: string): { success: boolean; data: SavedConstructionProject } {
    const project = dbStore.constructionProjects.find((p) => p.id === id);
    if (!project) {
      throw new NotFoundException(`Construction project with ID ${id} not found.`);
    }
    return {
      success: true,
      data: project
    };
  }

  /**
   * Save new project estimate
   */
  saveProject(payload: {
    projectName: string;
    input: ConstructionCalculatorInput;
    userId?: string;
  }): { success: boolean; message: string; data: SavedConstructionProject } {
    if (!payload.projectName || !payload.projectName.trim()) {
      throw new BadRequestException('Project name is required.');
    }
    if (!payload.input || !payload.input.builtUpArea) {
      throw new BadRequestException('Valid calculation input is required.');
    }

    const calculationResult = calculateFullConstructionEstimate(payload.input);

    const newProject: SavedConstructionProject = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: payload.userId || 'usr-customer-1',
      projectName: payload.projectName.trim(),
      input: payload.input,
      resultSnapshot: calculationResult,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dbStore.constructionProjects.unshift(newProject);

    return {
      success: true,
      message: 'Construction project estimate saved successfully.',
      data: newProject
    };
  }

  /**
   * Update existing project
   */
  updateProject(
    id: string,
    payload: {
      projectName?: string;
      input?: ConstructionCalculatorInput;
    }
  ): { success: boolean; message: string; data: SavedConstructionProject } {
    const projectIndex = dbStore.constructionProjects.findIndex((p) => p.id === id);
    if (projectIndex === -1) {
      throw new NotFoundException(`Construction project with ID ${id} not found.`);
    }

    const current = dbStore.constructionProjects[projectIndex];
    const updatedInput = payload.input || current.input;
    const updatedSnapshot = payload.input ? calculateFullConstructionEstimate(payload.input) : current.resultSnapshot;

    const updatedProject: SavedConstructionProject = {
      ...current,
      projectName: payload.projectName?.trim() || current.projectName,
      input: updatedInput,
      resultSnapshot: updatedSnapshot,
      updatedAt: new Date().toISOString()
    };

    dbStore.constructionProjects[projectIndex] = updatedProject;

    return {
      success: true,
      message: 'Construction project updated successfully.',
      data: updatedProject
    };
  }

  /**
   * Delete project
   */
  deleteProject(id: string): { success: boolean; message: string } {
    const projectIndex = dbStore.constructionProjects.findIndex((p) => p.id === id);
    if (projectIndex === -1) {
      throw new NotFoundException(`Construction project with ID ${id} not found.`);
    }

    dbStore.constructionProjects.splice(projectIndex, 1);

    return {
      success: true,
      message: 'Construction project deleted successfully.'
    };
  }

  /**
   * Create quotation request for non-deliverable materials or full turnkey
   */
  createQuotationRequest(data: {
    customerName: string;
    phone: string;
    email?: string;
    state: string;
    city: string;
    builtUpArea: number;
    categoriesRequested: string[];
    notes?: string;
  }): { success: boolean; message: string; data: ConstructionQuotationRequest } {
    if (!data.customerName || !data.phone) {
      throw new BadRequestException('Customer name and phone number are required.');
    }
    if (!data.categoriesRequested || data.categoriesRequested.length === 0) {
      throw new BadRequestException('At least one material category must be requested.');
    }

    const quote: ConstructionQuotationRequest = {
      id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      customerName: data.customerName.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim(),
      state: data.state,
      city: data.city,
      builtUpArea: Number(data.builtUpArea) || 1200,
      categoriesRequested: data.categoriesRequested,
      notes: data.notes?.trim(),
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    dbStore.constructionQuotes.unshift(quote);

    return {
      success: true,
      message: 'Quotation request submitted successfully. Our engineering partner will contact you shortly.',
      data: quote
    };
  }
}
