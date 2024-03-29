import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LIMIT, REDIS_CACHE_VARS, SYLLABUS_MESSAGE } from 'constant/constant';
import { MonHocService } from 'mon-hoc/mon-hoc.service';
import { NamHocService } from 'nam-hoc/nam-hoc.service';
import { HeDaotaoService } from 'he-dao-tao/he-dao-tao.service';
import { Not, OrderByCondition, Repository } from 'typeorm';
import { GetSyllabusFilterDto } from './dto/filter-syllabus.dto';
import { Syllabus } from './entity/syllabus.entity';
import { BaseService } from 'guards/base-service.dto';
import { RedisCacheService } from 'cache/redisCache.service';
import * as format from 'string-format';
import { UsersEntity } from 'users/entity/user.entity';
import { ChiTietNganhDaoTaoService } from 'chi-tiet-nganh-dao-tao/chi-tiet-nganh-dao-tao.service';

@Injectable()
export class SyllabusService extends BaseService {
  constructor(
    @InjectRepository(Syllabus)
    private syllabusRepository: Repository<Syllabus>,
    private readonly shoolYearService: NamHocService,
    private readonly typeOfEduService: HeDaotaoService,
    private readonly subjectService: MonHocService,
    private readonly chiTietNDTService: ChiTietNganhDaoTaoService,
    private cacheManager: RedisCacheService
  ) {
    super();
  }

  async create(createSyllabus: Syllabus): Promise<Syllabus> {
    if (await this.isExist(createSyllabus)) {
      throw new ConflictException(SYLLABUS_MESSAGE.SYLLABUS_EXIST);
    }

    await this.shoolYearService.findById(createSyllabus.namHoc);
    await this.typeOfEduService.findById(createSyllabus.heDaoTao);
    await this.subjectService.findById(createSyllabus.monHoc);
    await this.chiTietNDTService.findById(createSyllabus.chiTietNDT);

    try {
      const result = await this.syllabusRepository.save(createSyllabus);
      const key = format(REDIS_CACHE_VARS.DETAIL_SYLLABUS_CACHE_KEY, result?.id.toString());
      const detail = await this.findOne(result.id);
      await this.cacheManager.set(key, detail, REDIS_CACHE_VARS.DETAIL_SYLLABUS_CACHE_TTL);
      await this.delCacheAfterChange();
      return result;
    } catch (error) {
      throw new InternalServerErrorException(SYLLABUS_MESSAGE.CREATE_SYLLABUS_FAILED);
    }
  }

  async findAll(filter: GetSyllabusFilterDto): Promise<Syllabus[] | any> {
    const keyRedis = format(REDIS_CACHE_VARS.LIST_SYLLABUS_CACHE_KEY, JSON.stringify(filter));
    let result = await this.cacheManager.get(keyRedis);
    if (typeof result === 'undefined' || result === null) {
      const { key, page = 0, limit = LIMIT, updatedAt, createdBy, idHeDaotao, idMonHoc, idNamHoc, idCTNDT } = filter;
      const skip = page * limit;
      const queryOrder: OrderByCondition = updatedAt ? { 'sy.updatedAt': updatedAt } : {};
      const isDeleted = false;
      const queryByCondition = `sy.isDeleted = ${isDeleted}`;
      const query = this.syllabusRepository
        .createQueryBuilder('sy')
        .leftJoinAndSelect('sy.monHoc', 'monHoc')
        .leftJoinAndSelect('sy.createdBy', 'createdBy')
        .leftJoinAndSelect('sy.chiTietNDT', 'chiTietNDT')
        .leftJoinAndSelect('sy.heDaoTao', 'heDaoTao')
        .leftJoinAndSelect('sy.updatedBy', 'updatedBy')
        .leftJoinAndSelect('sy.namHoc', 'namHoc')
        .where((qb) => {
          qb.leftJoinAndSelect('chiTietNDT.nganhDaoTao', 'nganhDaoTao', 'nganhDaoTao.isDeleted = false').where((qb) => {
            qb.leftJoin('nganhDaoTao.chuongTrinhDaoTao', 'ctdt', 'ctdt.isDeleted = false');
          });
          key
            ? qb.andWhere('(monHoc.TenTiengViet LIKE :key OR monHoc.TenTiengAnh LIKE :key OR monHoc.ma LIKE :key)', {
                key: `%${key}%`
              })
            : {};
          idHeDaotao ? qb.andWhere('heDaoTao.id = :idHeDaotao', { idHeDaotao }) : {};
          idNamHoc ? qb.andWhere('namHoc.id = :idNamHoc', { idNamHoc }) : {};
          idMonHoc ? qb.andWhere('monHoc.id = :idMonHoc', { idMonHoc }) : {};
          idCTNDT ? qb.andWhere('chiTietNDT.id = :idCTNDT', { idCTNDT }) : {};
          createdBy ? qb.andWhere('createdBy.id =:idUser', { idUser: createdBy }) : {};
        })
        .andWhere(queryByCondition)
        .take(Number(limit) === -1 ? null : Number(limit))
        .skip(skip)
        .orderBy({ ...queryOrder });
      const [list, total] = await query.getManyAndCount();
      result = { contents: list, total, page: Number(page) };
      await this.cacheManager.set(keyRedis, result, REDIS_CACHE_VARS.LIST_SYLLABUS_CACHE_TTL);
    }

    if (result && typeof result === 'string') result = JSON.parse(result);
    return result;
  }

