import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { SealRequestsService } from './seal-requests.service';
import { UpdateSealRequestStatusDto } from './update-seal-request-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/seal-requests')
export class AdminSealRequestsController {
  constructor(private readonly sealRequestsService: SealRequestsService) {}

  @Get()
  findAll() {
    return this.sealRequestsService.findAllAdmin();
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSealRequestStatusDto,
  ) {
    return this.sealRequestsService.updateStatusAdmin(id, dto);
  }
}
