import { Controller, Get, Param, Query, Post } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { VaultsService, FindAllVaultsOptions } from './vaults.service';

@Controller('vaults')
export class VaultsController {
  constructor(private readonly vaultsService: VaultsService) {}

  @Get()
  @ApiQuery({ name: 'strategyType', required: false, type: String })
  @ApiQuery({ name: 'owner', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: String })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['tvl', 'apy', 'createdAt'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  findAll(
    @Query('strategyType') strategyType?: string,
    @Query('owner') owner?: string,
    @Query('isActive') isActive?: string,
    @Query('sortBy') sortBy?: 'tvl' | 'apy' | 'createdAt',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const options: FindAllVaultsOptions = {
      strategyType,
      owner,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      sortBy: sortBy || 'tvl',
      sortOrder: sortOrder || 'desc',
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    };

    return this.vaultsService.findAll(options);
  }

  @Get('stats')
  getStats() {
    return this.vaultsService.getVaultStats();
  }

  @Get('owner/:address')
  getByOwner(@Param('address') address: string) {
    return this.vaultsService.getVaultsByOwner(address);
  }

  @Post('sync/:id')
  syncVaultTVL(@Param('id') id: string) {
    return this.vaultsService.triggerVaultTVLSync(id);
  }

  @Post('sync-all')
  syncAllVaults() {
    return this.vaultsService.syncAllVaultsTVL();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vaultsService.findOne(id);
  }
}
