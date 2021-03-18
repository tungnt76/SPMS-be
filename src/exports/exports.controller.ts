import { ExportsDto } from './dto/exports.dto';
import { Controller, Get, Query, Req, UseGuards, HttpStatus, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ExportsService } from './exports.service';
import htmlTemlpate from 'utils/templateCTDT/template';
import * as pdf from 'html-pdf';
const options = { format: 'Letter', width: '8.5in', height: '11in', border: '5mm' };
import * as fs from 'fs';
import { generateTemplate } from 'utils/templateCTDT/templateCTDT';

@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  // @UseGuards(AuthGuard('jwt'))
  // @ApiBearerAuth('token')
  @Get()
  async findAll(@Req() req, @Query() filter: ExportsDto, @Res() res): Promise<any> {
    try {
      const { data, fileName = 'export.pdf' } = await this.exportsService.exportsFilePdf(filter);
      // res.setHeader('Content-disposition', 'attachment; filename=' + fileName);
      // await pdf.create(htmlTemlpate(data), options).toStream(function (err, stream) {
      //   if (err) return console.log(err);
      //   stream.pipe(res);
      //   stream.on('end', () => res.end());
      // });
      await fs.writeFileSync('./a.html', htmlTemlpate(data));
      await generateTemplate(data);
      return res.json({});
    } catch (error) {
      console.log('error', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'INTERNAL_SERVER_ERROR' });
    }
  }
}
