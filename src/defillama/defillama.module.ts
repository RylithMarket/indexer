import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DefiLlamaService } from './defillama.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  providers: [DefiLlamaService],
  exports: [DefiLlamaService],
})
export class DefiLlamaModule {}
