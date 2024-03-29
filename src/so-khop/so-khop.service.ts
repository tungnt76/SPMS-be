import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ChiTietGomNhomService } from 'chi-tiet-gom-nhom/chi-tiet-gom-nhom.service';
import { MonHocEntity } from 'mon-hoc/entity/mon-hoc.entity';
import { MonHocService } from 'mon-hoc/mon-hoc.service';
import { FilterSoKhopNganhDaoTao } from './dto/filter-so-khop.dto';
import { RowSoKhopNganhDaoTao } from './dto/row-so-khop.dto';
import { RedisCacheService } from 'cache/redisCache.service';
import * as format from 'string-format';
import { REDIS_CACHE_VARS, SOKHOP_MESSAGE } from 'constant/constant';
import { UsersEntity } from 'users/entity/user.entity';
import { UpdateSoKhopRequestBody } from './body/update-so-kho-request-body';
import { ChiTietNganhDaoTaoService } from 'chi-tiet-nganh-dao-tao/chi-tiet-nganh-dao-tao.service';

@Injectable()
export class SoKhopService {
  constructor(
    private chiTietGomNhomService: ChiTietGomNhomService,
    private monHocService: MonHocService,
    private chiTietNDTSerice:ChiTietNganhDaoTaoService,
    private cacheManager: RedisCacheService
  ) {}
  async soKhopNganhDaoTao(idNganhDaoTao: number, filter: FilterSoKhopNganhDaoTao) {
    const { khoaTuyenNam1, khoaTuyenNam2 } = filter;

    const firstSubjects: MonHocEntity[] = await this.monHocService.getAllSubjectByNganhDaoTaoAndKhoaTuyen(
      idNganhDaoTao,
      Number(khoaTuyenNam1)
    );
    const secondSubjects: MonHocEntity[] = await this.monHocService.getAllSubjectByNganhDaoTaoAndKhoaTuyen(
      idNganhDaoTao,
      Number(khoaTuyenNam2)
    );

    const soKhop: RowSoKhopNganhDaoTao[] = [];
    const oldSubjecs: MonHocEntity[] = [];

    for (const first of firstSubjects) {
      const row: RowSoKhopNganhDaoTao = {
        first: first,
        second: []
      };
      let index = 0;
      const length = secondSubjects.length;
      for (index = 0; index < length; index++) {
        if (first.ma === secondSubjects[index].ma) {
          row.second.push(secondSubjects[index]);
          soKhop.push(row);
          secondSubjects.splice(index, 1);
          break;
        }
      }
      if (index === length) {
        oldSubjecs.push(first);
      }
    }

    for (const oldSunject of oldSubjecs) {
      const row: RowSoKhopNganhDaoTao = {
        first: oldSunject,
        second: []
      };
      let current: MonHocEntity[] = [oldSunject]; // Danh sách tìm kiếm môn học thay thế hiện tại
      for (let i = Number(khoaTuyenNam1); i <= Number(khoaTuyenNam2); i++) {
        const next: MonHocEntity[] = []; // Danh sách tìm kiếm môn học thay thế cho năm tiếp theo
        for (let j = 0; j < current.length; j++) {
          //const monThayThe = await this.monHocTruocService.getMonHocThayTheV2(current[j].id); //Danh sách môn thay thế theo năm
          const monThayThe = await this.chiTietGomNhomService.getMonHocThayThe(current[j].id);
          if (monThayThe.length === 0) {
            // Không tìm thấy môn thay thế tại năm i
            next.push(current[j]);
            break;
          }
          for (const e of monThayThe) {
            let index = 0;
            const lenght = secondSubjects.length;
            for (; index < lenght; index++) {
              //Tìm môn học phù hợp
              if (secondSubjects[index].ma === e.ma) {
                row.second.push(e);
                secondSubjects.splice(index, 1);
                current.splice(j, 1);
                break;
              }
            }
            if (index === lenght)
              //Không tìm thấy môn học phù hợp
              next.push(e); // Thêm vào danh sách tìm vào lần tiếp theo
          }
        }
        current = next;
      }
      soKhop.push(row);
    }

    secondSubjects.forEach((e) => {
      soKhop.push({
        first: null,
        second: [e]
      });
    });
    return soKhop;
  }
  async updateSoKhopMonHoc(idNganh: number, body: UpdateSoKhopRequestBody, user: UsersEntity) {
    const { khoaTuyenNam1, khoaTuyenNam2 } = body;
    const ctmhArr = [];
    const ctmhTrcArr = [];
    body.contents.forEach((e) => {
      if (e.idChiTietGomNhom != null && !ctmhArr.includes(e.idChiTietGomNhom)) {
        ctmhArr.push(e.idChiTietGomNhom);
      }
      if (e.idChiTietMonHocTrc != null && !ctmhTrcArr.includes(e.idChiTietMonHocTrc)) {
        ctmhTrcArr.push(e.idChiTietMonHocTrc);
      }
    });
    let [chiTietGomNhom, totals] = [[], 0];
    if (ctmhArr.length > 0) {
      [chiTietGomNhom, totals] = await this.chiTietGomNhomService.getChiTietGomNhomByKhoaAndNganh(
        idNganh,
        khoaTuyenNam2,
        ctmhArr
      );
      if (ctmhArr.length != totals) {
        throw new BadRequestException(`${SOKHOP_MESSAGE.CHITIETGOMNHOM_NOT_IN}_${khoaTuyenNam2}`);
      }
    }

    let [chiTietGomNhomTrc, totalsTrc] = [[], 0];
    if (ctmhTrcArr.length > 0) {
      [chiTietGomNhomTrc, totalsTrc] = await this.chiTietGomNhomService.getChiTietGomNhomByKhoaAndNganh(
        idNganh,
        khoaTuyenNam1,
        ctmhTrcArr
      );
      if (ctmhTrcArr.length != totalsTrc) {
        throw new BadRequestException(`${SOKHOP_MESSAGE.CHITIETGOMNHOM_MONHOCTRUOC_NOT_IN}_${khoaTuyenNam1}`);
      }
    }
    chiTietGomNhom.forEach((ctgnE) => {
      const row = body.contents.find((e) => e.idChiTietGomNhom == ctgnE.id);
      const idCTGNMTrc = chiTietGomNhomTrc.find((e) => e.id == row.idChiTietMonHocTrc);
      ctgnE.ctgnMonHoctruoc = typeof idCTGNMTrc === 'undefined' ? null : idCTGNMTrc;
      ctgnE.updatedBy = user.id;
      ctgnE.updatedAt = new Date();
    });
    try {
      await this.chiTietGomNhomService.updateMonHocTruoc(chiTietGomNhom);
    } catch (error) {
      throw new InternalServerErrorException(SOKHOP_MESSAGE.UPDATE_MONHOCTRUOC_FAILED);
    }
  }
  async soKhopChiTietNganhDaoTao(idCTNDT1: number, idCTNDT2: number) {
    const chiTietNDT1 = await this.chiTietNDTSerice.findById(idCTNDT1);
    const chiTietNDT2 = await this.chiTietNDTSerice.findById(idCTNDT2);
    const khoaTuyen1 = chiTietNDT1.khoa
    const khoaTuyen2 = chiTietNDT2.khoa
    const NDT1=chiTietNDT1.nganhDaoTao.id
    const NDT2=chiTietNDT2.nganhDaoTao.id
    if(NDT1 !== NDT2){
      throw new BadRequestException("NOT_SAME_NGANH_DAO_TAO")
    }
    if(khoaTuyen1 >= khoaTuyen2){
      throw new BadRequestException()
    }
    return await this.soKhopNganhDaoTao(NDT1,{khoaTuyenNam1:khoaTuyen1,khoaTuyenNam2:khoaTuyen2});
  }
}
