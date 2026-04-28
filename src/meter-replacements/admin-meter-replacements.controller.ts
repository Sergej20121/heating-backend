import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { MeterReplacementsService } from './meter-replacements.service';
import { UpdateMeterReplacementStatusDto } from './update-meter-replacement-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/meter-replacements')
export class AdminMeterReplacementsController {
  constructor(private readonly meterReplacementsService: MeterReplacementsService) {}

  @Get()
  findAll() {
    return this.meterReplacementsService.findAllAdmin();
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateMeterReplacementStatusDto,
  ) {
    return this.meterReplacementsService.updateStatusAdmin(id, dto);
  }
}
