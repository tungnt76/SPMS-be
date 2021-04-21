import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ValidationPipe,
  UseGuards,
  Req,
  ParseIntPipe,
  Query,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { SyllabusService } from './syllabus.service';
import { CreateSyllabusDto } from './dto/create-syllabus.dto';
import { UpdateSyllabusDto } from './dto/update-syllabus.dto';
import { Syllabus } from './entity/syllabus.entity';
import { GetSyllabusFilterDto } from './dto/filter-syllabus.dto';
import { SYLLABUS_MESSAGE } from 'constant/constant';
import { FindAllSyllabusResponse } from './Responses/find-all-syllabus.response';
import { SyllabusResponse } from './Responses/syllbus.response';
import { Roles } from 'guards/roles.decorator';
import { Role } from 'guards/roles.enum';
import { RolesGuard } from 'guards/roles.guard';
import { GetUser } from 'auth/user.decorator';
import { UsersEntity } from 'users/entity/user.entity';

@ApiTags('Syllabus')
@Controller('syllabus')
export class SyllabusController {
  constructor(private readonly syllabusService: SyllabusService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles([Role.GIAOVIEN])
  @ApiBearerAuth('token')
  @ApiOperation({ summary: 'Tạo mới một Syllabus' })
  @ApiCreatedResponse({ description: SYLLABUS_MESSAGE.CREATE_SYLLABUS_SUCCESSFULLY })
  @ApiInternalServerErrorResponse({ description: SYLLABUS_MESSAGE.CREATE_SYLLABUS_FAILED })
  @ApiConflictResponse({ description: SYLLABUS_MESSAGE.SYLLABUS_EXIST })
  @ApiUnauthorizedResponse({ description: SYLLABUS_MESSAGE.SYLLABUS_NOT_AUTHORIZED })
  @Post()
  async create(@Body(ValidationPipe) createSyllabusDto: CreateSyllabusDto, @Req() req): Promise<Syllabus | any> {
    const user = req.user || {};
    const syllabus = await this.syllabusService.create({
      ...createSyllabusDto,
      createdBy: user?.id,
      updatedBy: user?.id,
      updatedAt: new Date(),
      createdAt: new Date()
    });
    return { data: syllabus, status: HttpStatus.CREATED };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles([Role.GIAOVIEN])
  @ApiBearerAuth('token')
  @ApiOperation({ summary: 'Lấy danh sách syllabus của giáo vien' })
  @ApiUnauthorizedResponse({ description: SYLLABUS_MESSAGE.SYLLABUS_NOT_AUTHORIZED })
  @ApiOkResponse({ description: 'OK', type: FindAllSyllabusResponse })
  @Get('/user')
  async findAllByUser(@Query() filter: GetSyllabusFilterDto, @GetUser() user: UsersEntity) {
    return await this.syllabusService.findAll({ ...filter, createdBy: user.id });
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles([Role.USER, Role.SINHVIEN, Role.GIAOVIEN, Role.QUANLY, Role.ADMIN])
  @ApiBearerAuth('token')
  @ApiOperation({ summary: 'Lấy danh sách Syllabus' })
  @ApiUnauthorizedResponse({ description: SYLLABUS_MESSAGE.SYLLABUS_NOT_AUTHORIZED })
  @ApiOkResponse({ description: 'OK', type: FindAllSyllabusResponse })
  @Get()
  async findAll(@Query(ValidationPipe) filter: GetSyllabusFilterDto): Promise<Syllabus[] | any> {
    return await this.syllabusService.findAll(filter);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles([Role.USER, Role.SINHVIEN, Role.GIAOVIEN, Role.QUANLY, Role.ADMIN])
  @ApiBearerAuth('token')
  @ApiOperation({ summary: 'Lấy thông tin một Syllabus' })
  @ApiUnauthorizedResponse({ description: SYLLABUS_MESSAGE.SYLLABUS_NOT_AUTHORIZED })
  @ApiNotFoundResponse({ description: SYLLABUS_MESSAGE.SYLLABUS_ID_NOT_FOUND })
  @ApiOkResponse({ description: 'OK', type: SyllabusResponse })
  @Get(':id')
  findOne(@Param('id', new ParseIntPipe()) id: number): Promise<Syllabus> {
    return this.syllabusService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles([Role.GIAOVIEN])
  @ApiBearerAuth('token')
  @ApiOperation({ summary: 'Cập nhật thông tin một Syllabus' })
  @ApiUnauthorizedResponse({ description: SYLLABUS_MESSAGE.SYLLABUS_NOT_AUTHORIZED })
  @ApiInternalServerErrorResponse({ description: SYLLABUS_MESSAGE.UPDATE_SYLLABUS_FAILED })
  @ApiConflictResponse({ description: SYLLABUS_MESSAGE.SYLLABUS_EXIST })
  @ApiOkResponse({ description: SYLLABUS_MESSAGE.UPDATE_SYLLABUS_SUCCESSFULLY })
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateSyllabusDto: UpdateSyllabusDto, @Req() req) {
    const user = req.user || {};
    await this.syllabusService.update(id, { ...updateSyllabusDto, updatedBy: user?.id, updatedAt: new Date() });
    return new HttpException(SYLLABUS_MESSAGE.UPDATE_SYLLABUS_SUCCESSFULLY, HttpStatus.OK);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles([Role.GIAOVIEN])
  @ApiBearerAuth('token')
  @ApiOperation({ summary: 'Xóa một Syllabus' })
  @ApiUnauthorizedResponse({ description: SYLLABUS_MESSAGE.SYLLABUS_NOT_AUTHORIZED })
  @ApiInternalServerErrorResponse({ description: SYLLABUS_MESSAGE.DELETE_SYLLABUS_FAILED })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const user = req.user || {};
    await this.syllabusService.remove(id, user?.id);
    return new HttpException(SYLLABUS_MESSAGE.DELETE_SYLLABUS_SUCCESSFULLY, HttpStatus.OK);
  }
}
