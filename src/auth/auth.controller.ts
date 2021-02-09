import { Body, Controller, Get, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from 'users/users.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { SignUpDto } from './dto/signup.dto';

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
}
