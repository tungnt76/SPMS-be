import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LIMIT, NGANHDAOTAO_MESSAGE, REDIS_CACHE_VARS } from 'constant/constant';
import { Repository, Like } from 'typeorm';
import { NganhDaoTaoEntity } from './entity/nganhDaoTao.entity';
import { INganhDaoTao } from './interfaces/nganhDaoTao.interface';
import { RedisCacheService } from 'cache/redisCache.service';
import * as format from 'string-format';

@Injectable()
export class CtdtService {
  constructor(
    @InjectRepository(NganhDaoTaoEntity) private readonly nganhDaoTaoRepository: Repository<NganhDaoTaoEntity>,
    private cacheManager: RedisCacheService
  ) {}

  async findAll(filter: any): Promise<any> {
    const key = format(REDIS_CACHE_VARS.LIST_NDT_CACHE_KEY, JSON.stringify(filter));
    let result = await this.cacheManager.get(key);
    if (typeof result === 'undefined' || result === null) {
      const { limit = LIMIT, page = 0, searchKey = '', sortBy, sortType, ...otherParam } = filter;
      const skip = Number(page) * Number(limit);
      const isSortFieldInForeignKey = sortBy ? sortBy.trim().includes('.') : false;
      const searchField = ['id', 'maNganhDaoTao', 'ten'];
      const searchQuery = searchField
        .map((e) => (e.includes('.') ? e + ' LIKE :search' : 'ndt.' + e + ' LIKE :search'))
        .join(' OR ');
      const [list, total] = await this.nganhDaoTaoRepository
        .createQueryBuilder('ndt')
        .innerJoinAndSelect('ndt.chuongTrinhDaoTao', 'chuongTrinhDaoTao', 'chuongTrinhDaoTao.isDeleted = false')
        .leftJoinAndSelect('ndt.createdBy', 'createdBy')
        .leftJoinAndSelect('ndt.updatedBy', 'updatedBy')
        .where((qb) => {
          searchKey
            ? qb.andWhere(searchQuery, {
                search: `%${searchKey}%`
              })
            : {};
          isSortFieldInForeignKey
            ? qb.orderBy(sortBy, sortType)
            : qb.orderBy(sortBy ? `ndt.${sortBy}` : null, sortType);
        })
        .andWhere({ isDeleted: false, ...otherParam })
        .skip(skip)
        .take(Number(limit) === -1 ? null : Number(limit))
        .getManyAndCount();
      result = { contents: list, total, page: Number(page) };
      await this.cacheManager.set(key, result, REDIS_CACHE_VARS.LIST_NDT_CACHE_TTL);
    }

    if (result && typeof result === 'string') result = JSON.parse(result);
    return result;
  }

  async findById(id: number): Promise<any> {
    const key = format(REDIS_CACHE_VARS.DETAIL_NDT_CACHE_KEY, id.toString());
    let result = await this.cacheManager.get(key);
    if (typeof result === 'undefined' || result === null) {
      result = await this.nganhDaoTaoRepository
        .createQueryBuilder('ndt')
        .innerJoinAndSelect('ndt.chuongTrinhDaoTao', 'chuongTrinhDaoTao', 'chuongTrinhDaoTao.isDeleted = false')
        .leftJoinAndSelect('ndt.createdBy', 'createdBy')
        .leftJoinAndSelect('ndt.updatedBy', 'updatedBy')
        .where({ id, isDeleted: false })
        .getOne();
      if (!result) {
        throw new HttpException(NGANHDAOTAO_MESSAGE.NGANHDAOTAO_ID_NOT_FOUND, HttpStatus.NOT_FOUND);
      }
      await this.cacheManager.set(key, result, REDIS_CACHE_VARS.DETAIL_NDT_CACHE_TTL);
    }

    if (result && typeof result === 'string') result = JSON.parse(result);
    return result;
  }

  async create(newData: INganhDaoTao): Promise<any> {
    const checkExistName = await this.nganhDaoTaoRepository.findOne({
      ten: newData?.ten,
      chuongTrinhDaoTao: newData?.chuongTrinhDaoTao,
      isDeleted: false
    });
    if (checkExistName) {
      throw new HttpException(NGANHDAOTAO_MESSAGE.NGANHDAOTAO_NAME_EXIST, HttpStatus.CONFLICT);
    }
    try {
      newData.maNganhDaoTao = newData.maNganhDaoTao.toUpperCase().trim();
      const newNganhDaoTao = await this.nganhDaoTaoRepository.create(newData);
      const result = await this.nganhDaoTaoRepository.save(newNganhDaoTao);
      const key = format(REDIS_CACHE_VARS.DETAIL_NDT_CACHE_KEY, result?.id.toString());
      const detail = await this.findById(result.id);
      await this.cacheManager.set(key, detail, REDIS_CACHE_VARS.DETAIL_NDT_CACHE_TTL);
      await this.delCacheAfterChange();
      return result;
    } catch (error) {
      if (error?.sqlState === '23000') {
        throw new BadRequestException(NGANHDAOTAO_MESSAGE.NGANHDAOTAO_FOREIGN_KEY_NOT_FOUND);
      }
      throw new HttpException(error?.message || 'error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: number, updatedData: INganhDaoTao): Promise<any> {
    const nganhDaoTao = await this.nganhDaoTaoRepository.findOne({ id, isDeleted: false });
    if (!nganhDaoTao) {
      throw new HttpException(NGANHDAOTAO_MESSAGE.NGANHDAOTAO_ID_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }
    try {
      if (updatedData?.maNganhDaoTao) {
        updatedData.maNganhDaoTao = updatedData.maNganhDaoTao.toUpperCase();
      }
      const updated = await this.nganhDaoTaoRepository.save({ ...nganhDaoTao, ...updatedData, updatedAt: new Date() });
      const key = format(REDIS_CACHE_VARS.DETAIL_NDT_CACHE_KEY, id.toString());
      await this.cacheManager.del(key);
      await this.findById(updated.id);
      await this.delCacheAfterChange();
      return updated;
    } catch (error) {
      if (error?.sqlState === '23000') {
        throw new BadRequestException(NGANHDAOTAO_MESSAGE.NGANHDAOTAO_FOREIGN_KEY_NOT_FOUND);
      }
      throw new HttpException(error?.message || 'error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async delete(id: number, updatedBy?: number): Promise<any> {
    const nganhDaoTao = await this.nganhDaoTaoRepository.findOne({ id, isDeleted: false });
    if (!nganhDaoTao) {
      throw new HttpException(NGANHDAOTAO_MESSAGE.NGANHDAOTAO_ID_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }
    try {
      const deleted = await this.nganhDaoTaoRepository.save({
        ...nganhDaoTao,
        isDeleted: true,
        updatedAt: new Date(),
        updatedBy
      });
      const key = format(REDIS_CACHE_VARS.DETAIL_NDT_CACHE_KEY, id.toString());
      await this.cacheManager.del(key);
      await this.delCacheAfterChange();
      return deleted;
    } catch (error) {
      throw new HttpException(error?.message || 'error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async getCount(): Promise<number> {
    return await this.nganhDaoTaoRepository.count({ isDeleted: false });
  }

  async delCacheAfterChange() {
    await this.cacheManager.delCacheList([REDIS_CACHE_VARS.LIST_NDT_CACHE_COMMON_KEY]);
  }
}
