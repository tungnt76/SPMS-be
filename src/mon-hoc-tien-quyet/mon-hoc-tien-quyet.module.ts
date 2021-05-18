import { Module } from '@nestjs/common';
import { MonHocTienQuyetService } from './mon-hoc-tien-quyet.service';
import { MonHocTienQuyetController } from './mon-hoc-tien-quyet.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonHocTienQuyetEntity } from './entity/mon-hoc-tien-quyet.entity';
import { RedisCacheModule } from 'cache/redisCache.module';
import { RolesModule } from 'roles/roles.module';

@Module({
  imports: [TypeOrmModule.forFeature([MonHocTienQuyetEntity]), RedisCacheModule, RolesModule],
  controllers: [MonHocTienQuyetController],
  providers: [MonHocTienQuyetService],
  exports: [MonHocTienQuyetService]
})
export class MonHocTienQuyetModule {}
