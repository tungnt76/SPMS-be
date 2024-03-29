import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseFilterDto } from 'chuong-trinh-dao-tao/dto/filterChuongTrinhDaoTao.dto';
import { LIMIT, REDIS_CACHE_VARS, ROLES_MESSAGE } from 'constant/constant';
import { Repository } from 'typeorm';
import { FilterRoles } from './dto/filter-roles.dto';
import { RolesEntity } from './entity/roles.entity';
import { RedisCacheService } from 'cache/redisCache.service';
import * as format from 'string-format';
import { CreateRolesDto } from './dto/create-roles.dto';
import { PermissionService } from 'permission/permission.service';
import { UpdateRolesDto } from './dto/update-roles.dto';
import { NotEquals } from 'class-validator';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RolesEntity)
    private rolesRepository: Repository<RolesEntity>,
    private cacheManager: RedisCacheService,
    @Inject(forwardRef(() => PermissionService))
    private permisionService: PermissionService
  ) {}

  async create(newData: CreateRolesDto) {
    const { name, value, permissions } = newData;
    const data: RolesEntity = { name: name.toLocaleUpperCase(), value, createdAt: new Date(), updatedAt: new Date() };
    let result: RolesEntity;
    const isExist = await this.rolesRepository.findOne({ where: { name: data.name, isDeleted: false } });
    if (isExist) {
      throw new ConflictException(ROLES_MESSAGE.ROLES_EXIST);
    }
    try {
      result = await this.rolesRepository.save(data);
      if (permissions) {
        await this.permisionService.savePermissons(permissions, result.id);
      }
      const key = format(REDIS_CACHE_VARS.DETAIL_ROLE_CACHE_KEY, result?.id.toString());
      await this.cacheManager.del(key);
      await this.findOne(result.id);
      await this.delCacheAfterChange();
      return result;
    } catch (error) {
      if (result?.id) {
        await this.rolesRepository.delete({ id: result.id });
        throw new BadRequestException(ROLES_MESSAGE.RESOURCE_NOT_FOUND);
      }
      throw new InternalServerErrorException(ROLES_MESSAGE.CREATE_ROLES_FAILED);
    }
  }

  async findAll(filter: FilterRoles) {
    const key = format(REDIS_CACHE_VARS.LIST_ROLE_CACHE_KEY, JSON.stringify(filter));
    let result = await this.cacheManager.get(key);
    if (typeof result === 'undefined' || result === null) {
      const { page = 0, limit = LIMIT, searchKey, sortBy, sortType } = filter;
      const skip = page * limit;
      const isSortFieldInForeignKey = sortBy ? sortBy.trim().includes('.') : false;
      const query = this.rolesRepository
        .createQueryBuilder('role')
        .where((qb) => {
          isSortFieldInForeignKey
            ? qb.orderBy(sortBy, sortType)
            : qb.orderBy(sortBy ? `role.${sortBy}` : null, sortType);
          searchKey
            ? qb.andWhere('(role.name LIKE :searchName OR role.value = :searchValue)', {
                searchName: `%${searchKey}%`,
                searchValue: Number.isNaN(Number(searchKey)) ? -1 : searchKey
              })
            : {};
        })
        .andWhere('(role.isDeleted = false and role.name <> :adminRole)', { adminRole: 'ADMIN' })
        .skip(skip)
        .take(Number(limit) === -1 ? null : Number(limit));
      const [results, total] = await query.getManyAndCount();
      result = { contents: results, total, page: Number(page) };
      await this.cacheManager.set(key, result, REDIS_CACHE_VARS.LIST_ROLE_CACHE_TTL);
    }

    if (result && typeof result === 'string') result = JSON.parse(result);
    return result;
  }

  async findOne(id: number) {
    const key = format(REDIS_CACHE_VARS.DETAIL_ROLE_CACHE_KEY, id.toString());
    let result = await this.cacheManager.get(key);
    if (typeof result === 'undefined' || result === null) {
      result = await this.rolesRepository
        .createQueryBuilder('role')
        .where('(role.isDeleted = false and role.name <> :adminRole)', { adminRole: 'ADMIN' })
        .andWhere('role.id = :id', { id })
        .getOne();
      if (!result) {
        throw new NotFoundException(ROLES_MESSAGE.ROLES_ID_NOT_FOUND);
      }
      await this.cacheManager.set(key, result, REDIS_CACHE_VARS.DETAIL_ROLE_CACHE_TTL);
    }

    if (result && typeof result === 'string') result = JSON.parse(result);
    return result;
  }

  async update(id: number, newData: UpdateRolesDto) {
    const oldData = await this.findOne(id);
    if (newData.name) {
      newData.name = newData.name.toUpperCase();
    }
    const { permissions, ...updateRole } = newData;
    try {
      const result = await this.rolesRepository.save({ ...oldData, ...updateRole, updatedAt: new Date() });
      if (permissions) {
        await this.permisionService.updatePermission(permissions, result.id);
      }
      const key = format(REDIS_CACHE_VARS.DETAIL_ROLE_CACHE_KEY, id.toString());
      const detail = await this.findOne(result.id);
      await this.cacheManager.set(key, detail, REDIS_CACHE_VARS.DETAIL_ROLE_CACHE_TTL);
      await this.delCacheAfterChange();
      return result;
    } catch (error) {
      throw new InternalServerErrorException(ROLES_MESSAGE.UPDATE_ROLES_FAILED);
    }
  }

  async remove(id: number) {
    const data = await this.findOne(id);
    if (!data) throw new NotFoundException(ROLES_MESSAGE.ROLES_ID_NOT_FOUND);
    try {
      const result = await this.rolesRepository.save({
        ...data,
        updatedAt: new Date(),
        isDeleted: true
      });
      const key = format(REDIS_CACHE_VARS.DETAIL_ROLE_CACHE_KEY, id.toString());
      await this.cacheManager.del(key);
      await this.delCacheAfterChange();
      return result;
    } catch (error) {
      throw new InternalServerErrorException(ROLES_MESSAGE.DELETE_ROLES_FAILED);
    }
  }

  async deleteRowIsDeleted(): Promise<any> {
    try {
      await this.rolesRepository.delete({ isDeleted: true });
    } catch (error) {
      throw new InternalServerErrorException(ROLES_MESSAGE.DELETE_ROLES_FAILED);
    }
  }

  async delCacheAfterChange() {
    await this.cacheManager.delCacheList([REDIS_CACHE_VARS.LIST_ROLE_CACHE_COMMON_KEY]);
  }
  // async getAllPermissions(idRole: number): Promise<RolesEntity> {
  //   const found = await this.rolesRepository
  //     .createQueryBuilder('role')
  //     .leftJoinAndSelect('role.permissions', 'per', 'per.actived = true ')
  //     .where({ id: idRole, isDeleted: false })
  //     .getOne();
  //   if (!found) throw new NotFoundException(ROLES_MESSAGE.ROLES_ID_NOT_FOUND);
  //   return found;
  // }
}
