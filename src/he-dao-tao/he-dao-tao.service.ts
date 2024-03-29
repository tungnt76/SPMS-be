import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HEDAOTAO_MESSAGE, REDIS_CACHE_VARS } from 'constant/constant';
import { Repository } from 'typeorm';
import { CreateHeDaoTaoDto } from './dto/create-he-dao-tao.dto';
import { UpdateHeDaoTaoDto } from './dto/update-he-dao-tao.dto';
import { HeDaoTaoEntity } from './entity/type-of-education.entity';
import { RedisCacheService } from 'cache/redisCache.service';
import * as format from 'string-format';

@Injectable()
export class HeDaotaoService {
  constructor(
    @InjectRepository(HeDaoTaoEntity)
    private typeOfEduRepository: Repository<HeDaoTaoEntity>,
    private cacheManager: RedisCacheService
  ) {}

  async create(createTypeOfEducationDto: CreateHeDaoTaoDto) {
    if (await this.isExist(createTypeOfEducationDto)) {
      throw new ConflictException(HEDAOTAO_MESSAGE.HEDAOTAO_EXIST);
    }
    if (createTypeOfEducationDto?.ma) {
      createTypeOfEducationDto.ma = createTypeOfEducationDto.ma.toUpperCase().trim();
    }
    try {
      const result = await this.typeOfEduRepository.save(createTypeOfEducationDto);
      const key = format(REDIS_CACHE_VARS.DETAIL_HE_DAO_TAO_CACHE_KEY, result?.id.toString());
      const detail = await this.findById(result.id);
      await this.cacheManager.set(key, detail, REDIS_CACHE_VARS.DETAIL_HE_DAO_TAO_CACHE_TTL);
      await this.delCacheAfterChange();
      return result;
    } catch (error) {
      throw new ServiceUnavailableException(HEDAOTAO_MESSAGE.CREATE_HEDAOTAO_FAILED);
    }
  }

  async findAll() {
    const key = REDIS_CACHE_VARS.LIST_HE_DAO_TAO_CACHE_KEY;
    let result = await this.cacheManager.get(key);
    if (typeof result === 'undefined' || result === null) {
      const list = await this.typeOfEduRepository.find({ where: { isDeleted: false }, order: { ma: 'ASC' } });
      result = { contents: list };
      await this.cacheManager.set(key, result, REDIS_CACHE_VARS.LIST_HE_DAO_TAO_CACHE_TTL);
    }

    if (result && typeof result === 'string') result = JSON.parse(result);
    return result;
  }

  async findById(id: number): Promise<HeDaoTaoEntity> {
    const key = format(REDIS_CACHE_VARS.DETAIL_HE_DAO_TAO_CACHE_KEY, id.toString());
    let result = await this.cacheManager.get(key);
    if (typeof result === 'undefined' || result === null) {
      try {
        result = await this.typeOfEduRepository.findOne(id, { where: { isDeleted: false } });
      } catch (error) {
        throw new ServiceUnavailableException();
      }
      if (!result) {
        throw new NotFoundException(HEDAOTAO_MESSAGE.HEDAOTAO_ID_NOT_FOUND);
      }
      await this.cacheManager.set(key, result, REDIS_CACHE_VARS.DETAIL_HE_DAO_TAO_CACHE_TTL);
    }

    if (result && typeof result === 'string') result = JSON.parse(result);
    return result;
  }

  async update(id: number, updateTypeOfEducationDto: UpdateHeDaoTaoDto) {
    const found = await this.findById(id);
    await this.checkConflictException(id, updateTypeOfEducationDto);
    if (updateTypeOfEducationDto?.ma) {
      updateTypeOfEducationDto.ma = updateTypeOfEducationDto.ma.toUpperCase().trim();
    }
    try {
      const result = await this.typeOfEduRepository.save({ ...found, ...updateTypeOfEducationDto });
      const key = format(REDIS_CACHE_VARS.DETAIL_HE_DAO_TAO_CACHE_KEY, id.toString());
      await this.cacheManager.del(key);
      await this.findById(result.id);
      await this.delCacheAfterChange();
      return result;
    } catch (error) {
      throw new ServiceUnavailableException(HEDAOTAO_MESSAGE.UPDATE_HEDAOTAO_FAILED);
    }
  }

  async remove(id: number) {
    const found = await this.findById(id);
    found.isDeleted = true;
    try {
      const result = await this.typeOfEduRepository.save(found);
      const key = format(REDIS_CACHE_VARS.DETAIL_HE_DAO_TAO_CACHE_KEY, id.toString());
      await this.cacheManager.del(key);
      await this.delCacheAfterChange();
      return result;
    } catch (error) {
      throw new ServiceUnavailableException(HEDAOTAO_MESSAGE.DELETE_HEDAOTAO_FAILED);
    }
  }
  private async isExist(createTypeOfEducationDto: CreateHeDaoTaoDto): Promise<boolean> {
    const { ma, ten } = createTypeOfEducationDto;
    const found = await this.typeOfEduRepository.findOne({
      where: [
        { ma: ma, isDeleted: false },
        { ten: ten, isDeleted: false }
      ]
    });
    return found ? true : false;
  }
  private async checkConflictException(id: number, createTypeOfEducationDto: CreateHeDaoTaoDto) {
    const { ma, ten } = createTypeOfEducationDto;
    const query = this.typeOfEduRepository.createQueryBuilder('tod');
    query.where('(tod.ma=:ma OR tod.ten=:ten)', { ma, ten });
    query.andWhere('(tod.isDeleted=:isDeleted AND tod.id!=:id)', { isDeleted: false, id });
    const found = await query.getOne();
    if (found) {
      throw new ConflictException(HEDAOTAO_MESSAGE.HEDAOTAO_EXIST);
    }
  }

  async deleteRowIsDeleted(): Promise<any> {
    try {
      await this.typeOfEduRepository.delete({ isDeleted: true });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(HEDAOTAO_MESSAGE.DELETE_HEDAOTAO_FAILED);
    }
  }

  async delCacheAfterChange() {
    await this.cacheManager.delCacheList([REDIS_CACHE_VARS.LIST_HE_DAO_TAO_CACHE_KEY]);
  }
}
