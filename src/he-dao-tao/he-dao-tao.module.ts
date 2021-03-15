import { Module } from '@nestjs/common';
import { HeDaotaoService } from './he-dao-tao.service';
import { HeDaotaoController } from './he-dao-tao.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeDaoTaoEntity } from './entity/type-of-education.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HeDaoTaoEntity])],
  controllers: [HeDaotaoController],
  providers: [HeDaotaoService],
  exports: [HeDaotaoService]
})
export class HeDaotaoModule {}