  async findOne(id: number): Promise<Syllabus> {
    const key = format(REDIS_CACHE_VARS.DETAIL_SYLLABUS_CACHE_KEY, id.toString());
    let result = await this.cacheManager.get(key);
    if (typeof result === 'undefined' || result === null) {
      const query = await this.syllabusRepository
        .createQueryBuilder('sy')
        .leftJoinAndSelect('sy.heDaoTao', 'heDaoTao')
        .leftJoinAndSelect('sy.updatedBy', 'updatedBy')
        .leftJoinAndSelect('sy.namHoc', 'namHoc')
        .leftJoinAndSelect('sy.monHoc', 'monHoc')
        .leftJoinAndSelect('sy.createdBy', 'createdBy')
        .leftJoinAndSelect('sy.chiTietNDT', 'chiTietNDT')
        .where((qb) => {
          qb.leftJoinAndSelect('monHoc.monHocTienQuyet', 'mhtq', 'mhtq.isDeleted = false').leftJoinAndSelect(
            'mhtq.monHocTruoc',
            'mht'
          );
        })
        .andWhere('sy.isDeleted = false')
        .andWhere('sy.id = :id', { id });
      result = await query.getOne();
      if (!result) {
        throw new NotFoundException(SYLLABUS_MESSAGE.SYLLABUS_ID_NOT_FOUND);
      }
      await this.cacheManager.set(key, result, REDIS_CACHE_VARS.DETAIL_SYLLABUS_CACHE_TTL);
    }

    if (result && typeof result === 'string') result = JSON.parse(result);
    return result;
  }

  async update(id: number, updateSyllabus: Syllabus, updateBy: UsersEntity) {
    const syllabus = await this.syllabusRepository.findOne(id, {
      where: { isDeleted: false },
      relations: ['createdBy']
    });
    this.checkPermission(syllabus.createdBy, updateBy);
    const { namHoc, heDaoTao, monHoc, chiTietNDT } = updateSyllabus;
    if (namHoc) {
      await this.shoolYearService.findById(namHoc);
      syllabus.namHoc = namHoc;
    }
    if (heDaoTao) {
      await this.typeOfEduService.findById(heDaoTao);
      syllabus.heDaoTao = heDaoTao;
    }
    if (monHoc) {
      await this.subjectService.findById(monHoc);
      syllabus.monHoc = monHoc;
    }
    if (chiTietNDT) {
      await this.chiTietNDTService.findById(chiTietNDT);
      syllabus.chiTietNDT = chiTietNDT;
    }

    if (await this.isExist(syllabus)) {
      throw new ConflictException(SYLLABUS_MESSAGE.SYLLABUS_EXIST);
    }
    try {
      const result = await this.syllabusRepository.save({
        ...syllabus,
        ...updateSyllabus,
        updateBy: updateBy.id,
        updatedAt: new Date()
      });
      const key = format(REDIS_CACHE_VARS.DETAIL_SYLLABUS_CACHE_KEY, id.toString());
      await this.cacheManager.del(key);
      await this.findOne(result.id);
      await this.delCacheAfterChange();
      return result;
    } catch (error) {
      throw new InternalServerErrorException(SYLLABUS_MESSAGE.UPDATE_SYLLABUS_FAILED);
    }
  }

  async remove(id: number, user: UsersEntity) {
    const found = await this.findOne(id);
    this.checkPermission(found.createdBy, user);
    try {
      const result = await this.syllabusRepository.save({
        ...found,
        updateBy: user.id,
        updatedAt: new Date(),
        isDeleted: true
      });
      const key = format(REDIS_CACHE_VARS.DETAIL_SYLLABUS_CACHE_KEY, id.toString());
      await this.cacheManager.del(key);
      await this.delCacheAfterChange();
      return result;
    } catch (error) {
      throw new InternalServerErrorException(SYLLABUS_MESSAGE.DELETE_SYLLABUS_FAILED);
    }
  }

