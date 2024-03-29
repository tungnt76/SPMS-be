import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisCacheService } from 'cache/redisCache.service';
import { LIMIT, CHITIETGOMNHOM_MESSAGE, REDIS_CACHE_VARS } from 'constant/constant';
import { MonHocEntity } from 'mon-hoc/entity/mon-hoc.entity';
import { Repository } from 'typeorm';
import { CreateChiTietGomNhomDTO } from './dto/create-chi-tiet-gom-nhom.dto';
import { FilterByNganhDaoTao } from './dto/filter-by-nganh-dao-tao.dto';
import { UpdateChiTietGomNhomDTO } from './dto/update-chi-tiet-gom-nhom.dto';
import { ChiTietGomNhomEntity } from './entity/chi-tiet-gom-nhom.entity';
import * as format from 'string-format';
import { FilterByChiTietNganhDaoTao } from './dto/filter-by-chi-tiet-nganh-dao-tao.dto';
import { FilterByKeHoachGiangDay } from './dto/filter-by-ke-hoach-giang-day.dto';

@Injectable()
export class ChiTietGomNhomService {
  constructor(
    @InjectRepository(ChiTietGomNhomEntity) private chiTietGomNhomRepository: Repository<ChiTietGomNhomEntity>,
    private cacheManager: RedisCacheService
  ) {}

  async findAll(filter): Promise<ChiTietGomNhomEntity[] | any> {
    const key = format(REDIS_CACHE_VARS.LIST_CHI_TIET_GOM_NHOM_CACHE_KEY, JSON.stringify(filter));
    let result = await this.cacheManager.get(key);
    if (typeof result === 'undefined' || result === null) {
      const { limit = LIMIT, page = 0, search = '', sortBy = '', sortType = 'ASC', ...otherParam } = filter;
      const skip = Number(page) * Number(limit);
      const query = {
        isDeleted: false,
        ...otherParam
      };

      let sortByTemp = sortBy;
      if (sortByTemp != 'gomNhom.tieuDe' && sortByTemp != 'monHoc.tenTiengViet' && sortByTemp != '')
        sortByTemp = 'ctgn.' + sortByTemp;

      try {
        const queryBuilder = this.chiTietGomNhomRepository
          .createQueryBuilder('ctgn')
          .leftJoinAndSelect('ctgn.monHoc', 'monHoc')
          .innerJoinAndSelect('ctgn.gomNhom', 'gomNhom', 'gomNhom.isDeleted = false')
          .leftJoinAndSelect('ctgn.createdBy', 'createdBy')
          .leftJoinAndSelect('ctgn.updatedBy', 'updatedBy')
          .where((qb) => {
            qb.where((qb) => {
              qb.innerJoinAndSelect(
                'gomNhom.loaiKhoiKienThuc',
                'loaiKhoiKienThuc',
                `loaiKhoiKienThuc.isDeleted = ${false}`
              ).where((qb) => {
                qb.innerJoinAndSelect(
                  'loaiKhoiKienThuc.khoiKienThuc',
                  'khoiKienThuc',
                  `khoiKienThuc.isDeleted = ${false}`
                ).where((qb) => {
                  qb.innerJoinAndSelect(
                    'khoiKienThuc.chiTietNganh',
                    'chiTietNganh',
                    `chiTietNganh.isDeleted = ${false}`
                  ).where((qb) => {
                    qb.innerJoinAndSelect(
                      'chiTietNganh.nganhDaoTao',
                      'nganhDaoTao',
                      `nganhDaoTao.isDeleted = ${false}`
                    ).where((qb) => {
                      qb.innerJoin('nganhDaoTao.chuongTrinhDaoTao', 'ctdt', 'ctdt.isDeleted = false');
                    });
                  });
                });
              });
            });
          })
          .andWhere(query);

        if (search != '') {
          queryBuilder.andWhere(
            '(gomNhom.tieuDe LIKE :search OR monHoc.tenTiengViet LIKE :search OR ctgn.ghiChu LIKE :search)',
            { search: `%${search}%` }
          );
        }

        const [list, total] = await queryBuilder
          .orderBy(sortByTemp, sortType)
          .skip(skip)
          .take(Number(limit) === -1 ? null : Number(limit))
          .getManyAndCount();
        result = { contents: list, total, page: Number(page) };
        await this.cacheManager.set(key, result, REDIS_CACHE_VARS.LIST_CHI_TIET_GOM_NHOM_CACHE_TTL);
      } catch (error) {
        throw new InternalServerErrorException();
      }
    }

    if (result && typeof result === 'string') result = JSON.parse(result);
    return result;
  }

