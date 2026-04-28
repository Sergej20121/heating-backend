import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SealRequestsService } from './seal-requests.service';
import { CreateSealRequestDto } from './create-seal-request.dto';

@UseGuards(JwtAuthGuard)
@Controller('seal-requests')
export class SealRequestsController {
  constructor(private readonly sealRequestsService: SealRequestsService) {}

  @Post()
  create(
    @CurrentUser() user: { sub: string; phone: string },
    @Body() dto: CreateSealRequestDto,
  ) {
    return this.sealRequestsService.create(user.sub, dto);
  }

  @Get()
  findMy(@CurrentUser() user: { sub: string; phone: string }) {
    return this.sealRequestsService.findMy(user.sub);
  }

  @Get(':id')
  findOneMy(
    @CurrentUser() user: { sub: string; phone: string },
    @Param('id') id: string,
  ) {
    return this.sealRequestsService.findOneMy(user.sub, id);
  }
}
