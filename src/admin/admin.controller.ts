import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminService } from './admin.service';
import { CreateUserByAdminDto } from './dto.create-user.dto';
import { CreateMeterByAdminDto } from './dto.create-meter.dto';
import { CreateReadingByAdminDto } from './dto.create-reading.dto';
import { UpdateMeterByAdminDto } from './dto.update-meter.dto';
import { UpdateReadingByAdminDto } from './dto.update-reading.dto';
import { UpsertHeatingSettingDto } from './dto.upsert-heating-setting.dto';
import { GenerateHeatingPaymentsDto } from './dto.generate-heating-payments.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Post('users')
  createUser(@Body() dto: CreateUserByAdminDto) {
    return this.adminService.createUser(dto);
  }

  @Patch('users/:id/block')
  blockUser(@Param('id') id: string) {
    return this.adminService.blockUser(id);
  }

  @Patch('users/:id/activate')
  activateUser(@Param('id') id: string) {
    return this.adminService.activateUser(id);
  }

  @Get('meters')
  getAllMeters() {
    return this.adminService.getAllMeters();
  }

  @Post('meters')
  createMeter(@Body() dto: CreateMeterByAdminDto) {
    return this.adminService.createMeter(dto);
  }

  @Patch('meters/:id')
  updateMeter(@Param('id') id: string, @Body() dto: UpdateMeterByAdminDto) {
    return this.adminService.updateMeter(id, dto);
  }

  @Patch('meters/:id/deactivate')
  deactivateMeter(@Param('id') id: string) {
    return this.adminService.deactivateMeter(id);
  }

  @Patch('meters/:id/activate')
  activateMeter(@Param('id') id: string) {
    return this.adminService.activateMeter(id);
  }

  @Patch('meters/:id/delete')
  deleteMeter(@Param('id') id: string) {
    return this.adminService.deleteMeter(id);
  }

  @Get('readings')
  getAllReadings() {
    return this.adminService.getAllReadings();
  }

  @Post('readings')
  createReading(@Body() dto: CreateReadingByAdminDto) {
    return this.adminService.createReading(dto);
  }

  @Patch('readings/:id')
  updateReading(@Param('id') id: string, @Body() dto: UpdateReadingByAdminDto) {
    return this.adminService.updateReading(id, dto);
  }

  @Get('heating-settings/:billingMonth')
  getHeatingSetting(@Param('billingMonth') billingMonth: string) {
    return this.adminService.getHeatingSetting(billingMonth);
  }

  @Post('heating-settings')
  upsertHeatingSetting(@Body() dto: UpsertHeatingSettingDto) {
    return this.adminService.upsertHeatingSetting(dto);
  }

  @Post('payments/generate-heating')
  generateHeatingPayments(@Body() dto: GenerateHeatingPaymentsDto) {
    return this.adminService.generateHeatingPayments(dto);
  }

  @Get('heating-calculations/:billingMonth')
  getHeatingCalculations(@Param('billingMonth') billingMonth: string) {
    return this.adminService.getHeatingCalculations(billingMonth);
  }

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }
}