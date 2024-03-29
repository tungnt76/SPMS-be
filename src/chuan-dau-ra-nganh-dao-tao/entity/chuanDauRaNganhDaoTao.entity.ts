import { ApiProperty } from '@nestjs/swagger';
import { ChiTietNganhDaoTaoEntity } from 'chi-tiet-nganh-dao-tao/entity/chiTietNganhDaoTao.entity';
import { ChuanDauRaEntity } from 'chuan-dau-ra/entity/chuanDauRa.entity';
import { isInt, IsInt, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';
import { TABLE_NAME } from 'constant/constant';
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UsersEntity } from 'users/entity/user.entity';

@Entity(TABLE_NAME.CHUANDAURANGANHDAOTAO)
export class ChuanDauRaNganhDaoTaoEntity {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @ApiProperty()
  @IsString()
  @Column()
  @IsNotEmpty()
  ma: string;

  @ApiProperty()
  @IsInt()
  @IsOptional()
  @OneToOne(() => ChuanDauRaNganhDaoTaoEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: number;

  @OneToMany(() => ChuanDauRaNganhDaoTaoEntity, (cdr) => cdr.parent, { cascade: ['insert'] })
  @JoinColumn({ name: 'id' })
  children?: ChuanDauRaNganhDaoTaoEntity[];

  @ApiProperty()
  @IsInt()
  @OneToOne(() => ChiTietNganhDaoTaoEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ID_ChiTietNganhDaoTao' })
  @IsNotEmpty()
  @Min(1)
  nganhDaoTao: number;

  @ApiProperty()
  @IsInt()
  @OneToOne(() => ChuanDauRaEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ID_ChuanDauRa' })
  @Min(1)
  chuanDauRa: number;

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
}
