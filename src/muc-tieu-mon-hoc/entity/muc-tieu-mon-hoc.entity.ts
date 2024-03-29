import { ChuanDauRaNganhDaoTaoEntity } from 'chuan-dau-ra-nganh-dao-tao/entity/chuanDauRaNganhDaoTao.entity';
import { TABLE_NAME } from 'constant/constant';
import { Syllabus } from 'syllabus/entity/syllabus.entity';
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UsersEntity } from 'users/entity/user.entity';

@Entity({ name: TABLE_NAME.MUCTIEUMONHOC })
export class MucTieuMonHocEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id?: number;

  @ManyToOne(() => Syllabus, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idSyllabus' })
  @Column({ name: 'idSyllabus' })
  syllabus?: number;

  @Column({ name: 'ma' })
  ma?: string;

  @Column({ name: 'moTa' })
  moTa?: string;

  @ManyToMany(() => ChuanDauRaNganhDaoTaoEntity, { cascade: true })
  @JoinTable({
    name: 'MucTieuMonHoc_ChuanDauRaCDIO',
    joinColumn: { name: 'idMTMH', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'idCDRCDIO', referencedColumnName: 'id' }
  })
  chuanDauRaCDIO?: ChuanDauRaNganhDaoTaoEntity[];

  @ManyToOne(() => UsersEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'updatedBy' })
  updatedBy?: number;

  @ManyToOne(() => UsersEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdBy' })
  createdBy?: number;

  @Column({ name: 'updatedAt' })
  updatedAt?: Date;

  @Column({ name: 'createdAt' })
  createdAt?: Date;

  @Column({ name: 'isDeleted' })
  isDeleted?: boolean;
}
