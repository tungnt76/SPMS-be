import { BadRequestException, Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SoKhopService } from './so-khop.service';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { FilterSoKhopNganhDaoTao } from './dto/filter-so-khop.dto';
import { AuthGuard } from '@nestjs/passport';
import { RowSoKhopNganhDaoTao } from './dto/row-so-khop.dto';

@ApiTags('so-khop')
@Controller('so-khop')
export class SoKhopController {
  constructor(private readonly soKhopService: SoKhopService) {}

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('token')
  @ApiOperation({ summary: 'Lấy thông tin so khớp môn học của 1 ngành đào tạo trong 2 năm' })
  @ApiOkResponse({ description: 'OK', type: [RowSoKhopNganhDaoTao] })
  @Get('/nganh-dao-tao/:idNganhDaoTao')
  findOne(@Query() filter: FilterSoKhopNganhDaoTao, @Param('idNganhDaoTao') id: number) {
    const { khoaTuyenNam1, khoaTuyenNam2 } = filter;
    if (Number(khoaTuyenNam1) >= Number(khoaTuyenNam2)) {
      throw new BadRequestException();
    }
    return this.soKhopService.soKhopNganhDaotao(id, filter);
  }
}
