import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { MeterReadingsService } from './meter-readings.service';
import { CreateMeterReadingDto } from './create-meter-reading.dto';

@UseGuards(JwtAuthGuard)
@Controller('meter-readings')
export class MeterReadingsController {
  constructor(private readonly meterReadingsService: MeterReadingsService) {}

  @Post()
  create(
    @CurrentUser() user: { sub: string; phone: string },
    @Body() dto: CreateMeterReadingDto,
  ) {
    return this.meterReadingsService.create(user.sub, dto);
  }

  @Get('my-meters')
  findMyMetersWithLastReading(@CurrentUser() user: { sub: string; phone: string }) {
    return this.meterReadingsService.findMyMetersWithLastReading(user.sub);
  }

  @Get('history/:meterId')
  findHistoryByMeter(
    @CurrentUser() user: { sub: string; phone: string },
    @Param('meterId') meterId: string,
  ) {
    return this.meterReadingsService.findHistoryByMeter(user.sub, meterId);
  }

  @Get('window-info')
  windowInfo() {
    return this.meterReadingsService.getSubmissionWindowInfo();
  }
}