  async getAllSubjectsByChiTietNDT(idCTNDT: number, filter: FilterByChiTietNganhDaoTao) {
    const key = format(REDIS_CACHE_VARS.LIST_CTGN_SJ_CTNDT_CACHE_KEY, idCTNDT.toString(), JSON.stringify(filter));
    let result = await this.cacheManager.get(key);
    if (typeof result === 'undefined' || result === null) {
      const { limit = LIMIT, page = 0, searchKey = '' } = filter;
      const skip = Number(page) * Number(limit);
      const query = this.chiTietGomNhomRepository
        .createQueryBuilder('ctgn')
        .leftJoinAndSelect('ctgn.monHoc', 'monHoc')
        .leftJoinAndSelect('ctgn.gomNhom', 'gomNhom', `gomNhom.isDeleted = ${false}`)
        .where((qb) => {
          qb.where((qb) => {
            qb.innerJoin('gomNhom.loaiKhoiKienThuc', 'loaiKhoiKienThuc', 'loaiKhoiKienThuc.isDeleted = false').where(
              (qb) => {
                qb.innerJoin(
                  'loaiKhoiKienThuc.khoiKienThuc',
                  'khoiKienThuc',
                  `khoiKienThuc.isDeleted = ${false}`
                ).where((qb) => {
                  qb.innerJoin(
                    'khoiKienThuc.chiTietNganh',
                    'chiTietNganh',
                    'chiTietNganh.isDeleted = false and chiTietNganh.id = :idCTNDT',
                    { idCTNDT }
                  ).where((qb) => {
                    qb.innerJoin('chiTietNganh.nganhDaoTao', 'nganhDaoTao', `nganhDaoTao.isDeleted = ${false}`).where(
                      (qb) => {
                        qb.innerJoin('nganhDaoTao.chuongTrinhDaoTao', 'ctdt', 'ctdt.isDeleted = false');
                      }
                    );
                  });
                });
              }
            );
          });
          searchKey
            ? qb.andWhere(
                `(monHoc.tenTiengViet LIKE :search OR monHoc.tenTiengAnh LIKE :search OR monHoc.ma LIKE :search)`,
                { search: `%${searchKey}%` }
              )
            : {};
        })
        .andWhere('ctgn.isDeleted = false')
        .take(Number(limit) === -1 ? null : Number(limit))
        .skip(skip);
      const [list, total] = await query.getManyAndCount();

      result = { contents: list, total, page: Number(page) };
      await this.cacheManager.set(key, result, REDIS_CACHE_VARS.LIST_CTGN_SJ_CTNDT_CACHE_TTL);
    }

    if (result && typeof result === 'string') result = JSON.parse(result);
    return result;
  }
  async getChiTietGomNhomByChiTietNDT(idCTNDT: number) {
    const query = this.chiTietGomNhomRepository
      .createQueryBuilder('ctgn')
      .leftJoinAndSelect('ctgn.monHoc', 'monHoc')
      .leftJoinAndSelect('ctgn.gomNhom', 'gomNhom', `gomNhom.isDeleted = ${false}`)
      .where((qb) => {
        qb.where((qb) => {
          qb.innerJoin('gomNhom.loaiKhoiKienThuc', 'loaiKhoiKienThuc', 'loaiKhoiKienThuc.isDeleted = false').where(
            (qb) => {
              qb.innerJoin('loaiKhoiKienThuc.khoiKienThuc', 'khoiKienThuc', `khoiKienThuc.isDeleted = ${false}`).where(
                (qb) => {
                  qb.innerJoin(
                    'khoiKienThuc.chiTietNganh',
                    'chiTietNganh',
                    'chiTietNganh.isDeleted = false and chiTietNganh.id = :idCTNDT',
                    { idCTNDT }
                  ).where((qb) => {
                    qb.innerJoin('chiTietNganh.nganhDaoTao', 'nganhDaoTao', `nganhDaoTao.isDeleted = ${false}`).where(
                      (qb) => {
                        qb.innerJoin('nganhDaoTao.chuongTrinhDaoTao', 'ctdt', 'ctdt.isDeleted = false');
                      }
                    );
                  });
                }
              );
            }
          );
        });
      })
      .andWhere('ctgn.isDeleted = false');
    const result = await query.getMany();

    return result;
  }

