import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query
} from '@nestjs/common';
import { ConstructionCalculatorService } from '../services/construction-calculator.service';
import { ConstructionCalculatorInput } from '@buildora/types';

@Controller('construction-calculator')
export class ConstructionCalculatorController {
  constructor(private readonly calculatorService: ConstructionCalculatorService) {}

  @Get('config')
  getConfig() {
    return this.calculatorService.getConfig();
  }

  @Post('calculate')
  calculate(@Body() body: ConstructionCalculatorInput) {
    return this.calculatorService.calculate(body);
  }

  @Get('projects')
  getProjects(@Query('userId') userId?: string) {
    return this.calculatorService.getProjects(userId);
  }

  @Get('projects/:id')
  getProjectById(@Param('id') id: string) {
    return this.calculatorService.getProjectById(id);
  }

  @Post('projects')
  saveProject(
    @Body()
    body: {
      projectName: string;
      input: ConstructionCalculatorInput;
      userId?: string;
    }
  ) {
    return this.calculatorService.saveProject(body);
  }

  @Put('projects/:id')
  updateProject(
    @Param('id') id: string,
    @Body()
    body: {
      projectName?: string;
      input?: ConstructionCalculatorInput;
    }
  ) {
    return this.calculatorService.updateProject(id, body);
  }

  @Delete('projects/:id')
  deleteProject(@Param('id') id: string) {
    return this.calculatorService.deleteProject(id);
  }

  @Post('quotes')
  createQuotation(
    @Body()
    body: {
      customerName: string;
      phone: string;
      email?: string;
      state: string;
      city: string;
      builtUpArea: number;
      categoriesRequested: string[];
      notes?: string;
    }
  ) {
    return this.calculatorService.createQuotationRequest(body);
  }
}
