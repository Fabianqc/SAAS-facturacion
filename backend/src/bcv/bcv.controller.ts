import { Controller, Get, Post } from '@nestjs/common';
import { BcvService } from './bcv.service';

@Controller('bcv')
export class BcvController {
  constructor(private readonly bcvService: BcvService) {}

  @Get('current')
  async getCurrentRate() {
    return this.bcvService.getCurrentRate();
  }

  @Get('history')
  async getRateHistory() {
    return this.bcvService.getRateHistory();
  }

  @Post('sync')
  async syncRate() {
    return this.bcvService.syncBcvRateSmart();
  }
}
