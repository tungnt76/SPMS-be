import { Module } from '@nestjs/common';
import { LoaiDanhGiaService } from './loai-danh-gia.service';
import { LoaiDanhGiaController } from './loai-danh-gia.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoaiDanhGiaEntity } from './entity/loai-danh-gia.entity';
import { SyllabusModule } from 'syllabus/syllabus.module';
import { ChuanDauRaMonHocModule } from 'chuan-dau-ra-mon-hoc/chuan-dau-ra-mon-hoc.module';
import { RedisCacheModule } from 'cache/redisCache.module';
import { PermissionModule } from 'permission/permission.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoaiDanhGiaEntity]),
    SyllabusModule,
    ChuanDauRaMonHocModule,
    RedisCacheModule,
    PermissionModule
  ],
  controllers: [LoaiDanhGiaController],
  providers: [LoaiDanhGiaService],
  exports: [LoaiDanhGiaService]
})
export class LoaiDanhGiaModule {}
