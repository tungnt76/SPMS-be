import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ChuongTrinhDaoTao')
export class ChuongTrinhDaoTaoEntity {
  @PrimaryGeneratedColumn()
  ID: number;

  @ApiProperty()
  @Column()
  MaCTDT: string;

  @ApiProperty()
  @Column()
  LoaiHinh: string;

  @ApiProperty()
  @Column()
  Ten: string;

  @ApiProperty()
  @Column()
  TrinhDo: string;

  @ApiProperty()
  @Column({ default: 0 })
  TongTinChi: number;

  @ApiProperty()
  @Column()
  DoiTuong: string;

  @ApiProperty()
  @Column()
  QuiTrinhDaoTao: string;

  @ApiProperty()
  @Column()
  DieuKienTotNghiep: string;
}