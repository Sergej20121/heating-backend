import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { MetersService } from './meters.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateMeterDto } from './create-meter.dto';

@UseGuards(JwtAuthGuard)
@Controller('meters')
export class MetersController {
  constructor(private readonly metersService: MetersService) {}

  @Post()
  create(
    @CurrentUser() user: { sub: string; phone: string },
    @Body() dto: CreateMeterDto,
  ) {
    return this.metersService.create(user.sub, dto);
  }

  @Get()
  findAllMy(@CurrentUser() user: { sub: string; phone: string }) {
    return this.metersService.findAllMy(user.sub);
  }

  @Get(':id')
  findOneMy(
    @CurrentUser() user: { sub: string; phone: string },
    @Param('id') id: string,
  ) {
    return this.metersService.findOneMy(user.sub, id);
  }

  @Delete(':id')
  deactivate(
    @CurrentUser() user: { sub: string; phone: string },
    @Param('id') id: string,
  ) {
    return this.metersService.deactivate(user.sub, id);
  }
}
