import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { MeterReplacementsService } from './meter-replacements.service';
import { CreateMeterReplacementDto } from './create-meter-replacement.dto';

@UseGuards(JwtAuthGuard)
@Controller('meter-replacements')
export class MeterReplacementsController {
  constructor(private readonly meterReplacementsService: MeterReplacementsService) {}

  @Post()
  create(
    @CurrentUser() user: { sub: string; phone: string },
    @Body() dto: CreateMeterReplacementDto,
  ) {
    return this.meterReplacementsService.create(user.sub, dto);
  }

  @Get()
  findMy(@CurrentUser() user: { sub: string; phone: string }) {
    return this.meterReplacementsService.findMy(user.sub);
  }

  @Get(':id')
  findOneMy(
    @CurrentUser() user: { sub: string; phone: string },
    @Param('id') id: string,
  ) {
    return this.meterReplacementsService.findOneMy(user.sub, id);
  }
}