  async findById(id: number): Promise<ChiTietGomNhomEntity | any> {
    const key = format(REDIS_CACHE_VARS.DETAIL_CHI_TIET_GOM_NHOM_CACHE_KEY, id.toString());
    let result = await this.cacheManager.get(key);
    if (typeof result === 'undefined' || result === null) {
      result = await this.chiTietGomNhomRepository
        .createQueryBuilder('ctgn')
        .leftJoinAndSelect('ctgn.monHoc', 'monHoc')
        .innerJoinAndSelect('ctgn.gomNhom', 'gomNhom', 'gomNhom.isDeleted = false')
        .leftJoinAndSelect('ctgn.createdBy', 'createdBy')
        .leftJoinAndSelect('ctgn.updatedBy', 'updatedBy')
        .where((qb) => {
          qb.where((qb) => {
            qb.innerJoinAndSelect(
              'gomNhom.loaiKhoiKienThuc',
              'loaiKhoiKienThuc',
              `loaiKhoiKienThuc.isDeleted = ${false}`
            ).where((qb) => {
              qb.innerJoinAndSelect(
                'loaiKhoiKienThuc.khoiKienThuc',
                'khoiKienThuc',
                `khoiKienThuc.isDeleted = ${false}`
              ).where((qb) => {
                qb.innerJoinAndSelect(
                  'khoiKienThuc.chiTietNganh',
                  'chiTietNganh',
                  `chiTietNganh.isDeleted = ${false}`
                ).where((qb) => {
                  qb.innerJoinAndSelect(
                    'chiTietNganh.nganhDaoTao',
                    'nganhDaoTao',
                    `nganhDaoTao.isDeleted = ${false}`
                  ).where((qb) => {
                    qb.innerJoin('nganhDaoTao.chuongTrinhDaoTao', 'ctdt', 'ctdt.isDeleted = false');
                  });
                });
              });
            });
          });
        })
        .andWhere('ctgn.id = :id and ctgn.isDeleted = false', { id })
        .getOne();
      if (!result) {
        throw new NotFoundException(CHITIETGOMNHOM_MESSAGE.CHITIETGOMNHOM_ID_NOT_FOUND);
      }
      await this.cacheManager.set(key, result, REDIS_CACHE_VARS.DETAIL_CHI_TIET_GOM_NHOM_CACHE_TTL);
    }
    if (result && typeof result === 'string') result = JSON.parse(result);
    return result;
  }