  async getCountSyllabus(idUser?: number): Promise<number> {
    if (idUser) {
      return await this.syllabusRepository.count({ createdBy: idUser, isDeleted: false });
    }
    return await this.syllabusRepository.count({ isDeleted: false });
  }
  async isExist(createSyllabusDto: Syllabus): Promise<boolean> {
    const { id, namHoc, monHoc, heDaoTao } = createSyllabusDto;
    const isNotId = id ? { id: Not(id) } : {};
    const query = {
      namHoc,
      monHoc,
      heDaoTao,
      isDeleted: false,
      ...isNotId
    };
    const found = await this.syllabusRepository.findOne({
      where: query
    });
    return found ? true : false;
  }
  async search(filter) {
    const { searchKey: key, limit = LIMIT } = filter;
    const isDeleted = false;
    const queryByCondition = `sy.isDeleted = ${isDeleted}`;
    const query = this.syllabusRepository
      .createQueryBuilder('sy')
      .leftJoinAndSelect('sy.monHoc', 'monHoc')
      .where((qb) => {
        key
          ? qb.where('(monHoc.TenTiengViet LIKE :key OR monHoc.TenTiengAnh LIKE :key)', {
              key: `%${key}%`
            })
          : {};
      })
      .leftJoinAndSelect('sy.heDaoTao', 'heDaoTao')
      .leftJoinAndSelect('sy.updatedBy', 'updatedBy')
      .leftJoinAndSelect('sy.namHoc', 'namHoc')
      .andWhere(queryByCondition)
      .take(Number(limit) === -1 ? null : Number(limit));
    const results = await query.getMany();
    return results;
  }

  async deleteRowIsDeleted(): Promise<any> {
    try {
      await this.syllabusRepository.delete({ isDeleted: true });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(SYLLABUS_MESSAGE.DELETE_SYLLABUS_FAILED);
    }
  }

  async delCacheAfterChange() {
    await this.cacheManager.delCacheList([REDIS_CACHE_VARS.LIST_SYLLABUS_CACHE_COMMON_KEY]);
  }

  async findOneV2(id: number): Promise<Syllabus> {
    const key = format(REDIS_CACHE_VARS.DETAIL_SYLLABUS_CACHE_KEY, id.toString());
    let result = await this.cacheManager.get(key);
    if (typeof result === 'undefined' || result === null) {
      const query = await this.syllabusRepository
        .createQueryBuilder('sy')
        .leftJoinAndSelect('sy.heDaoTao', 'heDaoTao')
        .leftJoinAndSelect('sy.updatedBy', 'updatedBy')
        .leftJoinAndSelect('sy.namHoc', 'namHoc')
        .leftJoinAndSelect('sy.monHoc', 'monHoc')
        .leftJoinAndSelect('sy.createdBy', 'createdBy')
        .where((qb) => {
          qb.leftJoinAndSelect('monHoc.monHocTienQuyet', 'mhtq', 'mhtq.isDeleted = false').leftJoinAndSelect(
            'mhtq.monHocTruoc',
            'mht'
          );
          qb.leftJoinAndSelect('monHoc.chiTietGomNhom', 'chiTietGomNhom', 'chiTietGomNhom.isDeleted = false')
            .leftJoinAndSelect('chiTietGomNhom.idGN', 'gomNhom', 'gomNhom.isDeleted = false')
            .leftJoinAndSelect('gomNhom.loaiKhoiKienThuc', 'loaiKhoiKienThuc', 'loaiKhoiKienThuc.isDeleted = false')
            .leftJoinAndSelect('loaiKhoiKienThuc.khoiKienThuc', 'khoiKienThuc', 'khoiKienThuc.isDeleted = false');
        })
        .andWhere('sy.isDeleted = false')
        .andWhere('sy.id = :id', { id });
      result = await query.getOne();
      if (!result) {
        throw new NotFoundException(SYLLABUS_MESSAGE.SYLLABUS_ID_NOT_FOUND);
      }
      await this.cacheManager.set(key, result, REDIS_CACHE_VARS.DETAIL_SYLLABUS_CACHE_TTL);
    }

    if (result && typeof result === 'string') result = JSON.parse(result);
    return result;
  }
}
