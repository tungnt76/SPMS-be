import { Module } from '@nestjs/common';
import { LoaiKhoiKienThucService } from './loai-khoi-kien-thuc.service';
import { LoaiKhoiKienThucController } from './loai-khoi-kien-thuc.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoaiKhoiKienThucEntity } from './entity/type-of-knowledge-block.entity';
import { RedisCacheModule } from 'cache/redisCache.module';
import { RolesModule } from 'roles/roles.module';

@Module({
  imports: [TypeOrmModule.forFeature([LoaiKhoiKienThucEntity]), RedisCacheModule, RolesModule],
  controllers: [LoaiKhoiKienThucController],
  providers: [LoaiKhoiKienThucService],
  exports: [LoaiKhoiKienThucService]
})
export class LoaiKhoiKienThucModule {}
