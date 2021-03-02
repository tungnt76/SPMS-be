import { Body, Controller, Get, HttpStatus, Param, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { IdDto } from 'chuong-trinh-dao-tao/dto/Id.dto';
import { USER_MESSAGE } from 'constant/constant';
import { UsersService } from 'users/users.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { SignUpDto } from './dto/signup.dto';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import * as lodash from 'lodash';
import { ChangePasswordDto } from './dto/changePassword.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly usersService: UsersService) {}
  @Post('login')
  async login(@Req() req, @Res() res, @Body() body: LoginDto) {
    const { email = '', password = '' } = body;
    const { status, data } = await this.authService.login(email, password);
    return res.status(status).json(data);
  }
  @Post('signup')
  async signup(@Req() req, @Res() res, @Body() body: SignUpDto) {
    const { status, data } = await this.authService.signup(body);
    return res.status(status).json(data);
  }
  @Post('refreshtoken')
  async refreshToken(@Req() req, @Res() res, @Body() body: RefreshTokenDto) {
    try {
      const { id } = this.authService.checkToken(body?.refreshToken);
      const user = await this.usersService.findOne({ ID: id });
      const { token } = await this.authService.createToken(user);
      const { refreshToken } = await this.authService.createRefreshToken(user);
      return res.json({ token, refreshToken });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'TOKEN_INVALID' });
    }
  }
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('token')
  @Get('profile')
  async getProfile(@Req() req, @Res() res) {
    try {
      const user = req.user || {};
      return res.json({ ...user });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'INTERNAL_SERVER_ERROR' });
    }
  }
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('token')
  @Put(':id')
  async updateProfile(@Req() req, @Res() res, @Param() param: IdDto, @Body() updateData: UpdateProfileDto) {
    try {
      const user = req.user || {};
      const { id } = param;
      if (Number(user?.ID) !== Number(id)) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: USER_MESSAGE.USERS_NOT_AUTHORIZED, error: USER_MESSAGE.USERS_NOT_AUTHORIZED });
      }
      await this.usersService.update(Number(id), updateData);
      return res.status(HttpStatus.OK).json({ message: USER_MESSAGE.UPDATE_USER_SUCCESSFULLY });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: USER_MESSAGE.UPDATE_USER_FAILED, error: lodash.get(error, 'response', 'error') });
    }
  }
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('token')
  @Put(':id/change-password')
  async changePassword(@Req() req, @Res() res, @Param() param: IdDto, @Body() updateData: ChangePasswordDto) {
    try {
      const user = req.user || {};
      const { id } = param;
      if (Number(user?.ID) !== Number(id)) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: USER_MESSAGE.USERS_NOT_AUTHORIZED, error: USER_MESSAGE.USERS_NOT_AUTHORIZED });
      }
      const userProfile = await this.usersService.findOne({ ID: Number(id), isDeleted: false });
      if (!userProfile) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: USER_MESSAGE.USER_ID_NOT_FOUND });
      }
      const checkPassword = await this.authService.comparePassword(updateData?.password, userProfile?.password);
      if (!checkPassword) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: USER_MESSAGE.PASSWORD_INCORRECT });
      }
      const newPassword = await this.authService.hashPassword(updateData?.newPassword);
      const userUpdated = await this.usersService.update(Number(id), {
        password: newPassword
      });
      return res.status(HttpStatus.OK).json({ message: USER_MESSAGE.UPDATE_USER_SUCCESSFULLY, user: userUpdated });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: USER_MESSAGE.UPDATE_USER_FAILED, error: lodash.get(error, 'response', 'error') });
    }
  }
}
