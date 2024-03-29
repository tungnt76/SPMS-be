import { ApiProperty } from '@nestjs/swagger';
import { ChiTietKeHoachEntity } from 'chi-tiet-ke-hoach/entity/chi-tiet-ke-hoach.entity';
import { ChiTietNganhDaoTaoEntity } from 'chi-tiet-nganh-dao-tao/entity/chiTietNganhDaoTao.entity';
import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { TABLE_NAME } from 'constant/constant';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UsersEntity } from 'users/entity/user.entity';

@Entity(TABLE_NAME.KEHOACHGIANGDAY)
export class KeHoachGiangDayEntity {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @ApiProperty()
  @IsString()
  @Column({ name: 'MaKeHoach' })
  @IsOptional()
  maKeHoach: string;

  @ApiProperty()
  @IsString()
  @Column({ name: 'TenHocKy' })
  @IsNotEmpty()
  tenHocKy: string;

  @ApiProperty()
  @IsInt()
  @Column({ name: 'STT' })
  @Min(1)
  @Max(12)
  sTT: number;

  @ApiProperty()
  @IsInt()
  @Column({ name: 'ID_ChiTietNganhDaoTao' })
  @ManyToOne(() => ChiTietNganhDaoTaoEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ID_ChiTietNganhDaoTao' })
  @Min(1)
  nganhDaoTao: number;

  @Column()
  createdAt: Date;

  @OneToOne(() => UsersEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdBy' })
  createdBy: number;

  @Column()
  updatedAt: Date;

  @OneToOne(() => UsersEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'updatedBy' })
  updatedBy: number;

  @Column()
  isDeleted: boolean;

  @OneToMany(() => ChiTietKeHoachEntity, (ctkh) => ctkh.idKHGD, { cascade: ['insert'] })
  chiTietKeHoach?: ChiTietKeHoachEntity[];
}