  async create(newData: CreateChiTietGomNhomDTO, idUser: number): Promise<any> {
    const record = await this.chiTietGomNhomRepository.findOne({
      idGN: newData?.idGN,
      idMH: newData?.idMH,
      isDeleted: false
    });
    if (record) {
      throw new ConflictException('Môn học đã tồn tại trong gom nhóm');
    }
    const { idCTGNMonHocTruoc } = newData;
    const chiTietGomNhom: ChiTietGomNhomEntity = {
      ...newData,
      createdBy: idUser,
      updatedBy: idUser,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    if (idCTGNMonHocTruoc) {
      const ctgnMonHoctruoc = await this.chiTietGomNhomRepository.findOne({
        id: newData.idCTGNMonHocTruoc,
        isDeleted: false
      });
      if (!ctgnMonHoctruoc) {
        throw new NotFoundException(CHITIETGOMNHOM_MESSAGE.CHITIETGOMNHOM_ID_NOT_FOUND);
      }
      chiTietGomNhom.ctgnMonHoctruoc = ctgnMonHoctruoc;
    }
    try {
      //const ctGomNhom = await this.chiTietGomNhomRepository.create(chiTietGomNhom);
      const result = await this.chiTietGomNhomRepository.save(chiTietGomNhom);
      const key = format(REDIS_CACHE_VARS.DETAIL_CHI_TIET_GOM_NHOM_CACHE_KEY, result?.id.toString());
      const detail = await this.findById(result?.id);
      await this.cacheManager.set(key, detail, REDIS_CACHE_VARS.DETAIL_CHI_TIET_GOM_NHOM_CACHE_TTL);
      await this.deleteKeysAfterChange();
      return result;
    } catch (error) {
      if (error?.sqlState === '23000') {
        throw new BadRequestException(CHITIETGOMNHOM_MESSAGE.CHITIETGOMNHOM_FOREIGN_KEY_NOT_FOUND);
      }
      throw new InternalServerErrorException(CHITIETGOMNHOM_MESSAGE.CREATE_CHITIETGOMNHOM_FAILED);
    }
  }

  async update(id: number, updatedData: UpdateChiTietGomNhomDTO, idUser: number): Promise<any> {
    const ctGomNhom = await this.chiTietGomNhomRepository.findOne({ id, isDeleted: false });
    if (!ctGomNhom) {
      throw new NotFoundException(CHITIETGOMNHOM_MESSAGE.CHITIETGOMNHOM_ID_NOT_FOUND);
    }
    const chiTietGomNhom: ChiTietGomNhomEntity = {
      ...ctGomNhom,
      ...updatedData,
      updatedBy: idUser,
      updatedAt: new Date()
    };
    const { idCTGNMonHocTruoc } = updatedData;
    if (idCTGNMonHocTruoc) {
      const ctgnMonHoctruoc = await this.chiTietGomNhomRepository.findOne({
        id: updatedData.idCTGNMonHocTruoc,
        isDeleted: false
      });
      if (!ctgnMonHoctruoc) {
        throw new NotFoundException(CHITIETGOMNHOM_MESSAGE.CHITIETGOMNHOM_ID_NOT_FOUND);
      }
      chiTietGomNhom.ctgnMonHoctruoc = ctgnMonHoctruoc;
    }
    try {
      const result = await this.chiTietGomNhomRepository.save(chiTietGomNhom);
      const key = format(REDIS_CACHE_VARS.DETAIL_CHI_TIET_GOM_NHOM_CACHE_KEY, id.toString());
      await this.cacheManager.del(key);
      await this.findById(result.id);
      await this.deleteKeysAfterChange();
      return result;
    } catch (error) {
      if (error?.sqlState === '23000') {
        throw new BadRequestException(CHITIETGOMNHOM_MESSAGE.CHITIETGOMNHOM_FOREIGN_KEY_NOT_FOUND);
      }
      throw new InternalServerErrorException(CHITIETGOMNHOM_MESSAGE.UPDATE_CHITIETGOMNHOM_FAILED);
    }
  }

  async delete(id: number, updatedBy?: number): Promise<any> {
    const ctGomNhom = await this.chiTietGomNhomRepository.findOne({ id, isDeleted: false });
    if (!ctGomNhom) {
      throw new NotFoundException(CHITIETGOMNHOM_MESSAGE.CHITIETGOMNHOM_ID_NOT_FOUND);
    }
    try {
      await this.deleteKeysAfterChange();
      const key = format(REDIS_CACHE_VARS.DETAIL_CHI_TIET_GOM_NHOM_CACHE_KEY, id.toString());
      await this.cacheManager.del(key);
      return await this.chiTietGomNhomRepository.save({
        ...ctGomNhom,
        isDeleted: true,
        updatedAt: new Date(),
        updatedBy
      });
    } catch (error) {
      throw new InternalServerErrorException(CHITIETGOMNHOM_MESSAGE.DELETE_CHITIETGOMNHOM_FAILED);
    }
  }

  async getMonHocThayThe(idMonHoc: number): Promise<MonHocEntity[]> {
    const key = format(REDIS_CACHE_VARS.LIST_CTGN_MHTT_CACHE_KEY, idMonHoc.toString());
    let result = await this.cacheManager.get(key);
    if (typeof result === 'undefined' || result === null) {
      result = await this.chiTietGomNhomRepository
        .createQueryBuilder('ctgn')
        .leftJoinAndSelect('ctgn.ctgnMonHoctruoc', 'ctgnMonHoctruoc')
        .leftJoinAndSelect('ctgn.monHoc', 'monHoc')
        .where((qb) => {
          qb.leftJoinAndSelect('monHoc.chiTietGomNhom', 'chiTietGomNhom', 'chiTietGomNhom.isDeleted = false')
            .leftJoinAndSelect('ctgnMonHoctruoc.monHoc', 'monHocTr')
            .where(`monHocTr.id = ${idMonHoc}`);
        })
        .getMany();
      result = result.map((e) => e.monHoc);
      await this.cacheManager.set(key, result, REDIS_CACHE_VARS.LIST_CTGN_MHTT_CACHE_TTL);
    }

    if (result && typeof result === 'string') result = JSON.parse(result);
    return result;
  }
  async getAllSubjects(khoa: number, idNganhDaoTao: number, filter: FilterByNganhDaoTao) {
    const key = format(
      REDIS_CACHE_VARS.LIST_CTGN_SJ_CACHE_KEY,
      khoa.toString(),
      idNganhDaoTao.toString(),
      JSON.stringify(filter)
    );
    let result = await this.cacheManager.get(key);
    if (typeof result === 'undefined' || result === null) {
      const { limit = LIMIT, page = 0, tenMonHoc, maMonHoc } = filter;
      const skip = Number(page) * Number(limit);
      const [list, total] = await this.chiTietGomNhomRepository
        .createQueryBuilder('ctgn')
        .leftJoinAndSelect('ctgn.createdBy', 'createdBy')
        .leftJoinAndSelect('ctgn.updatedBy', 'updatedBy')
        .leftJoinAndSelect('ctgn.monHoc', 'monHoc')
        .leftJoinAndSelect('ctgn.gomNhom', 'gomNhom', `gomNhom.isDeleted = ${false}`)
        .where((qb) => {
          qb.where((qb) => {
            qb.innerJoin('gomNhom.loaiKhoiKienThuc', 'loaiKhoiKienThuc', 'loaiKhoiKienThuc.isDeleted = false').where(
              (qb) => {
                qb.innerJoin(
                  'loaiKhoiKienThuc.khoiKienThuc',
                  'khoiKienThuc',
                  `khoiKienThuc.isDeleted = ${false}`
                ).where((qb) => {
                  qb.innerJoin(
                    'khoiKienThuc.chiTietNganh',
                    'chiTietNganh',
                    `chiTietNganh.isDeleted = ${false} and chiTietNganh.khoa = ${khoa} and chiTietNganh.nganhDaoTao = ${idNganhDaoTao}`
                  ).where((qb) => {
                    qb.innerJoin('chiTietNganh.nganhDaoTao', 'nganhDaoTao', `nganhDaoTao.isDeleted = ${false}`).where(
                      (qb) => {
                        qb.innerJoin('nganhDaoTao.chuongTrinhDaoTao', 'ctdt', 'ctdt.isDeleted = false');
                      }
                    );
                  });
                });
              }
            );
          });
          tenMonHoc
            ? qb.andWhere(`(monHoc.tenTiengViet LIKE '%${tenMonHoc}%' OR monHoc.tenTiengAnh LIKE '%${tenMonHoc}%')`)
            : {};
          maMonHoc ? qb.andWhere(`monHoc.ma LIKE '%${maMonHoc}%'`) : {};
        })
        .andWhere(`ctgn.isDeleted = ${false}`)
        .take(Number(limit) === -1 ? null : Number(limit))
        .skip(skip)
        .getManyAndCount();
      result = { contents: list, total, page: Number(page) };
      await this.cacheManager.set(key, result, REDIS_CACHE_VARS.LIST_CTGN_SJ_CACHE_TTL);
    }

    if (result && typeof result === 'string') result = JSON.parse(result);
    return result;
  }

  async deleteMultipleRows(ids: string, updatedBy?: number): Promise<any> {
    const list_id = ids
      .trim()
      .split(',')
      .map((x) => +x);
    const records = await this.chiTietGomNhomRepository
      .createQueryBuilder('ctgn')
      .where('ctgn.id IN (:...ids)', { ids: list_id })
      .andWhere(`ctgn.isDeleted = ${false}`)
      .getCount();
    if (list_id.length != records) {
      throw new NotFoundException(CHITIETGOMNHOM_MESSAGE.CHITIETGOMNHOM_ID_NOT_FOUND);
    }

    try {
      await this.chiTietGomNhomRepository
        .createQueryBuilder('ctgn')
        .update(ChiTietGomNhomEntity)
        .set({ isDeleted: true, updatedAt: new Date(), updatedBy })
        .andWhere('id IN (:...ids)', { ids: list_id })
        .execute();
      await this.deleteKeysAfterChange();
    } catch (error) {
      throw new InternalServerErrorException(CHITIETGOMNHOM_MESSAGE.DELETE_CHITIETGOMNHOM_FAILED);
    }
  }

  async deleteAll(updatedBy?: number): Promise<any> {
    try {
      await this.chiTietGomNhomRepository
        .createQueryBuilder('ctgn')
        .update(ChiTietGomNhomEntity)
        .set({ isDeleted: true, updatedAt: new Date(), updatedBy })
        .where(`isDeleted = ${false}`)
        .execute();
      await this.deleteKeysAfterChange();
    } catch (error) {
      throw new InternalServerErrorException(CHITIETGOMNHOM_MESSAGE.DELETE_CHITIETGOMNHOM_FAILED);
    }
  }

  async deleteRowIsDeleted(): Promise<any> {
    try {
      await this.chiTietGomNhomRepository.delete({ isDeleted: true });
    } catch (error) {
      throw new InternalServerErrorException(CHITIETGOMNHOM_MESSAGE.DELETE_CHITIETGOMNHOM_FAILED);
    }
  }
  async getChiTietGomNhomByKhoaAndNganh(idNganh: number, khoa: number, ctgnArr: string[]) {
    return await this.chiTietGomNhomRepository
      .createQueryBuilder('ctgn')
      .leftJoin('ctgn.gomNhom', 'gomNhom', 'gomNhom.isDeleted = false')
      .where((qb) => {
        qb.where((qb) => {
          qb.innerJoin('gomNhom.loaiKhoiKienThuc', 'loaiKhoiKienThuc', 'loaiKhoiKienThuc.isDeleted = false').where(
            (qb) => {
              qb.innerJoin('loaiKhoiKienThuc.khoiKienThuc', 'khoiKienThuc', 'khoiKienThuc.isDeleted = false').where(
                (qb) => {
                  qb.innerJoin(
                    'khoiKienThuc.chiTietNganh',
                    'chiTietNganh',
                    'chiTietNganh.isDeleted = false'
                  ).where('chiTietNganh.khoa = :khoa and chiTietNganh.nganhDaoTao = :idNganh', { khoa, idNganh });
                }
              );
            }
          );
        });
      })
      .andWhere('ctgn.id IN (:...ctgnArr)', { ctgnArr })
      .getManyAndCount();
  }

  async getAllSubjectByKeHoachGiangDay(idKeHoachGiangDay: number, filter: FilterByKeHoachGiangDay) {
    const { limit = LIMIT, page = 0, searchKey } = filter;
    const skip = Number(page) * Number(limit);
    const [list, total] = await this.chiTietGomNhomRepository
      .createQueryBuilder('ctgn')
      .leftJoinAndSelect('ctgn.monHoc', 'monHoc')
      .innerJoinAndSelect('ctgn.gomNhom', 'gomNhom', 'gomNhom.isDeleted = false')
      .innerJoin('ctgn.ctkhgd', 'ctkhgd', 'ctkhgd.isDeleted = false')
      .where((qb) => {
        qb.where((qb) => {
          qb.innerJoin('ctkhgd.idKHGD', 'khgd', 'khgd.isDeleted = false and khgd.id = :idKHGD', {
            idKHGD: idKeHoachGiangDay
          }).where((qb) => {
            qb.innerJoin('khgd.nganhDaoTao', 'chiTietNganh', 'chiTietNganh.isDeleted = false').where((qb) => {
              qb.innerJoin('chiTietNganh.nganhDaoTao', 'nganhDaoTao', `nganhDaoTao.isDeleted = ${false}`).where(
                (qb) => {
                  qb.innerJoin('nganhDaoTao.chuongTrinhDaoTao', 'ctdt', 'ctdt.isDeleted = false');
                }
              );
            });
          });
        });
        searchKey
          ? qb.andWhere(
              `(monHoc.tenTiengViet LIKE '%${searchKey}%' OR monHoc.tenTiengAnh LIKE '%${searchKey}%' OR monHoc.ma LIKE '%${searchKey}%')`
            )
          : {};
      })
      .andWhere(`ctgn.isDeleted = ${false}`)
      .take(Number(limit) === -1 ? null : Number(limit))
      .skip(skip)
      .getManyAndCount();
    return { contents: list, total, page: Number(page) };
  }

  async updateMonHocTruoc(chiTietGomNhom: ChiTietGomNhomEntity[]) {
    await this.chiTietGomNhomRepository.save(chiTietGomNhom);
  }

  async deleteKeysAfterChange() {
    await this.cacheManager.delCacheList([
      REDIS_CACHE_VARS.LIST_CHI_TIET_GOM_NHOM_CACHE_COMMON_KEY,
      REDIS_CACHE_VARS.LIST_CTGN_MHTT_CACHE_COMMON_KEY,
      REDIS_CACHE_VARS.LIST_CTGN_SJ_CACHE_COMMON_KEY
    ]);
  }
}
