import { Module } from '@nestjs/common';
import { HoatDongDanhGiaService } from './hoat-dong-danh-gia.service';
import { HoatDongDanhGiaController } from './hoat-dong-danh-gia.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HoatDongDanhGiaEntity } from './entity/hoat-dong-danh-gia.entity';
import { LoaiDanhGiaModule } from 'loai-danh-gia/loai-danh-gia.module';
import { SyllabusModule } from 'syllabus/syllabus.module';
import { ChuanDauRaMonHocModule } from 'chuan-dau-ra-mon-hoc/chuan-dau-ra-mon-hoc.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HoatDongDanhGiaEntity]),
    LoaiDanhGiaModule,
    SyllabusModule,
    ChuanDauRaMonHocModule
  ],
  controllers: [HoatDongDanhGiaController],
  providers: [HoatDongDanhGiaService]
})
export class HoatDongDanhGiaModule {}