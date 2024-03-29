import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LIMIT, MONHOCTIENQUYET_MESSAGE, REDIS_CACHE_VARS } from 'constant/constant';
import { Not, QueryFailedError, Repository } from 'typeorm';
import { CreateMonHocTienQuyetDto } from './dto/create-mon-hoc-tien-quyet.dto';
import { FilterMonHocKienQuyet } from './dto/filter-mon-hoc-tien-quyet.dto';
import { UpdateMonHocKienQuyetDto } from './dto/update-mon-hoc-tien-quyet.dto';
import { MonHocTienQuyetEntity } from './entity/mon-hoc-tien-quyet.entity';
import { RedisCacheService } from 'cache/redisCache.service';
import * as format from 'string-format';

@Injectable()
export class MonHocTienQuyetService {
  constructor(
    @InjectRepository(MonHocTienQuyetEntity)
    private prerequisiteSubjectRepository: Repository<MonHocTienQuyetEntity>,
    private cacheManager: RedisCacheService
  ) {}

  async create(createPrerequisiteSubjectDto: CreateMonHocTienQuyetDto) {
    if (await this.isExist(createPrerequisiteSubjectDto)) {
      throw new ConflictException(MONHOCTIENQUYET_MESSAGE.MONHOCTIENQUYET_EXIST);
    }
    try {
      const newRow = await this.prerequisiteSubjectRepository.create(createPrerequisiteSubjectDto);
      const result = await this.prerequisiteSubjectRepository.save(newRow);
      const key = format(REDIS_CACHE_VARS.DETAIL_MHTQ_CACHE_KEY, result?.id.toString());
      const detail = await this.findById(result.id);
      await this.cacheManager.set(key, detail, REDIS_CACHE_VARS.DETAIL_MHTQ_CACHE_TTL);
      await this.delCacheAfterChange();
      return result;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new BadRequestException();
      }
      throw new InternalServerErrorException(MONHOCTIENQUYET_MESSAGE.CREATE_MONHOCTIENQUYET_FAILED);
    }
  }

  async findAll(filter: FilterMonHocKienQuyet) {
    const key = format(REDIS_CACHE_VARS.LIST_MHTQ_CACHE_KEY, JSON.stringify(filter));
    let result = await this.cacheManager.get(key);
    if (typeof result === 'undefined' || result === null) {
      const { page = 0, limit = LIMIT } = filter;
      const skip = page * limit;
      const query = {
        isDeleted: false
      };
      const [list, total] = await this.prerequisiteSubjectRepository.findAndCount({
        relations: ['monHocTruoc', 'monHoc', 'createdBy', 'updatedBy'],
        where: query,
        skip,
        take: Number(limit) === -1 ? null : Number(limit)
      });
      result = { contents: list, total, page: Number(page) };
      await this.cacheManager.set(key, result, REDIS_CACHE_VARS.LIST_MHTQ_CACHE_TTL);
    }

    if (result && typeof result === 'string') result = JSON.parse(result);
    return result;
  }
  async findById(id: number) {
    const key = format(REDIS_CACHE_VARS.DETAIL_MHTQ_CACHE_KEY, id.toString());
    let result = await this.cacheManager.get(key);
    if (typeof result === 'undefined' || result === null) {
      result = await this.prerequisiteSubjectRepository.findOne(id, {
        relations: ['monHocTruoc', 'monHoc', 'createdBy', 'updatedBy'],
        where: { isDeleted: false }
      });
      if (!result) throw new NotFoundException(MONHOCTIENQUYET_MESSAGE.MONHOCTIENQUYET_ID_NOT_FOUND);
      await this.cacheManager.set(key, result, REDIS_CACHE_VARS.DETAIL_MHTQ_CACHE_TTL);
    }

    if (result && typeof result === 'string') result = JSON.parse(result);
    return result;
  }

  async findAllPrereSuject(id: number, filter: FilterMonHocKienQuyet) {
    const key = format(REDIS_CACHE_VARS.LIST_MHTQ_MHT_CACHE_KEY, id?.toString(), JSON.stringify(filter));
    let result = await this.cacheManager.get(key);
    if (typeof result === 'undefined' || result === null) {
      const { page = 0, limit = LIMIT, type } = filter;
      const skip = page * limit;
      const queryByType = type ? { condition: Number(type) } : {};
      const queryByIdSubject = id ? { monHoc: id } : {};
      const query = {
        isDeleted: false,
        ...queryByIdSubject,
        ...queryByType
      };
      const [list, total] = await this.prerequisiteSubjectRepository.findAndCount({
        relations: ['monHocTruoc', 'monHoc', 'createdBy', 'updatedBy'],
        where: query,
        skip,
        take: Number(limit) === -1 ? null : Number(limit)
      });
      result = { contents: list, total, page: Number(page) };
      await this.cacheManager.set(key, result, REDIS_CACHE_VARS.LIST_MHTQ_MHT_CACHE_TTL);
    }
    if (result && typeof result === 'string') result = JSON.parse(result);
    return result;
  }

  async update(id: number, updatePrerequisiteSubjectDto: UpdateMonHocKienQuyetDto) {
    const newPrere = await this.prerequisiteSubjectRepository.findOne(id, { where: { isDeleted: false } });
    if (!newPrere) throw new NotFoundException();
    const { monHoc, monHocTruoc, loaiMonHoc } = updatePrerequisiteSubjectDto;
    if (monHoc) {
      newPrere.monHoc = monHoc;
    }
    if (monHocTruoc) {
      newPrere.monHocTruoc = monHocTruoc;
    }
    if (loaiMonHoc) {
      newPrere.loaiMonHoc = loaiMonHoc;
    }
    if (await this.isExist(newPrere)) {
      throw new ConflictException(MONHOCTIENQUYET_MESSAGE.MONHOCTIENQUYET_EXIST);
    }
    try {
      newPrere.updatedAt = new Date();
      newPrere.updatedBy = updatePrerequisiteSubjectDto.updatedBy;
      const result = await this.prerequisiteSubjectRepository.save(newPrere);
      const key = format(REDIS_CACHE_VARS.DETAIL_MHTQ_CACHE_KEY, id.toString());
      await this.cacheManager.del(key);
      await this.findById(result.id);
      await this.delCacheAfterChange();
      return result;
    } catch (error) {
      throw new InternalServerErrorException(MONHOCTIENQUYET_MESSAGE.UPDATE_MONHOCTIENQUYET_FAILED);
    }
  }

  async remove(id: number, updateBy: number) {
    const found = await this.prerequisiteSubjectRepository.findOne(id, { where: { isDeleted: false } });
    if (!found) throw new NotFoundException(MONHOCTIENQUYET_MESSAGE.MONHOCTIENQUYET_ID_NOT_FOUND);
    found.updatedBy = updateBy;
    found.updatedAt = new Date();
    found.isDeleted = true;
    try {
      const result = await this.prerequisiteSubjectRepository.save(found);
      const key = format(REDIS_CACHE_VARS.DETAIL_MHTQ_CACHE_KEY, id.toString());
      await this.cacheManager.del(key);
      await this.delCacheAfterChange();
      return result;
    } catch (error) {
      throw new InternalServerErrorException(MONHOCTIENQUYET_MESSAGE.DELETE_MONHOCTIENQUYET_FAILED);
    }
  }

  private async isExist(prere: MonHocTienQuyetEntity): Promise<boolean> {
    const { id, monHoc, monHocTruoc } = prere;
    const notID = id ? { id: Not(id) } : {};
    const query = {
      isDeleted: false,
      monHoc,
      monHocTruoc,
      ...notID
    };
    const found = await this.prerequisiteSubjectRepository.findOne({ where: query });
    return found ? true : false;
  }

  async deleteRowIsDeleted(): Promise<any> {
    try {
      await this.prerequisiteSubjectRepository.delete({ isDeleted: true });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(MONHOCTIENQUYET_MESSAGE.DELETE_MONHOCTIENQUYET_FAILED);
    }
  }

  async delCacheAfterChange() {
    await this.cacheManager.delCacheList([
      REDIS_CACHE_VARS.LIST_MHTQ_CACHE_COMMON_KEY,
      REDIS_CACHE_VARS.LIST_MH_NDT_KT_CACHE_COMMON_KEY
    ]);
  }
}
